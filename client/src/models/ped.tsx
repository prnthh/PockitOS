import { CapsuleCollider, RigidBody } from "@react-three/rapier";
import React, { memo, useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectPersonById } from "../store/personSelectors";
import { RootState } from "../store/store";
import AnimatedModel from "../controllers/AnimatedModel";
import * as THREE from "three";
import { Box } from "@react-three/drei";
import usePhysicsWalk from "../controllers/usePhysicsWalk";

const Ped = memo(({ id }: { id: string }) => {
    const person = useSelector((state: RootState) => selectPersonById(state, id));
    const rigidBodyRef = useRef<any>(null);
    const [animation, setAnimation] = useState<string>("idle");

    const { setTarget } = usePhysicsWalk(rigidBodyRef, setAnimation, () => {
        setTimeout(() => {
            console.log("Setting new target");
            setTarget([Math.random() * 10 - 5, 0, Math.random() * 10 - 5]);
        }, 2000);
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
        </>
    );
});

export default Ped;