import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { pathLength, samplePath, type XZ } from '../../shared/layout';
import { now, type Reaction } from '../store';

const WALK_SPEED = 4.2;
const SKIN = ['#f5d0b5', '#e8b48f', '#c98e66', '#a56b45', '#7d4f32'];
const HAIR = ['#2b2118', '#4a3424', '#1c1c1c', '#6b4a2b', '#b07b3c'];
const OFFLINE = '#a3a9b3';
// Face the isometric camera when standing still.
const IDLE_YAW = Math.atan2(10, 24);

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export interface CharacterProps {
  seed: string;
  name: string;
  color: string;
  variant: 'live' | 'echo' | 'anon';
  /** Where the character walks; a single point means it just stands there. */
  path: XZ[];
  walkStart?: number;
  pulseAt?: number;
  reaction?: Reaction;
  offline?: boolean;
  badge?: string;
  dimmed?: boolean;
  highlighted?: boolean;
  ringColor?: string;
  onClick?: () => void;
}

export function Character(props: CharacterProps) {
  const { seed, name, variant, path, walkStart, pulseAt, reaction, offline, badge, dimmed, highlighted, ringColor, onClick } = props;
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  const total = useMemo(() => pathLength(path), [path]);
  const h = hash(seed);
  const anon = variant === 'anon';
  const shirt = offline ? OFFLINE : props.color;
  const skin = anon ? '#efeaff' : SKIN[h % SKIN.length];
  const hair = anon ? '#2a2440' : HAIR[(h >> 3) % HAIR.length];
  const phase = (h % 100) / 16;

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const t = now();
    const end = path[path.length - 1];
    let pos: XZ = end;
    let yaw = IDLE_YAW;
    let walking = false;
    if (walkStart !== undefined) {
      const d = (t - walkStart) * WALK_SPEED;
      if (d < total) {
        const s = samplePath(path, d);
        pos = s.pos;
        yaw = Math.atan2(s.dir[0], s.dir[1]);
        walking = true;
      }
    }

    let jump = 0;
    for (const at of [pulseAt, reaction?.at]) {
      if (at !== undefined && t - at < 0.6) jump = Math.max(jump, Math.sin((Math.PI * (t - at)) / 0.6) * 0.6);
    }
    g.position.set(pos[0], jump, pos[1]);

    const k = 1 - Math.exp(-dt * 10);
    let dy = yaw - g.rotation.y;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    g.rotation.y += dy * k;

    const swing = walking ? Math.sin(t * 11) * 0.7 : 0;
    legL.current!.rotation.x += (swing - legL.current!.rotation.x) * k;
    legR.current!.rotation.x += (-swing - legR.current!.rotation.x) * k;
    armL.current!.rotation.x += (-swing - armL.current!.rotation.x) * k;
    armR.current!.rotation.x += (swing - armR.current!.rotation.x) * k;
    body.current!.position.y = walking ? Math.abs(Math.sin(t * 11)) * 0.08 : Math.sin(t * 2 + phase) * 0.02;

    if (ring.current) {
      const s = highlighted ? 1.25 + Math.sin(t * 4) * 0.1 : 1;
      ring.current.scale.setScalar(s);
    }
  });

  const handleClick = onClick
    ? (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick();
      }
    : undefined;

  return (
    <group
      ref={group}
      position={[path[0][0], 0, path[0][1]]}
      onClick={handleClick}
      onPointerOver={onClick ? () => (document.body.style.cursor = 'pointer') : undefined}
      onPointerOut={onClick ? () => (document.body.style.cursor = '') : undefined}
    >
      {ringColor && (
        <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.03}>
          <ringGeometry args={[0.45, 0.62, 32]} />
          <meshBasicMaterial color={ringColor} transparent opacity={highlighted ? 0.95 : 0.6} toneMapped={false} />
        </mesh>
      )}
      <group ref={body}>
        <mesh ref={legL} position={[-0.12, 0.5, 0]} castShadow>
          <boxGeometry args={[0.17, 0.5, 0.2]} />
          <meshStandardMaterial color="#38404d" />
        </mesh>
        <mesh ref={legR} position={[0.12, 0.5, 0]} castShadow>
          <boxGeometry args={[0.17, 0.5, 0.2]} />
          <meshStandardMaterial color="#38404d" />
        </mesh>
        <mesh position={[0, 0.88, 0]} castShadow>
          <capsuleGeometry args={[0.27, 0.32, 4, 12]} />
          <meshStandardMaterial color={shirt} roughness={0.7} />
        </mesh>
        <mesh ref={armL} position={[-0.38, 0.92, 0]} castShadow>
          <boxGeometry args={[0.12, 0.42, 0.13]} />
          <meshStandardMaterial color={shirt} />
        </mesh>
        <mesh ref={armR} position={[0.38, 0.92, 0]} castShadow>
          <boxGeometry args={[0.12, 0.42, 0.13]} />
          <meshStandardMaterial color={shirt} />
        </mesh>
        <mesh position={[0, 1.45, 0]} castShadow>
          <sphereGeometry args={[0.27, 20, 16]} />
          <meshStandardMaterial color={offline ? '#c9ccd1' : skin} />
        </mesh>
        {/* hair cap, or a hood for the anonymous figure */}
        <mesh position={[0, anon ? 1.5 : 1.55, anon ? -0.04 : -0.02]} scale={anon ? [1.18, 1.1, 1.15] : [1.06, 0.72, 1.06]}>
          <sphereGeometry args={[0.28, 20, 16, 0, Math.PI * 2, 0, anon ? Math.PI * 0.62 : Math.PI / 2]} />
          <meshStandardMaterial color={hair} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.09, 1.47, 0.24]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={anon ? '#7c5cff' : '#1b1b1b'} />
        </mesh>
        <mesh position={[0.09, 1.47, 0.24]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={anon ? '#7c5cff' : '#1b1b1b'} />
        </mesh>
      </group>

      <Html position={[0, 2.05, 0]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
        <div className={`char-label ${variant} ${dimmed ? 'dimmed' : ''} ${highlighted ? 'highlighted' : ''}`}>
          {badge && <span className="badge">{badge}</span>}
          {variant === 'live' && <span className={`dot ${offline ? 'off' : 'on'}`} />}
          {name}
        </div>
        {reaction && (
          <div key={reaction.key} className="reaction-float">
            {reaction.emoji}
          </div>
        )}
      </Html>
    </group>
  );
}
