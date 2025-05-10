"use client";

import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import Ped from "./ped/ped";
import { useState } from "react";
import MovableTarget from "@/shared/MovableTarget";

export default function Home() {
    const [target, setTarget] = useState<[number, number, number] | undefined>()

    return (
        <div className="items-center justify-items-center min-h-screen">
            <div className="w-full" style={{ height: "100vh" }}>
                <Canvas shadows>
                    <MovableTarget setPosition={setTarget} />
                    <Physics>
                        <Ped modelUrl={'/models/rigga.glb'} position={target} />
                        <RigidBody type="fixed">
                            <mesh position={[0, -2, 0]} scale={[10, 0.5, 10]} receiveShadow>
                                <boxGeometry />
                                <meshStandardMaterial color="lightgreen" />
                            </mesh>
                        </RigidBody>
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[10, 10, 10]} castShadow />
                        <OrbitControls makeDefault />
                    </Physics>
                </Canvas>
            </div>
        </div >
    );
}
