import { useEntities } from "miniplex-react";
import { ECS, world } from "../ecs/state"
import { CharacterController } from "../CharacterController";

const playerQuery = ECS.world.with("type").where(({ type }) => type === "player")
const cameraQuery = ECS.world.with("cameraTarget", "position")

const Player = () => {
    const players = useEntities(playerQuery);
    const player = players.entities[0];
    const [cameraTarget] = useEntities(cameraQuery);

    if (!player) return null;

    return (
        <ECS.Entity entity={player}>
            <ECS.Component name="object3D">
                <CharacterController player={player} followCam={cameraTarget === player} />
            </ECS.Component>
        </ECS.Entity>
    );
}

export default Player