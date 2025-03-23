import { useGLTF, useAnimations, Box } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import useAnimationState from "./useAnimationState";
import { SkeletonUtils } from "three/examples/jsm/Addons";

// Model cache to store loaded models
const modelCache = new Map();

const AnimatedModel = ({ model, animation, ...props }: { model: string; animation: string }) => {
    const groupRef = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(model);
    const [clonedScene, setClonedScene] = useState<THREE.Object3D | undefined>(undefined);
    const [animationAction, setAnimationAction] = useState<THREE.AnimationAction | null>(null);

    // Create a clone of the scene to avoid modifying the original
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

    const { mixer, setThisAnimation } = useAnimationState(clonedScene);

    useEffect(() => {
        if (animation && mixer) {
            setThisAnimation(animation);
        }
    }, [animation, mixer, setThisAnimation]);

    // // Update the mixer on each frame
    useFrame((state, delta) => {
        if (mixer) mixer.update(delta);
    });

    return (
        <group ref={groupRef} {...props} position={[0, -0.4, 0]}>
            {clonedScene && <primitive object={clonedScene} />}
        </group>
    );
}

// Preload common models here
useGLTF.preload('/rigga.glb');

export default AnimatedModel;