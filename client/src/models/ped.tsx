import { CapsuleCollider, CuboidCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import React, { memo, useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectPersonById } from "../store/personSelectors";
import { AppDispatch, RootState } from "../store/store";
import AnimatedModel from "../controllers/AnimatedModel";
import * as THREE from "three";
import { Box } from "@react-three/drei";
import usePhysicsWalk from "../controllers/usePhysicsWalk";
import { makeCameraTarget, setRigidBody } from "../store/PersonSlice";
import { useFrame } from "@react-three/fiber";
import useUnstableWalk from "../controllers/useUnstableWalk";

const Ped = memo(({ id }: { id: string }) => {
    const person = useSelector((state: RootState) => selectPersonById(state, id));
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const [animation, setAnimation] = useState<string>("idle");
    const dispatch = useDispatch<AppDispatch>()

    const { fallenOver, setFallenOver, isRecovering } = useUnstableWalk(rigidBodyRef, setAnimation);

    const { setTarget } = usePhysicsWalk(rigidBodyRef, setAnimation, () => {
        setTimeout(() => {
            setTarget([Math.random() * 10 - 5, 0, Math.random() * 10 - 5]);
        }, 2000);
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
                <CapsuleCollider args={[0.3, 0.15]} />
                <CuboidCollider args={[0.2, 0.3, 0.1]} />
                <AnimatedModel model={`/${id}.glb`} animation={animation} onClick={() => {
                    if (person.cameraTarget) dispatch(makeCameraTarget(undefined))
                    else {
                        dispatch(makeCameraTarget(id))
                        setTarget(undefined)
                    }
                }} />
            </RigidBody>
        </>
    );
});

export default Ped;