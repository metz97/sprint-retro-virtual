import { create } from 'zustand';
import type { ClientMsg, Focus, PublicState, ServerMsg } from '../shared/types';

export interface Session {
  clientId: string;
  name: string;
  isModerator: boolean;
}

export interface Reaction {
  emoji: string;
  at: number;
  key: number;
}

interface RetroStore {
  status: 'connecting' | 'open' | 'closed';
  session: Session | null;
  me: string | null;
  state: PublicState | null;
  /** echoId -> time its duplicate started walking from the lobby */
  walkStart: Record<string, number>;
  /** echoId -> time a note was added to an existing duplicate */
  pulseAt: Record<string, number>;
  /** userId -> latest emoji reaction */
  reactions: Record<string, Reaction>;
  /** participants follow the moderator's camera unless they look around themselves */
  follow: boolean;
  localFocus: Focus;
  toast: { text: string; key: number } | null;
  join: (name: string, isModerator: boolean) => void;
  send: (msg: ClientMsg) => void;
  viewLocal: (focus: Focus) => void;
  setFollow: (follow: boolean) => void;
  showToast: (text: string) => void;
}

const SESSION_KEY = 'retro.session';
const OVERVIEW: Focus = { type: 'overview' };

/** Seconds on the same clock the 3D scene animates with. */
export const now = () => performance.now() / 1000;

// crypto.randomUUID needs a secure context, which teammates opening http://<lan-ip> don't have.
const makeId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

let socket: WebSocket | null = null;
let retry = 0;
let toastKey = 0;

export const useRetro = create<RetroStore>((set, get) => ({
  status: 'connecting',
  session: loadSession(),
  me: null,
  state: null,
  walkStart: {},
  pulseAt: {},
  reactions: {},
  follow: true,
  localFocus: OVERVIEW,
  toast: null,

  join(name, isModerator) {
    const session: Session = { clientId: get().session?.clientId ?? makeId(), name, isModerator };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.setItem('retro.lastName', name);
    } catch {
      // storage unavailable: the session just won't survive a refresh
    }
    set({ session });
    get().send({ t: 'join', ...session });
  },

  send(msg) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
    else get().showToast('Koneksi terputus, mencoba menyambung lagi…');
  },

  viewLocal(focus) {
    set({ localFocus: focus, follow: false });
  },

  setFollow(follow) {
    set({ follow });
  },

  showToast(text) {
    set({ toast: { text, key: ++toastKey } });
  },
}));

function onState(next: PublicState) {
  const { state: prev, walkStart, pulseAt, follow } = useRetro.getState();
  if (!prev) {
    useRetro.setState({ state: next });
    return;
  }
  const t = now();
  const prevEchoes = new Map(prev.echoes.map((e) => [e.id, e]));
  const nextWalk = { ...walkStart };
  const nextPulse = { ...pulseAt };
  for (const e of next.echoes) {
    const p = prevEchoes.get(e.id);
    if (!p) nextWalk[e.id] = t;
    else if (e.noteCount > p.noteCount) nextPulse[e.id] = t;
  }
  // Every moderator camera move pulls wandering participants back in.
  const focusChanged = JSON.stringify(prev.focus) !== JSON.stringify(next.focus);
  useRetro.setState({ state: next, walkStart: nextWalk, pulseAt: nextPulse, follow: follow || focusChanged });
}

function onMessage(msg: ServerMsg) {
  switch (msg.t) {
    case 'welcome':
      useRetro.setState({ me: msg.userId });
      break;
    case 'state':
      onState(msg.state);
      break;
    case 'reaction':
      useRetro.setState((s) => ({
        reactions: { ...s.reactions, [msg.userId]: { emoji: msg.emoji, at: now(), key: ++toastKey } },
      }));
      break;
    case 'error':
      useRetro.getState().showToast(msg.message);
      break;
  }
}

export function connect() {
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  socket = ws;
  useRetro.setState({ status: 'connecting' });

  ws.onopen = () => {
    retry = 0;
    useRetro.setState({ status: 'open' });
    const session = useRetro.getState().session;
    if (session) ws.send(JSON.stringify({ t: 'join', ...session } satisfies ClientMsg));
  };
  ws.onmessage = (ev) => onMessage(JSON.parse(ev.data as string) as ServerMsg);
  ws.onclose = () => {
    useRetro.setState({ status: 'closed' });
    setTimeout(connect, Math.min(5000, 500 * 2 ** retry++));
  };
}

// ---------- selectors ----------

export function useIsModerator(): boolean {
  return useRetro((s) => !!s.state?.users.find((u) => u.id === s.me)?.isModerator);
}

export function useEffectiveFocus(): Focus {
  return useRetro((s) => {
    if (!s.state) return OVERVIEW;
    const isModerator = !!s.state.users.find((u) => u.id === s.me)?.isModerator;
    return isModerator || s.follow ? s.state.focus : s.localFocus;
  });
}

/** Moderators move everyone's camera; participants only move their own. */
export function useNavigate(): (focus: Focus) => void {
  const isModerator = useIsModerator();
  const send = useRetro((s) => s.send);
  const viewLocal = useRetro((s) => s.viewLocal);
  return (focus) => (isModerator ? send({ t: 'focus', focus }) : viewLocal(focus));
}
