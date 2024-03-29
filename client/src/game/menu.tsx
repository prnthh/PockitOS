import React, { useContext, useEffect, useRef } from 'react';
import logo from './logo.svg';
import { SceneContext } from '../context/client';

function Menu() {
    
    return <>
    <Online/>
    <Chat />
    </>
}

function Online() {
    const [collapsed, setCollapsed] = React.useState(false);    
    const { regions, socket } = useContext(SceneContext);
    return <div className="absolute top-2 right-2">
    <div className="border bg-white text-left p-1 rounded-xl flex flex-col items-center">
    
    <button 
    className='flex items-center gap-1'
    onClick={(e: any)=>{
        setCollapsed(!collapsed);
        e.stopPropagation();
    }}>
    players online 
    <div className='w-5 h-5 flex items-center justify-center bg-black/50 rounded-full text-white'>
    {regions && Object.values(regions).reduce((acc, region) => acc + region.length, 0)}   
    </div>
    </button>
    
    {collapsed && <div className={'flex flex-col gap-1 w-full'}>
    {Object.keys(regions).map((region, id) => {
        return <div key={id} className='border bg-gray-200 rounded-lg overflow-hidden'>
        <div className='text-sm text-center w-full'>Region {region}</div>
        {regions[region].map((player, id) => {
            return <div className={'px-1 hover:bg-gray-300'} key={id}>
            {player == socket.id? 'You': player }
            </div>})
        }
        </div>
    })}
    </div>}
    </div>
    
    </div>
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
    
    return <div className="absolute bottom-2 right-2">
    <div className='bg-gray-200/30 p-2 rounded-lg'>
    <div className='max-h-36 overflow-y-auto text-left p-1'>
    {data.map((element, id) => <div key={id}>
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
