import { roomById, type CategoryId, type RoomId } from './config';

/** World-space [x, z] on the floor plane. */
export type XZ = [number, number];

export const ROOM_W = 12;
export const ROOM_Z0 = -12; // back wall
export const ROOM_Z1 = -1; // front wall (with door)
export const HALL_Z = 0;
export const LOBBY_Z0 = 1;
export const LOBBY_Z1 = 10;
export const WORLD_X = 21;
export const DOOR_W = 2.6;

/** Anonymous duplicates appear from here instead of from their author. */
export const ANON_PORTAL: XZ = [-19, 5.5];

const LOBBY_COLS = 12;

export function lobbySlot(index: number): XZ {
  const row = Math.floor(index / LOBBY_COLS) % 3;
  const col = index % LOBBY_COLS;
  return [(col - (LOBBY_COLS - 1) / 2) * 2.6, 3.6 + row * 2.2];
}

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

export function zoneRect(roomId: RoomId, categoryId: CategoryId): Rect {
  const room = roomById(roomId)!;
  const n = room.categories.length;
  const idx = Math.max(0, room.categories.indexOf(categoryId));
  const w = ROOM_W / n;
  const left = room.centerX - ROOM_W / 2;
  return { x0: left + idx * w, x1: left + (idx + 1) * w, z0: ROOM_Z0, z1: ROOM_Z1 };
}

/** Where the n-th duplicate of a zone stands. Fills back-to-front, wraps with an offset when full. */
export function zoneSlot(roomId: RoomId, categoryId: CategoryId, slot: number): XZ {
  const r = zoneRect(roomId, categoryId);
  const ux0 = r.x0 + 1;
  const ux1 = r.x1 - 1;
  const zBack = r.z0 + 3.5;
  const zFront = r.z1 - 1.6;
  const cols = Math.floor((ux1 - ux0) / 1.6) + 1;
  const rows = Math.floor((zFront - zBack) / 1.7) + 1;
  const capacity = cols * rows;
  const layer = Math.floor(slot / capacity);
  const i = slot % capacity;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const spacingX = (ux1 - ux0) / (cols - 1);
  return [ux0 + col * spacingX + layer * 0.7, zBack + row * 1.7 + layer * 0.6];
}

export function echoPath(start: XZ, roomId: RoomId, categoryId: CategoryId, slot: number): XZ[] {
  const cx = roomById(roomId)!.centerX;
  return [start, [cx, HALL_Z], [cx, ROOM_Z1 - 1.2], zoneSlot(roomId, categoryId, slot)];
}

export function pathLength(points: XZ[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

/** Position and heading at a given distance along a polyline. */
export function samplePath(points: XZ[], distance: number): { pos: XZ; dir: XZ } {
  let remaining = distance;
  for (let i = 1; i < points.length; i++) {
    const [ax, az] = points[i - 1];
    const [bx, bz] = points[i];
    const seg = Math.hypot(bx - ax, bz - az);
    if (seg === 0) continue;
    const dir: XZ = [(bx - ax) / seg, (bz - az) / seg];
    if (remaining <= seg) {
      return { pos: [ax + dir[0] * remaining, az + dir[1] * remaining], dir };
    }
    remaining -= seg;
  }
  return { pos: points[points.length - 1], dir: [0, 1] };
}
