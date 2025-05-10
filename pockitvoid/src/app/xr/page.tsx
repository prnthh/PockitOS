"use client";

import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { useState } from 'react'

const store = createXRStore()

export default function Home() {
    const [red, setRed] = useState(false)

    return (
        <div className="items-center justify-items-center min-h-screen">
            <div className="w-full" style={{ height: "100vh" }}>
                <Canvas>
                    <XR store={store}>
                        <mesh pointerEventsType={{ deny: 'grab' }} onClick={() => setRed(!red)} position={[0, 1, -1]}>
                            <boxGeometry />
                            <meshBasicMaterial color={red ? 'red' : 'blue'} />
                        </mesh>
                    </XR>
                </Canvas>
            </div>
        </div>
    );
}
