import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import {
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  PALETTE,
  REACTIONS,
  isValidPlacement,
  roomById,
  type CategoryId,
  type RoomId,
} from '../shared/config';
import type { ClientMsg, Focus, PublicState, ServerMsg } from '../shared/types';

const PORT = Number(process.env.PORT ?? 3001);
const DATA_FILE = path.resolve('server/data/retro.json');
const DIST_DIR = path.resolve('dist');

interface User {
  id: string;
  name: string;
  color: string;
  isModerator: boolean;
  lobbyIndex: number;
}

interface Echo {
  id: string;
  ownerId: string | null;
  roomId: RoomId;
  categoryId: CategoryId;
  slot: number;
  createdAt: number;
  revealed: boolean;
  discussed: boolean;
}

interface Note {
  id: string;
  echoId: string;
  authorId: string;
  text: string;
  anonymous: boolean;
  createdAt: number;
}

interface RetroState {
  retroName: string;
  users: Record<string, User>;
  echoes: Record<string, Echo>;
  notes: Record<string, Note>;
  focus: Focus;
}

// ---------- persistence ----------

function emptyState(): RetroState {
  return { retroName: process.env.RETRO_NAME ?? 'Sprint Retro', users: {}, echoes: {}, notes: {}, focus: { type: 'overview' } };
}

function loadState(): RetroState {
  try {
    return { ...emptyState(), ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
  } catch {
    return emptyState();
  }
}

let state = loadState();
let saveTimer: NodeJS.Timeout | undefined;

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  }, 300);
}

// ---------- views ----------

const clients = new Map<WebSocket, { userId: string | null }>();

function onlineUserIds(): Set<string> {
  const ids = new Set<string>();
  for (const c of clients.values()) if (c.userId) ids.add(c.userId);
  return ids;
}

/** What one viewer is allowed to see: hidden note texts and anonymous authors are stripped. */
function viewFor(viewerId: string | null, online: Set<string>): PublicState {
  const notes = Object.values(state.notes);
  return {
    retroName: state.retroName,
    users: Object.values(state.users).map((u) => ({ ...u, online: online.has(u.id) })),
    echoes: Object.values(state.echoes).map((e) => {
      const own = notes.filter((n) => n.echoId === e.id);
      const owner = e.ownerId ? state.users[e.ownerId] : undefined;
      return {
        ...e,
        ownerName: owner?.name ?? 'Anonim',
        color: owner?.color ?? '#3b3550',
        noteCount: own.length,
        mine: own.some((n) => n.authorId === viewerId),
      };
    }),
    notes: notes.map((n) => {
      const mine = n.authorId === viewerId;
      const visible = mine || !!state.echoes[n.echoId]?.revealed;
      return { id: n.id, echoId: n.echoId, text: visible ? n.text : null, mine, anonymous: n.anonymous, createdAt: n.createdAt };
    }),
    focus: state.focus,
  };
}

function send(ws: WebSocket, msg: ServerMsg) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcastState() {
  const online = onlineUserIds();
  for (const [ws, c] of clients) send(ws, { t: 'state', state: viewFor(c.userId, online) });
  persist();
}

// ---------- helpers ----------

function lowestFree(used: Iterable<number>): number {
  const set = new Set(used);
  let i = 0;
  while (set.has(i)) i++;
  return i;
}

function isValidFocus(f: Focus | undefined): boolean {
  if (!f) return false;
  if (f.type === 'overview') return true;
  if (f.type === 'room') return !!roomById(f.roomId);
  if (f.type === 'echo') return !!state.echoes[f.echoId];
  return false;
}

function removeEchoIfEmpty(echoId: string) {
  if (Object.values(state.notes).some((n) => n.echoId === echoId)) return;
  const echo = state.echoes[echoId];
  delete state.echoes[echoId];
  if (state.focus.type === 'echo' && state.focus.echoId === echoId && echo) {
    state.focus = { type: 'room', roomId: echo.roomId };
  }
}

// ---------- message handling ----------

function handle(ws: WebSocket, client: { userId: string | null }, msg: ClientMsg) {
  if (msg.t === 'join') {
    const name = String(msg.name ?? '').trim().slice(0, MAX_NAME_LENGTH);
    const id = String(msg.clientId ?? '').slice(0, 64);
    if (!name || !id) return send(ws, { t: 'error', message: 'Nama tidak boleh kosong.' });
    const existing = state.users[id];
    if (existing) {
      existing.name = name;
      existing.isModerator = !!msg.isModerator;
    } else {
      const lobbyIndex = lowestFree(Object.values(state.users).map((u) => u.lobbyIndex));
      state.users[id] = { id, name, isModerator: !!msg.isModerator, lobbyIndex, color: PALETTE[lobbyIndex % PALETTE.length] };
    }
    client.userId = id;
    send(ws, { t: 'welcome', userId: id });
    return broadcastState();
  }

  const user = client.userId ? state.users[client.userId] : undefined;
  if (!user) return send(ws, { t: 'error', message: 'Silakan join dulu.' });
  const requireModerator = () => {
    if (!user.isModerator) send(ws, { t: 'error', message: 'Hanya moderator yang bisa melakukan ini.' });
    return user.isModerator;
  };

  switch (msg.t) {
    case 'addNote': {
      const text = String(msg.text ?? '').trim().slice(0, MAX_NOTE_LENGTH);
      if (!text || !isValidPlacement(msg.roomId, msg.categoryId)) return;
      const ownerId = msg.anonymous ? null : user.id;
      let echo = Object.values(state.echoes).find(
        (e) => e.roomId === msg.roomId && e.categoryId === msg.categoryId && e.ownerId === ownerId,
      );
      if (!echo) {
        const slot = lowestFree(
          Object.values(state.echoes)
            .filter((e) => e.roomId === msg.roomId && e.categoryId === msg.categoryId)
            .map((e) => e.slot),
        );
        echo = {
          id: randomUUID(), ownerId, roomId: msg.roomId, categoryId: msg.categoryId,
          slot, createdAt: Date.now(), revealed: false, discussed: false,
        };
        state.echoes[echo.id] = echo;
      }
      const note: Note = { id: randomUUID(), echoId: echo.id, authorId: user.id, text, anonymous: !!msg.anonymous, createdAt: Date.now() };
      state.notes[note.id] = note;
      break;
    }
    case 'deleteNote': {
      const note = state.notes[msg.noteId];
      if (!note || note.authorId !== user.id) return;
      if (state.echoes[note.echoId]?.revealed) {
        return send(ws, { t: 'error', message: 'Masukan yang sudah dibuka tidak bisa dihapus.' });
      }
      delete state.notes[note.id];
      removeEchoIfEmpty(note.echoId);
      break;
    }
    case 'react': {
      if (!REACTIONS.includes(msg.emoji)) return;
      for (const ws2 of clients.keys()) send(ws2, { t: 'reaction', userId: user.id, emoji: msg.emoji });
      return;
    }
    case 'focus': {
      if (!requireModerator() || !isValidFocus(msg.focus)) return;
      state.focus = msg.focus;
      break;
    }
    case 'openEcho': {
      if (!requireModerator()) return;
      const echo = state.echoes[msg.echoId];
      if (!echo) return;
      echo.revealed = true;
      state.focus = { type: 'echo', echoId: echo.id };
      break;
    }
    case 'setDiscussed': {
      if (!requireModerator()) return;
      const echo = state.echoes[msg.echoId];
      if (!echo) return;
      echo.discussed = !!msg.discussed;
      break;
    }
    case 'reset': {
      if (!requireModerator()) return;
      const online = onlineUserIds();
      const keep = Object.values(state.users)
        .filter((u) => online.has(u.id))
        .sort((a, b) => a.lobbyIndex - b.lobbyIndex);
      state = { ...emptyState(), retroName: state.retroName };
      keep.forEach((u, i) => (state.users[u.id] = { ...u, lobbyIndex: i, color: PALETTE[i % PALETTE.length] }));
      break;
    }
    default:
      return;
  }
  broadcastState();
}

// ---------- http + websocket ----------

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  if (!fs.existsSync(DIST_DIR)) {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Retro server berjalan. Saat development, buka http://localhost:5173');
    return;
  }
  const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  let file = path.join(DIST_DIR, urlPath);
  if (!file.startsWith(DIST_DIR)) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST_DIR, 'index.html');
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  const client = { userId: null as string | null };
  clients.set(ws, client);
  send(ws, { t: 'state', state: viewFor(null, onlineUserIds()) });

  ws.on('message', (raw) => {
    let msg: ClientMsg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg && typeof msg === 'object' && typeof msg.t === 'string') handle(ws, client, msg);
  });

  ws.on('close', () => {
    clients.delete(ws);
    if (client.userId) broadcastState();
  });
});

server.listen(PORT, () => {
  console.log(`Retro server: http://localhost:${PORT}  (websocket di /ws)`);
});
