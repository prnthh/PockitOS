import { Socket } from 'socket.io';
import { Position, Region, id } from './client/src/context/interface';

abstract class AbstractEntity {
    id: id;
    name: string | undefined;
    position = { x: 0, y: 0, z: 0};
    region: string | undefined;
    
    constructor(public entityId: id, position?: Position) {
        this.id = entityId;
        if(position) this.position = position;
    }
    updatePosition(position: Position) {this.position = position}
    abstract behavior(region: Region): void;
}


export class ServerEntity extends AbstractEntity {
    constructor(public entityId: id, position?: Position) {
        super(entityId, position);
    }
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