import React, { useEffect, useMemo } from 'react';
import logo from './logo.svg';
import './App.css';
import { Canvas } from '@react-three/fiber'
import Controls from './controllers/Controls';
import Dialog from './ui/dialog';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState, store } from './store/store';
import { Provider } from 'react-redux'
import { addNPC } from './store/PersonSlice';
import { Physics } from '@react-three/rapier';
import Ped from './rigs/ped';
import { CharacterController } from './controllers/CharacterController';
import Ground from './rigs/ground';
import MetaCamera from './gizmos/MetaCamera';
import Thing from './rigs/thing';
import Building from './rigs/building';
import Window from './vfx/window';

function App() {

  return (
    <Provider store={store}>
      <Controls>
        <Game />
        <Dialog />
      </Controls>
    </Provider>
  );
}

function Game() {
  const people = useSelector((state: RootState) => state.persons)
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(addNPC({
      id: "rigga",
      position: [5, 1, 10]
    }))
    dispatch(addNPC({
      id: "rigga2",
      position: [-5, 1, 10]
    }))
    dispatch(addNPC({
      id: "rigga3",
      position: [0, 1, 10]
    }))
  }, [])

  return <Canvas className='select-none touch-none' shadows style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
    <color attach="background" args={['#222233']} />
    <fogExp2 attach="fog" args={['#222233', 0.04]} />

    <Physics debug>
      {Object.keys(people).map((personId) => {
        return <Ped key={personId} id={personId} />
      })}

      <CharacterController />
      <Thing model="burger.glb" />
      <Building model="lamppost2.glb" />
      <Ground />

      <Window />
    </Physics>

    <ambientLight intensity={0.3} />
    <directionalLight
      position={[5, 5, 5]}
      castShadow
      intensity={0.2}
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-20}
      shadow-camera-right={20}
      shadow-camera-top={20}
      shadow-camera-bottom={-20}
      shadow-camera-near={0.1}
      shadow-camera-far={50}
      shadow-bias={-0.0001}
    />

    <MetaCamera />
  </Canvas>
}

export default App;
