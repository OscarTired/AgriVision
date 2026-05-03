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

/* ------------------------------------------------------------------ */
/*  Spring physics class (shared pattern with PlantModel)              */
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
/*  Scene cloning with PBR-enhanced materials                          */
/* ------------------------------------------------------------------ */

const WEATHER_EMISSION = new Color('#88ccff');

function cloneWeatherScene(scene: Object3D) {
  const cloned = scene.clone(true);
  const materials: MeshStandardMaterial[] = [];

  cloned.traverse((child) => {
    if (child instanceof Mesh) {
      const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
      const clonedMaterials = sourceMaterials.map((material) => {
        const c = material.clone() as MeshStandardMaterial;
        c.transparent = true;
        c.opacity = 0;
        // Subtle iridescent emission for weather model
        if ('emissive' in c) {
          c.emissive.copy(WEATHER_EMISSION);
          c.emissiveIntensity = 0.15;
        }
        if ('roughness' in c) c.roughness = Math.max(0.3, (c.roughness ?? 0.5) * 0.8);
        if ('envMapIntensity' in c) c.envMapIntensity = 1.6;
        c.needsUpdate = true;
        return c;
      });

      materials.push(...clonedMaterials);
      child.material = Array.isArray(child.material) ? clonedMaterials : clonedMaterials[0];
      child.castShadow = false;
      child.receiveShadow = true;
    }
  });

  return { scene: cloned, materials };
}

function setOpacity(materials: MeshStandardMaterial[], opacity: number) {
  materials.forEach((material) => {
    material.opacity = opacity;
    material.depthWrite = opacity > 0.65;
  });
}

/* ------------------------------------------------------------------ */
/*  WeatherModel — floating atmospheric model with spring physics      */
/* ------------------------------------------------------------------ */

export function WeatherModel({ visible }: { visible: boolean }) {
  const groupRef = useRef<Group>(null);
  const opacityRef = useRef(0);
  const lastAppliedOpacity = useRef(-1);
  const gltf = useGLTF('/models/clima.glb');
  const { scene, materials } = useMemo(() => cloneWeatherScene(gltf.scene), [gltf.scene]);

  // Spring-driven position for organic float
  const floatSpring = useRef(new Spring(1.25, 30, 4));
  const scaleSpring = useRef(new Spring(0.34, 50, 6));
  const noiseSeed = useRef(Math.random() * 100);

  // GLTF Animation mixer
  const mixer = useRef<AnimationMixer | null>(null);

  useMemo(() => {
    if (gltf.animations && gltf.animations.length > 0) {
      const m = new AnimationMixer(scene);
      const action = m.clipAction(gltf.animations[0]);
      action.setLoop(LoopRepeat, Infinity);
      action.timeScale = 0.8; // Slightly slower for atmospheric feel
      action.play();
      mixer.current = m;
    }
    return null;
  }, [gltf.animations, scene]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    const clampedDelta = Math.min(delta, 0.05);
    const elapsed = clock.elapsedTime;

    // Smooth opacity transition
    opacityRef.current = MathUtils.damp(opacityRef.current, visible ? 0.85 : 0, 4, clampedDelta);
    groupRef.current.visible = opacityRef.current > 0.01;

    if (!visible && opacityRef.current <= 0.01) {
      return;
    }

    // Update GLTF animation only while visible/fading
    if (mixer.current) {
      mixer.current.update(clampedDelta);
    }

    // Organic floating via spring + multi-frequency noise
    const floatNoise =
      Math.sin(elapsed * 1.3 + noiseSeed.current) * 0.06 +
      Math.sin(elapsed * 0.7 + noiseSeed.current * 1.3) * 0.03;
    floatSpring.current.target = 1.25 + floatNoise;
    groupRef.current.position.y = floatSpring.current.update(clampedDelta);

    // Smooth rotation with slight wobble
    groupRef.current.rotation.y += clampedDelta * 0.22;
    groupRef.current.rotation.x = Math.sin(elapsed * 0.5 + noiseSeed.current) * 0.04;
    groupRef.current.rotation.z = Math.sin(elapsed * 0.35 + noiseSeed.current * 0.7) * 0.03;

    // Scale breathing via spring
    const scaleNoise = Math.sin(elapsed * 1.8) * 0.012;
    scaleSpring.current.target = visible ? 0.34 + scaleNoise : 0.15;
    groupRef.current.scale.setScalar(scaleSpring.current.update(clampedDelta));

    if (Math.abs(opacityRef.current - lastAppliedOpacity.current) > 0.015) {
      lastAppliedOpacity.current = opacityRef.current;
      setOpacity(materials, opacityRef.current);
    }
  });

  return <primitive ref={groupRef} object={scene} position={[1.6, 1.25, -0.7]} />;
}

useGLTF.preload('/models/clima.glb');
