import { Entity, Player, Position, Region, ServerEntity } from "../interface";

const REGION_SIZE = 100;


export function isPlayer(entity: Entity): entity is Player {
    return (entity as Player)?.socket !== undefined;
}

export function isServerEntity(entity: Entity): entity is ServerEntity {
    return (entity as ServerEntity)?.behavior !== undefined;
}

export function getRegionKey(position: Position): string {
    const xRegion = Math.floor(position.x / REGION_SIZE);
    const yRegion = Math.floor(position.y / REGION_SIZE);
    const zRegion = Math.floor(position.z / REGION_SIZE);
    return `${xRegion}:${yRegion}:${zRegion}`;
}

export function addPlayerToRegion(entity: Entity, regions: Record<string, Region>) {
    if(!entity.region) return;
    
    if (!regions[entity.region]) {
        regions[entity.region] = { updates: [], entities: {}};
    }
    
    if(isPlayer(entity))
    {
        regions[entity.region].entities[entity.id] = entity;
        regions[entity.region].updates.push({ type: 'playerEnter', player: {id: entity.id, position: entity.position } });    
        console.log(`Player ${entity.id} joined region ${entity.region}`);
        
        var existingPlayers = [];
        for (const id in regions[entity.region].entities) {
            if (id !== entity.id) { // Exclude the new player
                const existingPlayer = regions[entity.region].entities[id];
                existingPlayers.push({ id: existingPlayer.id, position: existingPlayer.position });
            }
        }
        const region = {
            id: entity.region,
            entities: existingPlayers
        }

        entity.socket.emit('regionState', region); // Send all at once
    } else {
        regions[entity.region].entities[entity.id] = entity;
        regions[entity.region].updates.push({ type: 'entityEnter', entity: {id: entity.id, position: entity.position } });    
        console.log(`Entity ${entity.id} joined region ${entity.region}`);
    
    }
}

export function removePlayerFromRegion(player: Entity, regions: Record<string, Region>) {
    if(!player.region) return;
    if (regions[player.region]) {
        delete regions[player.region].entities[player.id];
        if (Object.keys(regions[player.region].entities).length === 0) {
            delete regions[player.region];
        }
        regions[player.region]?.updates.push({ type: 'playerExit', player: {id: player.id, position: player.position} });
    }
}

export function updatePlayerRegion(player: Entity, regions: Record<string, Region>) {
    const newRegion = getRegionKey(player.position);
    if (newRegion !== player.region) {
        removePlayerFromRegion(player, regions);
        player.region = newRegion;
        addPlayerToRegion(player, regions);
    }
}