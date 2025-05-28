import React, { forwardRef } from "react";
import { useGLTF } from "@react-three/drei";

// Mesh component type and registration
export interface MeshData {
    path: string;
}

export function addMeshComponent(gameObject: any, data: Partial<MeshData> = {}) {
    const meshData: MeshData = {
        path: data.path || '/models/rigga.glb',
    };
    return {
        ...gameObject,
        components: {
            ...gameObject.components,
            mesh: meshData,
        },
    };
}

// Generic mesh renderer
export const MeshComponent = forwardRef(({ meshComponent }: { meshComponent?: MeshData }, ref) => {
    if (meshComponent && meshComponent.path) {
        const gltf = useGLTF(meshComponent.path);
        const scene = (gltf && "scene" in gltf) ? gltf.scene : null;
        return scene ? <primitive ref={ref} object={scene} /> : null;
    }
    // Fallback: box mesh
    return (
        <mesh ref={ref}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="orange" />
        </mesh>
    );
});