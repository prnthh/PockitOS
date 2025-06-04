"use client";

import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import Tile from "./Tile";
import Player from "./Player";
import { useState, useRef, useEffect } from "react";
import FakeServer from "./FakeServer";
import { MapEntity } from "./MapEntity";
import { InventoryUI } from "./ui/Inventory";
import MapGrid from "./MapGrid";
import { Box } from "@react-three/drei";

const TILE_SIZE = 0.66; // Size of each tile in the tilemap

export default function Home() {
    // Store playerId in React state (not persisted)
    const [playerId] = useState(() => Math.random().toString(36).slice(2) + Date.now());

    const [playerPos, setPlayerPos] = useState(FakeServer.getPlayerPos(playerId));
    // Remove targetPos, use currentAction
    // Get all players for rendering
    const [allPlayers, setAllPlayers] = useState(FakeServer.getAllPlayers());
    // Track drops for rendering
    const [drops, setDrops] = useState(FakeServer.getDrops());
    // Track map entities for rendering
    const [entities, setEntities] = useState<MapEntity[]>(FakeServer.getEntities());
    const [navPointer, setNavPointer] = useState<[number, number, number] | null>(null); // NavPointer world coords
    useEffect(() => {
        const interval = setInterval(() => {
            setPlayerPos(FakeServer.getPlayerPos(playerId));
            setAllPlayers({ ...FakeServer.getAllPlayers() });
            setDrops([...FakeServer.getDrops()]);
            setEntities([...FakeServer.getEntities()]);
        }, 200);
        return () => clearInterval(interval);
    }, [playerId]);

    // Click a player to attack them
    const handlePlayerClick = (targetId: string) => {
        if (targetId !== playerId) {
            FakeServer.setAction(playerId, { type: "attack", targetId });
        }
    };

    // Click a drop to pick it up
    const handleDropClick = (dropId: string) => {
        FakeServer.setAction(playerId, { type: "pickupDrop", dropId });
    };

    // Click a map entity to extract resource
    const handleEntityClick = (entity: MapEntity) => {
        if (!entity.depleted && entity.resourceAmount > 0) {
            FakeServer.setAction(playerId, { type: "extractResource", entityId: entity.id });
        }
    };

    return (
        <div className="items-center justify-items-center min-h-screen">
            <div className="w-full" style={{ height: "100vh" }}>
                <Canvas>
                    {/* Use new MapGrid for terrain and tile rendering */}
                    <MapGrid
                        debug
                        width={16}
                        depth={16}
                        tileSize={TILE_SIZE}
                        onTileClick={({ i, j, x, y, z }) => {
                            FakeServer.setAction(playerId, { type: "walkTo", pos: [i, j] });
                            setNavPointer([x, y, z]);
                        }}
                    />
                    {/* NavPointer debug cube */}
                    {navPointer && (
                        <mesh position={navPointer}>
                            <boxGeometry args={[0.18, 0.18, 0.18]} />
                            <meshStandardMaterial color="red" />
                        </mesh>
                    )}
                    {/* Render map entities (trees, ores) */}
                    {entities.map(entity => (
                        <mesh
                            key={entity.id}
                            position={[(entity.pos[0]) * TILE_SIZE, 0.2, (entity.pos[1]) * TILE_SIZE]}
                            onClick={e => {
                                e.stopPropagation();
                                handleEntityClick(entity);
                            }}
                        >
                            {/* Use different geometry/material for trees vs ores */}
                            {entity.type.kind === "tree" ? (
                                <cylinderGeometry args={[0.13 * TILE_SIZE, 0.18 * TILE_SIZE, 0.5 * TILE_SIZE, 12]} />
                            ) : (
                                <sphereGeometry args={[0.18 * TILE_SIZE, 12, 12]} />
                            )}
                            <meshStandardMaterial color={
                                entity.depleted ? "gray" : entity.type.kind === "tree" ? "#228B22" : "#888888"
                            } opacity={entity.depleted ? 0.5 : 1} transparent />
                        </mesh>
                    ))}
                    {Object.entries(allPlayers).map(([id, state]) => (
                        <group key={id}>
                            <Player
                                key={id}
                                health={state.health}
                                position={[(state.pos[0]) * TILE_SIZE, 0.3, (state.pos[1]) * TILE_SIZE]}
                                color={id === playerId ? "orange" : "blue"}
                                onClick={e => {
                                    e.stopPropagation();
                                    handlePlayerClick(id);
                                }}
                            />
                        </group>
                    ))}
                    {/* Render drops */}
                    {drops.map(drop => (
                        <mesh
                            key={drop.id}
                            position={[(drop.pos[0]) * TILE_SIZE, 0, (drop.pos[1]) * TILE_SIZE]}
                            onClick={e => {
                                e.stopPropagation();
                                handleDropClick(drop.id);
                            }}
                        >
                            <sphereGeometry args={[0.18 * TILE_SIZE, 16, 16]} />
                            <meshStandardMaterial color={drop.itemKey === 'bone' ? 'white' : 'yellow'} />
                        </mesh>
                    ))}
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                </Canvas>
            </div>
            <InventoryUI playerId={playerId} />
        </div>
    );
}
