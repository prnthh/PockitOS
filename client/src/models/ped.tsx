import { CapsuleCollider, RigidBody } from "@react-three/rapier"
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectPersonById } from "../store/personSelectors";
import { RootState } from "../store/store";
import { useFBX, useGLTF } from "@react-three/drei";
import AnimatedModel from "../controllers/AnimatedModel";

interface PedProps {
    person: any; // Update this type based on your person interface
}

const Ped = React.memo(({ id }: { id: string }) => {
    const person = useSelector((state: RootState) => selectPersonById(state, id));

    return (
        <RigidBody
            type="dynamic"
            colliders={false}
            position={person.position}
        >
            <group>
                <CapsuleCollider args={[0.3, 0.15]} />
                <AnimatedModel model="/rigga.glb" animation="idle" />
            </group>
        </RigidBody>
    )
});

export default Ped;