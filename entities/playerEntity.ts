import { Socket } from "socket.io";
import { AbstractEntity } from "../interface";

export class PlayerEntity extends AbstractEntity {
    socket: Socket;
    
    constructor(id: string, socket: any) {
        super(id);
        this.socket = socket;
    }
    
    behavior(): void {}
}