import { useGLTF } from "@react-three/drei";
import { BallCollider, CuboidCollider, RapierRigidBody, RigidBody } from "@react-three/rapier"
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons";

const Thing = ({ model }: { model: string }) => {
    // const person = useSelector((state: RootState) => selectPersonById(state, id));

    const { scene, animations } = useGLTF(model);
    const [clonedScene, setClonedScene] = useState<THREE.Object3D | undefined>(undefined);
    const rigidBodyRef = useRef<RapierRigidBody>(null);

    useEffect(() => {
        if (scene) {
            const cloned = SkeletonUtils.clone(scene);
            cloned.traverse((child: THREE.Object3D) => {
                if ('isMesh' in child) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            setClonedScene(cloned);
        }
    }, [scene]);


    if (!clonedScene) return null;

    return (
        <RigidBody
            ref={rigidBodyRef}
            linearDamping={0.5}
            angularDamping={0.5}
        >
            <primitive object={clonedScene} />
        </RigidBody>
    );
}

export default Thing