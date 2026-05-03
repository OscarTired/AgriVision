'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { RigidBody, BallCollider, type RapierRigidBody } from '@react-three/rapier';
import { Mesh, MeshStandardMaterial, Object3D, Plane, Raycaster, Vector2, Vector3 } from 'three';

const FRUIT_COUNT = 16;
const FRUIT_SCALE = 0.12;

/* ------------------------------------------------------------------ */
/*  Scene cloning with PBR-enhanced materials                          */
/* ------------------------------------------------------------------ */

function cloneFruitScene(scene: Object3D) {
  const cloned = scene.clone(true);
  cloned.traverse((child) => {
    if (child instanceof Mesh) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const clonedMats = mats.map((m) => {
        const c = m.clone() as MeshStandardMaterial;
        // PBR enhancements
        if ('roughness' in c) c.roughness = Math.max(0.25, (c.roughness ?? 0.5) * 0.8);
        if ('envMapIntensity' in c) c.envMapIntensity = 0.9;
        c.needsUpdate = true;
        return c;
      });
      child.material = Array.isArray(child.material) ? clonedMats : clonedMats[0];
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });
  return cloned;
}

/* ------------------------------------------------------------------ */
/*  Staggered confetti generation with cascade delay                   */
/* ------------------------------------------------------------------ */

interface FruitSpawnData {
  pos: [number, number, number];
  impulse: [number, number, number];
  delay: number; // stagger delay in seconds
}

function generateConfettiPositions(count: number): FruitSpawnData[] {
  const items: FruitSpawnData[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const radius = 0.2 + Math.random() * 0.6;
    items.push({
      pos: [
        Math.cos(angle) * radius,
        2.5 + Math.random() * 3.0,
        Math.sin(angle) * radius * 0.6,
      ],
      impulse: [
        Math.cos(angle) * (1.0 + Math.random() * 2.5),
        3 + Math.random() * 4,
        Math.sin(angle) * (0.8 + Math.random() * 1.5),
      ],
      // Stagger: each fruit spawns 40-80ms after the previous
      delay: i * (0.04 + Math.random() * 0.04),
    });
  }
  return items;
}

/* ------------------------------------------------------------------ */
/*  DraggableFruit — individual physics-driven fruit                   */
/* ------------------------------------------------------------------ */

function DraggableFruit({ initialPos, initialImpulse, spawnDelay, onDragStart, onDragEnd }: {
  initialPos: [number, number, number];
  initialImpulse: [number, number, number];
  spawnDelay: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const rigidRef = useRef<RapierRigidBody>(null);
  const gltf = useGLTF('/models/frambuesa.glb');
  const scene = useMemo(() => cloneFruitScene(gltf.scene), [gltf.scene]);

  const [hovered, setHovered] = useState(false);

  // All drag state lives in refs to avoid re-renders
  const dragging = useRef(false);
  const dragTarget = useRef(new Vector3());
  const prevTarget = useRef(new Vector3());
  const smoothVel = useRef(new Vector3());
  const grabOffset = useRef(new Vector3());
  const dragPlane = useRef(new Plane(new Vector3(0, 0, 1), 0));
  const pointerPos = useRef<{ x: number; y: number } | null>(null);

  const hasAppliedImpulse = useRef(false);
  const spawnTimer = useRef(0);
  const isSpawned = useRef(false);
  const { camera, gl } = useThree();

  // Raycast helper
  const projectPointer = useCallback((px: number, py: number): Vector3 => {
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new Vector2(
      ((px - rect.left) / rect.width) * 2 - 1,
      -((py - rect.top) / rect.height) * 2 + 1
    );
    const rc = new Raycaster();
    rc.setFromCamera(ndc, camera);
    const hit = new Vector3();
    rc.ray.intersectPlane(dragPlane.current, hit);
    return hit;
  }, [camera, gl]);

  useFrame((_, delta) => {
    if (!rigidRef.current) return;

    const clampedDelta = Math.min(delta, 0.05);

    // Staggered spawn delay
    if (!isSpawned.current) {
      spawnTimer.current += clampedDelta;
      if (spawnTimer.current < spawnDelay) return;
      isSpawned.current = true;
    }

    // Apply confetti impulse once
    if (!hasAppliedImpulse.current) {
      hasAppliedImpulse.current = true;
      rigidRef.current.applyImpulse(
        { x: initialImpulse[0] * 0.06, y: initialImpulse[1] * 0.06, z: initialImpulse[2] * 0.06 },
        true
      );
      rigidRef.current.applyTorqueImpulse(
        { x: (Math.random() - 0.5) * 0.015, y: (Math.random() - 0.5) * 0.015, z: (Math.random() - 0.5) * 0.015 },
        true
      );
      return;
    }

    // Smooth kinematic drag
    if (dragging.current && pointerPos.current) {
      const worldPt = projectPointer(pointerPos.current.x, pointerPos.current.y);
      const target = worldPt.add(grabOffset.current);

      const lerpSpeed = 1 - Math.exp(-18 * clampedDelta);
      dragTarget.current.lerp(target, lerpSpeed);

      const frameDelta = dragTarget.current.clone().sub(prevTarget.current);
      smoothVel.current.lerp(frameDelta.divideScalar(Math.max(clampedDelta, 0.001)), 0.15);
      prevTarget.current.copy(dragTarget.current);

      rigidRef.current.setNextKinematicTranslation({
        x: dragTarget.current.x,
        y: dragTarget.current.y,
        z: dragTarget.current.z,
      });
    }
  });

  // Pointer down: start drag
  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!rigidRef.current) return;

    (e.nativeEvent.target as HTMLElement)?.setPointerCapture?.(e.nativeEvent.pointerId);

    const bodyPos = rigidRef.current.translation();
    const bodyVec = new Vector3(bodyPos.x, bodyPos.y, bodyPos.z);

    dragPlane.current.setFromNormalAndCoplanarPoint(
      new Vector3(0, 0, 1).applyQuaternion(camera.quaternion),
      bodyVec
    );

    const worldPt = projectPointer(e.nativeEvent.clientX, e.nativeEvent.clientY);
    grabOffset.current.copy(bodyVec).sub(worldPt);
    dragTarget.current.copy(bodyVec);
    prevTarget.current.copy(bodyVec);
    smoothVel.current.set(0, 0, 0);
    pointerPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };

    rigidRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rigidRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    rigidRef.current.setBodyType(2, true);

    dragging.current = true;
    (gl.domElement as HTMLElement).style.cursor = 'grabbing';
    onDragStart?.();

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      pointerPos.current = { x: e.clientX, y: e.clientY };
    };

    const onUp = () => {
      if (!dragging.current || !rigidRef.current) return;
      dragging.current = false;
      pointerPos.current = null;
      (gl.domElement as HTMLElement).style.cursor = '';
      onDragEnd?.();

      rigidRef.current.setBodyType(0, true);

      const vel = smoothVel.current.clone();
      const maxSpeed = 18;
      if (vel.length() > maxSpeed) vel.normalize().multiplyScalar(maxSpeed);

      rigidRef.current.setLinvel({ x: vel.x, y: vel.y, z: vel.z }, true);
      rigidRef.current.applyTorqueImpulse(
        {
          x: (Math.random() - 0.5) * 0.03,
          y: (Math.random() - 0.5) * 0.03,
          z: (Math.random() - 0.5) * 0.03,
        },
        true
      );

      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [camera, projectPointer, gl, onDragStart, onDragEnd]);

  useEffect(() => {
    if (!dragging.current) {
      document.body.style.cursor = hovered ? 'grab' : '';
    }
    return () => { document.body.style.cursor = ''; };
  }, [hovered]);

  return (
    <RigidBody
      ref={rigidRef}
      position={initialPos}
      colliders={false}
      restitution={0.5}
      friction={0.7}
      linearDamping={0.35}
      angularDamping={0.5}
      mass={0.12}
      canSleep
      ccd={false}
    >
      <BallCollider args={[0.14]} />
      <group
        scale={FRUIT_SCALE}
        onPointerDown={onPointerDown}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <primitive object={scene} />
      </group>
    </RigidBody>
  );
}

/* ------------------------------------------------------------------ */
/*  InteractiveFruit — spawns staggered fruit cascade                  */
/* ------------------------------------------------------------------ */

export function InteractiveFruit({ visible, onDragStart, onDragEnd }: { visible: boolean; onDragStart?: () => void; onDragEnd?: () => void }) {
  const [fruits, setFruits] = useState<FruitSpawnData[]>([]);
  const spawned = useRef(false);

  useEffect(() => {
    if (visible && !spawned.current) {
      spawned.current = true;
      setFruits(generateConfettiPositions(FRUIT_COUNT));
    }
    if (!visible) {
      spawned.current = false;
      setFruits([]);
    }
  }, [visible]);

  if (!visible || fruits.length === 0) return null;

  return (
    <group>
      {fruits.map((f, i) => (
        <DraggableFruit
          key={i}
          initialPos={f.pos}
          initialImpulse={f.impulse}
          spawnDelay={f.delay}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      ))}
    </group>
  );
}

useGLTF.preload('/models/frambuesa.glb');
