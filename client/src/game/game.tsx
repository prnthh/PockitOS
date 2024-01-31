import { Sky, Grid, SpriteAnimator, OrbitControlsProps, OrbitControls } from '@react-three/drei'
import React, { useContext, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import PlayerComponent from './playerComponent'
import { SceneContext } from '../context/client'
import { Euler, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

var options = {
  gridSize: [30, 16],
  cellSize: 1.0,
  cellThickness: 1.0,
  cellColor: '#70db84',
  sectionSize: 5.0,
  sectionThickness: 1.5,
  sectionColor: '#000000',
  fadeDistance: 50,
  fadeStrength: 1,
  followCamera: false,
  infiniteGrid: true,
}

export function Game() {
  const { players, socket } = useContext(SceneContext);


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
    <Suspense fallback={null}>
      <MyCamera />

    <ambientLight />
    <pointLight position={[10, 10, 10]} />
    
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
    
    {players.map((player) => {
      return <PlayerComponent key={player.id} player={player} />
    })}
    </Suspense>
    <Grid {...options} position={[0, -3.0, 0.0]} />
    </Canvas>
    )
  }

  const defaultDistance = 10;

  function MyCamera() {
    const { players, socket } = useContext(SceneContext);
    const [cameraOffset, setCameraOffset] = useState(new Vector3(0, defaultDistance, defaultDistance));

    const myPlayer = players.find((player) => player.id === socket.id);
    const myPosition = new Vector3(myPlayer?.position.x || 0, myPlayer?.position.y || 0, myPlayer?.position.z || 0);
    
    const camera = useThree(state => state.camera)
    const orbitControlsRef = useRef<OrbitControlsImpl>(null)

    useEffect(() => {
      var cameraPosition = myPosition.clone();
      cameraPosition.add(cameraOffset);
      camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      // cameraPosition += cameraAngle;
      
    }, [myPosition]);
    return <OrbitControls
    target={myPosition}
    ref={orbitControlsRef}
    maxPolarAngle={Math.PI * 0.4}
    minPolarAngle={-Math.PI * 0.5}
    enablePan={false}
    maxDistance={30.0}
    minDistance={1.0}
    enableRotate={true}
    enableZoom={true}
    onChange={() => {
      var cameraOffset = camera.position.clone();
      cameraOffset.sub(myPosition);
      setCameraOffset(cameraOffset);
    }}
    //enableDamping={true}
    dampingFactor={0.1}
    rotateSpeed={0.5}
    />;
  }