import { Box } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3, Group } from "three";


export const FollowCam = ({ height, shoulderCamMode }: { height: number, shoulderCamMode: boolean }) => {

    const cameraTarget = useRef<Group>(null);
    const cameraPosition = useRef<Group>(null);
    const cameraWorldPosition = useRef<Vector3>(new Vector3());
    const cameraLookAtWorldPosition = useRef<Vector3>(new Vector3());
    const cameraLookAt = useRef<Vector3>(new Vector3());
    const verticalRotation = useRef<number>(0); // Add this line

    useFrame(({ camera }) => {
        if (cameraPosition.current) {
            if (shoulderCamMode) {
                // Right shoulder position
                cameraPosition.current.position.x = -0.5;
                cameraPosition.current.position.y = height + 0.3;
                cameraPosition.current.position.z = -0.5;
            } else {
                // Normal third person position
                cameraPosition.current.position.x = 0;
                cameraPosition.current.position.y = 1 + Math.sin(verticalRotation.current);
                cameraPosition.current.position.z = -1 - Math.cos(verticalRotation.current);
            }
            cameraPosition.current.getWorldPosition(cameraWorldPosition.current);
            camera.position.lerp(cameraWorldPosition.current, 0.1);
        }
        if (cameraTarget.current) {
            if (shoulderCamMode) {
                cameraTarget.current.position.x = 0;
                cameraTarget.current.position.y = height - 0.3;
                cameraTarget.current.position.z = 3;
            } else {
                cameraTarget.current.position.x = 0;
                cameraTarget.current.position.y = height * 0.8;
                cameraTarget.current.position.z = 1.5;
            }
            cameraTarget.current.getWorldPosition(cameraLookAtWorldPosition.current);
            cameraLookAt.current.lerp(cameraLookAtWorldPosition.current, 0.1);
            camera.lookAt(cameraLookAt.current);
        }
    });



    return <>
        <group ref={cameraTarget} position-z={1.5} position-y={height * 0.8}>
            <Box args={[0.1, 0.1, 0.1]}>
                <meshBasicMaterial wireframe color="red" />
            </Box>
        </group>
        <group ref={cameraPosition} position-y={height * 0.8} position-z={-1}>
            <Box args={[0.1, 0.1, 0.1]}>
                <meshBasicMaterial wireframe color="blue" />
            </Box>
        </group>
    </>

}