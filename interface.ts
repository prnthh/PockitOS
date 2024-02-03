import { Socket } from 'socket.io';
import { Position, Region, id } from './client/src/context/interface';

abstract class AbstractEntity {
    id: id;
    name: string | undefined;
    position = { x: 0, y: 0, z: 0};
    region: string | undefined;

    constructor(public entityId: id) {this.id = entityId;}
    updatePosition(position: Position) {this.position = position}
    abstract behavior(region: Region): void;
}


export class ServerEntity extends AbstractEntity {
    constructor(id: string) {super(id)}
    behavior(region: Region): void { }
}

export class PlayerEntity extends AbstractEntity {
    socket: Socket;

    constructor(id: string, socket: any) {
        super(id);
        this.socket = socket;
    }

    behavior(): void {}
}

export type GameEntity = ServerEntity | PlayerEntity;