"use client";

import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Box, OrbitControls } from "@react-three/drei";
import { useState } from "react";
import MovableTarget from "@/shared/MovableTarget";
import { Terrain } from "./terrain";
import Ped from "../controllers/click/ped/ped";
import { ShadowLight } from "../shadowmap/ShadowLight";

export default function Home() {
    const [target, setTarget] = useState<[number, number, number] | undefined>()

    return (
        <div className="items-center justify-items-center min-h-screen">
            <div className="w-full" style={{ height: "100vh" }}>
                <Canvas shadows>
                    <Box position={target} args={[0.1, 0.1, 0.1]} castShadow>
                        <meshBasicMaterial wireframe color="red" />
                    </Box>
                    <Physics>
                        <Terrain onClick={(point) => {
                            setTarget([point[0], point[1] + 0.05, point[2]]);
                        }} />
                        <ShadowLight />

                        <ambientLight intensity={0.5} />
                        <OrbitControls makeDefault />
                    </Physics>
                </Canvas>
            </div>
        </div >
    );
}
