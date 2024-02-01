import { ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, MeshStandardMaterial, PlaneGeometry, Vector3 } from "three";

const Terrain = ({playerPosition}: {playerPosition: Vector3}) => {
    const [tiles, setTiles] = useState<JSX.Element[]>([]);
    const chunkSize = 10; // Adjust this size based on your needs
    
    useEffect(() => {
        updateVisibleTiles(playerPosition);
    }, [playerPosition]);
    
    
    const updateVisibleTiles = useCallback((playerPos: Vector3) => {
        const newTiles = [] as JSX.Element[];
        newTiles.push(<Tile key={`1`}
        position={new Vector3(0, 0, 0)}
        heightData={[[0, 0, 1, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0],]}
        tileSize={1} />);
        setTiles(newTiles);
        
    }, []);
    return <group dispose={null} position={[0, -3, 0]}>
    {tiles}
    </group>;
};

export default Terrain;


const Tile = ({ position, heightData, tileSize }: { position: Vector3, heightData: number[][], tileSize: number }) => {
    const geometry = useMemo(() => {
        const tileGeometry = new BufferGeometry();
        const vertices: number[] = [];
        const indices: number[] = [];
        const colors: number[] = [];

        for (let i = 0; i < heightData.length; i++) {
            for (let j = 0; j < heightData[i].length; j++) {
                // Push vertex positions (x, y, z)
                vertices.push(i * tileSize, heightData[i][j], j * tileSize);

                // Compute color based on height
                let heightValue = heightData[i][j];
                let color = new Color(0, Math.max(0, 1 - heightValue / 3), 0); // Simple green gradient
                colors.push(color.r, color.g, color.b);
            }
        }

        // Create faces (two triangles per square)
        for (let i = 0; i < heightData.length - 1; i++) {
            for (let j = 0; j < heightData[i].length - 1; j++) {
                const stride = heightData[i].length;
                const a = i * stride + j;
                const b = i * stride + (j + 1);
                const c = (i + 1) * stride + (j + 1);
                const d = (i + 1) * stride + j;
                
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        tileGeometry.setIndex(indices);
        tileGeometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        tileGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
        tileGeometry.computeVertexNormals();

        return tileGeometry;
    }, [heightData, tileSize]);

    const handleTileClick = (event: ThreeEvent<MouseEvent>) => {
        const { point } = event;
        const localPoint = point.sub(position);

        // Calculate the tile coordinates
        const tileX = Math.floor(localPoint.x / tileSize);
        const tileY = Math.floor(localPoint.z / tileSize);

        console.log(`Clicked on tile (${tileX}, ${tileY})`);

        // if (onTileClick) {
        //     onTileClick(tileX, tileY);
        // }
    };

    return (
        <mesh receiveShadow geometry={geometry} onClick={handleTileClick} position={position}>
            <meshStandardMaterial vertexColors 
            wireframe 
            // color='green'
             />
        </mesh>
    );
};