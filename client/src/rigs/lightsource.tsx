import { useGLTF } from "@react-three/drei";
import { BallCollider, CuboidCollider, RapierRigidBody, RigidBody } from "@react-three/rapier"
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons";

const Lightsource = ({ model }: { model: string }) => {
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

                // Fix spotlight rotation issue
                if (child.type === 'SpotLight') {
                    const spotlight = child as THREE.SpotLight;


                    if (spotlight.target) {
                        const targetPosition = new THREE.Vector3();
                        spotlight.getWorldPosition(targetPosition);
                        targetPosition.y -= 10;

                        spotlight.target.position.copy(targetPosition);
                        if (!cloned.children.includes(spotlight.target)) {
                            cloned.add(spotlight.target);
                        }
                    }

                    // Update the spotlight matrix
                    spotlight.updateMatrixWorld(true);
                }
            });
            setClonedScene(cloned);
        }
    }, [scene]);


    if (!clonedScene) return null;

    return (
        <RigidBody
            ref={rigidBodyRef}
            type="fixed"
            position={[5, 0, 0]}
        >
            <primitive object={clonedScene} />
        </RigidBody >
    );
}

export default Lightsource