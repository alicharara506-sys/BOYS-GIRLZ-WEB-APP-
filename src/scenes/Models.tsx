import { useMemo } from "react";
import { Center, RoundedBox, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { ModelKind } from "../data/products";
function Soft({
  position = [0, 0, 0],
  scale = [1, 1, 1],
  color = "#a8c5e8",
}: {
  position?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}
export function Duck({ url = "/models/duck.glb" }: { url?: string }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  return (
    <Center>
      <primitive object={clone} scale={0.012} />
    </Center>
  );
}
export function ProductModel({
  kind,
  color = "#a8c5e8",
  url,
}: {
  kind: ModelKind;
  color?: string;
  url?: string;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.29, 0.9);
    s.lineTo(-0.52, 0.8);
    s.lineTo(-0.94, 0.36);
    s.quadraticCurveTo(-1.02, 0.24, -0.83, 0.11);
    s.lineTo(-0.68, 0.03);
    s.lineTo(-0.43, 0.29);
    s.lineTo(-0.4, -0.25);
    if (kind === "dress") {
      s.lineTo(-0.77, -1.2);
      s.quadraticCurveTo(0, -1.35, 0.77, -1.2);
      s.lineTo(0.4, -0.25);
    } else if (kind === "cardigan" || kind === "set") {
      s.lineTo(-0.43, -0.65);
      s.quadraticCurveTo(0, -0.72, 0.43, -0.65);
      s.lineTo(0.4, -0.25);
    } else {
      s.lineTo(-0.4, -1.03);
      s.quadraticCurveTo(-0.27, -1.18, -0.12, -1.06);
      s.lineTo(0, -0.55);
      s.lineTo(0.12, -1.06);
      s.quadraticCurveTo(0.27, -1.18, 0.4, -1.03);
      s.lineTo(0.4, -0.25);
    }
    s.lineTo(0.43, 0.29);
    s.lineTo(0.68, 0.03);
    s.lineTo(0.83, 0.11);
    s.quadraticCurveTo(1.02, 0.24, 0.94, 0.36);
    s.lineTo(0.52, 0.8);
    s.lineTo(0.29, 0.9);
    s.quadraticCurveTo(0, 0.62, -0.29, 0.9);
    return s;
  }, [kind]);
  if (url || kind === "duck") return <Duck url={url} />;
  if (kind === "bunny")
    return (
      <group>
        <Soft
          scale={[0.55, 0.72, 0.4]}
          position={[0, -0.35, 0]}
          color={color}
        />
        <Soft scale={[0.5, 0.48, 0.4]} position={[0, 0.47, 0]} color={color} />
        {[-1, 1].map((side) => (
          <group key={side}>
            <group rotation={[0, 0, side * 0.17]}>
              <Soft
                position={[side * 0.3, 1.07, 0]}
                scale={[0.16, 0.55, 0.12]}
                color={color}
              />
              <Soft
                position={[side * 0.3, 1.08, 0.11]}
                scale={[0.075, 0.37, 0.04]}
                color="#e1b8ad"
              />
            </group>
            <Soft
              position={[side * 0.52, -0.36, 0]}
              scale={[0.19, 0.4, 0.2]}
              color={color}
            />
            <Soft
              position={[side * 0.3, -0.86, 0.24]}
              scale={[0.26, 0.17, 0.34]}
              color={color}
            />
            <Soft
              position={[side * 0.18, 0.55, 0.36]}
              scale={[0.045, 0.05, 0.04]}
              color="#4c4037"
            />
          </group>
        ))}
        <Soft
          position={[0, 0.39, 0.41]}
          scale={[0.065, 0.05, 0.045]}
          color="#d39798"
        />
      </group>
    );
  if (kind === "boots")
    return (
      <group>
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * 0.43, -0.1, 0]}
            rotation={[0, side * 0.15, 0]}
          >
            <RoundedBox
              args={[0.6, 0.62, 0.58]}
              radius={0.12}
              smoothness={3}
              position={[0, 0.15, 0]}
            >
              <meshStandardMaterial color={color} roughness={0.9} />
            </RoundedBox>
            <Soft
              position={[0, -0.15, 0.2]}
              scale={[0.34, 0.27, 0.5]}
              color={color}
            />
            <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.23, 0.07, 10, 24]} />
              <meshStandardMaterial color="#faf4e7" />
            </mesh>
          </group>
        ))}
      </group>
    );
  return (
    <group position={[0, 0.1, 0]}>
      <mesh position={[0, 0, -0.17]}>
        <extrudeGeometry
          args={[
            shape,
            {
              depth: 0.26,
              bevelEnabled: true,
              bevelSegments: 3,
              steps: 1,
              bevelSize: 0.075,
              bevelThickness: 0.07,
              curveSegments: 16,
            },
          ]}
        />
        <meshStandardMaterial color={color} roughness={0.83} />
      </mesh>
      {(kind === "romper" || kind === "cardigan") && (
        <group position={[0, 0.93, -0.02]}>
          <Soft scale={[0.43, 0.43, 0.25]} color={color} />
          <Soft
            position={[0, -0.01, 0.2]}
            scale={[0.29, 0.3, 0.035]}
            color="#f5ecdf"
          />
          {[-1, 1].map((s) => (
            <Soft
              key={s}
              position={[s * 0.33, 0.3, 0]}
              scale={[0.15, 0.17, 0.12]}
              color={color}
            />
          ))}
        </group>
      )}
      {[-0.42, -0.14, 0.14, 0.42].map((y) => (
        <mesh key={y} position={[0, y, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.033, 0.033, 0.025, 12]} />
          <meshStandardMaterial color="#ead7b8" />
        </mesh>
      ))}
      {kind === "set" && (
        <group position={[0, -1.02, 0]}>
          {[-1, 1].map((s) => (
            <RoundedBox
              key={s}
              args={[0.32, 0.67, 0.28]}
              radius={0.055}
              position={[s * 0.2, -0.02, 0]}
            >
              <meshStandardMaterial color={color} />
            </RoundedBox>
          ))}
        </group>
      )}
      <Soft
        position={[0.24, 0.28, 0.19]}
        scale={[0.13, 0.12, 0.025]}
        color="#e8c77e"
      />
      {[-1, 1].map((s) => (
        <Soft
          key={s}
          position={[0.24 + s * 0.09, 0.38, 0.2]}
          scale={[0.045, 0.05, 0.025]}
          color="#e8c77e"
        />
      ))}
    </group>
  );
}
export function FloatingShape({
  heart = false,
  color = "#e8c77e",
}: {
  heart?: boolean;
  color?: string;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (heart) {
      s.moveTo(0, -0.4);
      s.bezierCurveTo(-0.8, 0.1, -0.4, 0.7, 0, 0.3);
      s.bezierCurveTo(0.4, 0.7, 0.8, 0.1, 0, -0.4);
    } else {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
        const r = i % 2 ? 0.21 : 0.45;
        if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      s.closePath();
    }
    return s;
  }, [heart]);
  return (
    <mesh>
      <extrudeGeometry
        args={[
          shape,
          {
            depth: 0.09,
            bevelEnabled: true,
            bevelThickness: 0.04,
            bevelSize: 0.025,
            bevelSegments: 2,
          },
        ]}
      />
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.08} />
    </mesh>
  );
}
