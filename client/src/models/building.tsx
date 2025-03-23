
const Building = () => (
    <group position={[9, 0, 0]}>
        <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[1, 4, 1]} />
            <meshStandardMaterial color="gray" />
        </mesh>
    </group>
)

export default Building