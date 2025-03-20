import { CapsuleCollider, RigidBody } from "@react-three/rapier"
import { ECS, Entity, world } from "../ecs/state"
import { useEntities } from "miniplex-react"

const query = ECS.world.with("type").where(({ type }) => type === "player")
const Ped = ({ entity }: { entity: Entity }) => {
    const [player] = useEntities(query)

    return (
        <ECS.Component name="object3D">
            <group position={[entity.position.x, entity.position.y, entity.position.z]}
                onClick={(e) => {
                    const currentTarget = ECS.world.entities.find(e => e.cameraTarget)
                    if (currentTarget === entity) {
                        // If clicking current target, switch back to player
                        ECS.world.removeComponent(entity, "cameraTarget")
                        if (player) ECS.world.addComponent(player, "cameraTarget", true)
                    } else {
                        // Switch to this ped
                        if (currentTarget) ECS.world.removeComponent(currentTarget, "cameraTarget")
                        ECS.world.addComponent(entity, "cameraTarget", true)
                    }
                }}
            >
                <RigidBody type="dynamic" colliders={false}>
                    <CapsuleCollider args={[0.3, 0.15]} />
                    <mesh position={[0, 0.5, 0]}>
                        <sphereGeometry args={[0.2, 4, 2]} />
                        <meshStandardMaterial color="yellow" />
                    </mesh>
                    <mesh>
                        <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                </RigidBody>
            </group>
        </ECS.Component>
    )
}

export default Ped