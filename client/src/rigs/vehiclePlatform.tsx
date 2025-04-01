import { Box, Cylinder } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
    RapierRigidBody,
    RigidBody,
    useRevoluteJoint,
    Vector3Tuple
} from "@react-three/rapier";
import { createRef, RefObject, useRef, useState } from "react";

const WheelJoint = ({
    body,
    wheel,
    bodyAnchor,
    wheelAnchor,
    rotationAxis,
    jointRef
}: {
    body: RefObject<RapierRigidBody>;
    wheel: RefObject<RapierRigidBody>;
    bodyAnchor: Vector3Tuple;
    wheelAnchor: Vector3Tuple;
    rotationAxis: Vector3Tuple;
    jointRef?: any;
}) => {
    const joint = useRevoluteJoint(body, wheel, [
        bodyAnchor,
        wheelAnchor,
        rotationAxis
    ]);

    // Assign joint to ref if provided
    if (jointRef) {
        jointRef.current = joint.current;
    }

    return null;
};

interface CarProps {
    chassisSize?: [number, number, number];  // Width, height, depth
    wheelThickness?: number;
    wheelRadius?: number;
    position?: [number, number, number];
    onLoad?: (bodyRef: RefObject<RapierRigidBody>, jointRefs: any) => void;
}

export const Car = ({
    chassisSize = [1.6, 0.02, 0.9],
    wheelThickness = 0.1,
    wheelRadius = 0.18,
    position = [5, 3, 0],
    onLoad
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

    // References for wheel joints
    const frontLeftJointRef = useRef(null);
    const frontRightJointRef = useRef(null);
    const rearLeftJointRef = useRef(null);
    const rearRightJointRef = useRef(null);

    // Joint refs object to pass to the hook
    const jointRefs = {
        frontLeft: frontLeftJointRef,
        frontRight: frontRightJointRef,
        rearLeft: rearLeftJointRef,
        rearRight: rearRightJointRef
    };

    // Calculate the joint positions relative to the chassis
    const jointPositions: [number, number, number][] = wheelPositions.map(([x, y, z]) => [
        x, y + wheelRadius, z // Adjust the y position to connect at the bottom of chassis
    ]);

    // Call onLoad callback when refs are ready
    useFrame(() => {
        if (bodyRef.current && onLoad &&
            frontLeftJointRef.current &&
            frontRightJointRef.current &&
            rearLeftJointRef.current &&
            rearRightJointRef.current) {
            onLoad(bodyRef, jointRefs);
        }
    });

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
            {/* Front left wheel */}
            <WheelJoint
                body={bodyRef}
                wheel={wheelRefs.current[0]}
                bodyAnchor={jointPositions[0]}
                wheelAnchor={[0, 0, 0]}
                rotationAxis={[0, 0, 1]}
                jointRef={frontLeftJointRef}
            />
            {/* Front right wheel */}
            <WheelJoint
                body={bodyRef}
                wheel={wheelRefs.current[1]}
                bodyAnchor={jointPositions[1]}
                wheelAnchor={[0, 0, 0]}
                rotationAxis={[0, 0, 1]}
                jointRef={frontRightJointRef}
            />
            {/* Rear left wheel */}
            <WheelJoint
                body={bodyRef}
                wheel={wheelRefs.current[2]}
                bodyAnchor={jointPositions[2]}
                wheelAnchor={[0, 0, 0]}
                rotationAxis={[0, 0, 1]}
                jointRef={rearLeftJointRef}
            />
            {/* Rear right wheel */}
            <WheelJoint
                body={bodyRef}
                wheel={wheelRefs.current[3]}
                bodyAnchor={jointPositions[3]}
                wheelAnchor={[0, 0, 0]}
                rotationAxis={[0, 0, 1]}
                jointRef={rearRightJointRef}
            />
        </group>
    );
};

export default Car;