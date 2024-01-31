import React from 'react';
import logo from './logo.svg';
import './App.css';
import { SceneProvider } from './context/client';
import { Game } from './game/game';
import Menu from './game/menu';

function App() {
  return (
    <div className="App">
      <SceneProvider>
        <Game />
        <Menu />
      </SceneProvider>
    </div>
  );
}

export default App;
