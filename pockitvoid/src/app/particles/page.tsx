"use client";

import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import Smoke from "./ParticleEmitter";
import { Vector3 } from "three";

export default function Home() {
    return (
        <div className="items-center justify-items-center min-h-screen">
            <div className="w-full" style={{ height: "100vh" }}>
                <Canvas>
                    <Physics>
                        <Smoke count={10} size={2} scaleFactor={0.8} range={0.5} emitterPosition={new Vector3(0, 1, 0)} />

                        <RigidBody>
                            <mesh>
                                <boxGeometry args={[1, 1, 1]} />
                                <meshStandardMaterial color="orange" />
                            </mesh>
                        </RigidBody>
                        <RigidBody type="fixed">
                            <mesh position={[0, -2, 0]} scale={[10, 0.1, 10]}>
                                <boxGeometry />
                                <meshStandardMaterial color="gray" />
                            </mesh>
                        </RigidBody>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} />
                        <OrbitControls />
                    </Physics>
                </Canvas>
            </div>
        </div>
    );
}
