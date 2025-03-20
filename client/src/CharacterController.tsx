import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { MathUtils, Vector3 } from "three";
import { Group } from 'three';
import { Entity } from "./ecs/state";

const normalizeAngle = (angle: number): number => {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
};

const lerpAngle = (start: number, end: number, t: number): number => {
    start = normalizeAngle(start);
    end = normalizeAngle(end);

    if (Math.abs(end - start) > Math.PI) {
        if (end > start) {
            start += 2 * Math.PI;
        } else {
            end += 2 * Math.PI;
        }
    }

    return normalizeAngle(start + (end - start) * t);
};

type AnimationState = 'idle' | 'walk' | 'run';

const { WALK_SPEED, RUN_SPEED, ROTATION_SPEED } = {
    WALK_SPEED: 0.6,
    RUN_SPEED: 2,
    ROTATION_SPEED: 0.02,
};

interface CharacterControllerProps {
    player: Entity;
    followCam: boolean;
}

export const CharacterController: React.FC<CharacterControllerProps> = ({ player, followCam }) => {
    const rb = useRef<RapierRigidBody>(null);
    const container = useRef<Group>(null);
    const character = useRef<Group>(null);
    // Add new camera refs
    const cameraTarget = useRef<Group>(null);
    const cameraPosition = useRef<Group>(null);
    const cameraWorldPosition = useRef(new Vector3());
    const cameraLookAtWorldPosition = useRef(new Vector3());
    const cameraLookAt = useRef(new Vector3());

    const [animation, setAnimation] = useState<AnimationState>("idle");

    const characterRotationTarget = useRef<number>(0);
    const rotationTarget = useRef<number>(0);
    const [, get] = useKeyboardControls();
    const isClicking = useRef<boolean>(false);

    useEffect(() => {
        const onMouseDown = (e: MouseEvent | TouchEvent): void => {
            isClicking.current = true;
        };
        const onMouseUp = (e: MouseEvent | TouchEvent): void => {
            isClicking.current = false;
        };
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mouseup", onMouseUp);
        // touch
        document.addEventListener("touchstart", onMouseDown);
        document.addEventListener("touchend", onMouseUp);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("mouseup", onMouseUp);
            document.removeEventListener("touchstart", onMouseDown);
            document.removeEventListener("touchend", onMouseUp);
        };
    }, []);

    useFrame(({ camera, mouse }) => {
        if (rb.current) {
            const vel = rb.current.linvel();

            const movement = {
                x: 0,
                z: 0,
            };

            if (get().forward) {
                movement.z = 1;
            }
            if (get().back) {
                movement.z = -1;
            }

            let speed = get().run ? RUN_SPEED : WALK_SPEED;

            if (isClicking.current && followCam) {
                // console.log("clicking", mouse.x, mouse.y);
                if (Math.abs(mouse.x) > 0.1) {
                    movement.x = -mouse.x;
                }
                movement.z = mouse.y + 0.4;
                if (Math.abs(movement.x) > 0.5 || Math.abs(movement.z) > 0.5) {
                    speed = RUN_SPEED;
                }
            }

            if (get().left) {
                movement.x = 1;
            }
            if (get().right) {
                movement.x = -1;
            }

            if (movement.x !== 0) {
                rotationTarget.current += ROTATION_SPEED * movement.x;
            }

            if (movement.x !== 0 || movement.z !== 0) {
                characterRotationTarget.current = Math.atan2(movement.x, movement.z);
                vel.x =
                    Math.sin(rotationTarget.current + characterRotationTarget.current) *
                    speed;
                vel.z =
                    Math.cos(rotationTarget.current + characterRotationTarget.current) *
                    speed;
                if (speed === RUN_SPEED) {
                    setAnimation("run");
                } else {
                    setAnimation("walk");
                }
            } else {
                setAnimation("idle");
            }

            if (!character.current) return;
            character.current.rotation.y = lerpAngle(
                character.current.rotation.y,
                characterRotationTarget.current,
                0.1
            );

            rb.current.setLinvel(vel, true);

            // Update player position in ECS
            if (player && rb.current) {
                const position = rb.current.translation();
                player.position.x = position.x;
                player.position.y = position.y;
                player.position.z = position.z;
            }
        }

        // Update camera
        if (!container.current) return;
        container.current.rotation.y = MathUtils.lerp(
            container.current.rotation.y,
            rotationTarget.current,
            0.1
        );

        if (followCam) {
            if (cameraPosition.current) {
                cameraPosition.current.getWorldPosition(cameraWorldPosition.current);
                camera.position.lerp(cameraWorldPosition.current, 0.1);
            }

            if (cameraTarget.current) {
                cameraTarget.current.getWorldPosition(cameraLookAtWorldPosition.current);
                cameraLookAt.current.lerp(cameraLookAtWorldPosition.current, 0.1);
                camera.lookAt(cameraLookAt.current);
            }
        }
    });

    return (
        <RigidBody colliders={false} lockRotations ref={rb}>
            <group ref={container}>
                <group ref={cameraTarget} position-z={1.5} />
                <group ref={cameraPosition} position-y={4} position-z={-4} />
                <group ref={character}>
                    <mesh position={[0, 0.5, 0]}>
                        <sphereGeometry args={[0.2, 4, 2]} />
                        <meshStandardMaterial color="hotpink" />
                    </mesh>
                    <mesh>
                        <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
                        <meshStandardMaterial color="blue" />
                    </mesh>
                </group>
            </group>
            <CapsuleCollider args={[0.08, 0.15]} />
        </RigidBody>
    );
};