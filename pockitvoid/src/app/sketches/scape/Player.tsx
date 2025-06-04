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
  const rotationTweenRef = useRef<Tween<{ y: number }> | null>(null);
  const [animation, setAnimation] = useState("idle");
  // --- Damage bubble state ---
  const [damage, setDamage] = useState<number | null>(null);
  const [showDamage, setShowDamage] = useState(false);
  const prevHealthRef = useRef(health);
  const lastTweenedPosRef = useRef<THREE.Vector3>(new THREE.Vector3(...position));
  const targetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(...position));
  const movingRef = useRef(false);

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
      targetPosRef.current.copy(groupRef.current.position);
      groupRef.current.rotation.y = 0;
    }
  }, []);

  // Update target position on prop change
  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;
    const currentPos = group.position.clone();
    const targetPos = new THREE.Vector3(...position);
    if (!currentPos.equals(targetPos)) {
      setAnimation("walk");
      targetPosRef.current.copy(targetPos);
      movingRef.current = true;
      // --- ROTATION ---
      const currentYaw = group.rotation.y;
      const targetYaw = getTargetYaw(currentPos, targetPos);
      let deltaYaw = targetYaw - currentYaw;
      if (deltaYaw > Math.PI) deltaYaw -= 2 * Math.PI;
      if (deltaYaw < -Math.PI) deltaYaw += 2 * Math.PI;
      const finalYaw = currentYaw + deltaYaw;
      rotationTweenRef.current?.stop();
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
    } else {
      // If not moving, ensure animation is idle
      if (animation !== "idle") setAnimation("idle");
      movingRef.current = false;
    }
  }, [position]);

  // Detect health decrease and show damage bubble
  useEffect(() => {
    if (health < prevHealthRef.current) {
      const dmg = prevHealthRef.current - health;
      setDamage(dmg);
      setShowDamage(true);
      setTimeout(() => setShowDamage(false), 500);
    }
    prevHealthRef.current = health;
  }, [health]);

  useFrame((_, delta) => {
    tweenGroup.update(performance.now());
    if (!groupRef.current) return;
    const group = groupRef.current;
    const targetPos = targetPosRef.current;
    const currentPos = group.position;
    // Move at a variable speed: slow down as we approach the target
    const baseSpeed = 1.3; // max speed
    const dist = currentPos.distanceTo(targetPos);
    const slowRadius = 0.2; // start slowing down within this distance
    let speed = baseSpeed;
    if (dist < slowRadius) {
      speed *= dist / slowRadius; // linearly slow down as we approach
      speed = Math.max(speed, 0.2); // don't go below a minimum speed
    }
    if (dist > 0.001) {
      const direction = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
      const moveDist = Math.min(speed * delta, dist);
      currentPos.addScaledVector(direction, moveDist);
      lastTweenedPosRef.current.copy(currentPos);
      if (dist <= 0.01) {
        group.position.copy(targetPos);
        if (animation !== "idle") setAnimation("idle");
        movingRef.current = false;
      } else {
        if (animation !== "walk") setAnimation("walk");
      }
    }
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
        {color == 'orange' && <OrbitCam maxPolar={Math.PI / 2.2} />}
      </group>
      {/* HP Bar and Damage Bubble */}
      <Html center position={[position[0], position[1] + .7, position[2]]} style={{ pointerEvents: "none", minWidth: 60 }}>
        <div style={{ position: 'relative', width: 50, height: 14 }}>
          {/* HP Bar */}
          <div style={{
            width: '100%',
            height: 7,
            background: '#a00',
            borderRadius: 5,
            overflow: 'hidden',
            border: '1px solid black',
          }}>
            <div style={{
              width: `${Math.max(0, Math.min(health * 10, 100))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0f0, #6f6)',
              transition: 'width 0.2s',
            }} />
          </div>
          {/* Damage Bubble */}
          {showDamage && damage !== null && (
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 22,
              transform: 'translateX(-50%)',
              background: 'rgba(255,0,0,0.85)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
              zIndex: 2,
              animation: 'damage-pop 0.5s cubic-bezier(.5,-0.5,.5,1.5)',
            }}>
              -{damage}
            </div>
          )}
        </div>
        <style>{`
          @keyframes damage-pop {
            0% { opacity: 0; transform: translateX(-50%) scale(0.7) translateY(10px); }
            20% { opacity: 1; transform: translateX(-50%) scale(1.1) translateY(-2px); }
            80% { opacity: 1; transform: translateX(-50%) scale(1) translateY(-8px); }
            100% { opacity: 0; transform: translateX(-50%) scale(0.9) translateY(-18px); }
          }
        `}</style>
      </Html>
    </>
  );
});

export default Player;
