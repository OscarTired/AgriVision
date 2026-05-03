'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Html,
  ContactShadows,
} from '@react-three/drei';
import { PlantModel } from './PlantModel';
import { WeatherModel } from './WeatherModel';
import { AmbientParticles } from './AmbientParticles';
import type { DiagnosisPlantSceneProps } from './plant-scene-types';
import * as THREE from 'three';
import {
  Sprout,
  Leaf,
  Microscope,
  CloudSun,
  CircleCheck,
  TriangleAlert,
  CircleX,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animated ground plane with radial gradient                         */
/* ------------------------------------------------------------------ */

function GroundPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const frameSkipRef = useRef(0);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    frameSkipRef.current = (frameSkipRef.current + 1) % 2;
    if (frameSkipRef.current !== 0) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    // Subtle opacity pulse synced with scene breathing
    mat.opacity = 0.18 + Math.sin(clock.elapsedTime * 0.4) * 0.04;
  });

  return (
    <mesh ref={meshRef} position={[0, -2.0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[5.5, 64]} />
      <meshStandardMaterial
        color="#2a4a20"
        roughness={0.92}
        metalness={0.05}
        transparent
        opacity={0.2}
        envMapIntensity={0.3}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner glow ring — subtle accent around the plant base              */
/* ------------------------------------------------------------------ */

function GlowRing() {
  const ringRef = useRef<THREE.Mesh>(null);
  const frameSkipRef = useRef(0);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    frameSkipRef.current = (frameSkipRef.current + 1) % 2;
    if (frameSkipRef.current !== 0) return;
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.06 + Math.sin(clock.elapsedTime * 0.8) * 0.03;
    ringRef.current.rotation.z = clock.elapsedTime * 0.05;
  });

  return (
    <mesh ref={ringRef} position={[0, -1.98, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.5, 3.5, 64]} />
      <meshBasicMaterial color="#5fa84a" transparent opacity={0.06} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene content — premium lighting rig (no physics, no post-proc)    */
/* ------------------------------------------------------------------ */

function SceneContent({ stage, growthProgress, showWeatherModel }: DiagnosisPlantSceneProps) {
  // Dynamic lighting intensity based on stage
  const isActive = stage !== 'idle';
  const spotIntensity = isActive ? 3.5 : 1.8;
  const fillIntensity = isActive ? 0.6 : 0.3;

  return (
    <>
      {/* Camera with cinematic FOV */}
      <PerspectiveCamera makeDefault position={[0, 0.2, 5.2]} fov={36} near={0.01} far={100} />

      {/* ============= PREMIUM LIGHTING RIG ============= */}

      {/* Ambient fill — low intensity to preserve contrast and depth */}
      <ambientLight intensity={0.35} color="#f0f4e8" />

      {/* Key light — warm directional (golden hour feel) */}
      <directionalLight
        position={[4, 8, 5]}
        intensity={2.2}
        color="#fff5e6"
        castShadow={false}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Greenhouse spotlight — cenital accent (the "signature" light) */}
      <spotLight
        position={[0, 7, 1]}
        angle={0.4}
        penumbra={0.8}
        intensity={spotIntensity}
        color="#e8f5d4"
        castShadow={false}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0003}
        target-position={[0, -1.8, 0]}
      />

      {/* Rim light — cool backlight for edge separation */}
      <pointLight position={[-3, 2, -3]} intensity={fillIntensity} color="#a8d8ea" decay={2} />

      {/* Accent fill — warm side (creates 3-point lighting) */}
      <pointLight position={[3, 1, 2]} intensity={0.4} color="#c4e89a" decay={2} />

      {/* ============= MODELS ============= */}

      <group position={[0, -1.8, 0]} rotation={[0, -0.15, 0]}>
        <PlantModel stage={stage} growthProgress={growthProgress} />
        <WeatherModel visible={showWeatherModel} />
      </group>

      {/* ============= ATMOSPHERIC ELEMENTS ============= */}

      {/* Ground plane with breathing opacity */}
      <GroundPlane />

      {/* Subtle glow ring around plant base */}
      <GlowRing />

      {/* Floating spore/pollen particles — ambient life (reduced count for perf) */}
      <AmbientParticles count={24} />

      {/* Contact shadows for grounded realism */}
      <ContactShadows
        position={[0, -1.97, 0]}
        opacity={0.35}
        scale={10}
        blur={2.4}
        far={4.5}
        resolution={128}
        frames={1}
        color="#1a2e12"
      />

      {/* Environment — warehouse for subtle metallic reflections */}
      <Environment preset="warehouse" environmentIntensity={0.6} />

      {/* ============= CONTROLS ============= */}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        target={[0, -1.2, 0]}
        minDistance={2.8}
        maxDistance={9}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.8}
        rotateSpeed={0.45}
        zoomSpeed={0.6}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading fallback — organic growth animation                        */
/* ------------------------------------------------------------------ */

function SceneFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 text-muted-foreground/70">
        {/* Organic pulsing loader */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-0 rounded-full border-2 border-primary/50 border-t-primary animate-spin" style={{ animationDuration: '0.9s' }} />
          <div className="absolute inset-1.5 rounded-full border-2 border-accent/30 border-b-transparent animate-spin" style={{ animationDuration: '1.4s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-pulse" />
          </div>
        </div>
        <span className="text-sm font-medium whitespace-nowrap animate-pulse">Cultivando ecosistema 3D...</span>
      </div>
    </Html>
  );
}

/* ------------------------------------------------------------------ */
/*  Stage indicator badges — glassmorphism with stage-aware icons       */
/* ------------------------------------------------------------------ */

const STAGE_LABELS: Record<string, { text: string; color: string }> = {
  idle: { text: 'Esperando imagen...', color: 'text-muted-foreground' },
  seedling: { text: 'Plantula detectada', color: 'text-emerald-500' },
  growing: { text: 'Analizando cultivo...', color: 'text-blue-500' },
  weather: { text: 'Consultando clima...', color: 'text-cyan-500' },
  healthy: { text: 'Diagnostico exitoso', color: 'text-green-500' },
  wilted: { text: 'Problema detectado', color: 'text-amber-500' },
  error: { text: 'Error en analisis', color: 'text-red-500' },
};

const STAGE_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  idle: Sprout,
  seedling: Leaf,
  growing: Microscope,
  weather: CloudSun,
  healthy: CircleCheck,
  wilted: TriangleAlert,
  error: CircleX,
};

/* ------------------------------------------------------------------ */
/*  DiagnosisPlantScene — main export                                  */
/* ------------------------------------------------------------------ */

export function DiagnosisPlantScene(props: DiagnosisPlantSceneProps) {
  const stageInfo = STAGE_LABELS[props.stage] || STAGE_LABELS.idle;
  const StageIcon = STAGE_ICON_MAP[props.stage] || Sprout;

  return (
    <div className="relative w-full h-[460px] md:h-[560px] lg:h-[620px] rounded-2xl overflow-hidden border border-border/30 shadow-2xl">
      {/* Layered background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--primary)/0.08)] via-background to-[hsl(var(--primary)/0.03)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,hsl(var(--primary)/0.15),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,hsl(var(--accent)/0.08),transparent_40%)]" />

      {/* Noise texture overlay for depth */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      {/* Top badges container */}
      <div className="pointer-events-none absolute top-4 inset-x-4 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        {/* Live badge — glassmorphism */}
        <div className="rounded-xl border border-primary/20 bg-background/70 px-3.5 py-2 text-xs font-semibold text-primary shadow-lg backdrop-blur-xl flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
          </span>
          Ecosistema 3D
        </div>

        {/* Stage indicator — animated glassmorphism */}
        <div className={`rounded-xl border border-border/30 bg-background/70 px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-xl flex items-center gap-2 transition-all duration-500 ${stageInfo.color}`}>
          <StageIcon className="w-3.5 h-3.5" />
          {stageInfo.text}
        </div>
      </div>

      {/* 3D Canvas — PBR, lightweight (no post-processing for perf) */}
      <Canvas
        dpr={[0.75, 1]}
        gl={{
          antialias: false,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          powerPreference: 'high-performance',
        }}
        shadows={false}
        performance={{ min: 0.35 }}
      >
        <Suspense fallback={<SceneFallback />}>
          <SceneContent
            stage={props.stage}
            growthProgress={props.growthProgress}
            showWeatherModel={props.showWeatherModel}
          />
        </Suspense>
      </Canvas>

      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/60 to-transparent" />
    </div>
  );
}
