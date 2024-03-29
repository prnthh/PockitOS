import { EntityEnter, PlayerEnter, Position, Region } from "../client/src/context/interface";
import { GameEntity, ServerEntity } from "../interface";
import { Player } from "../client/src/context/interface";
import { PlayerEntity } from "../entities/playerEntity";

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

export function movePlayerRegion(player: GameEntity, regions: Record<string, Region>) {
    const oldRegion = player.region;
    const newRegion = getRegionKey(player.position);
    
    if (newRegion) {
        player.region = newRegion;
        if (!regions[newRegion]) {
            regions[newRegion] = { 
                id: newRegion,
                updates: [], 
                entities: {}
            };
        }
        
        if(oldRegion !== newRegion) 
        {
            if(oldRegion)
            {
                regions[oldRegion]?.updates.push({ 
                    type: 'playerExit',
                    player: {id: player.id, position: player.position} 
                });
                delete regions[oldRegion].entities[player.id];
            }
            regions[newRegion]?.updates.push({ 
                type: 'playerEnter',
                player: {id: player.id, position: player.position} 
            });
        }
        
        regions[newRegion].entities[player.id] = player as PlayerEntity;
        
        if(oldRegion !== newRegion && isPlayer(player))
        {
            player.socket.emit('regionState', {
                ...regionSnapshot(regions[player.region]),
                id: player.region,
            } as Region);
        }
        
    }
}

export function getAdjacentRegions(regionKey: string): string[] {
    const [x, y, z] = regionKey.split(':').map(Number);
    const adjacentRegions = [];
    
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (dx !== 0 || dy !== 0 || dz !== 0) {
                    adjacentRegions.push(`${x + dx}:${y + dy}:${z + dz}`);
                }
            }
        }
    }
    
    return adjacentRegions;
}