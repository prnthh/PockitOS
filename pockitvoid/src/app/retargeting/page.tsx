"use client";

import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import Ped from "../npc/ped/ped";
import { Vector3 } from "three";
import AnimatedModel from "@/shared/HumanoidModel";
import Ground from "../ground/ground/flat";

export default function Home() {
    return (
        <div className="items-center justify-items-center min-h-screen">
            <div className="w-full" style={{ height: "100vh" }}>
                <Canvas>
                    <Physics>
                        <AnimatedModel model={'/models/Soldier.glb'} position={[0, -2, 0]} scale={1} debug />
                        <AnimatedModel model={'/models/Michelle.glb'} position={[-2, -2, 0]} height={4} rotation={[-Math.PI / 2, 0, 0]} debug />
                        {/* <AnimatedModel model={'/models/rigga6.glb'} position={[2, -2, 2]} debug />
                        <AnimatedModel model={'/models/rigga2.glb'} position={[2, -2, 0]} debug />
                        <AnimatedModel model="/models/rigga4.glb" position={[0, -2, 2]} height={0.9} debug />
                        <AnimatedModel model="/models/rigga3.glb" position={[0, -2, -2]} />
                        <AnimatedModel model="/models/rigga.glb" position={[2, -2, -2]} />
                        <AnimatedModel model="/models/readyplayer.me.glb" position={[-2, -2, -2]} />
                        <AnimatedModel model="/models/readyplayer.me.glb" position={[-2, -2, -2]} />
                        <AnimatedModel model="/models/Soldier.glb" position={[-4, -2, -2]} />
                        <AnimatedModel model="/models/Michelle.glb" position={[-4, -2, -2]} /> */}

                        <Ground position={[0, -2, 0]} />
                        <ambientLight intensity={1.5} />
                        <pointLight position={[10, 10, 10]} />
                        <OrbitControls />
                    </Physics>
                </Canvas>
            </div>
        </div>
    );
}
