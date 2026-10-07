import type { ThreeEvent } from '@react-three/fiber';
import { CATEGORIES, type RoomDef } from '../../shared/config';
import {
  ANON_PORTAL, DOOR_W, HALL_Z, LOBBY_Z0, LOBBY_Z1, ROOM_W, ROOM_Z0, ROOM_Z1, WORLD_X, zoneRect,
} from '../../shared/layout';
import { ZoneDecor, Plant } from './Decor';
import { TextSign } from './TextSign';

const WALL = '#f7f4ef';
const WALL_T = 0.3;
const BACK_H = 2.8;
const SIDE_H = 1.1;
const FRONT_H = 0.45;

function clickable(onClick: () => void) {
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onClick();
    },
  };
}

export function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -1]} receiveShadow>
      <planeGeometry args={[140, 100]} />
      <meshStandardMaterial color="#c9d8b6" />
    </mesh>
  );
}

export function Lobby({ onSelect }: { onSelect: () => void }) {
  const depth = LOBBY_Z1 - LOBBY_Z0;
  return (
    <group>
      {/* hallway between lobby and rooms */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, HALL_Z]} receiveShadow>
        <planeGeometry args={[WORLD_X * 2, 2]} />
        <meshStandardMaterial color="#d9d4cc" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, (LOBBY_Z0 + LOBBY_Z1) / 2]} receiveShadow {...clickable(onSelect)}>
        <planeGeometry args={[WORLD_X * 2, depth]} />
        <meshStandardMaterial color="#ead7b7" />
      </mesh>
      {/* rug under the waiting crowd */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 5.8]} receiveShadow>
        <planeGeometry args={[33, 6.4]} />
        <meshStandardMaterial color="#d8b98c" />
      </mesh>
      {/* low border walls */}
      <mesh position={[0, FRONT_H / 2, LOBBY_Z1]} castShadow>
        <boxGeometry args={[WORLD_X * 2 + WALL_T, FRONT_H, WALL_T]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      {[-WORLD_X, WORLD_X].map((x) => (
        <mesh key={x} position={[x, FRONT_H / 2, (LOBBY_Z0 + LOBBY_Z1) / 2 - 1]} castShadow>
          <boxGeometry args={[WALL_T, FRONT_H, depth + 2]} />
          <meshStandardMaterial color={WALL} />
        </mesh>
      ))}
      <TextSign title="🏡 Lobby" subtitle="Semua peserta menunggu di sini" width={7} height={1.3} bg="#fff8ec" accent="#c08b4a" position={[0, 0.02, 9.1]} rotation={[-Math.PI / 2, 0, 0]} />
      <Plant position={[-WORLD_X + 0.9, 0, LOBBY_Z1 - 0.9]} />
      <Plant position={[WORLD_X - 0.9, 0, LOBBY_Z1 - 0.9]} />
      <AnonPortal />
    </group>
  );
}

function AnonPortal() {
  const [x, z] = ANON_PORTAL;
  return (
    <group position={[x, 0, z]}>
      <mesh position-y={1.1}>
        <torusGeometry args={[0.85, 0.12, 12, 40]} />
        <meshStandardMaterial color="#7c5cff" emissive="#7c5cff" emissiveIntensity={0.8} />
      </mesh>
      <mesh position-y={1.1}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial color="#2a2440" transparent opacity={0.85} />
      </mesh>
      <TextSign title="🎭 Pintu Anonim" width={2.6} height={0.6} bg="#2a2440" fg="#ffffff" position={[0, 0.02, 1.2]} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}

export function Room({ room, onSelect }: { room: RoomDef; onSelect: () => void }) {
  const cx = room.centerX;
  const depth = ROOM_Z1 - ROOM_Z0;
  const cz = (ROOM_Z0 + ROOM_Z1) / 2;
  const segW = (ROOM_W - DOOR_W) / 2;

  return (
    <group>
      {room.categories.map((cat) => {
        const r = zoneRect(room.id, cat);
        const def = CATEGORIES[cat];
        const zx = (r.x0 + r.x1) / 2;
        return (
          <group key={cat}>
            <mesh rotation-x={-Math.PI / 2} position={[zx, 0.01, cz]} receiveShadow {...clickable(onSelect)}>
              <planeGeometry args={[r.x1 - r.x0, depth]} />
              <meshStandardMaterial color={def.floor} />
            </mesh>
            <TextSign
              title={`${def.emoji} ${def.label}`}
              width={Math.min(4.8, r.x1 - r.x0 - 1)}
              height={1.1}
              accent={def.accent}
              position={[zx, 1.75, ROOM_Z0 + WALL_T / 2 + 0.02]}
            />
            <ZoneDecor categoryId={cat} rect={r} />
          </group>
        );
      })}

      {room.categories.length > 1 && (
        <mesh rotation-x={-Math.PI / 2} position={[cx, 0.015, cz - 1]}>
          <planeGeometry args={[0.08, depth - 3]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}

      {/* back wall with the room title floating above it */}
      <mesh position={[cx, BACK_H / 2, ROOM_Z0]} castShadow receiveShadow>
        <boxGeometry args={[ROOM_W + WALL_T, BACK_H, WALL_T]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      <TextSign title={`${room.emoji} ${room.title}`} width={9} height={1.1} bg="#1f2937" fg="#ffffff" position={[cx, BACK_H + 0.85, ROOM_Z0]} />

      {[cx - ROOM_W / 2, cx + ROOM_W / 2].map((x) => (
        <mesh key={x} position={[x, SIDE_H / 2, cz]} castShadow receiveShadow>
          <boxGeometry args={[WALL_T, SIDE_H, depth]} />
          <meshStandardMaterial color={WALL} />
        </mesh>
      ))}

      {/* front wall with a doorway in the middle */}
      {[cx - ROOM_W / 2 + segW / 2, cx + ROOM_W / 2 - segW / 2].map((x) => (
        <mesh key={x} position={[x, FRONT_H / 2, ROOM_Z1]} castShadow>
          <boxGeometry args={[segW, FRONT_H, WALL_T]} />
          <meshStandardMaterial color={WALL} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[cx, 0.012, ROOM_Z1 + 0.6]}>
        <planeGeometry args={[DOOR_W - 0.4, 0.9]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
    </group>
  );
}
