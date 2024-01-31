import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Player } from '../context/client';
import { useFrame, useLoader } from '@react-three/fiber';
import { FBXLoader, SkeletonUtils } from 'three/examples/jsm/Addons.js';
import { AnimationAction, AnimationMixer, Mesh, Vector3 } from 'three';
import TWEEN from '@tweenjs/tween.js';

const PlayerComponent = ({player}: {player: Player}) => {
  const [position, setPosition] = useState(new Vector3(player.position.x, player.position.y, player.position.z)); 
  
  useFrame(() => {
    TWEEN.update();
  });

  useEffect(() => {
  const tween = new TWEEN.Tween(position)
  .to(new Vector3(player.position.x, player.position.y, player.position.z), 1000)
  .easing(TWEEN.Easing.Quadratic.Out)
  .onUpdate(() => {
    setPosition(new Vector3(position.x, position.y, position.z));
  })
  .start();

  return () => {
    tween.stop();
  };

  }, [player.position.x, player.position.y, player.position.z]);

  return <group dispose={null}
  position={position}>
  
  <BoxCharacter />
  </group>
}

export default PlayerComponent;

function BoxCharacter() {
  return <mesh>
  <boxGeometry />
  <meshStandardMaterial color="hotpink" />
  </mesh>
}

export const ANIMATIONS = {
  idle: '/resources/animation/Happy.fbx',
  walk: '/resources/animation/Happy Walk.fbx',
};

function FBXCharacter(){
  
  const fileUrl = '/models/character/character.fbx';
  const fbx = useLoader(FBXLoader, fileUrl);
  const clone = useMemo(() => SkeletonUtils.clone(fbx), [fbx]);
  const [animationState, setAnimationState] = useState('idle');
  
  const mesh = useRef<Mesh>(null);
  
  const animations = useLoader(FBXLoader, Object.values(ANIMATIONS)).map(f => f.animations[0]);
  const [mixer, setMixer] = useState<AnimationMixer | null>(null);

  type Actions = { [key: string]: AnimationAction };
  const actions = useMemo(() => mixer ? Object.keys(ANIMATIONS).reduce<Actions>((acc, key, index) => {
    acc[key] = mixer.clipAction(animations[index], clone);
    return acc;
  }, {}) : {}, [mixer, clone, animations]);

  useEffect(() => {
    if (!clone) return;
    
    clone.traverse((child) => { 
        if (child instanceof Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.metalness = 0;
            child.material.shininess = 0;
            child.material.transparent = true;
        }
    });
    
    const newMixer = new AnimationMixer(clone);
    setMixer(newMixer);

    return () => {
        newMixer.stopAllAction();
        newMixer.uncacheRoot(newMixer.getRoot());
    };
}, [clone]);
  useEffect(() => {
        if (mixer) {
            const action = (animationState && actions[animationState]) || actions.idle;
            action?.reset().fadeIn(0.1)?.play();
            
            return () => {action.fadeOut(0.1);}
        }
    }, [mixer, actions, animationState]);

  return <mesh
  ref={mesh}
  >
  <primitive object={clone} scale={1} />
  </mesh>
}