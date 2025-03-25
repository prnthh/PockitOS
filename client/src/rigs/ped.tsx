import { CapsuleCollider, CuboidCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import React, { memo, useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectPersonById } from "../store/personSelectors";
import { AppDispatch, RootState } from "../store/store";
import AnimatedModel from "../gizmos/AnimatedModel";
import { Box, Html } from "@react-three/drei";
import usePhysicsWalk from "../controllers/usePhysicsWalk";
import { makeCameraTarget, setRigidBody } from "../store/PersonSlice";
import useUnstableWalk from "../controllers/useUnstableWalk";
import NPCController from "../controllers/NPCController";

const Ped = memo(({ id }: { id: string }) => {
    const person = useSelector((state: RootState) => selectPersonById(state, id));
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const [animation, setAnimation] = useState<string>("idle");
    const dispatch = useDispatch<AppDispatch>();

    const { fallenOver, setFallenOver } = useUnstableWalk(id, rigidBodyRef, setAnimation);

    const { target, setTarget } = usePhysicsWalk(rigidBodyRef, setAnimation, () => {
        // When destination reached, set new destination
        setTarget([Math.random() * 10 - 5, 0, Math.random() * 10 - 5]);
    });

    useEffect(() => {
        if (!rigidBodyRef || !rigidBodyRef.current) return;
        dispatch(setRigidBody({ id, rb: rigidBodyRef as React.RefObject<RapierRigidBody> }));
    }, [rigidBodyRef]);

    return (
        <>
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
                        setTarget(undefined)
                        // make the player fall over
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
                        dispatch(makeCameraTarget(id))
                        setTarget(undefined)

                    }} />
            </RigidBody>

            {/* Add NPC behavior controller */}
            <NPCController
                id={id}
                rigidBodyRef={rigidBodyRef}
                setAnimation={setAnimation}
                setTarget={setTarget}
            />
        </>
    );
});

export default Ped;