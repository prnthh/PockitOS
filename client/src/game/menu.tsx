import React, { useContext, useEffect, useRef } from 'react';
import logo from './logo.svg';
import { SceneContext } from '../context/client';

function Menu() {
    const { regions, socket } = useContext(SceneContext);
    
    return <>
    <div className="absolute">
    <div className="border border-black">players:
    
    {Object.keys(regions).map((region, id) => {
        return <div key={id}>
        {region}
        {regions[region].map((player, id) => {
            return <div key={id}>
            {player}
            </div>})
        }
        </div>
    })}
    </div>
    
    </div>
    <Chat />
    </>
}

function Chat() {
    const { socket } = useContext(SceneContext);
    const [data, setData] = React.useState<any[]>([]);
    const [message, setMessage] = React.useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if(socket) {
            socket.on('regionUpdate', ({id, updates}: {id: string, updates: any[]}) => {
                updates.forEach((element: any) => {
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
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } , [data]);
    
    function addMessage(message: any) {
        setData(prevData => [...prevData, message]);
    }
    
    function sendMessage() {
        if(message.length > 0) {
            socket.emit('sendMessage', { message: message });
            setMessage('');
        }
    }
    
    return <div className="absolute bottom-0">
    <div className='bg-gray-200/30'>
    <div className='max-h-36 overflow-y-auto text-left p-1'>
    {data.map((element) => <div key={element.timestamp}>
    {element.playerId}: {element.message}
    </div>
    )}
    <div ref={messagesEndRef} />
    
    </div>
    <div className='bg-gray-200 p-1 flex'>
    <input className='flex flex-grow' type="text" id="message" name="message"
    placeholder="enter a message"
    value={message} onChange={(e)=>{setMessage(e.target.value)}}
    onKeyDown={(e) => {
        if(e.key === 'Enter' && message.length > 0) {
            sendMessage();
        }}
    }
    />
    <button className="bg-gray-400 hover:bg-gray-500 px-1" onClick={() => sendMessage()}>→</button>
    </div>
    </div>
    
    </div>
}

export default Menu;
