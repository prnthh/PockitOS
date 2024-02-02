import React, { createContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export interface Player {
  id: string;
  position: { x: number; y: number; z: number };
  // Add other player properties as needed
}

interface Entity {
  id: string;
  // Entity properties
}

interface SceneContextValue {
  socket: any;
  players: Player[];
  entities: Entity[];
  updatePlayerPosition: (position: { x: number; y: number; z: number }) => void;
  sendMessage: (message: string) => void;
}

export const SceneContext = createContext<SceneContextValue>({
  players: [],
  entities: [],
  updatePlayerPosition: () => {},
  sendMessage: () => {},
  socket: null,
});

interface SceneProviderProps {
  children: ReactNode;
}

export const SceneProvider: React.FC<SceneProviderProps> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [socket, setSocket] = useState<any>(null);

  const playersRef = useRef<Player[]>([]); // Ref to hold the current players state

  useEffect(() => {
    const newSocket = io("http://localhost:4000", { transports: ['websocket', 'polling', 'flashsocket'] }); // Adjust the URL to match your server
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected!' + newSocket.id);
    });

    newSocket.on('regionUpdate', (updates: any[]) => {
      console.log('Received region update', updates);

      for (const update of updates) {
        if (update.type === 'positionUpdate') {
          const playerIndex = playersRef.current.findIndex((player) => player.id === update.playerId);
          if (playerIndex !== -1) {
            setPlayers((prevPlayers) => {
              const newPlayers = [...prevPlayers];
              newPlayers[playerIndex].position = update.position;
              return newPlayers;
            });
          }
        } else if (update.type === 'playerEnter') {
          setPlayers((prevPlayers) => [...prevPlayers, update.player]);
        } else if (update.type === 'playerExit') {
          console.log('playerExit', update);
          setPlayers((prevPlayers) => prevPlayers.filter((player) => player.id !== update.player.id));
        } else if (update.type === 'newEntity') {
          setEntities((prevEntities) => [...prevEntities, update]);
        } else if (update.type === 'newMessage') {
          // Handle new message
        }
      }
    });

    newSocket.on('regionState', (regionUpdate: {id: string, entities: Player[]}) => {
      console.log('Received region state', regionUpdate);
      setPlayers(regionUpdate.entities);
    });

    return () => { newSocket.close(); };
  }, [setSocket]);

  const updatePlayerPosition = useCallback((position: { x: number; y: number; z: number }) => {
    socket.emit('updatePosition', position);
  }, [socket]);

  const sendMessage = useCallback((message: string) => {
    socket.emit('sendMessage', message);
  }, [socket]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const contextValue = {
    socket,
    players,
    entities,
    updatePlayerPosition,
    sendMessage,
  };

  return <SceneContext.Provider value={contextValue}>{children}</SceneContext.Provider>;
};
