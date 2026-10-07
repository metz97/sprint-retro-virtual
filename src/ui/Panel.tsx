import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { CATEGORIES, MAX_NOTE_LENGTH, ROOMS, roomById, type CategoryId, type RoomId } from '../../shared/config';
import { useIsModerator, useRetro } from '../store';

export function Panel() {
  const [open, setOpen] = useState(true);
  const isModerator = useIsModerator();
  const session = useRetro((s) => s.session);
  const retroName = useRetro((s) => s.state?.retroName);

  return (
    <aside className={`panel ${open ? 'open' : 'closed'}`}>
      <button className="panel-toggle" onClick={() => setOpen(!open)} title={open ? 'Sembunyikan panel' : 'Tampilkan panel'}>
        {open ? '◀' : '✍️'}
      </button>
      <div className="panel-body">
        <header className="panel-header">
          <div className="muted small">{retroName}</div>
          <div className="whoami">
            {isModerator ? '🎙️' : '👤'} {session?.name}
            <span className="role">{isModerator ? 'Moderator' : 'Peserta'}</span>
          </div>
        </header>
        <NoteForm />
        <MyNotes />
        {isModerator && <ModeratorTools />}
      </div>
    </aside>
  );
}

function NoteForm() {
  const send = useRetro((s) => s.send);
  const [roomId, setRoomId] = useState<RoomId>('how');
  const [categoryId, setCategoryId] = useState<CategoryId>('liked');
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const room = roomById(roomId)!;

  const pickRoom = (id: RoomId) => {
    setRoomId(id);
    setCategoryId(roomById(id)!.categories[0]);
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    send({ t: 'addNote', roomId, categoryId, text: text.trim(), anonymous });
    setText('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
  };

  return (
    <form className="card" onSubmit={submit}>
      <h3>✍️ Tulis masukan</h3>
      <div className="segmented">
        {ROOMS.map((r) => (
          <button type="button" key={r.id} className={r.id === roomId ? 'active' : ''} onClick={() => pickRoom(r.id)} title={r.title}>
            {r.emoji} {r.id === 'keep' ? 'Keep' : r.title}
          </button>
        ))}
      </div>
      {room.categories.length > 1 && (
        <div className="categories">
          {room.categories.map((c) => {
            const def = CATEGORIES[c];
            return (
              <button
                type="button"
                key={c}
                className={`category ${c === categoryId ? 'active' : ''}`}
                style={c === categoryId ? { borderColor: def.accent, background: def.floor } : undefined}
                onClick={() => setCategoryId(c)}
              >
                {def.emoji} {def.label}
              </button>
            );
          })}
        </div>
      )}
      <textarea
        value={text}
        maxLength={MAX_NOTE_LENGTH}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={4}
        placeholder={`${CATEGORIES[categoryId].label}?`}
      />
      <div className="form-row">
        <label className="check">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          <span>🎭 Anonim</span>
        </label>
        <button className="btn primary" disabled={!text.trim()}>
          Kirim <span className="kbd">Ctrl+↵</span>
        </button>
      </div>
      <p className="muted small">
        {anonymous
          ? 'Karakter bertopeng akan keluar dari Pintu Anonim, tanpa namamu.'
          : 'Duplikat karaktermu akan berjalan dari lobby ke room ini.'}
      </p>
    </form>
  );
}

function MyNotes() {
  const state = useRetro((s) => s.state);
  const send = useRetro((s) => s.send);
  if (!state) return null;
  const echoes = new Map(state.echoes.map((e) => [e.id, e]));
  const mine = state.notes.filter((n) => n.mine).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <section className="card">
      <h3>🗂️ Masukanmu ({mine.length})</h3>
      {mine.length === 0 && <p className="muted small">Belum ada. Karaktermu masih santai di lobby.</p>}
      <ul className="my-notes">
        {mine.map((n) => {
          const echo = echoes.get(n.echoId);
          if (!echo) return null;
          const cat = CATEGORIES[echo.categoryId];
          return (
            <li key={n.id} style={{ borderLeftColor: cat.accent }}>
              <div className="my-note-meta">
                {cat.emoji} {cat.label}
                {n.anonymous && ' · 🎭'}
                <span className="status">{echo.discussed ? '✅ dibahas' : echo.revealed ? '👁️ dibuka' : '🔒 tertutup'}</span>
              </div>
              <div className="my-note-text">{n.text}</div>
              {!echo.revealed && (
                <button className="link-btn" onClick={() => send({ t: 'deleteNote', noteId: n.id })}>
                  Hapus
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ModeratorTools() {
  const state = useRetro((s) => s.state);
  const send = useRetro((s) => s.send);
  if (!state) return null;
  const total = state.echoes.length;
  const revealed = state.echoes.filter((e) => e.revealed).length;
  const discussed = state.echoes.filter((e) => e.discussed).length;

  const reset = () => {
    if (confirm('Mulai retro baru? Semua masukan dan peserta offline akan dihapus.')) send({ t: 'reset' });
  };

  return (
    <section className="card">
      <h3>🎙️ Moderator</h3>
      <p className="muted small">Klik karakter di room untuk membuka masukannya. Kamera semua peserta akan ikut.</p>
      <div className="progress-stats">
        {ROOMS.map((r) => {
          const inRoom = state.echoes.filter((e) => e.roomId === r.id);
          return (
            <div key={r.id}>
              <span>
                {r.emoji} {r.title}
              </span>
              <b>
                {inRoom.filter((e) => e.discussed).length}/{inRoom.length}
              </b>
            </div>
          );
        })}
      </div>
      <div className="progress">
        <div className="progress-fill" style={{ width: total ? `${(discussed / total) * 100}%` : 0 }} />
      </div>
      <p className="muted small">
        {discussed} dari {total} karakter sudah dibahas · {revealed} sudah dibuka
      </p>
      <button className="btn danger" onClick={reset}>
        🔄 Mulai retro baru
      </button>
    </section>
  );
}
