import { useFrame } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import { RefObject, useEffect, useRef } from "react";
import * as THREE from "three";

const WALK_SPEED = 1.0;
const RUN_SPEED = 2.0;
const IDLE_THRESHOLD = 0.51;
const RUN_DISTANCE = 5.0;
const ROTATION_SPEED = 2.5;

const usePhysicsWalk = (
    rigidBodyRef: RefObject<RapierRigidBody | null>,
    setAnimation: any,
    position: [number, number, number] | undefined,
    onDestinationReached?: () => void
) => {
    const target = useRef<number[] | undefined>(undefined);
    const targetReached = useRef(false);

    useEffect(() => {
        const newTarget = position;

        // Update target and reset state if it changes
        if (JSON.stringify(target.current) !== JSON.stringify(newTarget)) {
            target.current = newTarget;
            targetReached.current = false;

            if (!newTarget) {
                setAnimation("idle");
                if (rigidBodyRef.current) {
                    rigidBodyRef.current.setLinvel({ x: 0, y: rigidBodyRef.current.linvel().y, z: 0 }, true);
                }
            }
        }
    }, [position, rigidBodyRef]);

    const getGroundNormal = (position: THREE.Vector3): THREE.Vector3 => {
        // Placeholder: always Y-up. Replace with actual ground normal logic if available.
        return new THREE.Vector3(0, 1, 0);
    };

    useFrame((state, delta) => {
        const rigidBody = rigidBodyRef.current;
        if (!rigidBody || !target.current || targetReached.current) return;

        // Current position
        const pos = rigidBody.translation();
        const currentPos = new THREE.Vector3(pos.x, pos.y, pos.z);

        // Target position
        const targetPos = new THREE.Vector3(target.current[0], target.current[1], target.current[2]);

        // Direction in 3D
        const directionToTarget = targetPos.clone().sub(currentPos);
        const distance = directionToTarget.length();

        // Check if target is reached
        if (distance <= IDLE_THRESHOLD) {
            rigidBody.setLinvel({ x: 0, y: rigidBody.linvel().y, z: 0 }, true);
            setAnimation("idle");
            targetReached.current = true;
            target.current = undefined;
            if (onDestinationReached) onDestinationReached();
            return;
        }

        // Project direction onto ground plane
        const groundNormal = getGroundNormal(currentPos);
        const projectedDir = directionToTarget.clone().projectOnPlane(groundNormal).normalize();

        // Calculate rotation to face movement direction (flip direction)
        const up = groundNormal;
        // Flip the direction so the front faces the target
        const lookAt = currentPos.clone().sub(projectedDir);
        const m = new THREE.Matrix4().lookAt(currentPos, lookAt, up);
        const targetQuat = new THREE.Quaternion().setFromRotationMatrix(m);

        // Slerp current rotation toward target
        const currentRotation = rigidBody.rotation();
        const currentQuat = new THREE.Quaternion(
            currentRotation.x,
            currentRotation.y,
            currentRotation.z,
            currentRotation.w
        );
        currentQuat.slerp(targetQuat, ROTATION_SPEED * delta);
        rigidBody.setRotation(currentQuat, true);

        setAnimation("idle"); // Always idle for now
    });

    return {
        isMoving: !!target.current && !targetReached.current,
        targetReached: targetReached.current,
    };
};

export default usePhysicsWalk;