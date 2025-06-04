"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/Addons.js";

interface MapGridProps {
    width?: number;
    depth?: number;
    tileSize?: number;
    heightData: Uint8Array;
    onTileClick?: (coords: { x: number; y: number; z: number; i: number; j: number }) => void;
    debug?: boolean; // Add debug prop
}

// Export height generation utility
export function generateHeight(width: number, height: number) {
    const size = width * height;
    const data = new Uint8Array(size);
    const perlin = new ImprovedNoise();
    const z = Math.random() * 100;
    let quality = 1;
    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < size; i++) {
            const x = i % width;
            const y = ~~(i / width);
            data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.2);
        }
        quality *= 4;
    }
    return data;
}

export default function MapGrid({
    width = 32,
    depth = 32,
    tileSize = 0.66,
    heightData,
    onTileClick,
    debug = false, // default to false
}: MapGridProps) {
    // Create a continuous plane geometry
    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(
            width * tileSize,
            depth * tileSize,
            width - 1,
            depth - 1
        );
        geo.rotateX(-Math.PI / 2);
        // Shift so (0,0) is at the corner, not center
        geo.translate((width * tileSize) / 2, 0, (depth * tileSize) / 2);
        const vertices = geo.attributes.position.array;
        for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
            vertices[j + 1] = heightData[i] * 0.08; // lower scale for less eccentricity
        }
        geo.computeVertexNormals();
        return geo;
    }, [heightData, width, depth, tileSize]);

    // Debug grid lines
    const gridLines = useMemo(() => {
        if (!debug) return null;
        const lines = [];
        const yOffset = 0.01; // Small offset to prevent z-fighting
        // Vertical lines (along z)
        for (let i = 0; i <= width; i++) {
            for (let j = 0; j < depth; j++) {
                // Each segment from (i, j) to (i, j+1)
                const idxA = j * width + Math.min(i, width - 1);
                const idxB = (j + 1) * width + Math.min(i, width - 1);
                const x = i * tileSize;
                const zA = j * tileSize;
                const zB = (j + 1) * tileSize;
                const yA = heightData[idxA] * 0.08 + yOffset;
                const yB = (j + 1 < depth) ? heightData[idxB] * 0.08 + yOffset : yA;
                lines.push(
                    x, yA, zA,
                    x, yB, zB
                );
            }
        }
        // Horizontal lines (along x)
        for (let j = 0; j <= depth; j++) {
            for (let i = 0; i < width; i++) {
                // Each segment from (i, j) to (i+1, j)
                const idxA = Math.min(j, depth - 1) * width + i;
                const idxB = Math.min(j, depth - 1) * width + (i + 1);
                const xA = i * tileSize;
                const xB = (i + 1) * tileSize;
                const z = j * tileSize;
                const yA = heightData[idxA] * 0.08 + yOffset;
                const yB = (i + 1 < width) ? heightData[idxB] * 0.08 + yOffset : yA;
                lines.push(
                    xA, yA, z,
                    xB, yB, z
                );
            }
        }
        // Removed translation to align grid with mesh
        return new THREE.BufferGeometry().setAttribute(
            'position',
            new THREE.Float32BufferAttribute(lines, 3)
        );
    }, [debug, width, depth, tileSize, heightData]);

    return (
        <>
            <mesh
                geometry={geometry}
                position={[-tileSize / 2, 0, -tileSize / 2]} // Offset mesh by half tileSize on x and z in the negative direction
                onClick={e => {
                    if (onTileClick) {
                        const point = e.point;
                        // Adjust for mesh offset
                        const x = point.x + tileSize / 2;
                        const z = point.z + tileSize / 2;
                        // Convert world position to grid indices
                        const i = Math.floor(x / tileSize);
                        const j = Math.floor(z / tileSize);
                        onTileClick({ x: point.x, y: point.y, z: point.z, i, j });
                    }
                }}
            >
                <meshStandardMaterial color={"#bfcdb7"} />
            </mesh>
            {debug && gridLines && (
                <lineSegments geometry={gridLines} position={[-tileSize / 2, 0, -tileSize / 2]}>
                    <lineBasicMaterial color="yellow" linewidth={2} />
                </lineSegments>
            )}
        </>
    );
}
