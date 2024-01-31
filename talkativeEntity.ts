import { sendMessage, updatePosition } from ".";
import { Entity, Region, ServerEntity } from "./interface";

function circularWalkingBehavior(entity: Entity) {
    var oldPosition = entity.position;
    var newPosition = { x: oldPosition.x + 1, y: oldPosition.y, z: oldPosition.z };
    updatePosition(entity, newPosition);
    sendMessage(entity, ramblingMessages[Math.floor(Math.random() * ramblingMessages.length)]);
}

const ramblingMessages = [
    "I wonder why the sky is blue...",
    "Do fish ever get thirsty?",
    "Yesterday I dreamed of electric sheep."
    // Add more random messages
];

export const walkingEntity: ServerEntity = {
    id: 'walkingEntity1',
    position: { x: 0, y: 0, z: 0 },
    behavior: (region: Region) => {
        var nearbyPlayers = Object.values(region.entities).filter(entity => entity.id !== walkingEntity.id && entity.position.x === walkingEntity.position.x && entity.position.y === walkingEntity.position.y && entity.position.z === walkingEntity.position.z);
        if (nearbyPlayers.length > 0) {
            circularWalkingBehavior(walkingEntity);
        }
    },
    init: () => {
        // Initialize the entity
    }
};
