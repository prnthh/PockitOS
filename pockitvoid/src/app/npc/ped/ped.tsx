import { BallCollider, CapsuleCollider, CuboidCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import React, { memo, useRef, useState, Suspense } from "react";
import AnimatedModel from "./animatedModel";
import usePhysicsWalk from "./usePhysicsWalk";
import * as THREE from "three"

const Ped = memo(({ modelUrl, position }: { modelUrl: string, position: [number, number, number] | undefined }) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const [animation, setAnimation] = useState<string>("idle");

    const { isMoving, targetReached } = usePhysicsWalk(
        rigidBodyRef,
        setAnimation,
        position,
    );

    return (
        <Suspense fallback={null}>
            <RigidBody
                ref={rigidBodyRef}
                type="dynamic"
                colliders={false}
                linearDamping={0.5}
                angularDamping={0.5}
                enabledRotations={[false, true, false]}
            >
                <CapsuleCollider args={[0.3, 0.15]} />
                <CuboidCollider args={[0.2, 0.3, 0.1]} />
                <BallCollider args={[0.2]} position={[0, 0, 0.2]} sensor />
                <AnimatedModel model={modelUrl} animation={animation}
                    height={0.45}
                    onClick={() => {
                        // Handling click
                    }} />
            </RigidBody>
        </Suspense>
    );
});

export default Ped;