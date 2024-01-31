import express, { Express, Request, Response } from "express";
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { isPlayer, isServerEntity, removePlayerFromRegion, updatePlayerRegion } from "./modules/region";
import { Entity, Player, Position, Region, ServerEntity } from "./interface";
import { walkingEntity } from "./talkativeEntity";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const regions: Record<string, Region> = {};
const entities: Record<string, Entity> = {};

app.get('/', (req, res) => {
    res.send('Hello World!');
});

io.on('connection', (socket: Socket) => {
    const playerId = socket.id;
    
    const defaultPlayer: Player = {
        id: socket.id,
        position: { x: 0, y: 0, z: 0 },
        socket: socket,
    };
    entities[playerId] = defaultPlayer;
    
    console.log(`User connected: ${playerId}`);
    updatePlayerRegion(entities[playerId], regions);
    
    socket.on('updatePosition', (position) => {
        updatePosition(entities[playerId], position);
    });
    
    socket.on('sendMessage', (message) => {
        console.log(`Message from ${playerId}: ${message.message}`);
        sendMessage(entities[playerId], message.message);
    });
    
    socket.on('interactWithEntity', (data) => {
        const { entityId, action } = data;
        // Implement logic based on action and entity
    });
    
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${playerId}`);
        removePlayerFromRegion(entities[playerId], regions);
        delete entities[socket.id];
    });
});

export function updatePosition(entity: Entity, position: Position,) {
    entity.position = position;
    updatePlayerRegion(entity, regions);
    var region = entity.region
    region && regions[region].updates.push({ type: 'positionUpdate', playerId: entity.id, position });
}

export function sendMessage(entity: Entity, message: string) {
    var region = entities[entity.id].region
    region && regions[region].updates.push({ type: 'newMessage', playerId: entity.id, message: message,timestamp: new Date() });
}

function loadEntities(entitiesToLoad: ServerEntity[]) {
    entitiesToLoad.forEach((entityToLoad, index) => {
        entities[entityToLoad.id] = entityToLoad;
        if(isServerEntity(entityToLoad))
        {
            entityToLoad.init();
            updatePlayerRegion(entityToLoad, regions);
        }
    });
}

const entityList = [walkingEntity];
loadEntities(entityList);

// Game tick for batching updates
setInterval(() => {
    for (const regionKey in regions) {
        const region = regions[regionKey];
        if (region.updates.length > 0) {
            for (const playerId in region.entities) {
                const player = entities[playerId];
                if(isPlayer(player))
                {
                    player.socket.emit('regionUpdate', region.updates);
                }
            }
            region.updates.length = 0; // Clear the updates after sending
        }
    }
}, 1000 / 60); // Example: 60 ticks per second

setInterval(() => {
    for (const entityId in entities) {
        const entity = entities[entityId];
        if(isServerEntity(entity))
        {
            entity.region && entity.behavior(regions[entity.region]);
        }
    }
} , 1000 / 2); // Example: 2 ticks per second

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
