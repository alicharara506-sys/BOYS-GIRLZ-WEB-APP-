import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ProductModel } from "./Models";
import type { Product } from "../data/products";
function Model({
  product,
  color,
  angle,
}: {
  product: Product;
  color: string;
  angle: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  useEffect(() => invalidate(), [angle, color, invalidate]);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y = angle;
  });
  return (
    <group ref={ref}>
      <ProductModel kind={product.model} url={product.modelUrl} color={color} />
    </group>
  );
}
function CameraDistance({ zoom, reset }: { zoom: number; reset: number }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.25, zoom);
    camera.lookAt(0, 0, 0);
    invalidate();
  }, [camera, invalidate, zoom, reset]);
  return null;
}
export default function ProductScene({
  product,
  color,
  angle,
  zoom,
  reset,
  autoRotate,
}: {
  product: Product;
  color: string;
  angle: number;
  zoom: number;
  reset: number;
  autoRotate: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.25, zoom], fov: 36 }}
      frameloop={autoRotate ? "always" : "demand"}
      gl={{ antialias: true, powerPreference: "low-power" }}
      aria-label={`Interactive 3D style preview of ${product.name}`}
    >
      <ambientLight intensity={1.8} />
      <directionalLight position={[3, 5, 4]} intensity={2.5} />
      <directionalLight position={[-3, 1, -1]} intensity={1} color="#e4ecff" />
      <Suspense fallback={null}>
        <Model product={product} color={color} angle={angle} />
        <ContactShadows
          position={[0, -1.42, 0]}
          opacity={0.17}
          scale={7}
          blur={2.5}
          far={4}
          resolution={128}
          frames={1}
        />
      </Suspense>
      <OrbitControls
        key={reset}
        makeDefault
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI - 0.35}
        autoRotate={autoRotate}
        autoRotateSpeed={0.7}
        enableZoom={false}
      />
      <CameraDistance zoom={zoom} reset={reset} />
    </Canvas>
  );
}
