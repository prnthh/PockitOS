import { useRef } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { PerspectiveCamera as ThreePerspectiveCamera, Vector3, Quaternion } from "three";
import { useFrame } from "@react-three/fiber";
import { useControlScheme } from "./Controls";
import useGameStore from "../store/gameStore";
import { useShallow } from "zustand/react/shallow";
import { useRapier } from "@react-three/rapier";

const vehicleSpawn = new Vector3(-7, 2, -130);

const MetaCamera = () => {
    const camera = useRef<ThreePerspectiveCamera>(null);
    const targetLookAt = useRef(new Vector3(0, 0, -1));
    const { scheme } = useControlScheme();
    const cameraTargets = useGameStore(
        useShallow((state) =>
            Object.values(state.entities).filter((entity) => entity.cameraTarget)
        )
    );
    const { world } = useRapier();

    useFrame(() => {
        if (!camera.current) return;

        if (cameraTargets.length > 0) {
            const target = cameraTargets[0];
            if (!target.rigidbodyhandle) return;

            const rb = world.getRigidBody(target.rigidbodyhandle);
            const pos = rb.translation();
            const quat = rb.rotation();

            const targetPos = new Vector3(pos.x, pos.y, pos.z);
            const forward = new Vector3(0, 0, 1).applyQuaternion(quat); // Local Z is forward

            const offsetDistance = 5;
            const heightOffset = 2;
            const offset = forward.clone().multiplyScalar(-offsetDistance);
            offset.y += heightOffset;

            const desiredCameraPos = targetPos.clone().add(offset);

            // Lerp position smoothly
            camera.current.position.lerp(desiredCameraPos, 0.1);

            // Lerp the look target smoothly
            targetLookAt.current.lerp(targetPos, 0.1);
            camera.current.lookAt(targetLookAt.current);
        }
    });

    return <PerspectiveCamera ref={camera} makeDefault position={[0, 10, 10]} />;
};

export default MetaCamera;