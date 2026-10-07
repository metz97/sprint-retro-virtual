import { Canvas } from '@react-three/fiber';
import { ROOMS } from '../../shared/config';
import { useNavigate } from '../store';
import { CAMERA_OFFSET, CameraRig } from './CameraRig';
import { Characters } from './Characters';
import { FocusedNoteCard } from './NoteCard';
import { Ground, Lobby, Room } from './Rooms';

export function World() {
  const navigate = useNavigate();
  return (
    <Canvas shadows orthographic dpr={[1, 2]} camera={{ position: CAMERA_OFFSET.toArray(), zoom: 20, near: 0.1, far: 500 }}>
      <color attach="background" args={['#dde8f0']} />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#ffffff', '#b9c7d6', 1.2]} />
      <directionalLight
        position={[14, 26, 16]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
      />
      <CameraRig />
      <Ground />
      <Lobby onSelect={() => navigate({ type: 'overview' })} />
      {ROOMS.map((room) => (
        <Room key={room.id} room={room} onSelect={() => navigate({ type: 'room', roomId: room.id })} />
      ))}
      <Characters />
      <FocusedNoteCard />
    </Canvas>
  );
}
