import { CapsuleCollider, RigidBody } from "@react-three/rapier";
import React, { memo, useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectPersonById } from "../store/personSelectors";
import { RootState } from "../store/store";
import AnimatedModel from "../controllers/AnimatedModel";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Box } from "@react-three/drei";

const Ped = memo(({ id }: { id: string }) => {
    const person = useSelector((state: RootState) => selectPersonById(state, id));
    const [target, setTarget] = useState<number[]>([5, 0, 10]);
    const [isWaiting, setIsWaiting] = useState(false);
    const [animation, setAnimation] = useState<string>("idle");
    const rigidBodyRef = useRef<any>(null);
    const waitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const WALK_SPEED = 1.0;
    const RUN_SPEED = 2.0;
    const IDLE_THRESHOLD = 0.5;
    const RUN_DISTANCE = 5.0;
    const ROTATION_SPEED = 2.0;

    const generateRandomDestination = () => {
        const x = (Math.random() - 0.5) * 20;
        const z = (Math.random() - 0.5) * 20;
        return [x, 0, z];
    };

    useEffect(() => {
        return () => {
            if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
        };
    }, []);

    useFrame((state, delta) => {
        const rigidBody = rigidBodyRef.current;
        if (!rigidBody) return;

        const position = rigidBody.translation();
        const directionToTarget = new THREE.Vector3(...target).sub(
            new THREE.Vector3(position.x, position.y, position.z)
        );
        const distance = directionToTarget.length();

        if (distance <= IDLE_THRESHOLD && !isWaiting) {
            setAnimation("idle");
            setIsWaiting(true);
            rigidBody.setLinvel({ x: 0, y: rigidBody.linvel().y, z: 0 }, true);
            waitTimeoutRef.current = setTimeout(() => {
                setTarget(generateRandomDestination());
                setIsWaiting(false);
            }, 4000);
            return;
        }

        if (isWaiting) {
            setAnimation("idle");
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

        setAnimation(speed > WALK_SPEED ? "run" : "walk");
    });

    return (
        <>
            <RigidBody
                ref={rigidBodyRef}
                type="dynamic"
                colliders={false}
                position={person.position}
                linearDamping={0.5}
                angularDamping={0.5}
                enabledRotations={[false, true, false]}
            >
                <CapsuleCollider args={[0.3, 0.15]} />
                <AnimatedModel model="/rigga.glb" animation={animation} />
            </RigidBody>
            <Box position={new THREE.Vector3(...target)} args={[0.1, 0.1, 0.1]} />
        </>
    );
});

export default Ped;