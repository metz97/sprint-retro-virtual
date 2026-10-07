export type RoomId = 'how' | 'keep' | 'actions';
export type CategoryId = 'liked' | 'lacked' | 'learned' | 'longed' | 'actions';

export interface CategoryDef {
  id: CategoryId;
  label: string;
  emoji: string;
  floor: string;
  accent: string;
}

export interface RoomDef {
  id: RoomId;
  title: string;
  emoji: string;
  centerX: number;
  categories: CategoryId[];
}

export const CATEGORIES: Record<CategoryId, CategoryDef> = {
  liked: { id: 'liked', label: 'What did you like', emoji: '☀️', floor: '#d3eab4', accent: '#5fa83b' },
  lacked: { id: 'lacked', label: 'What did the team lack', emoji: '🌧️', floor: '#c2cbd8', accent: '#58708f' },
  learned: { id: 'learned', label: 'What did you learn', emoji: '📚', floor: '#f2dfbb', accent: '#b9822f' },
  longed: { id: 'longed', label: 'What does the team long for', emoji: '🌠', floor: '#d2cbee', accent: '#6b5bb5' },
  actions: { id: 'actions', label: 'Actions', emoji: '🎯', floor: '#f5d2c6', accent: '#c4573a' },
};

export const ROOMS: RoomDef[] = [
  { id: 'how', title: 'How did it go', emoji: '🌤️', centerX: -14, categories: ['liked', 'lacked'] },
  { id: 'keep', title: 'What are we going to keep', emoji: '💡', centerX: 0, categories: ['learned', 'longed'] },
  { id: 'actions', title: 'Actions', emoji: '🎯', centerX: 14, categories: ['actions'] },
];

export function roomById(id: string): RoomDef | undefined {
  return ROOMS.find((r) => r.id === id);
}

export function isValidPlacement(roomId: string, categoryId: string): boolean {
  return !!roomById(roomId)?.categories.includes(categoryId as CategoryId);
}

export const PALETTE = [
  '#e4572e', '#2e86ab', '#f3a712', '#29bf12', '#a846a0', '#ff7aa2',
  '#17bebb', '#8c5e34', '#3d5a80', '#ef8354', '#6a994e', '#c1121f',
];

export const REACTIONS = ['👍', '👏', '🔥', '😂', '🎉', '❤️', '🤔', '💯'];

export const MAX_NAME_LENGTH = 24;
export const MAX_NOTE_LENGTH = 500;
