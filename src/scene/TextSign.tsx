import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const PX_PER_UNIT = 160;
const FONT = '"Segoe UI", "Segoe UI Emoji", system-ui, sans-serif';

interface TextSignProps {
  title: string;
  subtitle?: string;
  width: number;
  height: number;
  bg?: string;
  fg?: string;
  accent?: string;
  position: [number, number, number];
  rotation?: [number, number, number];
}

/** Text painted onto a canvas texture, so signs live in the world and scale with the camera. */
export function TextSign({ title, subtitle, width, height, bg = '#ffffff', fg = '#1f2937', accent, position, rotation }: TextSignProps) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * PX_PER_UNIT);
    canvas.height = Math.round(height * PX_PER_UNIT);
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    const r = Math.min(w, h) * 0.18;

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(4, 4, w - 8, h - 8, r);
    ctx.fill();
    if (accent) {
      ctx.lineWidth = Math.max(6, h * 0.04);
      ctx.strokeStyle = accent;
      ctx.stroke();
    }

    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleSize = subtitle ? h * 0.34 : h * 0.5;
    ctx.font = `700 ${titleSize}px ${FONT}`;
    fitText(ctx, title, w * 0.9, titleSize, 700);
    ctx.fillText(title, w / 2, subtitle ? h * 0.36 : h / 2);
    if (subtitle) {
      const subSize = h * 0.2;
      ctx.globalAlpha = 0.75;
      fitText(ctx, subtitle, w * 0.9, subSize, 500);
      ctx.fillText(subtitle, w / 2, h * 0.7);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, [title, subtitle, width, height, bg, fg, accent]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight: number) {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (ctx.measureText(text).width > maxWidth && s > 8) {
    s *= 0.92;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
}
