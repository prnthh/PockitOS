import { useEffect, useRef } from "react"
import { ECS } from "../ecs/state"
import { useEntities } from "miniplex-react"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { PerspectiveCamera as ThreePerspectiveCamera, Vector3 } from "three"
import { useFrame } from "@react-three/fiber"

const cameraQuery = ECS.world.with("cameraTarget", "position")
const playerQuery = ECS.world.with("type").where(({ type }) => type === "player")

const MetaCamera = () => {
    const camera = useRef<ThreePerspectiveCamera>(null)
    const controls = useRef<any>(null)
    const targetPosition = useRef(new Vector3())

    const [cameraTarget] = useEntities(cameraQuery)

    useFrame(() => {
        if (!cameraTarget || !controls.current || cameraTarget.type === 'player') return

        // Update target position from entity position
        targetPosition.current.set(
            cameraTarget.position.x,
            cameraTarget.position.y,
            cameraTarget.position.z
        )

        // Smoothly update controls target
        controls.current.target.lerp(targetPosition.current, 0.1)
    })

    return <>
        <PerspectiveCamera ref={camera} makeDefault position={[0, 10, 10]} />
    </>
}

export default MetaCamera