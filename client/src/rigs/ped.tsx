import { CapsuleCollider, CuboidCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import React, { memo, useRef, useState, useEffect, Suspense } from "react";
import { Box, Html } from "@react-three/drei";
import usePhysicsWalk from "../controllers/usePhysicsWalk";
import useUnstableWalk from "../controllers/useUnstableWalk";
import NPCController from "../controllers/npc/NPCController";
import useGameStore, { NpcEntity } from "../store/gameStore";
import { useShallow } from 'zustand/react/shallow'
import AnimatedModel from "../gizmos/AnimatedModel";

const Ped = memo(({ id }: { id: string }) => {
    const { updateEntity } = useGameStore();
    const person = useGameStore(
        useShallow((state) => state.entities[id] as NpcEntity)
    )

    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const [animation, setAnimation] = useState<string>("idle");

    const { isMoving, targetReached } = usePhysicsWalk(
        rigidBodyRef,
        setAnimation,
        person.currentAction || 'idle',
    );

    const { fallenOver, setFallenOver } = useUnstableWalk(id, rigidBodyRef, setAnimation);

    useEffect(() => {
        if (!rigidBodyRef || !rigidBodyRef.current) return;

        updateEntity(id, {
            rigidbodyhandle: rigidBodyRef.current.handle,
        });
    }, [rigidBodyRef.current]);

    return (
        <Suspense fallback={null}>
            <RigidBody
                ref={rigidBodyRef}
                type="dynamic"
                colliders={false}
                position={person.position}
                linearDamping={0.5}
                angularDamping={0.5}
                enabledRotations={fallenOver ? [true, true, true] : [false, true, false]}
                onCollisionEnter={(e) => {
                    console.log('onCollisionEnter', e)
                    // @ts-ignore
                    if (e.other.rigidBody?.userData?.type === 'player') {
                        setFallenOver(true)
                    }
                }}
            >
                <Html center position={[0, 1, 0]}>
                    {JSON.stringify(Object.entries(person).filter(([key]) => key !== 'rbRef'))}
                </Html>
                <CapsuleCollider args={[0.3, 0.15]} />
                <CuboidCollider args={[0.2, 0.3, 0.1]} />
                <AnimatedModel model={`/${id}.glb`} animation={animation}
                    height={0.45}
                    onClick={() => {
                        // Handling click
                    }} />
            </RigidBody>
            <NPCController
                id={id}
                setAnimation={setAnimation}
                isMoving={isMoving}
                targetReached={targetReached}
            />
        </Suspense>
    );
});

export default Ped;