import { RigidBody } from "@react-three/rapier";


function Ground() {
    return (
        <RigidBody type="fixed" position={[0, 0, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshPhysicalMaterial
                    color="#4477ff"
                    roughness={1}
                    metalness={0}
                />
                <gridHelper args={[100, 100, 'white', 'lightblue']} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} />
            </mesh>
        </RigidBody>
    );
}

export default Ground;