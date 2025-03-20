import React, { useMemo } from 'react';
import logo from './logo.svg';
import './App.css';
import { Canvas } from '@react-three/fiber'
import Game from './ecs/world';
import { KeyboardControls, KeyboardControlsEntry } from '@react-three/drei';

enum Controls {
  forward = 'forward',
  back = 'back',
  left = 'left',
  right = 'right',
  jump = 'jump',
  run = 'run',
}

function App() {
  const map = useMemo<KeyboardControlsEntry<Controls>[]>(() => [
    { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: Controls.back, keys: ['ArrowDown', 'KeyS'] },
    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: Controls.run, keys: ['Shift'] },
    { name: Controls.jump, keys: ['Space'] },
  ], [])
  return (
    <KeyboardControls map={map}>

      <Canvas style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
        <Game />
      </Canvas>
    </KeyboardControls>
  );
}

export default App;
