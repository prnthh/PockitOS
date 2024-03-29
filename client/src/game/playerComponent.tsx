import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SceneContext } from '../context/client';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { FBXLoader, SkeletonUtils } from 'three/examples/jsm/Addons.js';
import { AnimationAction, AnimationMixer, Mesh, Object3D, Object3DEventMap, Vector3 } from 'three';
import TWEEN from '@tweenjs/tween.js';
import { Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Player } from '../context/interface';
import SpriteEntity from './EntityVariants/SpriteEntity';

const PlayerComponent = ({player, control}: {player: Player, control: OrbitControlsImpl | null}) => {
  const {socket} = useContext(SceneContext);
  const [position, setPosition] = useState(new Vector3(player.position.x, player.position.y, player.position.z));
  const { camera } = useThree();
  const [ entityStatus, setEntityStatus ] = useState<{message: String | undefined, animation: String}>({
    message: undefined,
    animation: 'idle',
  });
  // const animations = useLoader(FBXLoader, Object.values(ANIMATIONS)).map(f => f.animations[0]);

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
  <SpriteEntity />
  </group>
}

export default PlayerComponent;



export const ANIMATIONS = {
  idle: '/resources/animation/Happy.fbx',
  walk: '/resources/animation/Happy Walk.fbx',
};

function FBXCharacter(){
  
  const fileUrl = '/models/character/character.fbx';
  const fbx = useLoader(FBXLoader, fileUrl);
  const clone = useMemo(() => SkeletonUtils.clone(fbx), [fbx]);  
  const mesh = useRef<Mesh>(null);
  
  return <mesh
  ref={mesh}
  >
  <primitive object={clone} scale={1} />
  </mesh>
}


function useModelAttachment(
  clone:Object3D<Object3DEventMap>,
  attachpoint: string,
  model?: string,
  offset?: Vector3,
  scale?: Vector3,
  rotation?: Vector3){
      const [loadedModel, setLoadedModel] = useState<Object3D>();

      useEffect(() => {
          const bone = clone.getObjectByName(attachpoint);
          if (!bone) return;
          const existingModel = bone.getObjectByName(attachpoint + "hat");
          if (existingModel) bone.remove(existingModel);

          if(model && (model.includes("undefined") || model.includes("None"))) return;

          const hatFileUrl = `/resources/3d/${model}.fbx`;
          const loader = new FBXLoader();
          loader.load(hatFileUrl, (loadedHat) => {
              const clonedHat = SkeletonUtils.clone(loadedHat);
              setLoadedModel(clonedHat);
          });
      }, [model, clone]);

      useEffect(() => {
          if (!loadedModel || !clone) return;

          const bone = clone.getObjectByName(attachpoint);
          if (bone) {
              loadedModel.name = attachpoint + "hat";
              loadedModel.position.set(offset?.x || 0, offset?.y || 0, offset?.z || 0);
              loadedModel.scale.set(scale?.x || 1, scale?.y || 1, scale?.z || 1);
              loadedModel.rotation.set(rotation?.x || 0, rotation?.y || 0, rotation?.z || 0);
              bone.add(loadedModel);
          }
      }, [loadedModel]);

      return { loadedModel, setLoadedModel };

  }