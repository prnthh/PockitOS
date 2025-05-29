import { FollowCam } from "@/shared/FollowCam";
import { OrbitCam } from "@/shared/OrbitCam";
import { useEffect, useRef, useState, forwardRef } from "react";
import AnimatedModel from "@/shared/HumanoidModel";
import * as THREE from "three";
import { Tween, Group, Easing } from "@tweenjs/tween.js";
import { useFrame } from "@react-three/fiber";
import { Box, Html } from "@react-three/drei";

interface PlayerProps {
  position: [number, number, number];
  health?: number;
  color?: string;
  onClick?: (e: any) => void;
}

const tweenGroup = new Group(); // ✅ your own tween group

const Player = forwardRef<THREE.Group, PlayerProps>(({ position, health = 100, color = "orange", onClick }, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const tweenRef = useRef<Tween<THREE.Vector3> | null>(null);
  const rotationTweenRef = useRef<Tween<{ y: number }> | null>(null);
  const [animation, setAnimation] = useState("idle");
  const lastTweenedPosRef = useRef<THREE.Vector3>(new THREE.Vector3(...position));

  // Forward the ref
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(groupRef.current);
    } else {
      (ref as React.MutableRefObject<THREE.Group | null>).current = groupRef.current;
    }
  }, [ref]);

  // Helper to get yaw angle to target
  function getTargetYaw(from: THREE.Vector3, to: THREE.Vector3) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    return Math.atan2(dx, dz);
  }

  // Set initial position and rotation on mount
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
      lastTweenedPosRef.current.copy(groupRef.current.position); // sync
      groupRef.current.rotation.y = 0;
    }
  }, []);

  // Tween position and rotation on position change
  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;
    // Use lastTweenedPosRef as the true current position
    const currentPos = lastTweenedPosRef.current.clone();
    const targetPos = new THREE.Vector3(...position);
    if (currentPos.equals(targetPos)) return;

    setAnimation("walk"); // Switch to walk when moving

    // --- ROTATION ---
    const currentYaw = group.rotation.y;
    const targetYaw = getTargetYaw(currentPos, targetPos);
    // Normalize shortest angle
    let deltaYaw = targetYaw - currentYaw;
    if (deltaYaw > Math.PI) deltaYaw -= 2 * Math.PI;
    if (deltaYaw < -Math.PI) deltaYaw += 2 * Math.PI;
    const finalYaw = currentYaw + deltaYaw;

    // Stop existing tweens if needed
    tweenRef.current?.stop();
    rotationTweenRef.current?.stop();

    // Animate rotation
    const rotObj = { y: currentYaw };
    const rotationTween = new Tween(rotObj)
      .to({ y: finalYaw }, 200)
      .easing(Easing.Linear.None)
      .onUpdate(() => {
        if (group) group.rotation.y = rotObj.y;
      });
    tweenGroup.add(rotationTween);
    rotationTween.start();
    rotationTweenRef.current = rotationTween;

    // Animate position using a separate vector
    const distance = currentPos.distanceTo(targetPos);
    const duration = distance * 0.7 * 1000; // 0.66 seconds per tile (unit)
    const tweenedPos = currentPos.clone();
    const tween = new Tween(tweenedPos)
      .to(targetPos, duration)
      .easing(Easing.Linear.None)
      .onUpdate(() => {
        if (group) group.position.copy(tweenedPos);
        lastTweenedPosRef.current.copy(tweenedPos); // always update
      })
      .onComplete(() => {
        setAnimation("idle"); // Switch to idle when done moving
      });
    tweenGroup.add(tween);
    tween.start();
    tweenRef.current = tween;
  }, [position]);

  useFrame((_, delta) => {
    // ✅ drive your own tween group
    tweenGroup.update(performance.now());
  });

  return (
    <>
      <group ref={groupRef}>
        <AnimatedModel
          position={[0, -0.3, 0]}
          debug={true}
          model={"/models/rigga.glb"}
          animation={animation}
          height={0.95}
          onClick={onClick}
          scale={0.8}
        />
        {color == 'orange' && <OrbitCam />}
      </group>
      <Html center position={[position[0], position[1] + .7, position[2]]} style={{ pointerEvents: "none" }}>
        <div className="text-white bg-black p-1 rounded">
          {`HP:${health ?? 0}`}
        </div>
      </Html>
    </>
  );
});

export default Player;
