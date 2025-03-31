import { Box, Cylinder } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
    RapierRigidBody,
    RigidBody,
    useRevoluteJoint,
    Vector3Tuple
} from "@react-three/rapier";
import { createRef, RefObject, useRef } from "react";

const WheelJoint = ({
    body,
    wheel,
    bodyAnchor,
    wheelAnchor,
    rotationAxis
}: {
    body: RefObject<RapierRigidBody>;
    wheel: RefObject<RapierRigidBody>;
    bodyAnchor: Vector3Tuple;
    wheelAnchor: Vector3Tuple;
    rotationAxis: Vector3Tuple;
}) => {
    const joint = useRevoluteJoint(body, wheel, [
        bodyAnchor,
        wheelAnchor,
        rotationAxis
    ]);

    useFrame(() => {
        // if (joint.current) {
        //     joint.current.configureMotorVelocity(20, 10);
        // }
    });

    return null;
};

interface CarProps {
    chassisSize?: [number, number, number];  // Width, height, depth
    wheelThickness?: number;
    wheelRadius?: number;
    position?: [number, number, number];
}

export const Car = ({
    chassisSize = [1.6, 0.02, 0.9],
    wheelThickness = 0.1,
    wheelRadius = 0.18,
    position = [5, 3, 0]
}: CarProps = {}) => {
    const bodyRef = useRef<RapierRigidBody>(null!);
    const [chassisWidth, chassisHeight, chassisDepth] = chassisSize;

    // Adjust wheel positions to prevent clipping
    // Move wheels lower by adding wheelRadius to the y-offset
    const wheelPositions: [number, number, number][] = [
        [-chassisWidth / 2 + wheelRadius, -chassisHeight / 2 - wheelRadius, wheelThickness / 1.9 + chassisDepth / 2],
        [-chassisWidth / 2 + wheelRadius, -chassisHeight / 2 - wheelRadius, -wheelThickness / 1.9 + -chassisDepth / 2],
        [chassisWidth / 2 - wheelRadius, -chassisHeight / 2 - wheelRadius, wheelThickness / 1.9 + chassisDepth / 2],
        [chassisWidth / 2 - wheelRadius, -chassisHeight / 2 - wheelRadius, -wheelThickness / 1.9 + -chassisDepth / 2]
    ];

    const wheelRefs = useRef(
        wheelPositions.map(() =>
            createRef<RapierRigidBody>()
        ) as RefObject<RapierRigidBody>[]
    );

    // Calculate the joint positions relative to the chassis
    const jointPositions: [number, number, number][] = wheelPositions.map(([x, y, z]) => [
        x, y + wheelRadius, z // Adjust the y position to connect at the bottom of chassis
    ]);

    return (
        <group>
            <RigidBody colliders="cuboid" ref={bodyRef} type="dynamic" position={position}>
                <Box scale={chassisSize} castShadow receiveShadow name="chassis">
                    <meshStandardMaterial color={"red"} />
                </Box>
            </RigidBody>
            {wheelPositions.map((wheelPosition, index) => (
                <RigidBody
                    position={[
                        position[0] + wheelPosition[0],
                        position[1] + wheelPosition[1],
                        position[2] + wheelPosition[2]
                    ]}
                    colliders="hull"
                    type="dynamic"
                    key={index}
                    ref={wheelRefs.current[index]}
                >
                    <Cylinder
                        rotation={[Math.PI / 2, 0, 0]}
                        args={[wheelRadius, wheelRadius, wheelThickness, 32]}
                        castShadow
                        receiveShadow
                    >
                        <meshStandardMaterial color={"grey"} />
                    </Cylinder>
                </RigidBody>
            ))}
            {wheelPositions.map((wheelPosition, index) => (
                <WheelJoint
                    key={index}
                    body={bodyRef}
                    wheel={wheelRefs.current[index]}
                    bodyAnchor={jointPositions[index]}
                    wheelAnchor={[0, 0, 0]}
                    rotationAxis={[0, 0, 1]}
                />
            ))}
        </group>
    );
};

export default Car;