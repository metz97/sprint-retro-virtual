import { REACTIONS } from '../../shared/config';
import { useRetro } from '../store';

export function ReactionBar() {
  const send = useRetro((s) => s.send);
  return (
    <div className="reaction-bar">
      {REACTIONS.map((emoji) => (
        <button key={emoji} onClick={() => send({ t: 'react', emoji })} title="Kirim reaksi">
          {emoji}
        </button>
      ))}
    </div>
  );
}
