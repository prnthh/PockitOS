import React, { useContext, useEffect } from 'react';
import logo from './logo.svg';
import { SceneContext } from '../context/client';

function Menu() {
    const { players, socket } = useContext(SceneContext);

    function moveDirection(direction: string) {
        var myPlayer = players.find((player) => player.id === socket.id);
        if(myPlayer)
        {
            var myPosition = myPlayer.position;
            if(direction === 'up') {
                myPosition.z -= 1;
            }
            else if(direction === 'down') {
                myPosition.z += 1;
            }
            else if(direction === 'left') {
                myPosition.x -= 1;
            }
            else if(direction === 'right') {
                myPosition.x += 1;
            }
            socket.emit('updatePosition', myPosition);
        }
    }
    
    
    return <>
        <div className="absolute">
    <div className="border border-black">players:
    {players.map((player) => <div key={player.id}>
    {player.id} {JSON.stringify(player.position)}
    </div>
    )}
    </div>
    
    
    
    {['left', 'down', 'up', 'right'].map((direction) => <button className='border px-1 ' key={direction} onClick={() => moveDirection(direction)}>{direction}</button>)}
    </div>
    <Chat />
    </>
}

function Chat() {
    const { socket } = useContext(SceneContext);
    const [data, setData] = React.useState<any[]>([]);
    const [message, setMessage] = React.useState('hello world');

    useEffect(() => {
        if(socket) {
            socket.on('regionUpdate', (message: any) => {
                message.forEach((element: any) => {
                    console.log('Received message:', element);
                    if(element.type === 'newMessage') {
                        addMessage(element);
                    }
                });
            });
        }
        
        return () => {
            if(socket) {
                socket.off('message');
            }
        };
    }, [socket]);
    
    function addMessage(message: any) {
        console.log('addMessage', message);
        console.log('data', data);
        setData(prevData => [...prevData, message]);
    }
    
    return <div className="absolute bottom-0">
    <div>
    {data.map((element) => <div key={element.timestamp}>
    {element.playerId}: {element.message}
    </div>
    )}
    
    <div className='bg-gray-200 p-1'>
    <input type="text" id="message" name="message" value={message} onChange={(e)=>setMessage(e.target.value)}/>
    <button onClick={() => {
        socket.emit('sendMessage', { message: message });
    }}>send</button>
    </div>
    </div>
    
    </div>
}

export default Menu;
