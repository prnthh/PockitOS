import { Socket } from 'socket.io';

type id = string;

export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface Region {
    entities: Record<string, Entity>;
    updates: any[];
}

export interface Entity {
    id: id;
    position: Position;
    region?: string;
}

export interface ServerEntity extends Entity {
    behavior: (region: Region) => void;
    init: () => void;
}

export interface Player extends Entity{
    socket: Socket;
}