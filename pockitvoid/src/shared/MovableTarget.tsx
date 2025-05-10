
import { OrbitControls, TransformControls } from "@react-three/drei";
import { memo, useEffect, useRef } from "react";
import * as THREE from "three";

function MovableTarget({ setPosition }: { setPosition: React.Dispatch<React.SetStateAction<[number, number, number] | undefined>> }) {

    const meshRef = useRef<THREE.Mesh>(null);
    const transformControls = useRef<any>(null);

    // Update target position when the box is moved
    const handleTransformChange = () => {
        if (meshRef.current) {
            const position = meshRef.current.parent?.position;
            position && setPosition([position.x, position.y, position.z]);
            console.log(position)
        }
    };

    return <TransformControls name='movable' onObjectChange={handleTransformChange} ref={transformControls} mode="translate">
        <mesh ref={meshRef}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="red" />
        </mesh>
    </TransformControls>
}

export default memo(MovableTarget);