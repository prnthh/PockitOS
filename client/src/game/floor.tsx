import { Plane } from "@react-three/drei";
import { ThreeEvent, useLoader } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { MeshStandardMaterial, PlaneGeometry, TextureLoader, Vector3 } from "three";

const meshWidth = 100;

export const TerrainLoader = ({onClick, position}: {onClick: ((event: ThreeEvent<MouseEvent>) => void), position: Vector3}) => {
  const tiles = ['0:0:0', '-1:0:0', '-1:0:-1', '0:0:-1'];
  return <>{tiles.map((tile, index) => {

    return <TerrainSimple key={index} onClick={onClick} position={tile} />
  })}</>
}

export const TerrainSimple = ({onClick, position}: {onClick?: ((event: ThreeEvent<MouseEvent>) => void), position: string }) => {
  const [initialized, setInitialized] = useState(false);

  const [x, y, z] = position.split(':').map(Number);

  const tilePosition = new Vector3((x * meshWidth) + (meshWidth / 2)
  , y * meshWidth, z * meshWidth + meshWidth / 2);
  
  const heightMap = useLoader(TextureLoader, `world/:${z}:${x}/elevation.png`);
  const colors = useLoader(TextureLoader, `world/:${z}:${x}/colors.png`);
  
  const [mapGeometry, setMapGeometry] = useState<PlaneGeometry>(new PlaneGeometry(meshWidth, meshWidth, 256, 256));
  
  
  useEffect(() => { 
    if (!initialized) {
      setInitialized(true);
      computeHeight();
    } 
  }, [heightMap, initialized]);
  
  function computeHeight() {
    
    var data = getImageData( heightMap.image );
    if (!data) return;
    
    const clone = mapGeometry.clone()
    const geometry = clone.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position.array
    let w, h, x, y
    
    const width = geometry.parameters.widthSegments + 1
    const height = geometry.parameters.heightSegments + 1
    const widthStep = heightMap.image.width / width
    const heightStep = heightMap.image.height / height
    
    for (let i = 0; i < positions.length; i += 3) {
      w = (i / 3) % width
      h = i / 3 / width
      
      x = Math.floor(w * widthStep)
      y = Math.floor(h * heightStep)
      
      const displacement = data.data[x * 4 + y * 4 * heightMap.image.width]
      positions[i + 1] = (displacement / 5) - 4
    }
    
    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
    
    setMapGeometry(geometry)
  }
  
  return <group>
  <Plane
  // rotation={[-Math.PI / 2, 0, 0]}
  position={tilePosition}
  args={[meshWidth, meshWidth, 128, 128]}
  onClick={(e)=>{console.log(e); e.point.y += 3; onClick && onClick(e)}} 
  geometry={mapGeometry}
  castShadow
  receiveShadow
  >
  <meshStandardMaterial
  attach="material"
  color="white"
  map={colors}
  metalness={0.2}
  // normalMap={normals}
  // displacementMap={heightMap}
  // displacementScale={5}
  // displacementBias={-10}
  />
  </Plane>
  </group>
};


function getImageData( image: HTMLImageElement ) {
  var canvas = document.createElement( 'canvas' );
  canvas.width = image.width;
  canvas.height = image.height;
  var context = canvas.getContext( '2d' );
  context?.drawImage( image, 0, 0 );
  return context?.getImageData( 0, 0, image.width, image.height );
}

function getPixel( imagedata:  ImageData, x: number, y: number ) {
  var position = ( x + imagedata.width * y ) * 4, data = imagedata.data;
  return { r: data[ position ], g: data[ position + 1 ], b: data[ position + 2 ], a: data[ position + 3 ] };
}