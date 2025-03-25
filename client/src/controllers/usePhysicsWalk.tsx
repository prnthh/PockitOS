import { useFrame } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import { RefObject, useEffect, useRef, useState } from "react";
import * as THREE from "three";

const WALK_SPEED = 1.0;
const RUN_SPEED = 2.0;
const IDLE_THRESHOLD = 0.5;
const RUN_DISTANCE = 5.0;
const ROTATION_SPEED = 2.5;

// Fallback for browsers that don't support requestIdleCallback
const requestIdleCallbackPolyfill = (callback: IdleRequestCallback, options?: IdleRequestOptions) => {
    const timeout = options?.timeout || 50;
    return setTimeout(() => {
        const start = Date.now();
        callback({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
        });
    }, timeout);
};

const cancelIdleCallbackPolyfill = (id: number) => clearTimeout(id);

// Use the native implementation if available, otherwise use the polyfill
const requestIdle = window.requestIdleCallback || requestIdleCallbackPolyfill;
const cancelIdle = window.cancelIdleCallback || cancelIdleCallbackPolyfill;

const usePhysicsWalk = (rigidBodyRef: RefObject<RapierRigidBody | null>, setAnimation: any, onDestinationReached?: () => void) => {
    const waitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const idleCallbackRef = useRef<number | null>(null);
    const lastCalculationTimeRef = useRef<number>(0);
    const calculationResultsRef = useRef<{
        direction: THREE.Vector3,
        distance: number,
        targetAngle: number,
        speed: number
    } | null>(null);

    const [target, setTarget] = useState<number[] | undefined>([0, 0, 0]);
    const targetReached = useRef(false);

    useEffect(() => {
        targetReached.current = false;
        if (!target) {
            setAnimation("idle");
            return;
        }

        // Schedule first path calculation
        schedulePathCalculation();

        return () => {
            if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
            if (idleCallbackRef.current) cancelIdle(idleCallbackRef.current);
        };
    }, [target]);

    // Schedule path calculation during idle time
    const schedulePathCalculation = () => {
        if (idleCallbackRef.current) cancelIdle(idleCallbackRef.current);

        idleCallbackRef.current = requestIdle(
            (deadline) => {
                // Only recalculate if we have time or it's been a while since last calculation
                const shouldCalculate = deadline.timeRemaining() > 5 ||
                    deadline.didTimeout ||
                    performance.now() - lastCalculationTimeRef.current > 200;

                if (shouldCalculate && rigidBodyRef.current && target && !targetReached.current) {
                    calculatePath();
                    lastCalculationTimeRef.current = performance.now();
                }

                // Schedule next calculation if target still exists
                if (target && !targetReached.current) {
                    schedulePathCalculation();
                }
            },
            { timeout: 100 } // Ensure calculation happens at least every 100ms
        );
    };

    // Calculate path and store results for use in render loop
    const calculatePath = () => {
        const rigidBody = rigidBodyRef.current;
        if (!rigidBody || !target) return;

        const position = rigidBody.translation();
        const directionToTarget = new THREE.Vector3(...target).sub(
            new THREE.Vector3(position.x, position.y, position.z)
        );
        const distance = directionToTarget.length();

        if (distance <= IDLE_THRESHOLD) {
            targetReached.current = true;
            calculationResultsRef.current = null;
            return;
        }

        // Calculate direction and rotation
        directionToTarget.y = 0;
        directionToTarget.normalize();
        const targetAngle = Math.atan2(directionToTarget.x, directionToTarget.z);
        const speed = distance > RUN_DISTANCE ? RUN_SPEED : WALK_SPEED;

        // Store calculation results
        calculationResultsRef.current = {
            direction: directionToTarget,
            distance,
            targetAngle,
            speed
        };
    };

    useFrame((state, delta) => {
        const rigidBody = rigidBodyRef?.current;
        if (!rigidBody || !target || targetReached.current) return;

        // Handle destination reached
        if (targetReached.current) {
            rigidBody.setLinvel({ x: 0, y: rigidBody.linvel().y, z: 0 }, true);
            if (onDestinationReached) onDestinationReached();
            setTarget(undefined);
            return;
        }

        // Use the precalculated results if available
        const results = calculationResultsRef.current;
        if (!results) return;

        // Check if we've reached the target during calculations
        if (results.distance <= IDLE_THRESHOLD) {
            rigidBody.setLinvel({ x: 0, y: rigidBody.linvel().y, z: 0 }, true);
            if (onDestinationReached) onDestinationReached();
            targetReached.current = true;
            setTarget(undefined);
            return;
        }

        // Rotate toward target
        const currentRotation = rigidBody.rotation();
        const currentQuat = new THREE.Quaternion(currentRotation.x, currentRotation.y, currentRotation.z, currentRotation.w);
        const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), results.targetAngle);
        currentQuat.slerp(targetQuat, ROTATION_SPEED * delta);
        rigidBody.setRotation(currentQuat, true);

        // Move only in current facing direction
        const currentAngle = new THREE.Vector3(0, 0, 1).applyQuaternion(currentQuat);
        const forward = new THREE.Vector3(currentAngle.x, 0, currentAngle.z);
        const forwardVelocity = forward.multiplyScalar(results.speed);

        rigidBody.setLinvel({
            x: forwardVelocity.x,
            y: rigidBody.linvel().y,
            z: forwardVelocity.z
        }, true);

        setAnimation(results.speed > WALK_SPEED * 1.2 ? "run" : "walk");
    });

    return { target, setTarget };
}

export default usePhysicsWalk;