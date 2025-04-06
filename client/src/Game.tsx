
import './App.css';
import { Canvas } from '@react-three/fiber'

import { Physics } from '@react-three/rapier';
import Ground from './rigs/ground';
import MetaCamera from './gizmos/MetaCamera';
import Thing from './rigs/thing';
import Building from './rigs/building';
import Lightsource from './rigs/lightsource';
import WorldLighting from './gizmos/WorldLighting';
import FPSController from './controllers/FPSController';
import { Perf } from 'r3f-perf';
import useGameStore from './store/gameStore';
import { CharacterController } from './controllers/CharacterController';
import { Suspense, useEffect } from 'react';
import Ped from './rigs/ped';
import { useShallow } from 'zustand/react/shallow';
import Vehicle from './rigs/vehicle';
import { Terrain } from './rigs/terrain';

function Game() {
    return <Canvas className='select-none touch-none' shadows style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
        <Perf />
        <Physics debug>

            {/* world: always render ground first, then buildings, then entities */}
            <Building position={[0, 0, 8]} />
            <Lightsource model="lamppost2.glb" position={[-5, 0, 5]} />
            <GameEntities />
            <Ground />
            {/* <Terrain /> */}

            {/* env stuff */}
            <MetaCamera />

        </Physics>

        <WorldLighting />
    </Canvas>
}

function GameEntities() {

    const { addEntity } = useGameStore();
    const npcs = useGameStore(
        useShallow((state) => Object.keys(state.entities)
            .filter(id => state.entities[id]?.type === 'npc'))
    )

    const things = useGameStore(
        useShallow((state) => Object.keys(state.entities)
            .filter(id => state.entities[id]?.type === 'thing'))
    )

    const players = useGameStore(
        useShallow((state) => Object.keys(state.entities)
            .filter(id => state.entities[id]?.type === 'player'))
    )

    const vehicles = useGameStore(
        useShallow((state) => Object.keys(state.entities)
            .filter(id => state.entities[id]?.type === 'vehicle'))
    )


    useEffect(() => {

        addEntity({
            id: 'player',
            type: 'player',
            position: [0, 2, 0],
            cameraTarget: true,
            inventory: [],
        });

        addEntity({
            id: 'rigga',
            type: 'npc',
            position: [1, 1, 1],
            currentGoal: 'wander',
        });

        addEntity({
            id: 'rigga5',
            type: 'npc',
            position: [-1, 1, 1],
            currentGoal: 'wander',
        });

        addEntity({
            id: 'mycar',
            type: 'vehicle',
            position: [0, 1, 0],
        });

        const interval = setTimeout(() => {
            addEntity({
                id: `burger${Math.floor(Math.random() * 1000)}`,
                name: 'burger',
                type: 'thing',
                position: [Math.random() * 10 - 5, 0, Math.random() * 10 - 5],
            });
        }, 4000);

        return () => {
            clearTimeout(interval);
        }


    }, []);

    useEffect(() => {
        console.log('GameEntities', npcs, things)
    }, [npcs, things]);

    return <>
        {Object.values(players).map((entity) => {
            return <Suspense key={entity}><CharacterController id={entity} /></Suspense>
        })}
        {Object.values(npcs).map((entity) => {
            return <Suspense key={entity}><Ped id={entity} /></Suspense>
        })}
        {Object.values(things).map((entity) => {
            return <Suspense key={entity}><Thing id={entity} /></Suspense>
        })}
        {Object.values(vehicles).map((entity) => {
            return <Suspense key={entity}><Vehicle id={entity} /></Suspense>
        })}
    </>
}

export default Game;