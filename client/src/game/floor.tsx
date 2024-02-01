import { Plane } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";

export const TerrainSimple = () => {
    const height = useLoader(TextureLoader, "elevation.png");
    const normals = useLoader(TextureLoader, "normals.png");
    const colors = useLoader(TextureLoader, "colors.png");
  
    return (
      <group>
        <Plane
          scale={10}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -3, 0]}
          args={[64, 64, 1024, 1024]}
        >
          <meshStandardMaterial
            attach="material"
            color="white"
            map={colors}
            metalness={0.2}
            normalMap={normals}
            displacementMap={height}
          />
        </Plane>
      </group>
    );
  };