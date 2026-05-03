'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Ambient floating particles — spores / pollen / organic motes       */
/*  Creates atmospheric depth and a sense of living environment        */
/* ------------------------------------------------------------------ */

interface AmbientParticlesProps {
  count?: number;
}

export function AmbientParticles({ count = 120 }: AmbientParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const frameSkipRef = useRef(0);

  // Generate initial positions, velocities, and phase offsets
  const { positions, velocities, phases, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const siz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribute in a wide cylinder around the scene
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.0 + Math.random() * 5.0;
      const height = -2.5 + Math.random() * 6.0;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      // Slow, drifting velocities
      vel[i * 3] = (Math.random() - 0.5) * 0.004;
      vel[i * 3 + 1] = 0.002 + Math.random() * 0.005; // Slight upward drift
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.004;

      // Phase offset for sinusoidal drifting
      pha[i] = Math.random() * Math.PI * 2;

      // Varied sizes for depth perception
      siz[i] = 0.008 + Math.random() * 0.025;
    }

    return { positions: pos, velocities: vel, phases: pha, sizes: siz };
  }, [count]);

  // Create geometry once
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, sizes]);

  // Soft circular particle texture (generated in memory)
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // Radial gradient for soft particle look
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(200, 240, 160, 1.0)');
    gradient.addColorStop(0.3, 'rgba(180, 230, 140, 0.6)');
    gradient.addColorStop(0.6, 'rgba(160, 220, 120, 0.2)');
    gradient.addColorStop(1, 'rgba(140, 200, 100, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    frameSkipRef.current = (frameSkipRef.current + 1) % 2;
    if (frameSkipRef.current !== 0) return;

    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const elapsed = clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Base drift
      posArr[ix] += velocities[ix];
      posArr[iy] += velocities[iy];
      posArr[iz] += velocities[iz];

      // Sinusoidal lateral wander
      posArr[ix] += Math.sin(elapsed * 0.3 + phases[i]) * 0.0008;
      posArr[iz] += Math.cos(elapsed * 0.25 + phases[i] * 1.3) * 0.0008;

      // Wrap particles that drift too far
      if (posArr[iy] > 4.0) {
        posArr[iy] = -2.5;
        posArr[ix] = (Math.random() - 0.5) * 10;
        posArr[iz] = (Math.random() - 0.5) * 10;
      }

      // Horizontal bounds
      const distSq = posArr[ix] * posArr[ix] + posArr[iz] * posArr[iz];
      if (distSq > 49) {
        const angle = Math.atan2(posArr[iz], posArr[ix]) + Math.PI;
        posArr[ix] = Math.cos(angle) * 1.5;
        posArr[iz] = Math.sin(angle) * 1.5;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Subtle overall rotation for atmospheric movement
    pointsRef.current.rotation.y = elapsed * 0.008;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        map={particleTexture}
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#c8f0a0"
      />
    </points>
  );
}
