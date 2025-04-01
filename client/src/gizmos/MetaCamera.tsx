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

    useFrame(() => {

        // get the position of person from the rigidbody
        const pos = undefined // new Vector3()
        if (!pos) return;


        // Update target position from entity position
        // targetPosition.current.set(
        //     pos.x,
        //     pos.y + 0.5,
        //     pos.z
        // );

        // // Calculate desired camera position (in front of target)
        // const desiredPosition = new Vector3(
        //     pos.x,
        //     pos.y + 0.5,
        //     pos.z - 2
        // );

        // // Smoothly interpolate camera position
        // camera.current?.position.lerp(desiredPosition, 0.01);

        // // Smoothly interpolate camera lookAt
        // camera.current?.lookAt(
        //     targetPosition.current.lerp(targetPosition.current, 0.01)
        // );
    });

    return <>
        <PerspectiveCamera ref={camera} makeDefault position={[0, 10, 10]} />
        {/* <OrbitControls /> */}
    </>
}

export default MetaCamera