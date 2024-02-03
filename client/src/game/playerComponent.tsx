import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SceneContext } from '../context/client';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { FBXLoader, SkeletonUtils } from 'three/examples/jsm/Addons.js';
import { AnimationAction, AnimationMixer, Mesh, Vector3 } from 'three';
import TWEEN from '@tweenjs/tween.js';
import { Html, SpriteAnimator } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Player } from '../context/interface';

const PlayerComponent = ({player, control}: {player: Player, control: OrbitControlsImpl | null}) => {
  const {socket} = useContext(SceneContext);
  const [position, setPosition] = useState(new Vector3(player.position.x, player.position.y, player.position.z));
  const { camera } = useThree();
  const [ entityStatus, setEntityStatus ] = useState<{message: String | undefined, animation: String}>({
    message: undefined,
    animation: 'idle',
  });

  const isPlayer = player?.id === socket?.id;

  useEffect(() => {
    if(isPlayer) {
      control?.target.set(position.x, position.y, position.z);
    }
  } , [position, control, isPlayer]);
  
  // hide player.message in 5 seconds, unless if new one is set
  useEffect(() => {
    setEntityStatus({
      message: player.message,
      animation: entityStatus.animation,
    });
    
    const timer = setTimeout(() => {
      setEntityStatus({
        message: undefined,
        animation: entityStatus.animation,
      });
    }, 5000);
    return () => clearTimeout(timer);
  }, [player.message]);
    
  useFrame(() => {
    TWEEN.update();
  });
  
  useEffect(() => {
    const distance = position.distanceTo(new Vector3(player.position.x, player.position.y, player.position.z));
    const tween = new TWEEN.Tween(position)
    .to(new Vector3(player.position.x, player.position.y, player.position.z), distance * 200)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(() => {
      setPosition(new Vector3(position.x, position.y, position.z));
      if (camera && isPlayer && control) {
        const cameraOffset = camera.position.clone().sub(control?.target as Vector3);
        camera.position.set(position.x + cameraOffset.x,position.y + cameraOffset.y, position.z + cameraOffset.z);
        control.target = new Vector3(position.x, position.y, position.z);
      }
    })
    .start();
    
    return () => {
      tween.stop();
    };
    
  }, [player.position.x, player.position.y, player.position.z]);
  
  return <group dispose={null}
  position={position}>
  <Html position={[0,1,0]}>
  <div className='-translate-x-1/2 text-yellow-300'>
  {entityStatus.message && entityStatus.message}
  {player.id}
  <div>
  {JSON.stringify(entityStatus)}
  
  </div>
  </div>
  </Html>
  <BoxCharacter />
  </group>
}

export default PlayerComponent;

function BoxCharacter() {
  const [frameName, setFrameName] = useState('idle');
  
  
  const onClick = () => {
    console.log('clicked')
    setFrameName('celebration')
  }
  
  const onEnd = ({ currentFrameName, currentFrame }: {currentFrameName: string, currentFrame: number}) => {
    if (currentFrameName === 'celebration') {
      setFrameName('idle')
    }
  }
  return   <group onClick={onClick}>
  <SpriteAnimator
  scale={[4, 4, 4]}
  position={[0.0, -1.5, 0]}
  onLoopEnd={onEnd}
  frameName={frameName}
  fps={24}
  animationNames={['idle', 'celebration']}
  autoPlay={true}
  loop={true}
  alphaTest={0.01}
  textureImageURL={'./boy_hash.png'}
  textureDataURL={'./boy_hash.json'}
  />
  </group>
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