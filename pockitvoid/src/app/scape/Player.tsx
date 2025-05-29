import { FollowCam } from "@/shared/FollowCam";
import { OrbitCam } from "@/shared/OrbitCam";
import { useEffect, useRef, useState } from "react";
import AnimatedModel from "@/shared/HumanoidModel";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

interface PlayerProps {
  position: [number, number, number];
  health?: number;
  color?: string;
  onClick?: (e: any) => void;
}

export default function Player({ position, health = 100, color = "orange", onClick }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isMoving, setIsMoving] = useState(false);
  const lastYawRef = useRef(0);
  const rotLerpSpeed = 5; // higher is snappier, 20~50 for <100ms

  // Set initial position on mount
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
    }
  }, []);

  // Lerp position and rotate to face direction in useFrame
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const current = groupRef.current.position;
    const target = new THREE.Vector3(...position);
    const speed = 1; // units per second
    const toTarget = target.clone().sub(current);
    const distance = toTarget.length();
    if (distance > 0.01) {
      setIsMoving(true);
      const move = Math.min(speed * delta, distance);
      const dir = toTarget.clone().normalize();
      current.add(dir.multiplyScalar(move));
      // --- Rotation logic ---
      const targetYaw = Math.atan2(dir.x, dir.z);
      let currentYaw = groupRef.current.rotation.y;
      // Shortest angle
      let deltaYaw = targetYaw - currentYaw;
      if (deltaYaw > Math.PI) deltaYaw -= 2 * Math.PI;
      if (deltaYaw < -Math.PI) deltaYaw += 2 * Math.PI;
      currentYaw += deltaYaw * Math.min(1, rotLerpSpeed * delta); // snappy
      groupRef.current.rotation.y = currentYaw;
      lastYawRef.current = currentYaw;
    } else {
      current.copy(target);
      setIsMoving(false);
      // Snap to last yaw
      groupRef.current.rotation.y = lastYawRef.current;
    }
  });

  return (
    <group ref={groupRef}>
      <AnimatedModel
        position={[0, -0.3, 0]}
        debug={true}
        model={"/models/rigga.glb"}
        animation={isMoving ? "walk" : "idle"}
        height={0.95}
        onClick={onClick}
        scale={0.8}
      />
      {color === "orange" && <OrbitCam />}
      <Html center position={[0, 0.8, 0]}>
        <div className="text-white bg-black p-1 rounded">
          {`HP:${health ?? 0}`}
        </div>
      </Html>
    </group>
  );
}
