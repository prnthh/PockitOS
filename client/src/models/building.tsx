import { ECS, Entity } from "../ecs/state"

const Building = ({ entity }: { entity: Entity }) => (
    <ECS.Component name="object3D">
        <group position={[entity.position.x, entity.position.y, entity.position.z]}>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[1, 4, 1]} />
                <meshStandardMaterial color="gray" />
            </mesh>
        </group>
    </ECS.Component>
)

export default Building