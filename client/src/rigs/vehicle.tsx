import { Collider } from '@dimforge/rapier3d-compat'
import { KeyboardControls, OrbitControls, useGLTF, useKeyboardControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CuboidCollider, Physics, RapierRigidBody, RigidBody, useRapier } from '@react-three/rapier'
import { RefObject, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { WheelInfo, useVehicleController } from '../controllers/useVehicleController'
import { useControlScheme } from '../gizmos/Controls' // added
import useGameStore, { VehicleEntity } from '../store/gameStore'
import { useShallow } from 'zustand/react/shallow'

const spawn = {
    position: [-7, 2, -130] as THREE.Vector3Tuple,
    rotation: [0, Math.PI / 2, 0] as THREE.Vector3Tuple,
}

const controls = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'back', keys: ['ArrowDown', 'KeyS'] },
    { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'right', keys: ['ArrowRight', 'KeyD'] },
    { name: 'brake', keys: ['Space'] },
    { name: 'reset', keys: ['KeyR'] },
]

type KeyControls = {
    forward: boolean
    back: boolean
    left: boolean
    right: boolean
    brake: boolean
    reset: boolean
}

const wheelInfo: Omit<WheelInfo, 'position'> = {
    axleCs: new THREE.Vector3(1, 0, 0),
    suspensionRestLength: 0.25,
    suspensionStiffness: 48,
    maxSuspensionTravel: 1,
    radius: 0.15,
}

const carDimensions = [0.8, 0.4, 1.6] as const
const inset = 0.15
const wheelSize = [0.15, 0.25] as const

const wheels: WheelInfo[] = [
    // front
    { position: new THREE.Vector3((carDimensions[0] / 2), -(carDimensions[1] / 2) + inset, (carDimensions[2] / 2) - inset), ...wheelInfo },
    { position: new THREE.Vector3(-(carDimensions[0] / 2), -(carDimensions[1] / 2) + inset, (carDimensions[2] / 2) - inset), ...wheelInfo },
    // rear
    { position: new THREE.Vector3(-(carDimensions[0] / 2), -(carDimensions[1] / 2) + inset, -(carDimensions[2] / 2) + inset), ...wheelInfo },
    { position: new THREE.Vector3((carDimensions[0] / 2), -(carDimensions[1] / 2) + inset, -(carDimensions[2] / 2) + inset), ...wheelInfo },
]

const _airControlAngVel = new THREE.Vector3()

const Vehicle = ({ id }: { id: string }) => {
    const { updateEntity } = useGameStore();
    const vehicle = useGameStore(
        useShallow((state) => state.entities[id] as VehicleEntity)
    )

    const { world, rapier } = useRapier()
    const threeControls = useThree((s) => s.controls)
    const [, getKeyboardControls] = useKeyboardControls<keyof KeyControls>()
    const { scheme, setScheme } = useControlScheme(); // added

    const chasisMeshRef = useRef<THREE.Mesh>(null!)
    const chasisBodyRef = useRef<RapierRigidBody>(null!)
    const wheelsRef: RefObject<(THREE.Object3D | null)[]> = useRef([])

    const { vehicleController } = useVehicleController(chasisBodyRef, wheelsRef as RefObject<THREE.Object3D[]>, wheels)

    const { accelerateForce, brakeForce, steerAngle } = {
        accelerateForce: 1,
        brakeForce: 0.05,
        steerAngle: Math.PI / 12,
    }

    useEffect(() => {
        if (!chasisMeshRef || !chasisBodyRef.current) return;

        updateEntity(id, {
            rigidbodyhandle: chasisBodyRef.current.handle,
        });
    }, [chasisBodyRef.current]);

    const ground = useRef<Collider | null>(null)

    useFrame((state, delta) => {
        if (scheme !== "drive") return; // vehicle active only in drive mode
        if (!chasisMeshRef.current || !vehicleController.current || !!threeControls) return

        const t = 1.0 - Math.pow(0.01, delta)

        /* controls */

        const controller = vehicleController.current

        const chassisRigidBody = controller.chassis()

        const controls = getKeyboardControls()

        // rough ground check
        let outOfBounds = false

        const ray = new rapier.Ray(chassisRigidBody.translation(), { x: 0, y: -1, z: 0 })

        const raycastResult = world.castRay(ray, 1, false, undefined, undefined, undefined, chassisRigidBody)

        ground.current = null

        if (raycastResult) {
            const collider = raycastResult.collider
            const userData = collider.parent()?.userData as any
            outOfBounds = userData?.outOfBounds

            ground.current = collider
        }

        const engineForce = Number(controls.forward) * accelerateForce - Number(controls.back)

        controller.setWheelEngineForce(2, -engineForce)
        controller.setWheelEngineForce(3, -engineForce)

        const wheelBrake = Number(controls.brake) * brakeForce
        controller.setWheelBrake(0, wheelBrake)
        controller.setWheelBrake(1, wheelBrake)
        controller.setWheelBrake(2, wheelBrake)
        controller.setWheelBrake(3, wheelBrake)

        const currentSteering = controller.wheelSteering(0) || 0
        const steerDirection = Number(controls.left) - Number(controls.right)

        const steering = THREE.MathUtils.lerp(currentSteering, steerAngle * steerDirection, 0.5)

        controller.setWheelSteering(0, steering)
        controller.setWheelSteering(1, steering)

        // air control
        if (!ground.current) {
            const forwardAngVel = Number(controls.forward) - Number(controls.back)
            const sideAngVel = Number(controls.left) - Number(controls.right)

            const angvel = _airControlAngVel.set(0, sideAngVel * t, forwardAngVel * t)
            angvel.applyQuaternion(chassisRigidBody.rotation())
            angvel.add(chassisRigidBody.angvel())

            chassisRigidBody.setAngvel(new rapier.Vector3(angvel.x, angvel.y, angvel.z), true)
        }

        if (controls.reset || outOfBounds) {
            const chassis = controller.chassis()
            chassis.setTranslation(new rapier.Vector3(...spawn.position), true)
            const spawnRot = new THREE.Euler(...spawn.rotation)
            const spawnQuat = new THREE.Quaternion().setFromEuler(spawnRot)
            chassis.setRotation(spawnQuat, true)
            chassis.setLinvel(new rapier.Vector3(0, 0, 0), true)
            chassis.setAngvel(new rapier.Vector3(0, 0, 0), true)
        }
    })

    return (
        <>
            <group onClick={(e) => {
                console.log(id); e.stopPropagation();
                updateEntity(id, { cameraTarget: true })
                updateEntity('player', { cameraTarget: false })
                setScheme('drive')
            }}>
                <RigidBody
                    position={vehicle.position}
                    canSleep={false}
                    ref={chasisBodyRef}
                    colliders={false}
                    type="dynamic"
                >
                    <CuboidCollider args={[carDimensions[0] / 2, carDimensions[1] / 2, carDimensions[2] / 2]} />

                    {/* chassis */}
                    <mesh ref={chasisMeshRef} castShadow receiveShadow>
                        <boxGeometry args={[carDimensions[0], carDimensions[1], carDimensions[2]]} />
                    </mesh>

                    {/* wheels */}
                    {wheels.map((wheel, index) => (
                        <group key={index} ref={(ref) => ((wheelsRef.current as any)[index] = ref)} position={wheel.position}>
                            <group rotation-z={-Math.PI / 2}>
                                <mesh>
                                    <cylinderGeometry args={[wheelSize[0], wheelSize[0], wheelSize[1], 6]} />
                                    <meshStandardMaterial color="#222" />
                                </mesh>
                                <mesh scale={1.01}>
                                    <cylinderGeometry args={[wheelSize[0], wheelSize[0], wheelSize[1], 6]} />
                                    <meshStandardMaterial color="#fff" wireframe />
                                </mesh>
                            </group>
                        </group>
                    ))}
                </RigidBody>
            </group>
        </>
    )
}

export default Vehicle