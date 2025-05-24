import { useGLTF, useAnimations, Box } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import useAnimationState from "./useAnimationState";

const AnimatedModel = ({ model, animation = "idle", onClick, height = 1, animationOverrides, position = [0, 0, 0], debug = false, ...props }: {
    model: string; animation?: string, height?: number, animationOverrides?: { [key: string]: string }, position?: [number, number, number], debug: boolean, onClick?: () => void;
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(model);
    const [clonedScene, setClonedScene] = useState<THREE.Object3D | undefined>(undefined);

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

    const { mixer, setThisAnimation } = useAnimationState(clonedScene, animationOverrides);

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
        <group ref={groupRef} {...props} position={position} onClick={(e) => {
            if (onClick) onClick();
        }}>
            {debug && <Box args={[0.3, height, 0.3]} position={[0, height / 2, 0]}>
                <meshBasicMaterial wireframe color="red" />
            </Box>}
            {clonedScene && <primitive object={clonedScene} />}
        </group>
    );
}

// Preload common models here
useGLTF.preload('/rigga.glb');

export default AnimatedModel;