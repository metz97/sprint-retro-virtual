import { Html } from '@react-three/drei';
import { CATEGORIES, roomById } from '../../shared/config';
import { zoneSlot } from '../../shared/layout';
import { useEffectiveFocus, useIsModerator, useNavigate, useRetro } from '../store';

/** Speech-bubble card above the focused duplicate. */
export function FocusedNoteCard() {
  const focus = useEffectiveFocus();
  const state = useRetro((s) => s.state);
  const send = useRetro((s) => s.send);
  const isModerator = useIsModerator();
  const navigate = useNavigate();
  if (focus.type !== 'echo' || !state) return null;
  const echo = state.echoes.find((e) => e.id === focus.echoId);
  if (!echo) return null;

  const [x, z] = zoneSlot(echo.roomId, echo.categoryId, echo.slot);
  const cat = CATEGORIES[echo.categoryId];
  const notes = state.notes.filter((n) => n.echoId === echo.id).sort((a, b) => a.createdAt - b.createdAt);

  return (
    <Html position={[x, 2.5, z]} zIndexRange={[60, 50]}>
      <div className="note-card" style={{ borderTopColor: cat.accent }}>
        <div className="note-card-head">
          <div>
            <div className="note-card-name">{echo.ownerId ? echo.ownerName : '🎭 Anonim'}</div>
            <div className="note-card-cat">
              {cat.emoji} {cat.label} · {roomById(echo.roomId)?.title}
            </div>
          </div>
          <button className="icon-btn" title="Tutup" onClick={() => navigate({ type: 'room', roomId: echo.roomId })}>
            ✕
          </button>
        </div>

        {!echo.revealed && <div className="note-card-hint">🔒 Belum dibuka. Hanya kamu yang bisa melihat isinya.</div>}

        <ol className="note-list">
          {notes.map((n) => (
            <li key={n.id} className={n.text === null ? 'hidden-note' : ''}>
              {n.text ?? '••••••••••'}
              {n.mine && echo.ownerId === null && <span className="mine-tag">punyamu</span>}
            </li>
          ))}
        </ol>

        {isModerator && (
          <div className="note-card-actions">
            <button
              className={echo.discussed ? 'btn' : 'btn primary'}
              onClick={() => send({ t: 'setDiscussed', echoId: echo.id, discussed: !echo.discussed })}
            >
              {echo.discussed ? '↩️ Tandai belum dibahas' : '✅ Selesai dibahas'}
            </button>
          </div>
        )}
      </div>
    </Html>
  );
}
