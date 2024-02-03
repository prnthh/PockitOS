import { EntityEnter, PlayerEnter, Position, Region } from "../client/src/context/interface";
import { GameEntity,PlayerEntity, ServerEntity } from "../interface";
import { Player } from "../client/src/context/interface";

const REGION_SIZE = 100;


export function isPlayer(entity: GameEntity): entity is PlayerEntity {
    return (entity as PlayerEntity)?.socket !== undefined;
}

export function isServerEntity(entity: GameEntity): entity is ServerEntity {
    return (entity as ServerEntity)?.behavior !== undefined;
}

export function getRegionKey(position: Position): string {
    const xRegion = Math.floor(position.x / REGION_SIZE);
    const yRegion = Math.floor(position.y / REGION_SIZE);
    const zRegion = Math.floor(position.z / REGION_SIZE);
    return `${xRegion}:${yRegion}:${zRegion}`;
}

export function addPlayerToRegion(entity: GameEntity, regions: Record<string, Region>) {
    if(!entity.region) return;
    
    if (!regions[entity.region]) {
        regions[entity.region] = { 
            id: entity.region,
            updates: [], entities: {}
        };
    }
    
    if(isPlayer(entity))
    {
        console.log(`Player ${entity.id} joined region ${entity.region}`);
        regions[entity.region].entities[entity.id] = entity as PlayerEntity;
        regions[entity.region].updates?.push({ 
            type: 'playerEnter', 
            player: {id: entity.id, position: entity.position } 
        } as PlayerEnter);    
        
        entity.socket.emit('regionState', {
            ...regionSnapshot(regions[entity.region]),
            id: entity.region,
        } as Region);
    } else {
        regions[entity.region].entities[entity.id] = entity as ServerEntity;
        regions[entity.region].updates.push({ 
            type: 'entityEnter', 
            entity: {id: entity.id, position: entity.position } 
        } as EntityEnter);    
        console.log(`Entity ${entity.id} joined region ${entity.region}`);
    }
}

function regionSnapshot(region: Region) {
    return {
        id: region.id,
        entities: Object.values(region.entities).reduce<Record<string, Player>>((acc, entity) => {
            acc[entity.id] = {
                id: entity.id,
                position: entity.position
            };
            return acc;
        }, {}),
        updates: region.updates
    } as Region;
}

export function removePlayerFromRegion(player: GameEntity, regions: Record<string, Region>) {
    if(!player.region) return;
    if (regions[player.region]) {
        delete regions[player.region].entities[player.id];
        if (Object.keys(regions[player.region].entities).length === 0) {
            delete regions[player.region];
        }
        regions[player.region]?.updates.push({ type: 'playerExit', 
        player: {id: player.id, position: player.position} });
    }
}

export function updatePlayerRegion(player: GameEntity, regions: Record<string, Region>) {
    const newRegion = getRegionKey(player.position);
    if (newRegion !== player.region) {
        removePlayerFromRegion(player, regions);
        player.region = newRegion;
        addPlayerToRegion(player, regions);
    }
}