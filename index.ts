import express, { Express, Request, Response } from "express";
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

interface Position {
    x: number;
    y: number;
    z: number;
}

interface Player {
    id: string;
    position: Position;
    socket: Socket;
    region?: string;
}

interface Region {
    players: Record<string, Player>;
    updates: any[];
}

const players: Record<string, Player> = {};
const regions: Record<string, Region> = {};

const REGION_SIZE = 100; // Define your region size

app.get('/', (req, res) => {
    res.send('Hello World!');
});

io.on('connection', (socket: Socket) => {
    const playerId = socket.id;
    
    const defaultPlayer: Player = {
        id: socket.id,
        position: { x: 0, y: 0, z: 0 },
        socket: socket,
        // region: getRegionKey({ x: 0, y: 0, z: 0 })
    };
    players[playerId] = defaultPlayer;
    
    console.log(`User connected: ${playerId}`);
    // addPlayerToRegion(players[playerId]);
    updatePlayerRegion(players[playerId]);
    
    socket.on('updatePosition', (position) => {
        players[playerId].position = position;
        updatePlayerRegion(players[playerId]);
        var region = players[playerId].region
        region && regions[region].updates.push({ type: 'positionUpdate', playerId: playerId, position });
    });
    
    socket.on('sendMessage', (message) => {
        console.log(`Message from ${playerId}: ${message.message}`);
        var region = players[playerId].region
        region && regions[region].updates.push({ type: 'newMessage', playerId: playerId, message: message.message,timestamp: new Date() });
    });
    
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${playerId}`);
        removePlayerFromRegion(players[playerId]);
        delete players[socket.id];
    });
});

function getRegionKey(position: Position): string {
    const xRegion = Math.floor(position.x / REGION_SIZE);
    const yRegion = Math.floor(position.y / REGION_SIZE);
    const zRegion = Math.floor(position.z / REGION_SIZE);
    return `${xRegion}:${yRegion}:${zRegion}`;
}

function addPlayerToRegion(player: Player) {
    if(!player.region) return;

    if (!regions[player.region]) {
        regions[player.region] = { players: {}, updates: [] };
    }

    console.log(`Player ${player.id} joined region ${player.region}`);
    regions[player.region].players[player.id] = player;
    regions[player.region].updates.push({ type: 'playerEnter', player: {id: player.id, position: player.position } });
    
    const existingPlayers = [];
    for (const id in regions[player.region].players) {
        if (id !== player.id) { // Exclude the new player
            const existingPlayer = regions[player.region].players[id];
            existingPlayers.push({ id: existingPlayer.id, position: existingPlayer.position });
        }
    }
    player.socket.emit('regionState', existingPlayers); // Send all at once
    
}

function removePlayerFromRegion(player: Player) {
    if(!player.region) return;
    if (regions[player.region]) {
        delete regions[player.region].players[player.id];
        if (Object.keys(regions[player.region].players).length === 0) {
            delete regions[player.region];
        }
        regions[player.region]?.updates.push({ type: 'playerExit', player: {id: player.id, position: player.position} });
    }
}

function updatePlayerRegion(player: Player) {
    const newRegion = getRegionKey(player.position);
    if (newRegion !== player.region) {
        removePlayerFromRegion(player);
        player.region = newRegion;
        addPlayerToRegion(player);
    }
}

// Game tick for batching updates
setInterval(() => {
    for (const regionKey in regions) {
        const region = regions[regionKey];
        if (region.updates.length > 0) {
            for (const playerId in region.players) {
                region.players[playerId].socket.emit('regionUpdate', region.updates);
            }
            region.updates.length = 0; // Clear the updates after sending
        }
    }
}, 1000 / 60); // Example: 60 ticks per second

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
