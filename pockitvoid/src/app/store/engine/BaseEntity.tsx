import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { RigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";

// Props: gameObject, onRefsAvailable
const Entity = forwardRef(({ gameObject, onRefsAvailable }: any, ref) => {
    const rigidBodyRef = useRef<any>(null);
    const meshRef = useRef<any>(null);
    const notifiedRef = useRef<string | null>(null); // Track last notified id

    useImperativeHandle(ref, () => ({
        rigidBody: rigidBodyRef.current,
        mesh: meshRef.current,
    }), []);

    useEffect(() => {
        if (
            rigidBodyRef.current &&
            meshRef.current &&
            onRefsAvailable &&
            notifiedRef.current !== gameObject.id
        ) {
            onRefsAvailable(gameObject.id, {
                rigidBody: rigidBodyRef.current,
                mesh: meshRef.current,
            });
            notifiedRef.current = gameObject.id;
        }
    }, [gameObject.id, onRefsAvailable, meshRef.current, rigidBodyRef.current]);

    // For now, use a box mesh as before. You can extend this to use renderer/collider data.
    const meshComponent = gameObject.components.mesh;
    if (meshComponent && meshComponent.path) {
        // Load and render GLTF model
        const gltf = useGLTF(meshComponent.path);
        const scene = (gltf && "scene" in gltf) ? gltf.scene : null;
        return (
            <RigidBody ref={rigidBodyRef}>
                {scene && <primitive ref={meshRef} object={scene} />}
            </RigidBody>
        );
    }
    // Fallback: box mesh
    return (
        <RigidBody ref={rigidBodyRef}>
            <mesh ref={meshRef}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="orange" />
            </mesh>
        </RigidBody>
    );
});

export default Entity;
