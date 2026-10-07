import type { CategoryId, RoomId } from './config';

export type Focus =
  | { type: 'overview' }
  | { type: 'room'; roomId: RoomId }
  | { type: 'echo'; echoId: string };

export interface PublicUser {
  id: string;
  name: string;
  color: string;
  isModerator: boolean;
  online: boolean;
  lobbyIndex: number;
}

/** A participant's "duplicate" standing in a room, holding their notes for one category. */
export interface PublicEcho {
  id: string;
  /** null = the shared anonymous figure of this category */
  ownerId: string | null;
  ownerName: string;
  color: string;
  roomId: RoomId;
  categoryId: CategoryId;
  slot: number;
  createdAt: number;
  revealed: boolean;
  discussed: boolean;
  noteCount: number;
  /** viewer wrote at least one note in this echo */
  mine: boolean;
}

export interface PublicNote {
  id: string;
  echoId: string;
  /** null while the echo is unrevealed and the viewer is not the author */
  text: string | null;
  mine: boolean;
  anonymous: boolean;
  createdAt: number;
}

export interface PublicState {
  retroName: string;
  users: PublicUser[];
  echoes: PublicEcho[];
  notes: PublicNote[];
  focus: Focus;
}

export type ClientMsg =
  | { t: 'join'; clientId: string; name: string; isModerator: boolean }
  | { t: 'addNote'; roomId: RoomId; categoryId: CategoryId; text: string; anonymous: boolean }
  | { t: 'deleteNote'; noteId: string }
  | { t: 'react'; emoji: string }
  | { t: 'focus'; focus: Focus }
  | { t: 'openEcho'; echoId: string }
  | { t: 'setDiscussed'; echoId: string; discussed: boolean }
  | { t: 'reset' };

export type ServerMsg =
  | { t: 'welcome'; userId: string }
  | { t: 'state'; state: PublicState }
  | { t: 'reaction'; userId: string; emoji: string }
  | { t: 'error'; message: string };
