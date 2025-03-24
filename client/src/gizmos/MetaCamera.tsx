import { useEffect, useRef } from "react"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { PerspectiveCamera as ThreePerspectiveCamera, Vector3 } from "three"
import { useFrame } from "@react-three/fiber"
import { useSelector } from "react-redux"
import { RootState } from "../store/store"
import { getCameraTarget, selectPersonById } from "../store/personSelectors"

const MetaCamera = () => {
    const camera = useRef<ThreePerspectiveCamera>(null)
    // const controls = useRef<any>(null)
    const cameraPosition = useRef(new Vector3())
    const targetPosition = useRef(new Vector3())
    const targetId = useSelector((state: RootState) => getCameraTarget(state));
    const personObj = useSelector((state: RootState) => targetId && selectPersonById(state, targetId));

    console.log(personObj)

    // const [cameraTarget] = useEntities(cameraQuery)

    useFrame(() => {
        if (!personObj) return;

        // get the position of person from the rigidbody
        const pos = personObj.rbRef?.current?.translation();
        if (!pos) return;


        // Update target position from entity position
        targetPosition.current.set(
            pos.x,
            pos.y + 0.5,
            pos.z
        );

        // Calculate desired camera position (in front of target)
        const desiredPosition = new Vector3(
            pos.x,
            pos.y + 0.5,
            pos.z - 2
        );

        // Smoothly interpolate camera position
        camera.current?.position.lerp(desiredPosition, 0.01);

        // Smoothly interpolate camera lookAt
        camera.current?.lookAt(
            targetPosition.current.lerp(targetPosition.current, 0.01)
        );
    });

    return <>
        <PerspectiveCamera ref={camera} makeDefault position={[0, 10, 10]} />
        {/* <OrbitControls /> */}
    </>
}

export default MetaCamera