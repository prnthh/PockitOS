import React, { createContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Player, PlayerEnter, Position, PositionUpdate, Region, Regions, SendMessage, ServerUpdate, id } from './interface';


interface SceneContextValue {
  socket: any;
  regions: Regions;
  updatePlayerPosition: (position: { x: number; y: number; z: number }) => void;
  sendMessage: (message: string) => void;
}

export const SceneContext = createContext<SceneContextValue>({
  regions: {},
  updatePlayerPosition: () => {},
  sendMessage: () => {},
  socket: null,
});

interface SceneProviderProps {
  children: ReactNode;
}

export const SceneProvider: React.FC<SceneProviderProps> = ({ children }) => {
  const [regions, setRegions] = useState<Regions>({});
  const [socket, setSocket] = useState<any>(null);
  const regionsRef = useRef<Regions>();

  
  useEffect(() => {
    const newSocket = io("http://localhost:4000", { transports: ['websocket', 'polling', 'flashsocket'] });
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Connected!' + newSocket.id);
    });
    
    newSocket.on('regionUpdate', ({regionId, updates}: {regionId: string, updates: ServerUpdate[]}) => {
      console.log('Received region update', regionId, updates);      
      var region = regionsRef.current?.[regionId] || {
        id: regionId,
        entities: {},
      } as Region;
      
      for (const update of updates) {
        console.log('[Processing update]', update);
        if (update.type === 'positionUpdate') {
          const messageUpdate = update as PositionUpdate
          const id = messageUpdate.player.id;
          region.entities[id].position = messageUpdate.player.position;
        } else if (update.type === 'playerEnter') {
          const messageUpdate = update as PlayerEnter
          region.entities[messageUpdate.player.id] = {
            id: messageUpdate.player.id,
            position: messageUpdate.player.position,
          };
          // remove from other regions
          for (const regionId in regionsRef.current) {
            if (regionId !== region.id) {
              delete regionsRef.current[regionId].entities[messageUpdate.player.id];
            }
          }
        } else if (update.type === 'playerExit') {
          console.log('Player exit', update);
          const messageUpdate = update as PlayerEnter
          delete region.entities[messageUpdate.player.id];
        } else if (update.type === 'newEntity') {
          
        } else if (update.type === 'newMessage') {
          const messageUpdate = update as SendMessage
          // Handle new message
          const playerId = messageUpdate.playerId;
          const message = messageUpdate.message;
          region.entities[playerId].message = message;
          
        }
      }
      
      setRegions((prevRegions) => {
        const newRegions = { ...prevRegions };
        newRegions[regionId] = region;
        return newRegions;
      });
    });
    
    newSocket.on('regionState', (region: Region) => {
      console.log('Received region state', region);
      // setPlayers(regionUpdate.entities);
      setRegions((prevRegions) => {
        const newRegions = { ...prevRegions };
        var newRegion = newRegions[region.id] || {
          id: region.id,
          entities: {},
        };
        for (const entity of Object.keys(region.entities)) {
          newRegion.entities[entity] = region.entities[entity];
        }
        newRegions[region.id] = newRegion;
        
        return newRegions;
      });
    });
    
    return () => { newSocket.close(); };
  }, [setSocket]);
  
  useEffect(() => {
    console.log('[Regions updated]:', regions);
    regionsRef.current = regions;
  } , [regions]);
  
  const updatePlayerPosition = useCallback((position: Position) => {
    socket.emit('updatePosition', position);
  }, [socket]);
  
  const sendMessage = useCallback((message: string) => {
    socket.emit('sendMessage', message);
  }, [socket]);
  
  const contextValue = {
    socket,
    regions,
    updatePlayerPosition,
    sendMessage,
  };
  
  return <SceneContext.Provider value={contextValue}>{children}</SceneContext.Provider>;
};
