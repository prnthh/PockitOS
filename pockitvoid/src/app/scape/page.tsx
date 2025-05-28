"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useThree, extend } from "@react-three/fiber";
import { OrbitControls, Environment, Sky, Box } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import { WorldTerrain } from "./WorldTerrain";
import * as THREE from "three";
import MovableTarget from "@/shared/MovableTarget";
import Ped from "../controllers/click/ped/ped";
import { ShadowLight } from "../shadowmap/ShadowLight";

// Create a light source component for directional lighting with shadows
function DirectionalLight() {
    const light = useRef();
    const { scene } = useThree();

    useEffect(() => {
        if (light.current) {
            const directionalLight = light.current;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.1;
            directionalLight.shadow.camera.far = 50;
            directionalLight.shadow.camera.left = -20;
            directionalLight.shadow.camera.right = 20;
            directionalLight.shadow.camera.top = 20;
            directionalLight.shadow.camera.bottom = -20;
            directionalLight.shadow.bias = -0.0001;
            directionalLight.shadow.normalBias = 0.05;
        }

        // Add ambient light to the scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        return () => {
            scene.remove(ambientLight);
        };
    }, [scene]);

    return (
        <directionalLight
            ref={light}
            castShadow
            position={[6.25, 3, 4]}
            intensity={2}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-normalBias={0.05}
        />
    );
}

// Custom camera control setup
function CameraSetup() {
    const controls = useRef();

    useEffect(() => {
        if (controls.current) {
            controls.current.maxPolarAngle = Math.PI * 0.45;
            controls.current.target.y = -0.5;
            controls.current.enableDamping = true;
            controls.current.minDistance = 3;
            controls.current.maxDistance = 30;
        }
    }, []);

    return <OrbitControls ref={controls} />;
}

export default function ScapePage() {
    const [target, setTarget] = useState<[number, number, number] | undefined>();

    return (
        <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
            <Canvas
                shadows
                camera={{ position: [-10, 8, -2.2], fov: 35, near: 0.1, far: 200 }}
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
            >
                <Suspense fallback={null}>
                    <color attach="background" args={[0x201919]} />

                    <fog attach="fog" args={['#201919', 30, 100]} />

                    <Sky
                        distance={450000}
                        sunPosition={[1, 0.3, 0]}
                        inclination={0.5}
                        azimuth={0.25}
                    />

                    <DirectionalLight />

                    <Physics>
                        <WorldTerrain center={[0, 0]} />
                        <ShadowLight />

                        <ambientLight intensity={0.5} />
                        <OrbitControls makeDefault />
                    </Physics>
                </Suspense>
            </Canvas>
        </div>
    );
}
