import express, { Express, Request, Response } from "express";
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { getAdjacentRegions, isPlayer, isServerEntity, movePlayerRegion, removePlayerFromRegion } from "./modules/region";
import { GameEntity, PlayerEntity, ServerEntity } from "./interface";
import TalkativeEntity from "./entities/talkativeEntity";
import { Position, PositionUpdate, Region, SendMessage } from "./client/src/context/interface";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const regions: Record<string, Region> = {};
const entities: Record<string, GameEntity> = {};

app.get('/', (req, res) => {
    res.send('Hello World!');
});

io.on('connection', (socket: Socket) => {
    // init new player
    const playerId = socket.id;
    entities[playerId] = new PlayerEntity(socket.id, socket);
    movePlayerRegion(entities[playerId], regions);
    
    socket.on('updatePosition', (position) => {
        updatePosition(entities[playerId], position as Position);
    });
    
    socket.on('sendMessage', (message) => {
        sendMessage(entities[playerId], message.message);
    });
    
    socket.on('interactWithEntity', (data) => {});
    
    socket.on('disconnect', () => {
        removePlayerFromRegion(entities[playerId], regions);
        delete entities[socket.id];
    });
});

// player actions

export function updatePosition(entity: GameEntity, position: Position,) {
    if(position.y < 0) return;
    entity.position = position;
    movePlayerRegion(entity, regions);
    var region = entity.region;
    region && regions[region].updates.push({ 
        type: 'positionUpdate', 
        player: {id: entity.id, position} 
    } as PositionUpdate);
}

export function sendMessage(entity: GameEntity, message: string) {
    var region = entities[entity.id].region
    region && regions[region].updates.push({ 
        type: 'newMessage', 
        playerId: entity.id, 
        message: message,
        timestamp: new Date() 
    } as SendMessage);
}

// entity initialization

function loadEntities(entitiesToLoad: ServerEntity[]) {
    entitiesToLoad.forEach((Entity, index) => {
        entities[Entity.id] = Entity;
        movePlayerRegion(Entity, regions);
    });
}

const entityTypes = [
    new TalkativeEntity('Goblin1', { x: 3, y: 0, z: 3 }),
    new TalkativeEntity('Goblin2', { x: 5, y: 0, z: 8 }),
];
loadEntities(entityTypes);

// Game tick for batching updates
const MOVES_PER_SECOND = 10;
const ACTIONS_PER_SECOND = 2;

setInterval(() => {
    for (const regionKey in regions) {
        const region = regions[regionKey];
        if (region.updates.length > 0) {
            const adjacentRegions = getAdjacentRegions(regionKey);
            const playersToNotify = new Set<string>();
            
            // Add players in the current region
            for (const playerId in region.entities) {
                playersToNotify.add(playerId);
            }
            
            // Add players in adjacent regions
            adjacentRegions.forEach(adjRegionKey => {
                const adjRegion = regions[adjRegionKey];
                if (adjRegion) {
                    for (const playerId in adjRegion.entities) {
                        playersToNotify.add(playerId);
                    }
                }
            });
            
            // Notify all players
            playersToNotify.forEach(playerId => {
                const player = entities[playerId];
                if (isPlayer(player)) {
                    console.log(`Sending updates to player ${playerId} in region ${regionKey}`);
                    player.socket.emit('regionUpdate', {
                        regionId: regionKey,
                        updates: region.updates
                    });
                }
            });
            
            region.updates.length = 0;
        }
    }
}, 1000 / MOVES_PER_SECOND);

setInterval(() => {
    for (const entityId in entities) {
        const entity = entities[entityId];
        if(isServerEntity(entity))
        {
            entity.region && entity.behavior(regions[entity.region]);
        }
    }
} , 1000 / ACTIONS_PER_SECOND);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});