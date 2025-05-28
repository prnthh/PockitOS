"use client";

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
    Physics,
    RigidBody
} from "@react-three/rapier";
import {
    OrbitControls,
    useTexture,
    PerspectiveCamera,
    Environment,
    Cylinder,
    useGLTF,
    Stats
} from "@react-three/drei";
import * as THREE from 'three';

// Water shader material using Three.js shaders
function createWaterMaterial(waterTexture: THREE.Texture): THREE.ShaderMaterial {
    // Custom water shader
    const waterMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            waterTexture: { value: waterTexture },
            fogColor: { value: new THREE.Color(0x0487e2) },
            highlightColor: { value: new THREE.Color(0x74ccf4) }
        },
        vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform float time;
      uniform sampler2D waterTexture;
      uniform vec3 fogColor;
      uniform vec3 highlightColor;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      
      // Simple noise function
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        // Animated water texture coordinates
        vec2 uv = vUv * 4.0;
        uv.y += time * 0.1;
        
        // Sample water texture and create waves
        vec4 waterColor = texture2D(waterTexture, uv);
        
        // Create wave effect
        float wave1 = sin(vWorldPosition.x * 2.0 + time) * 0.05;
        float wave2 = sin(vWorldPosition.z * 3.0 + time * 1.5) * 0.05;
        float waves = wave1 + wave2;
        
        // Create highlights
        float highlight = smoothstep(0.4, 0.6, waves + 0.5);
        
        // Mix colors based on waves
        vec3 finalColor = mix(fogColor, highlightColor, highlight);
        
        // Add water texture influence
        finalColor = mix(finalColor, waterColor.rgb, 0.3);
        
        gl_FragColor = vec4(finalColor, 0.85);
      }
    `,
        transparent: true,
        side: THREE.DoubleSide
    });

    return waterMaterial;
}

interface FloatingObjectProps {
    position: [number, number, number];
    scale?: number;
}

function FloatingObject({ position, scale = 1 }: FloatingObjectProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const initialY = position[1];

    useFrame(({ clock }) => {
        if (meshRef.current) {
            // Make object float up and down
            meshRef.current.position.y = initialY + Math.sin(clock.getElapsedTime() + position[0] * 10) * 0.2;
            // Slowly rotate
            meshRef.current.rotation.y += 0.003;
        }
    });

    return (
        <mesh ref={meshRef} position={position} scale={scale}>
            <icosahedronGeometry args={[1, 2]} />
            <meshStandardMaterial color="#0487e2" metalness={0.2} roughness={0.4} />
        </mesh>
    );
}

interface IceFloorProps {
    position?: [number, number, number];
}

function IceFloor({ position = [0, -5, 0] }: IceFloorProps) {
    const texture = useTexture('/textures/water1.png');

    return (
        <Cylinder position={position} args={[5, 5, 10]}>
            <meshStandardMaterial map={texture} color="#74ccf4" />
        </Cylinder>
    );
}

function Water() {
    const waterRef = useRef<THREE.Mesh>(null);
    const texture = useTexture('/textures/water1.png');
    const waterMaterial = useRef<THREE.ShaderMaterial | null>(null);

    useEffect(() => {
        waterMaterial.current = createWaterMaterial(texture);
    }, [texture]);

    useFrame(({ clock }) => {
        if (waterMaterial.current) {
            waterMaterial.current.uniforms.time.value = clock.getElapsedTime();
        }
    });

    return (
        <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[50, 50, 32, 32]} />
            {waterMaterial.current && (
                <primitive object={waterMaterial.current} attach="material" />
            )}
        </mesh>
    );
}

interface CharacterProps {
    position?: [number, number, number];
}

function Character({ position = [0, 0.2, 0] }: CharacterProps) {
    const { scene, animations } = useGLTF('/models/Michelle.glb');
    const mixer = useRef<THREE.AnimationMixer | null>(null);

    useEffect(() => {
        if (scene && animations.length > 0) {
            scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                }
            });

            mixer.current = new THREE.AnimationMixer(scene);
            const action = mixer.current.clipAction(animations[0]);
            action.play();
        }
    }, [scene, animations]);

    useFrame((_, delta) => {
        if (mixer.current) {
            mixer.current.update(delta);
        }
    });

    return scene ? <primitive object={scene} position={position} /> : null;
}

function Scene() {
    const { scene } = useThree();

    // Generate random positions for floating objects
    const floatingObjectsPositions = Array.from({ length: 20 }).map((_, i) => [
        (Math.random() - 0.5) * 15,
        Math.random() * 1 - 0.5,
        (Math.random() - 0.5) * 15
    ] as [number, number, number]);

    useEffect(() => {
        // Set up scene environment
        scene.fog = new THREE.Fog(0x0487e2, 7, 25);
        scene.background = new THREE.Color(0x0487e2);
    }, [scene]);

    return (
        <>
            <PerspectiveCamera makeDefault position={[5, 3, 7]} />

            <hemisphereLight args={[0x74ccf4, 0x333366, 3]} />
            <directionalLight
                position={[3, 10, 5]}
                intensity={2}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-near={0.1}
                shadow-camera-far={20}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
                color="#FFE499"
            />

            <Physics>
                {/* Character */}
                <Character />

                {/* Water surface */}
                <Water />

                {/* Ice floor underneath */}
                <IceFloor />

                {/* Floating objects */}
                {floatingObjectsPositions.map((pos, idx) => (
                    <FloatingObject key={idx} position={pos} scale={Math.random() * 0.5 + 0.5} />
                ))}
            </Physics>

            <OrbitControls
                minDistance={2}
                maxDistance={15}
                maxPolarAngle={Math.PI * 0.45}
                target={[0, 0.5, 0]}
                autoRotate
                autoRotateSpeed={0.5}
            />

            <Stats />
        </>
    );
}

export default function Home() {
    return (
        <div className="items-center justify-items-center min-h-screen">
            <div className="w-full" style={{ height: "100vh" }}>
                <Canvas shadows>
                    <Scene />
                </Canvas>
            </div>
        </div>
    );
}