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

    useFrame((state, delta) => {
        const rigidBody = rigidBodyRef.current;
        if (!rigidBody || !target.current || targetReached.current) return;

        // Calculate path
        const position = rigidBody.translation();
        const directionToTarget = new THREE.Vector3(...target.current).sub(
            new THREE.Vector3(position.x, position.y, position.z)
        );
        const distance = directionToTarget.length();

        // Check if target is reached
        if (distance <= IDLE_THRESHOLD) {
            rigidBody.setLinvel({ x: 0, y: rigidBody.linvel().y, z: 0 }, true);
            setAnimation("idle");
            targetReached.current = true;
            target.current = undefined; // Clear target
            if (onDestinationReached) onDestinationReached();
            return;
        }

        // Calculate direction and rotation
        directionToTarget.y = 0;
        directionToTarget.normalize();
        const targetAngle = Math.atan2(directionToTarget.x, directionToTarget.z);
        const speed = distance > RUN_DISTANCE ? RUN_SPEED : WALK_SPEED;

        // Rotate toward target
        const currentRotation = rigidBody.rotation();
        const currentQuat = new THREE.Quaternion(
            currentRotation.x,
            currentRotation.y,
            currentRotation.z,
            currentRotation.w
        );
        const targetQuat = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            targetAngle
        );
        currentQuat.slerp(targetQuat, ROTATION_SPEED * delta);
        rigidBody.setRotation(currentQuat, true);

        // Move in current facing direction
        const currentAngle = new THREE.Vector3(0, 0, 1).applyQuaternion(currentQuat);
        const forward = new THREE.Vector3(currentAngle.x, 0, currentAngle.z);
        const forwardVelocity = forward.multiplyScalar(speed);

        rigidBody.setLinvel(
            {
                x: forwardVelocity.x,
                y: rigidBody.linvel().y,
                z: forwardVelocity.z,
            },
            true
        );

        setAnimation(speed > WALK_SPEED * 1.2 ? "run" : "walk");
    });

    return {
        isMoving: !!target.current && !targetReached.current,
        targetReached: targetReached.current,
    };
};

export default usePhysicsWalk;