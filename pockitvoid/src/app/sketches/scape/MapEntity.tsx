import React from "react";
import { useGLTF } from "@react-three/drei";

// Types for map entities (trees, ores)

export type TreeType = "normal" | "star" | "heart" | "earth";
export type OreType = "copper" | "tin" | "iron" | "coal";

export type MapEntityType =
    | { kind: "tree"; treeType: TreeType }
    | { kind: "ore"; oreType: OreType };

export interface MapEntity {
    id: string;
    type: MapEntityType;
    pos: [number, number];
    resourceAmount: number; // current available resource
    maxResource: number; // max resource
    depleted: boolean;
    replenishTicksLeft: number; // ticks until replenished if depleted
}


interface MapEntityMeshProps {
    entity: MapEntity;
    position: [number, number, number];
    onClick: (e: any) => void;
}

export function MapEntityMesh({ entity, position, onClick }: MapEntityMeshProps) {
    // Load GLTF model for ores
    const rocks = useGLTF("/models/environment/rocks.glb");

    if (entity.type.kind === "tree") {
        return (
            <mesh position={position} onClick={onClick}>
                <cylinderGeometry args={[0.13 * 0.66, 0.18 * 0.66, 0.5 * 0.66, 12]} />
                <meshStandardMaterial
                    color={entity.depleted ? "gray" : "#228B22"}
                    opacity={entity.depleted ? 0.5 : 1}
                    transparent
                />
            </mesh>
        );
    } else if (entity.type.kind === "ore") {
        return (
            <primitive
                object={rocks.scene}
                position={position}
                scale={[0.18 * 0.66, 0.18 * 0.66, 0.18 * 0.66]}
                onClick={onClick}
                // @ts-ignore
                userData={{ entityId: entity.id }}
            >
                {/* Optionally, you can add a meshStandardMaterial override here if needed */}
            </primitive>
        );
    }
    return null;
}

// For drei GLTF loader
useGLTF.preload("/models/environment/rocks.glb");
