import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { roomById } from '../../shared/config';
import { ROOM_Z0, ROOM_Z1, zoneSlot } from '../../shared/layout';
import { useEffectiveFocus, useRetro } from '../store';

export const CAMERA_OFFSET = new THREE.Vector3(10, 22, 24);
/** Matches the side panel width in styles.css, so focused things land in the visible area. */
export const panelWidth = (viewportWidth: number) => (viewportWidth > 900 ? 380 : 0);

export function CameraRig() {
  const focus = useEffectiveFocus();
  const echoes = useRetro((s) => s.state?.echoes);
  const size = useThree((s) => s.size);
  const target = useRef(new THREE.Vector3(0, 0, -1));
  const desired = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => {
    const forward = CAMERA_OFFSET.clone().negate().normalize();
    return forward.cross(new THREE.Vector3(0, 1, 0)).normalize();
  }, []);

  useFrame(({ camera }, dt) => {
    const panel = panelWidth(size.width);
    const w = size.width - panel;
    const h = size.height;
    let zoom = Math.min(w / 46, h / 26);
    desired.set(0, 0, -1.5);

    if (focus.type === 'room') {
      const room = roomById(focus.roomId);
      if (room) {
        desired.set(room.centerX, 0.5, (ROOM_Z0 + ROOM_Z1) / 2);
        zoom = Math.min(w / 15, h / 13);
      }
    } else if (focus.type === 'echo') {
      const echo = echoes?.find((e) => e.id === focus.echoId);
      if (echo) {
        const [x, z] = zoneSlot(echo.roomId, echo.categoryId, echo.slot);
        desired.set(x, 2.4, z);
        zoom = Math.min(w / 10, h / 10);
      }
    }
    // Shift left so the target sits in the middle of the area not covered by the panel.
    desired.addScaledVector(right, -panel / 2 / zoom);

    const k = 1 - Math.exp(-dt * 3.5);
    target.current.lerp(desired, k);
    camera.position.copy(target.current).add(CAMERA_OFFSET);
    camera.lookAt(target.current);
    camera.zoom += (zoom - camera.zoom) * k;
    camera.updateProjectionMatrix();
  });

  return null;
}
