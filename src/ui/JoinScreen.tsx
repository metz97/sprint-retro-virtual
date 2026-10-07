import { useState, type FormEvent } from 'react';
import { MAX_NAME_LENGTH } from '../../shared/config';
import { useRetro } from '../store';

function lastName(): string {
  try {
    return localStorage.getItem('retro.lastName') ?? '';
  } catch {
    return '';
  }
}

export function JoinScreen() {
  const join = useRetro((s) => s.join);
  const status = useRetro((s) => s.status);
  const [name, setName] = useState(lastName);
  const [isModerator, setIsModerator] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) join(name.trim(), isModerator);
  };

  return (
    <div className="join-backdrop">
      <form className="join-card" onSubmit={submit}>
        <div className="join-logo">🏡</div>
        <h1>Retro Village</h1>
        <p className="muted">Sprint retrospective dalam dunia 3D. Karaktermu akan menunggu di lobby.</p>
        <label className="field">
          <span>Nama</span>
          <input autoFocus value={name} maxLength={MAX_NAME_LENGTH} onChange={(e) => setName(e.target.value)} placeholder="mis. Khalid" />
        </label>
        <label className="check">
          <input type="checkbox" checked={isModerator} onChange={(e) => setIsModerator(e.target.checked)} />
          <span>🎙️ Masuk sebagai moderator</span>
        </label>
        <button className="btn primary big" disabled={!name.trim() || status !== 'open'}>
          {status === 'open' ? 'Masuk ke lobby →' : 'Menyambung ke server…'}
        </button>
      </form>
    </div>
  );
}
