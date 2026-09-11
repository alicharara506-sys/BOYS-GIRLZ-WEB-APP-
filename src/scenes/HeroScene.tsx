import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { Duck, FloatingShape, ProductModel } from "./Models";
function World() {
  const group = useRef<THREE.Group>(null);
  const cloud = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const shades = useMemo(
    () => [new THREE.Color("#a8c5e8"), new THREE.Color("#f4b8c1")],
    [],
  );
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        state.pointer.x * 0.075,
        3,
        delta,
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        -state.pointer.y * 0.04,
        3,
        delta,
      );
    }
    if (cloud.current) {
      const t = Math.min(window.scrollY / window.innerHeight, 1);
      (cloud.current.material as THREE.MeshStandardMaterial).color
        .copy(shades[0])
        .lerp(shades[1], t);
      cloud.current.scale.x =
        1.2 + Math.sin(state.clock.elapsedTime * 0.35) * 0.12;
    }
  });
  const w = viewport.width;
  return (
    <group ref={group}>
      <ambientLight intensity={1.9} />
      <directionalLight position={[2, 5, 5]} intensity={2.2} color="#fff5e2" />
      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.35}>
        <group
          position={[-w * 0.18, 1.32, 0]}
          rotation={[0.1, 0.25, -0.15]}
          scale={0.53}
        >
          <FloatingShape color="#a8c5e8" />
        </group>
      </Float>
      <Float speed={0.9} rotationIntensity={0.3} floatIntensity={0.35}>
        <group
          position={[w * 0.21, 1.12, 0]}
          rotation={[0.1, -0.2, 0.12]}
          scale={0.47}
        >
          <FloatingShape heart color="#f0b0bd" />
        </group>
      </Float>
      <Float speed={1.1} rotationIntensity={0.4} floatIntensity={0.3}>
        <group
          position={[w * 0.33, -1.36, 0.8]}
          scale={0.37}
          rotation={[0.08, -0.5, 0.12]}
        >
          <Duck />
        </group>
      </Float>
      <Float speed={0.85} rotationIntensity={0.2} floatIntensity={0.3}>
        <group
          position={[-w * 0.34, -1.1, 0.7]}
          scale={0.32}
          rotation={[0.1, 0.4, -0.2]}
        >
          <ProductModel kind="romper" color="#a8c5e8" />
        </group>
      </Float>
      {Array.from({ length: 6 }, (_, i) => (
        <Float
          key={i}
          speed={0.5 + i * 0.13}
          rotationIntensity={0.5}
          floatIntensity={0.3}
        >
          <group
            position={[
              (i % 2 ? 1 : -1) * w * (0.24 + (i % 3) * 0.075),
              0.5 - i * 0.35,
              -0.3,
            ]}
            scale={0.1 + (i % 3) * 0.025}
          >
            <FloatingShape
              heart={i % 3 === 0}
              color={i % 2 ? "#edbdc1" : "#e8c77e"}
            />
          </group>
        </Float>
      ))}
      <mesh
        ref={cloud}
        position={[-w * 0.44, 1.2, -0.6]}
        scale={[1.2, 0.43, 0.4]}
      >
        <sphereGeometry args={[0.7, 24, 16]} />
        <meshStandardMaterial
          color="#a8c5e8"
          transparent
          opacity={0.36}
          roughness={1}
        />
      </mesh>
      <mesh position={[w * 0.44, -0.2, -0.5]} scale={[1.1, 0.6, 0.4]}>
        <sphereGeometry args={[0.6, 24, 16]} />
        <meshStandardMaterial color="#f4b8c1" transparent opacity={0.24} />
      </mesh>
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.12} luminanceThreshold={1.15} mipmapBlur />
      </EffectComposer>
    </group>
  );
}
export default function HeroScene({ active }: { active: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8], fov: 35 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      frameloop={active ? "always" : "never"}
      fallback={null}
      aria-label="Floating pastel stars, hearts, baby outfit, and toy duck"
    >
      <Suspense fallback={null}>
        <World />
      </Suspense>
    </Canvas>
  );
}
