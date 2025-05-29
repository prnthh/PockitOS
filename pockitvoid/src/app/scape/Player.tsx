import { FollowCam } from "@/shared/FollowCam";
import { OrbitCam } from "@/shared/OrbitCam";
import { useEffect, useRef } from "react";
import AnimatedModel from "@/shared/HumanoidModel";
import * as THREE from "three";
import { Tween, Group, Easing } from "@tweenjs/tween.js";
import { useFrame } from "@react-three/fiber";

interface PlayerProps {
  position: [number, number, number];
  color?: string;
  onClick?: (e: any) => void;
}

const tweenGroup = new Group(); // ✅ your own tween group

export default function Player({ position, color = "orange", onClick }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tweenRef = useRef<Tween<THREE.Vector3> | null>(null);

  // Set initial position on mount
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
    }
  }, []);

  // Tween position on position change
  useEffect(() => {
    if (!groupRef.current) return;

    const group = groupRef.current;
    const currentPos = group.position;
    const targetPos = new THREE.Vector3(...position);

    if (currentPos.equals(targetPos)) return;

    // Stop existing tween if needed
    tweenRef.current?.stop();

    const tween = new Tween(currentPos)
      .to(targetPos, 600)
      .easing(Easing.Quadratic.Out);

    tweenGroup.add(tween); // ✅ add to our tween group
    tween.start();
    tweenRef.current = tween;
  }, [position]);

  useFrame((_, delta) => {
    // ✅ drive your own tween group
    tweenGroup.update(performance.now());
  });

  return (
    <group ref={groupRef}>
      <AnimatedModel
        position={[0, -0.3, 0]}
        debug={true}
        model={"/models/rigga.glb"}
        animation={"idle"}
        height={0.95}
        onClick={onClick}
        scale={0.8}
      />
      <mesh position={position} scale={[0.8, 0.8, 0.8]} />
      {color === "orange" && <OrbitCam />}
    </group>
  );
}
