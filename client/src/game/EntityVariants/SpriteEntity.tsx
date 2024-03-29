import { SpriteAnimator } from "@react-three/drei";
import { useState } from "react";

export default function SpriteEntity() {
    const [frameName, setFrameName] = useState('idle');
    
    
    const onClick = (e: any) => {
      console.log('clicked')
      setFrameName('celebration')
      e.stopPropagation();
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