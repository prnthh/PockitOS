import { useEffect, useRef } from "react"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { PerspectiveCamera as ThreePerspectiveCamera, Vector3 } from "three"
import { useFrame } from "@react-three/fiber"

const MetaCamera = () => {
    const camera = useRef<ThreePerspectiveCamera>(null)
    // const controls = useRef<any>(null)
    const cameraPosition = useRef(new Vector3())
    const targetPosition = useRef(new Vector3())

    // const [cameraTarget] = useEntities(cameraQuery)

    // useFrame(() => {
    //     if (!cameraTarget || cameraTarget.type === 'player') return;

    //     // Update target position from entity position
    //     targetPosition.current.set(
    //         cameraTarget.position.x,
    //         cameraTarget.position.y + 0.5,
    //         cameraTarget.position.z
    //     );

    //     // Calculate desired camera position (in front of target)
    //     const desiredPosition = new Vector3(
    //         cameraTarget.position.x,
    //         cameraTarget.position.y + 0.5,
    //         cameraTarget.position.z - 2
    //     );

    //     // Smoothly interpolate camera position
    //     camera.current?.position.lerp(desiredPosition, 0.01);

    //     // Smoothly interpolate camera lookAt
    //     camera.current?.lookAt(
    //         targetPosition.current.lerp(targetPosition.current, 0.01)
    //     );
    // });

    return <>
        <PerspectiveCamera ref={camera} makeDefault position={[0, 10, 10]} />
        {/* <OrbitControls /> */}
    </>
}

export default MetaCamera