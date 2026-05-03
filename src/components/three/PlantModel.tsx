'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  AnimationMixer,
  LoopRepeat,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Color,
} from 'three';
import type { Group } from 'three';
import type { PlantStage } from './plant-scene-types';

/* ------------------------------------------------------------------ */
/*  Model paths & stage configuration                                  */
/* ------------------------------------------------------------------ */

const MODEL_PATHS: Record<Exclude<PlantStage, 'idle' | 'weather' | 'error'>, string> = {
  seedling: '/models/germinacion.glb',
  growing: '/models/crecimiento.glb',
  healthy: '/models/floracion.glb',
  wilted: '/models/marchita.glb',
};

const STAGE_TINTS: Record<Exclude<PlantStage, 'idle' | 'weather'>, Color> = {
  seedling: new Color('#9be36f'),
  growing: new Color('#4f9f5a'),
  healthy: new Color('#6fbd58'),
  wilted: new Color('#9b7a3f'),
  error: new Color('#8f6b3c'),
};

const STAGE_SCALES: Record<Exclude<PlantStage, 'idle' | 'weather' | 'error'>, number> = {
  seedling: 0.65,
  growing: 1.0,
  healthy: 1.35,
  wilted: 1.15,
};

/* ------------------------------------------------------------------ */
/*  Spring physics — organic breathing & transitions                   */
/* ------------------------------------------------------------------ */

class Spring {
  position: number;
  velocity: number;
  target: number;
  stiffness: number;
  damping: number;

  constructor(initial = 0, stiffness = 80, damping = 8) {
    this.position = initial;
    this.velocity = 0;
    this.target = initial;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  update(dt: number): number {
    const force = -this.stiffness * (this.position - this.target);
    const dampForce = -this.damping * this.velocity;
    this.velocity += (force + dampForce) * dt;
    this.position += this.velocity * dt;
    return this.position;
  }
}

/* ------------------------------------------------------------------ */
/*  Simplex-like pseudo-noise (GPU-free, deterministic)                */
/* ------------------------------------------------------------------ */

function organicNoise(t: number, seed: number): number {
  // Layer 3 sine waves with irrational frequency ratios for non-repeating organic motion
  return (
    Math.sin(t * 0.7 + seed) * 0.45 +
    Math.sin(t * 1.31 + seed * 2.17) * 0.30 +
    Math.sin(t * 2.47 + seed * 0.73) * 0.15 +
    Math.sin(t * 4.13 + seed * 1.51) * 0.10
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: clone scene with material setup                            */
/* ------------------------------------------------------------------ */

interface PlantModelProps {
  stage: PlantStage;
  growthProgress: number;
}

function cloneSceneWithMaterials(scene: Object3D, tint: Color) {
  const cloned = scene.clone(true);
  const materials: MeshStandardMaterial[] = [];

  cloned.traverse((child) => {
    if (child instanceof Mesh) {
      const src = Array.isArray(child.material) ? child.material : [child.material];
      const clones = src.map((m) => {
        const c = m.clone() as MeshStandardMaterial;
        c.transparent = true;
        c.opacity = 0;
        c.needsUpdate = true;
        // Subtle tint blending
        if ('color' in c && c.color) c.color.lerp(tint, 0.18);
        // PBR enhancements
        if ('roughness' in c) c.roughness = Math.max(0.35, (c.roughness ?? 0.5) * 0.85);
        if ('envMapIntensity' in c) c.envMapIntensity = 1.4;
        return c;
      });
      materials.push(...clones);
      child.material = Array.isArray(child.material) ? clones : clones[0];
      child.castShadow = false;
      child.receiveShadow = true;
    }
  });
  return { scene: cloned, materials };
}

function setOpacity(materials: MeshStandardMaterial[], opacity: number) {
  materials.forEach((m) => {
    m.opacity = opacity;
    m.depthWrite = opacity > 0.5;
  });
}

/* ------------------------------------------------------------------ */
/*  StageModel — individual GLB with spring physics + GLTF animations  */
/* ------------------------------------------------------------------ */

function StageModel({ path, visible, scale, tint }: { path: string; visible: boolean; scale: number; tint: Color }) {
  const groupRef = useRef<Group>(null);
  const gltf = useGLTF(path);
  const { scene, materials } = useMemo(() => cloneSceneWithMaterials(gltf.scene, tint), [gltf.scene, tint]);

  // Spring physics for organic transitions
  const breathSpring = useRef(new Spring(1, 60, 6));
  const scaleSpring = useRef(new Spring(visible ? scale : 0.01, 45, 7));
  const opacityRef = useRef(0);
  const lastAppliedOpacity = useRef(-1);

  // Seed for deterministic noise per model (so each one sways differently)
  const noiseSeed = useRef(Math.random() * 100);

  // GLTF Animation mixer — plays embedded animations if any
  const mixer = useRef<AnimationMixer | null>(null);

  useMemo(() => {
    if (gltf.animations && gltf.animations.length > 0) {
      const m = new AnimationMixer(scene);
      const action = m.clipAction(gltf.animations[0]);
      action.setLoop(LoopRepeat, Infinity);
      action.play();
      mixer.current = m;
    }
    return null;
  }, [gltf.animations, scene]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    const clampedDelta = Math.min(delta, 0.05); // Prevent physics explosion on tab-switch
    const elapsed = _state.clock.elapsedTime;

    // Update GLTF animation mixer
    if (visible && mixer.current) {
      mixer.current.update(clampedDelta);
    }

    // — Opacity crossfade with asymmetric speeds —
    const fadeSpeed = visible ? 2.2 : 3.8;
    opacityRef.current = MathUtils.damp(opacityRef.current, visible ? 1 : 0, fadeSpeed, clampedDelta);

    if (!visible && opacityRef.current <= 0.005) {
      groupRef.current.visible = false;
      if (lastAppliedOpacity.current !== 0) {
        lastAppliedOpacity.current = 0;
        setOpacity(materials, 0);
      }
      return;
    }

    // — Scale via spring physics —
    const targetScale = visible ? scale : scale * 0.4;
    scaleSpring.current.target = targetScale;
    const springScale = scaleSpring.current.update(clampedDelta);

    // — Organic breathing via spring —
    const breathTarget = visible ? 1 + organicNoise(elapsed * 1.2, noiseSeed.current) * 0.02 : 1;
    breathSpring.current.target = breathTarget;
    const breath = breathSpring.current.update(clampedDelta);

    // — Multi-frequency wind sway (organic, non-repeating) —
    const swayY = visible ? organicNoise(elapsed * 0.6, noiseSeed.current + 10) * 0.028 : 0;
    const swayZ = visible ? organicNoise(elapsed * 0.4, noiseSeed.current + 20) * 0.008 : 0;
    const tiltX = visible ? organicNoise(elapsed * 0.3, noiseSeed.current + 30) * 0.005 : 0;

    // — Vertical bob —
    const bob = visible ? Math.sin(elapsed * 0.8 + noiseSeed.current) * 0.018 : 0;

    // Apply transforms
    groupRef.current.scale.setScalar(springScale * breath);
    groupRef.current.rotation.y = swayY;
    groupRef.current.rotation.z = swayZ;
    groupRef.current.rotation.x = tiltX;
    groupRef.current.position.y = -0.2 + bob;

    groupRef.current.visible = opacityRef.current > 0.005;
    if (Math.abs(opacityRef.current - lastAppliedOpacity.current) > 0.01) {
      lastAppliedOpacity.current = opacityRef.current;
      setOpacity(materials, opacityRef.current);
    }
  });

  return (
    <primitive
      ref={groupRef}
      object={scene}
      position={[0, -0.2, 0]}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  PlantModel — orchestrates all stages                               */
/* ------------------------------------------------------------------ */

export function PlantModel({ stage, growthProgress }: PlantModelProps) {
  const resolved = stage === 'error' ? 'wilted' : stage;
  const active = resolved === 'weather' ? 'growing' : resolved;
  const growScale = MathUtils.lerp(STAGE_SCALES.seedling, STAGE_SCALES.growing, growthProgress);

  return (
    <group>
      <StageModel
        path={MODEL_PATHS.seedling}
        visible={active === 'seedling' || active === 'idle'}
        scale={active === 'idle' ? STAGE_SCALES.seedling * 0.8 : STAGE_SCALES.seedling}
        tint={STAGE_TINTS.seedling}
      />
      <StageModel
        path={MODEL_PATHS.growing}
        visible={active === 'growing'}
        scale={growScale}
        tint={STAGE_TINTS.growing}
      />
      <StageModel
        path={MODEL_PATHS.healthy}
        visible={active === 'healthy'}
        scale={STAGE_SCALES.healthy}
        tint={STAGE_TINTS.healthy}
      />
      <StageModel
        path={MODEL_PATHS.wilted}
        visible={active === 'wilted'}
        scale={STAGE_SCALES.wilted}
        tint={STAGE_TINTS.wilted}
      />
    </group>
  );
}

// Only preload the initial stage — others load on-demand
useGLTF.preload('/models/germinacion.glb');
