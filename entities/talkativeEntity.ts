import { sendMessage, updatePosition } from "..";
import { Entity, Region, ServerEntity } from "../interface";

function circularWalkingBehavior(entity: Entity, distance: number) {
    var oldPosition = entity.position;
    var newPosition = { x: oldPosition.x + 1, y: oldPosition.y, z: oldPosition.z };
    updatePosition(entity, newPosition);
    sendMessage(entity, distance + ": " + ramblingMessages[Math.floor(Math.random() * ramblingMessages.length)]);
}

const ramblingMessages = [
    "I wonder why the sky is blue...",
    "Do fish ever get thirsty?",
    "Yesterday I dreamed of electric sheep."
    // Add more random messages
];

export const walkingEntity: ServerEntity = {
    id: 'walkingEntity1',
    position: { x: 3, y: 0, z: 3 },
    behavior: (region: Region) => {
        var distance;
        var nearbyPlayers = Object.values(region.entities)?.filter(player => {
            if (player.id === walkingEntity.id) return false;
            distance = Math.sqrt(
                Math.pow(player.position.x - walkingEntity.position.x, 2) +
                Math.pow(player.position.y - walkingEntity.position.y, 2) +
                Math.pow(player.position.z - walkingEntity.position.z, 2)
            );
            return distance < 3;
        });
        if (nearbyPlayers.length > 0) {
            distance && circularWalkingBehavior(walkingEntity, distance);
        }

    },
    init: () => {
        // Initialize the entity
    }
};
