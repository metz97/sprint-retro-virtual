import { ROOMS } from '../../shared/config';
import { useEffectiveFocus, useIsModerator, useNavigate, useRetro } from '../store';

export function TopBar() {
  const focus = useEffectiveFocus();
  const navigate = useNavigate();
  const isModerator = useIsModerator();
  const follow = useRetro((s) => s.follow);
  const setFollow = useRetro((s) => s.setFollow);
  const status = useRetro((s) => s.status);
  const online = useRetro((s) => s.state?.users.filter((u) => u.online).length ?? 0);

  const activeRoom = focus.type === 'room' ? focus.roomId : null;

  return (
    <div className="topbar">
      <nav className="nav">
        <button className={focus.type === 'overview' ? 'active' : ''} onClick={() => navigate({ type: 'overview' })}>
          🗺️ Semua
        </button>
        {ROOMS.map((r) => (
          <button key={r.id} className={activeRoom === r.id ? 'active' : ''} onClick={() => navigate({ type: 'room', roomId: r.id })}>
            {r.emoji} {r.title}
          </button>
        ))}
      </nav>
      <div className="topbar-status">
        {!isModerator &&
          (follow ? (
            <span className="pill follow">📡 Mengikuti moderator</span>
          ) : (
            <button className="pill free" onClick={() => setFollow(true)}>
              🔓 Lihat sendiri · ikuti moderator
            </button>
          ))}
        <span className={`pill conn ${status}`}>
          <span className="dot on" /> {status === 'open' ? `${online} online` : 'menyambung…'}
        </span>
      </div>
    </div>
  );
}
