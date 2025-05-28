import { HeightfieldCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";
// Import TSL from three/examples/jsm/nodes if available, else fallback
import {
    mx_noise_float, color, cross, dot, float, transformNormalToView, positionLocal, sign, step, Fn, uniform, varying, vec2, vec3, Loop
} from "three/tsl"

export function Terrain({
    tileX,
    tileY,
    gridX,
    gridY,
    origin,
    size,
    baseHeight,
    deltas,
    onEdit,
}: {
    tileX: number;
    tileY: number;
    gridX: number;
    gridY: number;
    origin: number[];
    size: number;
    baseHeight: (x: number, y: number) => number;
    deltas: { [key: string]: number };
    onEdit: (pointIdx: number, raise: boolean) => void;
}) {
    const width = size;
    const height = size;
    const widthSegments = 50; // Increased segments for more detail
    const heightSegments = 50; // Increased segments for more detail

    // Build heightfield with deltas
    const heightField = useMemo(() => {
        const arr = Array((widthSegments + 1) * (heightSegments + 1)).fill(0);
        for (let h = 0; h < heightSegments + 1; h++) {
            for (let w = 0; w < widthSegments + 1; w++) {
                const i = h * (widthSegments + 1) + w;
                const wx = origin[0] + (w / widthSegments) * width;
                const wy = origin[1] + (h / heightSegments) * height;
                const base = baseHeight(wx, wy);
                const deltaKey = `${tileX},${tileY},${i}`;
                arr[i] = base + (deltas[deltaKey] || 0);
            }
        }
        return arr;
    }, [origin, width, height, widthSegments, heightSegments, baseHeight, deltas, tileX, tileY]);

    const geometry = useMemo(() => {
        const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
        const pos = geometry.attributes.position;
        for (let i = 0; i < heightField.length; i++) {
            pos.setZ(i, heightField[i]);
        }
        geometry.deleteAttribute('uv');
        geometry.deleteAttribute('normal');
        geometry.rotateX(-Math.PI * 0.5);
        geometry.computeVertexNormals();
        return geometry;
    }, [heightField, width, height, widthSegments, heightSegments]);

    // TSL terrain material setup - with reduced scale parameters
    const noiseIterations = useMemo(() => uniform(3), []);
    const positionFrequency = useMemo(() => uniform(0.4), []); // Increased frequency for smaller features
    const warpFrequency = useMemo(() => uniform(3), []); // Reduced for smaller features
    const warpStrength = useMemo(() => uniform(0.5), []); // Reduced for subtler warping
    const strength = useMemo(() => uniform(2), []); // Reduced strength for smaller height variation
    const offset = useMemo(() => uniform(vec2(0, 0)), []);
    const normalLookUpShift = useMemo(() => uniform(0.01), []);
    const colorSand = useMemo(() => uniform(color('#ffe894')), []);
    const colorGrass = useMemo(() => uniform(color('#85d534')), []);
    const colorSnow = useMemo(() => uniform(color('#ffffff')), []);
    const colorRock = useMemo(() => uniform(color('#bfbd8d')), []);

    const vNormal = useMemo(() => varying(vec3()), []);
    const vPosition = useMemo(() => varying(vec3()), []);

    // Terrain elevation function (TSL) - With reduced height scale
    const terrainElevation = useMemo(() => Fn(([position]: [any]) => {
        const warpedPosition = position.add(offset).toVar();
        warpedPosition.addAssign(
            mx_noise_float(
                warpedPosition.mul(positionFrequency).mul(warpFrequency),
                float(1),
                float(0)
            ).mul(warpStrength)
        );

        const elevation = float(0).toVar();
        Loop(
            { type: 'float', start: float(1), end: noiseIterations.toFloat(), condition: '<=' },
            ({ i }: { i: any }) => {
                const noiseInput = warpedPosition
                    .mul(positionFrequency)
                    .mul(i.mul(float(2)))
                    .add(i.mul(float(987)));
                const noise = mx_noise_float(noiseInput, float(1), float(0)).div(i.add(float(1)).mul(float(2)));
                elevation.addAssign(noise);
            }
        );

        const elevationSign = sign(elevation);
        elevation.assign(
            elevation.abs().pow(float(2)).mul(elevationSign).mul(strength)
        );

        return elevation;
    }), [noiseIterations, positionFrequency, warpFrequency, warpStrength, strength, offset]);

    // TSL material - Adjusted for better visualization with lower terrain
    const terrainMaterial = useMemo(() => {
        // Use MeshStandardNodeMaterial if available, else fallback
        const mat = (THREE as any).MeshStandardNodeMaterial
            ? new (THREE as any).MeshStandardNodeMaterial({
                metalness: 0,
                roughness: 0.5,
                color: '#85d534',
            })
            : new THREE.MeshStandardMaterial({
                metalness: 0,
                roughness: 0.5,
                color: '#85d534',
            });

        if (mat.positionNode) {
            // Position node calculation
            mat.positionNode = Fn(() => {
                // Neighbours positions
                const neighbourA = positionLocal.xyz.add(vec3(normalLookUpShift, float(0.0), float(0.0))).toVar();
                const neighbourB = positionLocal.xyz.add(vec3(float(0.0), float(0.0), normalLookUpShift.negate())).toVar();

                // Elevations
                const position = positionLocal.xyz.toVar();
                const elevation = terrainElevation(positionLocal.xz);
                position.y.addAssign(elevation);

                neighbourA.y.addAssign(terrainElevation(neighbourA.xz));
                neighbourB.y.addAssign(terrainElevation(neighbourB.xz));

                // Compute normal
                const toA = neighbourA.sub(position).normalize();
                const toB = neighbourB.sub(position).normalize();
                vNormal.assign(cross(toA, toB));

                // Varyings
                vPosition.assign(position.add(vec3(offset.x, float(0), offset.y)));

                return position;
            })();

            mat.normalNode = transformNormalToView(vNormal);

            // Color node calculation - Adjusted thresholds for lower terrain
            mat.colorNode = Fn(() => {
                const finalColor = colorSand.toVar();

                // Grass - lowered threshold
                const grassMix = step(float(-0.02), vPosition.y);
                finalColor.assign(grassMix.mix(finalColor, colorGrass));

                // Rock
                const rockMix = step(float(0.5), dot(vNormal, vec3(float(0), float(1), float(0))))
                    .oneMinus()
                    .mul(step(float(-0.02), vPosition.y));
                finalColor.assign(rockMix.mix(finalColor, colorRock));

                // Snow - lowered threshold
                const snowThreshold = mx_noise_float(vPosition.xz.mul(float(25)), float(1), float(0))
                    .mul(float(0.1))
                    .add(float(0.2)); // Lower snow threshold
                const snowMix = step(snowThreshold, vPosition.y);
                finalColor.assign(snowMix.mix(finalColor, colorSnow));

                return finalColor;
            })();
        }
        return mat;
    }, [colorSand, colorGrass, colorSnow, colorRock, normalLookUpShift, offset, terrainElevation, vNormal, vPosition]);

    // Handle click: find nearest vertex
    function handleMeshClick(e: any) {
        if (!onEdit) return;
        const point = e.point;
        // Convert world point to local tile coordinates
        const localX = ((point.x - origin[0]) / width + 0.5) * width;
        const localY = ((point.z - origin[1]) / height + 0.5) * height;
        // Find nearest vertex
        let minDist = Infinity;
        let minIdx = 0;
        for (let h = 0; h < heightSegments + 1; h++) {
            for (let w = 0; w < widthSegments + 1; w++) {
                const i = h * (widthSegments + 1) + w;
                const vx = (w / widthSegments) * width;
                const vy = (h / heightSegments) * height;
                const dist = (vx - localX) ** 2 + (vy - localY) ** 2;
                if (dist < minDist) {
                    minDist = dist;
                    minIdx = i;
                }
            }
        }
        // Left click = raise, right click = lower
        const raise = e.button === 0;
        onEdit(minIdx, raise);
    }

    return (
        <RigidBody colliders={false} position={[origin[0], 0, origin[1]]}>
            <mesh
                geometry={geometry}
                castShadow
                receiveShadow
                onPointerDown={handleMeshClick}
                material={terrainMaterial}
            />
            <HeightfieldCollider
                args={[
                    widthSegments,
                    heightSegments,
                    heightField as number[],
                    { x: height, y: 1, z: width },
                ]}
            />
        </RigidBody>
    );
}