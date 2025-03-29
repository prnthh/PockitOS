import { useGLTF } from "@react-three/drei";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons";
import useGameStore, { ThingEntity } from "../store/gameStore";
import { useShallow } from "zustand/react/shallow";

const Thing = ({ id }: { id: string }) => {
    const thing = useGameStore(
        useShallow((state) => state.entities[id] as ThingEntity)
    );
    const { updateEntity } = useGameStore();

    const { scene } = useGLTF(`/${thing.name}.glb`);
    const [clonedScene, setClonedScene] = useState<THREE.Object3D | undefined>(undefined);
    const rigidBodyRef = useRef<RapierRigidBody>(null);

    // Clone the scene when it loads
    useEffect(() => {
        if (scene) {
            console.log("Scene loaded, cloning for", id);
            const cloned = SkeletonUtils.clone(scene);
            cloned.traverse((child: THREE.Object3D) => {
                if ("isMesh" in child) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            setClonedScene(cloned);
        }
    }, [scene, id]);

    useEffect(() => {
        if (!rigidBodyRef || !rigidBodyRef.current) return;

        updateEntity(id, {
            rigidbodyhandle: rigidBodyRef.current.handle,
        });
    }, [rigidBodyRef.current]);

    return (
        <>
            {clonedScene && (
                <RigidBody
                    ref={rigidBodyRef} // Use callback ref
                    position={thing.position}
                    softCcdPrediction={1}
                >
                    <primitive object={clonedScene} />
                </RigidBody>
            )}
        </>
    );
};

export default Thing;