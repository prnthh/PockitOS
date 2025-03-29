import { RapierRigidBody } from "@react-three/rapier";
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface UseUnstableWalkReturn {
    fallenOver: boolean;
    setFallenOver: (value: boolean) => void;
}

export default function useUnstableWalk(
    id: string,
    rigidBodyRef: React.RefObject<RapierRigidBody | null>,
    setAnimation: (animation: string) => void
): UseUnstableWalkReturn {
    const [fallenOver, setFallenOver] = useState(false);
    const [isRecovering, setIsRecovering] = useState(false);
    const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Handle recovery from fallen state
    useEffect(() => {
        if (fallenOver && !isRecovering) {
            // Wait a moment before starting recovery
            recoveryTimeoutRef.current = setTimeout(() => {
                setIsRecovering(true);
                // dispatch(setCurrentAction({ id, action: "recover" }));
                setAnimation("idle"); // Could use a "getup" animation if available
            }, 2000);
        }

        return () => {
            if (recoveryTimeoutRef.current) {
                clearTimeout(recoveryTimeoutRef.current);
            }
        };
    }, [fallenOver, isRecovering, setAnimation]);

    // Handle rotation recovery
    useFrame((state, delta) => {
        if (!isRecovering || !rigidBodyRef.current) return;

        const rb = rigidBodyRef.current;
        const currentRotation = rb.rotation();
        const currentQuat = new THREE.Quaternion(
            currentRotation.x,
            currentRotation.y,
            currentRotation.z,
            currentRotation.w
        );

        // Target quaternion - upright position (keep y rotation but reset x and z)
        const targetQuat = new THREE.Quaternion();
        const yAngle = Math.atan2(
            2 * (currentRotation.w * currentRotation.y + currentRotation.x * currentRotation.z),
            1 - 2 * (currentRotation.y * currentRotation.y + currentRotation.x * currentRotation.x)
        );
        targetQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yAngle);

        // Interpolate towards upright with a stronger force (increased from 3 to 8)
        currentQuat.slerp(targetQuat, Math.min(delta * 8, 1));

        // Apply the rotation more forcefully
        rb.setRotation(currentQuat, true);

        // Add an upward impulse to help with recovery
        if (isRecovering) {
            // Apply stronger upward force
            rb.applyImpulse(new THREE.Vector3(0, 0.02, 0), true);

            // Also reduce angular velocity to prevent spinning
            const angVel = rb.angvel();
            rb.setAngvel({ x: angVel.x * 0.8, y: angVel.y, z: angVel.z * 0.8 }, true);
        }

        // Check if we're close enough to upright
        const dot = Math.abs(currentQuat.dot(targetQuat));
        if (dot > 0.999) {
            setFallenOver(false);
            setIsRecovering(false);
        }
    });

    return {
        fallenOver,
        setFallenOver,
    };
}
