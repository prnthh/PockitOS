export type id = string;

export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface Region {
    id: string;
    entities: (Record<string, Player>);
    updates: ServerUpdate[];
}

export interface Player {
    id: string;
    position: { x: number; y: number; z: number };
    message?: string;
}

interface RegionUpdate {
    type: string;
}

export interface EntityEnter extends RegionUpdate {
    entity: { id: id, position: Position };
}

export interface PlayerEnter extends RegionUpdate {
    player: { id: id, position: Position };
}

export interface SendMessage extends RegionUpdate {
    message: string;
    playerId: id;
    timestamp: Date;
}

export interface PositionUpdate extends RegionUpdate {
    player: { id: id, position: Position };
}

export type ServerUpdate = PlayerEnter | SendMessage | PositionUpdate | EntityEnter;
