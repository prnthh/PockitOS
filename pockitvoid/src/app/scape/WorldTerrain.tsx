import { useState, useRef, useEffect, useCallback } from "react";
import { Terrain } from "./terrain";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

// Better noise-based height function with reduced scale
function baseHeight(x: number, y: number) {
    // Create a more interesting terrain with multiple noise frequencies - scaled down
    return (
        // Base undulating hills (medium frequency)
        (Math.sin(x * 0.2) + Math.cos(y * 0.2)) * 0.5 +
        // Add fine detail (high frequency, low amplitude)
        (Math.sin(x * 0.4 + Math.cos(y * 0.3)) * Math.sin(y * 0.3)) * 0.1 +
        // Add larger landforms (low frequency, medium amplitude)
        (Math.sin(x * 0.05 + 0.3) * Math.cos(y * 0.07 + 0.4)) * 0.8
    );
}

// Grid and tile settings
const TILE_SIZE = 10;
const TILES_PER_GRID = 5; // 5x5 tiles per grid
const VISIBLE_RADIUS = 2; // Radius for view distance

// Delta map: { ["gridX,gridY"]: { ["tileX,tileY,index"]: delta } }

export function WorldTerrain({ center = [0, 0] }: { center?: [number, number] }) {
    const [deltas, setDeltas] = useState<{ [key: string]: { [key: string]: number } }>({});
    const [currentCenter, setCurrentCenter] = useState(center);
    const dragPlane = useRef<THREE.Mesh>(null);
    const isDragging = useRef(false);
    const dragStart = useRef(new THREE.Vector3());
    const dragOffset = useRef(new THREE.Vector2(0, 0));
    const { camera } = useThree();

    // Compute visible grids
    const visibleGrids = [];
    const [centerGridX, centerGridY] = [
        Math.floor(currentCenter[0] / (TILE_SIZE * TILES_PER_GRID)),
        Math.floor(currentCenter[1] / (TILE_SIZE * TILES_PER_GRID)),
    ];
    for (let gx = centerGridX - VISIBLE_RADIUS; gx <= centerGridX + VISIBLE_RADIUS; gx++) {
        for (let gy = centerGridY - VISIBLE_RADIUS; gy <= centerGridY + VISIBLE_RADIUS; gy++) {
            visibleGrids.push([gx, gy]);
        }
    }

    // Handle tile click to raise/lower
    const handleTileClick = useCallback((gridX: number, gridY: number, tileX: number, tileY: number, pointIdx: number, raise: boolean) => {
        const gridKey = `${gridX},${gridY}`;
        const tileKey = `${tileX},${tileY},${pointIdx}`;
        setDeltas(prev => ({
            ...prev,
            [gridKey]: {
                ...(prev[gridKey] || {}),
                [tileKey]: ((prev[gridKey]?.[tileKey] || 0) + (raise ? 0.2 : -0.2)), // Reduced scale for edits
            },
        }));
    }, []);

    // Drag handling
    const handleDragStart = useCallback((e: THREE.Event) => {
        e.stopPropagation();
        isDragging.current = true;
        if (e.point) {
            dragStart.current.copy(e.point);
        }
    }, []);

    const handleDragEnd = useCallback(() => {
        isDragging.current = false;
    }, []);

    // Update terrain position while dragging
    useFrame(() => {
        if (isDragging.current && dragPlane.current) {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2(
                (THREE.MathUtils as any).clamp((THREE as any).pointer.x, -1, 1),
                (THREE.MathUtils as any).clamp((THREE as any).pointer.y, -1, 1)
            );

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(dragPlane.current);

            if (intersects.length > 0) {
                const delta = new THREE.Vector3()
                    .copy(intersects[0].point)
                    .sub(dragStart.current);

                dragOffset.current.x -= delta.x;
                dragOffset.current.y -= delta.z;

                setCurrentCenter([
                    center[0] + dragOffset.current.x,
                    center[1] + dragOffset.current.y
                ]);

                dragStart.current.copy(intersects[0].point);
            }
        }
    });

    // Create a water plane that's properly visible and blue
    const waterSize = TILE_SIZE * TILES_PER_GRID * (VISIBLE_RADIUS * 2 + 1);
    const waterPlane = (
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[waterSize, waterSize]} />
            <meshPhysicalMaterial
                color="#4db2ff"
                transmission={0.7}
                roughness={0.1}
                ior={1.333}
                transparent={true}
                opacity={0.8}
                metalness={0.1}
                envMapIntensity={1}
                clearcoat={1}
                clearcoatRoughness={0.1}
            />
        </mesh>
    );

    // Create invisible drag plane
    const dragPlaneElement = (
        <mesh
            ref={dragPlane}
            position={[0, 0.1, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
            onPointerDown={handleDragStart}
            onPointerUp={handleDragEnd}
            onPointerLeave={handleDragEnd}
        >
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial />
        </mesh>
    );

    // Render visible tiles
    return (
        <>
            {waterPlane}
            {dragPlaneElement}
            {visibleGrids.map(([gridX, gridY]) => {
                const gridKey = `${gridX},${gridY}`;
                const gridOrigin = [gridX * TILE_SIZE * TILES_PER_GRID, gridY * TILE_SIZE * TILES_PER_GRID];
                const gridDeltas = deltas[gridKey] || {};
                return Array.from({ length: TILES_PER_GRID }).map((_, tx) =>
                    Array.from({ length: TILES_PER_GRID }).map((_, ty) => {
                        const tileOrigin = [
                            gridOrigin[0] + tx * TILE_SIZE,
                            gridOrigin[1] + ty * TILE_SIZE,
                        ];
                        return (
                            <Terrain
                                key={`${gridX},${gridY},${tx},${ty}`}
                                tileX={tx}
                                tileY={ty}
                                gridX={gridX}
                                gridY={gridY}
                                origin={tileOrigin}
                                size={TILE_SIZE}
                                baseHeight={baseHeight}
                                deltas={gridDeltas}
                                onEdit={(pointIdx, raise) => handleTileClick(gridX, gridY, tx, ty, pointIdx, raise)}
                            />
                        );
                    })
                );
            })}
        </>
    );
}
