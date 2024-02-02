import { Plane } from "@react-three/drei";
import { ThreeEvent, useLoader } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { MeshStandardMaterial, PlaneGeometry, TextureLoader, Vector3 } from "three";

const meshWidth = 100;
const scale = 1;
const tileWidth = meshWidth * scale;

export const TerrainSimple = ({onClick, position}: {onClick?: ((event: ThreeEvent<MouseEvent>) => void), position: Vector3 }) => {
  const heightMap = useLoader(TextureLoader, "elevation.png");
  const normals = useLoader(TextureLoader, "normals.png");
  const colors = useLoader(TextureLoader, "colors.png");
  const ref = useRef<MeshStandardMaterial>(null);

  const [mapGeometry, setMapGeometry] = useState<PlaneGeometry>(new PlaneGeometry(meshWidth, meshWidth, 256, 256));
  
  const tilePosition = new Vector3(tileWidth / 2, 0, tileWidth / 2);
  
  useEffect(() => {  
    var imagedata = getImageData( heightMap.image );
    if (!imagedata) return;
    var color = getPixel( imagedata, 0, 0 );
    console.log( color.r, color.g, color.b, color.a );
    
    computeHeight();
  }, [heightMap]);
  
  function computeHeight() {

    var data = getImageData( heightMap.image );
    if (!data) return;

    const clone = mapGeometry.clone()
    const geometry = clone
    const positions = geometry.attributes.position.array
    let w, h, x, y
    
    const width = geometry.parameters.widthSegments + 1
    const height = geometry.parameters.heightSegments + 1
    const widthStep = heightMap.image.width / width
    const heightStep = heightMap.image.height / height

    for (let i = 1; i < positions.length; i += 3) {
      w = (i / 3) % width
      h = i / 3 / width
      
      x = Math.round(w * widthStep)
      y = Math.round(h * heightStep)
      
      const displacement = data.data[x * 4 + y * 4 * heightMap.image.width]
      positions[i + 1] = displacement / 20.55 - 3
    }
    
    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()

    setMapGeometry(geometry)
  }
  
  return <group>
  <Plane
  scale={scale}
  rotation={[-Math.PI / 2, 0, 0]}
  position={tilePosition}
  args={[meshWidth, meshWidth, 128, 128]}
  onClick={(e)=>{console.log(e); e.point.y += 3; onClick && onClick(e)}} 
  geometry={mapGeometry}
  castShadow
  receiveShadow
  >
  <meshStandardMaterial
  ref={ref}
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