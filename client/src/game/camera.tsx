import { useThree } from "@react-three/fiber";
import { useContext, useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { SceneContext } from "../context/client";
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { OrbitControls } from "@react-three/drei";

const defaultDistance = 10;

function MyCamera({myref}: {myref: (orbit: OrbitControlsImpl) => void}) {
  const [cameraOffset, setCameraOffset] = useState(new Vector3(0, defaultDistance, defaultDistance));


  const camera = useThree(state => state.camera)
  const orbitControlsRef = useRef<OrbitControlsImpl>(null)

  // useEffect(() => {
  //   var cameraPosition = myPosition.clone();
  //   cameraPosition.add(cameraOffset);
  //   camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
  // }, [myPosition]);

  useEffect(() => {
    myref(orbitControlsRef.current as OrbitControlsImpl);
  }, [orbitControlsRef]);

  return <OrbitControls
  makeDefault
  // target={myPosition}
  ref={orbitControlsRef}
  maxPolarAngle={Math.PI * 0.4}
  minPolarAngle={-Math.PI * 0.5}
  enablePan={false}
  maxDistance={30.0}
  minDistance={1.0}
  enableRotate={true}
  enableZoom={true}
  // onChange={() => {
  //   var cameraOffset = camera.position.clone();
  //   cameraOffset.sub(myPosition);
  //   setCameraOffset(cameraOffset);
  // }}
  //enableDamping={true}
  dampingFactor={0.1}
  rotateSpeed={0.5}
  />;
}

export default MyCamera;