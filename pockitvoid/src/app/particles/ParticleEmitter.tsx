import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import TWEEN, { Tween } from '@tweenjs/tween.js'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

function Particle({
    startPosition,
    size,
    range,
    particle,
    randomRotation,
    scaleFactor,
    ...props
}: {
    startPosition: THREE.Vector3
    size: number
    range: number
    particle: string
    randomRotation: boolean
    scaleFactor: number
}) {
    const ref = useRef<THREE.Sprite>(null)
    const texref = useRef<THREE.SpriteMaterial>(null)
    const startPositionRef = useRef(startPosition)
    const texture = useTexture(`/textures/${particle}.png`)

    useEffect(() => {
        startPositionRef.current = startPosition
    }, [startPosition])

    useEffect(() => {
        if (!ref.current) return
        doMovement()
    }, [])

    function doMovement() {
        if (!ref.current) return
        ref.current.scale.set(size, size, size)
        ref.current.position.copy(getRandomisedPosition(startPositionRef.current, range)) // Reset to the current start position
        ref.current.material.opacity = 0.2

        const randomDuration = Math.random() * 2000 + 4000
        new Tween(ref.current.position)
            .to({ y: ref.current.position.y + 5 }, randomDuration)
            .start()
            .onComplete(doMovement)
        new Tween(ref.current.scale)
            .to(
                { x: size * scaleFactor, y: size * scaleFactor, z: size * scaleFactor },
                randomDuration,
            )
            .start()
        new Tween(ref.current.material).to({ opacity: 0 }, randomDuration).start()

        if (randomRotation && texref.current) {
            texref.current.rotation = Math.random() * Math.PI * 2
            new Tween(texref.current)
                .to({ rotation: Math.random() * Math.PI * 2 }, randomDuration * 3)
                .start()
        }
    }

    return (
        <sprite ref={ref}>
            <spriteMaterial
                ref={texref}
                map={texture}
                depthWrite={false}
                rotation={randomRotation ? Math.random() * Math.PI * 2 : undefined}
            />
        </sprite>
    )
}

function getRandomisedPosition(position: THREE.Vector3, range = 1.5) {
    return new THREE.Vector3(
        position.x + rand11() * range,
        position.y + rand11() * range,
        position.z + rand11() * range,
    )
}

const rand11 = () => Math.random() * 2.0 - 1.0

const duration = 5000

const Smoke = ({
    count,
    size = 2,
    range = 2,
    emitterPosition = new THREE.Vector3(),
    particle = 'smoke',
    randomRotation = true,
    scaleFactor = 5,
}: {
    count: number
    size?: number
    range?: number
    emitterPosition?: THREE.Vector3
    particle?: string
    randomRotation?: boolean
    scaleFactor?: number
}) => {
    const [particleCount, setParticleCount] = useState(0)
    const countRef = useRef<number>(0)
    useEffect(() => {
        countRef.current = particleCount
    }, [particleCount])

    useFrame(() => {
        TWEEN.update()
    })

    useEffect(() => {
        const interval = setInterval(() => {
            if (countRef.current === undefined) return
            if (countRef.current < count) setParticleCount((prev) => prev + 1)
            else clearInterval(interval)
        }, duration / count)
        return () => clearInterval(interval)
    }, [])

    return (
        <group
        // position={position}
        >
            {Array.from({ length: particleCount }).map((_, i) => (
                <Particle
                    particle={particle}
                    key={i}
                    startPosition={emitterPosition}
                    size={size}
                    range={range}
                    randomRotation={randomRotation}
                    scaleFactor={scaleFactor}
                />
            ))}
        </group>
    )
}

export default Smoke
