import { CATEGORIES } from '../../shared/config';
import { ANON_PORTAL, echoPath, lobbySlot } from '../../shared/layout';
import type { PublicEcho } from '../../shared/types';
import { useEffectiveFocus, useIsModerator, useRetro } from '../store';
import { Character } from './Character';

function echoBadge(e: PublicEcho): string {
  if (e.discussed) return '✅';
  if (!e.revealed) return `💬 ${e.noteCount}`;
  return `👁️ ${e.noteCount}`;
}

export function Characters() {
  const state = useRetro((s) => s.state);
  const me = useRetro((s) => s.me);
  const walkStart = useRetro((s) => s.walkStart);
  const pulseAt = useRetro((s) => s.pulseAt);
  const reactions = useRetro((s) => s.reactions);
  const send = useRetro((s) => s.send);
  const viewLocal = useRetro((s) => s.viewLocal);
  const showToast = useRetro((s) => s.showToast);
  const focus = useEffectiveFocus();
  const isModerator = useIsModerator();
  if (!state) return null;

  const usersById = new Map(state.users.map((u) => [u.id, u]));

  const openEcho = (e: PublicEcho) => {
    if (isModerator) send({ t: 'openEcho', echoId: e.id });
    else if (e.revealed || e.mine) viewLocal({ type: 'echo', echoId: e.id });
    else showToast('Masukan ini belum dibuka moderator 🔒');
  };

  return (
    <>
      {state.users.map((u) => (
        <Character
          key={u.id}
          seed={u.id}
          variant="live"
          name={u.id === me ? `${u.name} (kamu)` : u.name}
          color={u.color}
          path={[lobbySlot(u.lobbyIndex)]}
          offline={!u.online}
          badge={u.isModerator ? '🎙️' : undefined}
          reaction={reactions[u.id]}
        />
      ))}
      {state.echoes.map((e) => {
        const owner = e.ownerId ? usersById.get(e.ownerId) : undefined;
        const start = owner ? lobbySlot(owner.lobbyIndex) : ANON_PORTAL;
        return (
          <Character
            key={e.id}
            seed={e.ownerId ?? e.id}
            variant={e.ownerId ? 'echo' : 'anon'}
            name={e.ownerName}
            color={e.color}
            path={echoPath(start, e.roomId, e.categoryId, e.slot)}
            walkStart={walkStart[e.id]}
            pulseAt={pulseAt[e.id]}
            badge={echoBadge(e)}
            dimmed={e.discussed}
            highlighted={focus.type === 'echo' && focus.echoId === e.id}
            ringColor={CATEGORIES[e.categoryId].accent}
            onClick={() => openEcho(e)}
          />
        );
      })}
    </>
  );
}
