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
import { Physics, RigidBody } from '@react-three/rapier';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Ped from './models/ped';
import { CharacterController } from './controllers/CharacterController';
import { selectPersonById } from './store/personSelectors';

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
      id: "npc1",
      position: [Math.random() * 5, 0, Math.random() * 5]
    }))
  }, [])

  return <Canvas shadows style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
    <Physics debug>
      <RigidBody type="fixed" position={[0, -1, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshPhysicalMaterial
            color="#4477ff"
            roughness={1}
            metalness={0}
          />
        </mesh>
      </RigidBody>

      {Object.keys(people).map((personId) => {
        return <Ped key={personId} id={personId} />
      })}

      <CharacterController />
    </Physics>

    <ambientLight intensity={2} />
    <directionalLight
      position={[5, 5, 5]}
      castShadow
      intensity={1}
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-20}
      shadow-camera-right={20}
      shadow-camera-top={20}
      shadow-camera-bottom={-20}
      shadow-camera-near={0.1}
      shadow-camera-far={50}
      shadow-bias={-0.0001}
    />

    <PerspectiveCamera makeDefault position={[0, 10, 10]} />
  </Canvas>
}

export default App;
