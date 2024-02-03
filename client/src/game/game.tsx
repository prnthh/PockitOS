import { Sky, Grid, SpriteAnimator, OrbitControlsProps, OrbitControls } from '@react-three/drei'
import React, { useContext, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import PlayerComponent from './playerComponent'
import { SceneContext } from '../context/client'
import { Euler, Vector3 } from 'three'
import MyCamera from './camera'
import { TerrainLoader, TerrainSimple } from './floor'
import Terrain from './terrain'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export function Game() {
  const { regions, players, socket } = useContext(SceneContext);
  const [controlRef, setControlRef] = useState<OrbitControlsImpl | null>(null)

  function onTerrainClick(event: any) {
    socket.emit('updatePosition', event.point);
  }

  return (
    <Canvas
    className='h-full w-full'
    camera={{
      position: [10, 15, -10],
      fov: 45,
      far: 1000,
      near: 0.1,
    }}
    >
    <Sky sunPosition={[7, 5, 1]} />
    <fog attach="fog" args={["white", 50, 105]} />
    <Suspense fallback={null}>
    <MyCamera myref={setControlRef}/>

    <ambientLight />
    <directionalLight castShadow position={[10, 10, 10]} />

    <SpriteAnimator
    scale={[4, 4, 4]}
    position={[0, -0.25, 1.2]}
    startFrame={0}
    fps={40}
    autoPlay={true}
    loop={true}
    textureImageURL={'./flame.png'}
    textureDataURL={'./flame.json'}
    alphaTest={0.01}
    />
    <SpriteAnimator
    scale={[2, 2, 2]}
    position={[-3.5, -2.0, 2.5]}
    startFrame={0}
    autoPlay={true}
    loop={true}
    numberOfFrames={16}
    alphaTest={0.01}
    textureImageURL={'./alien.png'}
    />

    {/* {players.map((player) => {
      return <PlayerComponent key={player.id} player={player} control={controlRef} />
    })} */}
    {Object.keys(regions).map((regionId) => {
      const region = regions[regionId];
      return <>
      
      </>
    } )}
    {Object.keys(players).map((playerId) => {
      const player = players[playerId];
      return <PlayerComponent key={player.id} player={player} control={controlRef} />
    }
    )}
          <TerrainLoader onClick={onTerrainClick} />

    </Suspense>
    </Canvas>
    )
  }

