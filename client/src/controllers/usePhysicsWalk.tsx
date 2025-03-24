import { useFrame } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import { RefObject, useEffect, useRef, useState } from "react";
import * as THREE from "three";

const WALK_SPEED = 1.0;
const RUN_SPEED = 2.0;
const IDLE_THRESHOLD = 0.5;
const RUN_DISTANCE = 5.0;
const ROTATION_SPEED = 2.5;

const usePhysicsWalk = (rigidBodyRef: RefObject<RapierRigidBody | null>, setAnimation: any, onDestinationReached?: () => void) => {
    const waitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [target, setTarget] = useState<number[] | undefined>([0, 0, 0]);
    const targetReached = useRef(false);

    useEffect(() => {
        targetReached.current = false;
        if (!target) {
            setAnimation("idle");
            return;
        }
        return () => {
            if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
        };
    }, [target]);

    useFrame((state, delta) => {
        const rigidBody = rigidBodyRef?.current;
        if (!rigidBody || !target || targetReached.current) return;

        const position = rigidBody.translation();
        const directionToTarget = new THREE.Vector3(...target).sub(
            new THREE.Vector3(position.x, position.y, position.z)
        );
        const distance = directionToTarget.length();

        if (distance <= IDLE_THRESHOLD) {
            rigidBody.setLinvel({ x: 0, y: rigidBody.linvel().y, z: 0 }, true);
            if (onDestinationReached) onDestinationReached();
            targetReached.current = true;
            setTarget(undefined);
            return;
        }

        // Rotate toward target
        directionToTarget.y = 0;
        directionToTarget.normalize();
        const targetAngle = Math.atan2(directionToTarget.x, directionToTarget.z);
        const currentRotation = rigidBody.rotation();
        const currentQuat = new THREE.Quaternion(currentRotation.x, currentRotation.y, currentRotation.z, currentRotation.w);
        const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
        currentQuat.slerp(targetQuat, ROTATION_SPEED * delta);
        rigidBody.setRotation(currentQuat, true);

        // Move only in current facing direction
        const currentAngle = new THREE.Vector3(0, 0, 1).applyQuaternion(currentQuat);
        const forward = new THREE.Vector3(currentAngle.x, 0, currentAngle.z);
        const speed = distance > RUN_DISTANCE ? RUN_SPEED : WALK_SPEED;
        const forwardVelocity = forward.multiplyScalar(speed);

        rigidBody.setLinvel({
            x: forwardVelocity.x,
            y: rigidBody.linvel().y,
            z: forwardVelocity.z
        }, true);

        setAnimation(speed > WALK_SPEED * 1.2 ? "run" : "walk");
    });

    return { target, setTarget };
}

export default usePhysicsWalk;