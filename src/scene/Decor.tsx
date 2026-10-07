import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CategoryId } from '../../shared/config';
import type { Rect } from '../../shared/layout';

type V3 = [number, number, number];

/** Props that give each zone its mood. Kept near the back wall, behind the duplicates. */
export function ZoneDecor({ categoryId, rect }: { categoryId: CategoryId; rect: Rect }) {
  const cx = (rect.x0 + rect.x1) / 2;
  const back = rect.z0 + 1.6;
  switch (categoryId) {
    case 'liked':
      return (
        <>
          <Sun position={[rect.x0 + 1.4, 4.3, back + 0.6]} />
          <Tree position={[rect.x0 + 0.9, 0, back]} />
          <Flowers position={[rect.x1 - 1.2, 0, back]} />
          <Flowers position={[cx, 0, back + 0.4]} />
        </>
      );
    case 'lacked':
      return (
        <>
          <RainCloud position={[rect.x1 - 1.6, 4.3, back + 0.6]} />
          <mesh rotation-x={-Math.PI / 2} position={[rect.x1 - 1.6, 0.02, back + 0.6]}>
            <circleGeometry args={[0.9, 24]} />
            <meshStandardMaterial color="#8fb3d9" roughness={0.1} metalness={0.2} />
          </mesh>
          <DeadTree position={[rect.x0 + 0.9, 0, back]} />
        </>
      );
    case 'learned':
      return (
        <>
          <Bookshelf position={[rect.x0 + 0.5, 0, back + 0.3]} />
          <BookStack position={[cx + 1.4, 0, back + 0.2]} />
          <Lamp position={[rect.x1 - 0.9, 0, back]} />
        </>
      );
    case 'longed':
      return (
        <>
          <Stars rect={rect} />
          <Telescope position={[rect.x1 - 1.3, 0, back + 0.2]} />
          <BeanBag position={[rect.x0 + 1.1, 0, back + 0.2]} />
        </>
      );
    case 'actions':
      return (
        <>
          <RoundTable position={[cx, 0, back + 0.4]} />
          <Plant position={[rect.x0 + 0.8, 0, back]} />
          <Plant position={[rect.x1 - 0.8, 0, back]} />
        </>
      );
  }
}

function Sun({ position }: { position: V3 }) {
  const rays = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (rays.current) rays.current.rotation.z += dt * 0.4;
  });
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.55, 24, 16]} />
        <meshBasicMaterial color="#ffd23f" toneMapped={false} />
      </mesh>
      <group ref={rays}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} rotation-z={(i / 8) * Math.PI * 2} position={[Math.cos((i / 8) * Math.PI * 2) * 0.85, Math.sin((i / 8) * Math.PI * 2) * 0.85, 0]}>
            <boxGeometry args={[0.32, 0.08, 0.08]} />
            <meshBasicMaterial color="#ffb703" toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function RainCloud({ position }: { position: V3 }) {
  const drops = useRef<THREE.Group>(null);
  const seeds = useMemo(() => Array.from({ length: 24 }, () => [Math.random() * 2 - 1, Math.random() * 0.8 - 0.4, Math.random()]), []);
  useFrame(() => {
    const g = drops.current;
    if (!g) return;
    const t = performance.now() / 1000;
    g.children.forEach((d, i) => {
      const [, , s] = seeds[i];
      d.position.y = -0.3 - (((t * 1.6 + s) % 1) * 3.9);
    });
  });
  return (
    <group position={position}>
      {([[-0.5, 0, 0, 0.5], [0.1, 0.15, 0, 0.62], [0.65, -0.02, 0, 0.45], [0.05, -0.1, 0.3, 0.45]] as const).map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 16, 12]} />
          <meshStandardMaterial color="#8d99ae" />
        </mesh>
      ))}
      <group ref={drops}>
        {seeds.map(([x, z], i) => (
          <mesh key={i} position={[x, 0, z]}>
            <boxGeometry args={[0.03, 0.22, 0.03]} />
            <meshBasicMaterial color="#5e9cd8" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Tree({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position-y={0.6} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 1.2, 8]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      <mesh position-y={1.6} castShadow>
        <icosahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial color="#4caf50" flatShading />
      </mesh>
    </group>
  );
}

function DeadTree({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position-y={0.7} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 1.4, 6]} />
        <meshStandardMaterial color="#6d5d4b" />
      </mesh>
      <mesh position={[0.22, 1.15, 0]} rotation-z={-0.8} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.6, 6]} />
        <meshStandardMaterial color="#6d5d4b" />
      </mesh>
      <mesh position={[-0.2, 1.0, 0]} rotation-z={0.9} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.5, 6]} />
        <meshStandardMaterial color="#6d5d4b" />
      </mesh>
    </group>
  );
}

function Flowers({ position }: { position: V3 }) {
  const colors = ['#ff6b9a', '#ffd23f', '#ff8c42', '#c77dff'];
  return (
    <group position={position}>
      {colors.map((c, i) => {
        const x = (i % 2) * 0.35 - 0.17;
        const z = Math.floor(i / 2) * 0.35 - 0.17;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position-y={0.2}>
              <cylinderGeometry args={[0.02, 0.02, 0.4, 4]} />
              <meshStandardMaterial color="#3a7d44" />
            </mesh>
            <mesh position-y={0.42}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color={c} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Bookshelf({ position }: { position: V3 }) {
  const bookColors = ['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#8338ec', '#ffb703'];
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[0.5, 2, 1.8]} />
        <meshStandardMaterial color="#9c6644" />
      </mesh>
      {[0.45, 1.05, 1.65].map((y) =>
        bookColors.map((c, i) => (
          <mesh key={`${y}-${i}`} position={[0.27, y, -0.7 + i * 0.27]} castShadow>
            <boxGeometry args={[0.08, 0.42, 0.2]} />
            <meshStandardMaterial color={c} />
          </mesh>
        )),
      )}
    </group>
  );
}

function BookStack({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {['#264653', '#e76f51', '#e9c46a'].map((c, i) => (
        <mesh key={i} position={[0, 0.08 + i * 0.16, 0]} rotation-y={i * 0.3} castShadow>
          <boxGeometry args={[0.6, 0.15, 0.42]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
    </group>
  );
}

function Lamp({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position-y={0.7}>
        <cylinderGeometry args={[0.03, 0.03, 1.4, 6]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position-y={1.45}>
        <coneGeometry args={[0.3, 0.35, 16, 1, true]} />
        <meshStandardMaterial color="#fff3c4" emissive="#ffd166" emissiveIntensity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Stars({ rect }: { rect: Rect }) {
  const group = useRef<THREE.Group>(null);
  const stars = useMemo(
    () => Array.from({ length: 14 }, () => [rect.x0 + 0.5 + Math.random() * (rect.x1 - rect.x0 - 1), 3.6 + Math.random() * 1.2, rect.z0 + 0.8 + Math.random() * 1.6, Math.random() * 6] as const),
    [rect],
  );
  useFrame(() => {
    const t = performance.now() / 1000;
    group.current?.children.forEach((s, i) => s.scale.setScalar(0.7 + Math.sin(t * 3 + stars[i][3]) * 0.3));
  });
  return (
    <group ref={group}>
      {stars.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <octahedronGeometry args={[0.09, 0]} />
          <meshBasicMaterial color="#fff6a8" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Telescope({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {[0, 2.1, 4.2].map((a) => (
        <mesh key={a} position={[Math.sin(a) * 0.2, 0.45, Math.cos(a) * 0.2]} rotation={[Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35]}>
          <cylinderGeometry args={[0.025, 0.025, 0.95, 6]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      ))}
      <mesh position={[0, 1.05, 0]} rotation={[0.9, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 1.1, 12]} />
        <meshStandardMaterial color="#4a4e69" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

function BeanBag({ position }: { position: V3 }) {
  return (
    <mesh position={[position[0], 0.3, position[2]]} scale={[1, 0.6, 1]} castShadow>
      <sphereGeometry args={[0.55, 16, 12]} />
      <meshStandardMaterial color="#9d8df1" />
    </mesh>
  );
}

function RoundTable({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position-y={0.75} castShadow receiveShadow>
        <cylinderGeometry args={[1.4, 1.4, 0.1, 32]} />
        <meshStandardMaterial color="#d4a373" />
      </mesh>
      <mesh position-y={0.37}>
        <cylinderGeometry args={[0.12, 0.25, 0.74, 12]} />
        <meshStandardMaterial color="#6f4e37" />
      </mesh>
      {/* target on the table */}
      {['#c1121f', '#ffffff', '#c1121f', '#ffffff'].map((c, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position-y={0.81 + i * 0.002}>
          <circleGeometry args={[0.6 - i * 0.15, 32]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
      <mesh position={[0.05, 1.0, 0.05]} rotation={[0.5, 0, 0.3]}>
        <coneGeometry args={[0.05, 0.4, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

export function Plant({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position-y={0.25} castShadow>
        <cylinderGeometry args={[0.28, 0.2, 0.5, 12]} />
        <meshStandardMaterial color="#d97a4a" />
      </mesh>
      <mesh position-y={0.85} castShadow>
        <icosahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#52b788" flatShading />
      </mesh>
    </group>
  );
}
