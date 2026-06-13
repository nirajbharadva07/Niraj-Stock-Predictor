import { Canvas } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei';

function GlowSphere({ prediction }) {
  const isUp = prediction === "UP";
  return (
    <Float speed={3} rotationIntensity={1.2} floatIntensity={1.5}>
      <Sphere args={[1, 128, 128]} scale={3.2}>
        <MeshDistortMaterial
          color={isUp ? "#10b981" : "#f43f5e"}
          attach="material"
          distort={0.35}
          speed={1.8}
          roughness={0}
          metalness={0.2}
          opacity={0.85}
          transparent
        />
      </Sphere>
    </Float>
  );
}

export default function Hero3D({ prediction }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight
          position={[-10, -10, -5]}
          intensity={0.5}
          color={prediction === "UP" ? "#10b981" : "#f43f5e"}
        />
        <Stars radius={80} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
        <GlowSphere prediction={prediction} />
      </Canvas>
    </div>
  );
}