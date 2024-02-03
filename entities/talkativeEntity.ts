import { sendMessage, updatePosition } from "..";
import { Region } from "../client/src/context/interface";
import { ServerEntity } from "../interface";

const startPosition = { x: 3, y: 0, z: 3 };
const ramblingMessages = [
    "I wonder why the sky is blue...",
    "Do fish ever get thirsty?",
    "Follow me!",
    // Add more random messages
];

class TalkativeEntity extends ServerEntity {
    startPosition: { x: number; y: number; z: number };

    constructor(name: string) {
        super(name);
        this.startPosition = { x: 3, y: 0, z: 3 };
    }

    behavior(region: Region): void {
        var distance;
        var nearbyPlayers = Object.values(region.entities)?.filter(player => {
            if (player.id === this.id) return false;
            distance = Math.sqrt(
                Math.pow(player.position.x - this.position.x, 2) +
                Math.pow(player.position.y - this.position.y, 2) +
                Math.pow(player.position.z - this.position.z, 2)
            );
            return distance < 3;
        });
        if (nearbyPlayers.length > 0) {
            distance && this.circularWalkingBehavior(this, distance);
        } else {
            if(this.position.x !== this.startPosition.x) {
                console.log(this.position, this.startPosition);
                this.updatePosition({ x: 3, y: 0, z: 3 });
                this.sendMessage("I'm so lonely...");
            }
        }
    }

    sendMessage(message: string): void {
        console.log(`${this.name}: ${message}`);
    }

    private circularWalkingBehavior(entity: ServerEntity, distance: number) {
        var oldPosition = entity.position;
        var newPosition = { x: oldPosition.x + 1, y: oldPosition.y, z: oldPosition.z };
        updatePosition(entity, newPosition);
        sendMessage(entity, ramblingMessages[Math.floor(Math.random() * ramblingMessages.length)]);
    }
}

export default TalkativeEntity;