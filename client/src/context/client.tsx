import React, { createContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Player, PlayerEnter, Position, PositionUpdate, Region, SendMessage, ServerUpdate, id } from './interface';


interface SceneContextValue {
  socket: any;
  regions: Record<id, id[]>;
  players: Record<id, Player>;
  updatePlayerPosition: (position: { x: number; y: number; z: number }) => void;
  sendMessage: (message: string) => void;
}

export const SceneContext = createContext<SceneContextValue>({
  regions: {},
  players: {},
  updatePlayerPosition: () => {},
  sendMessage: () => {},
  socket: null,
});

export const SceneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [regions, setRegions] = useState<Record<id, id[]>>({});
  const [players, setPlayers] = useState<Record<id, Player>>({});
  const [socket, setSocket] = useState<any>(null);
  const regionsRef = useRef<Record<id, id[]>>();
  const playersRef = useRef<Record<id, Player>>();

  
  useEffect(() => {
    const newSocket = io("http://localhost:4000", { transports: ['websocket', 'polling', 'flashsocket'] });
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Connected!' + newSocket.id);
    });
    
    newSocket.on('regionUpdate', ({regionId, updates}: {regionId: string, updates: ServerUpdate[]}) => {
      console.log(' :::: Region update ::::\n', regionId, updates);      
      var region: id[] = regionsRef.current?.[regionId] || []; // array of entityids in region
      
      for (const update of updates) {
        if (update.type === 'positionUpdate') {
          const messageUpdate = update as PositionUpdate
          const id = messageUpdate.player.id;
          if(playersRef.current)
            playersRef.current[id].position = messageUpdate.player.position;
        } else if (update.type === 'playerEnter') {
          const messageUpdate = update as PlayerEnter
          if(playersRef.current)
            playersRef.current[messageUpdate.player.id] = messageUpdate.player;
          if(region.indexOf(messageUpdate.player.id) === -1)
          region.push(messageUpdate.player.id);
          // todo: maybe remove from other regions
        } else if (update.type === 'playerExit') {
          const messageUpdate = update as PlayerEnter
          region = region.filter((id) => id !== messageUpdate.player.id);
        } else if (update.type === 'newEntity') {
          
        } else if (update.type === 'newMessage') {
          const messageUpdate = update as SendMessage
          const playerId = messageUpdate.playerId;
          const message = messageUpdate.message;
          if(playersRef.current)
            playersRef.current[playerId].message = message;
          
        }
      }
      
      setRegions((prevRegions) => {
        const newRegions = { ...prevRegions };
        newRegions[regionId] = region;
        return newRegions;
      });
    });
    
    newSocket.on('regionState', (region: Region) => {
      console.log(':::: Region state ::::\n', region);
      // setPlayers(regionUpdate.entities);
      setRegions((prevRegions) => {
        const newRegions = { ...prevRegions };
        newRegions[region.id] = [
          // ...newRegions[region.id],
          ...Object.keys(region.entities)
        ]
        return newRegions;
      });

      setPlayers((prevPlayers) => {
        const newPlayers = { ...prevPlayers };
        for (const id in region.entities) {
          newPlayers[id] = region.entities[id];
        }
        return newPlayers;
      });
    });
    
    return () => { newSocket.close(); };
  }, [setSocket]);
  
  useEffect(() => {
    console.log('[Regions updated]:', regions);
    regionsRef.current = regions;
  } , [regions]);

  useEffect(() => {
    console.log('[Players updated]:', players);
    playersRef.current = players;
  } , [players]);
  
  const updatePlayerPosition = useCallback((position: Position) => {
    socket.emit('updatePosition', position);
  }, [socket]);
  
  const sendMessage = useCallback((message: string) => {
    socket.emit('sendMessage', message);
  }, [socket]);
  
  const contextValue = {
    socket,
    players,
    regions,
    updatePlayerPosition,
    sendMessage,
  };
  
  return <SceneContext.Provider value={contextValue}>{children}</SceneContext.Provider>;
};
