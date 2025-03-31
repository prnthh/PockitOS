import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { MathUtils, Vector3 } from "three";
import { Group } from 'three';
import AnimatedModel from "../gizmos/AnimatedModel";
import { useControlScheme } from "../gizmos/Controls";

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

export const CharacterController = () => {
    const rb = useRef<RapierRigidBody>(null);
    const container = useRef<Group>(null);
    const character = useRef<Group>(null);
    const cameraTarget = useRef<Group>(null);
    const cameraPosition = useRef<Group>(null);
    const cameraWorldPosition = useRef(new Vector3());
    const cameraLookAtWorldPosition = useRef(new Vector3());
    const cameraLookAt = useRef(new Vector3());

    const [animation, setAnimation] = useState<AnimationState>("idle");
    const { scheme, setScheme } = useControlScheme();
    const { gl, camera } = useThree();

    const characterRotationTarget = useRef<number>(0);
    const rotationTarget = useRef<number>(0);
    const [, get] = useKeyboardControls();
    const isClicking = useRef<boolean>(false);
    const mousePosition = useRef({ x: 0, y: 0 });
    const isFpsActive = useRef<boolean>(false);

    // Handle mouse movement for FPS mode
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (scheme === 'fps' && isFpsActive.current) {
                // Convert mouse movement to rotation
                const sensitivity = 0.002;
                rotationTarget.current -= e.movementX * sensitivity;

                // Optional: Vertical look (not affecting character movement)
                // Implement if needed
            }
        };

        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.code === 'Escape' && scheme === 'fps' && isFpsActive.current) {
                document.exitPointerLock();
                isFpsActive.current = false;
            }
        };

        if (scheme === 'fps') {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [scheme]);

    // Handle pointer lock for FPS mode
    useEffect(() => {
        const handleClick = () => {
            if (scheme === 'fps' && !isFpsActive.current) {
                gl.domElement.requestPointerLock();
                isFpsActive.current = true;
            }
        };

        const handlePointerLockChange = () => {
            isFpsActive.current = document.pointerLockElement === gl.domElement;
        };

        if (scheme === 'fps') {
            gl.domElement.addEventListener('click', handleClick);
            document.addEventListener('pointerlockchange', handlePointerLockChange);
        }

        return () => {
            gl.domElement.removeEventListener('click', handleClick);
            document.removeEventListener('pointerlockchange', handlePointerLockChange);
        };
    }, [scheme, gl]);

    useEffect(() => {
        const onMouseDown = (e: MouseEvent | TouchEvent): void => {
            if (scheme === 'simple') isClicking.current = true;
        };
        const onMouseUp = (e: MouseEvent | TouchEvent): void => {
            if (scheme === 'simple') isClicking.current = false;
        };

        if (scheme === 'simple') {
            document.addEventListener("mousedown", onMouseDown);
            document.addEventListener("mouseup", onMouseUp);
            document.addEventListener("touchstart", onMouseDown);
            document.addEventListener("touchend", onMouseUp);
        }

        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("mouseup", onMouseUp);
            document.removeEventListener("touchstart", onMouseDown);
            document.removeEventListener("touchend", onMouseUp);
        };
    }, [scheme]);

    useFrame(({ camera, mouse }) => {
        if (rb.current) {
            const vel = rb.current.linvel();

            const movement = {
                x: 0,
                z: 0,
            };

            // Skip movement in 'none' mode
            if (scheme === 'none') {
                vel.x = 0;
                vel.z = 0;
                rb.current.setLinvel(vel, true);
                return;
            }

            if (get().forward) {
                movement.z = 1;
            }
            if (get().back) {
                movement.z = -1;
            }

            let speed = get().run ? RUN_SPEED : WALK_SPEED;

            if (scheme === 'simple') {
                // Simple mode controls (original controls)
                if (isClicking.current) {
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
            } else if (scheme === 'fps') {
                // FPS mode controls (WASD relative to camera direction)
                if (get().left) {
                    movement.x = -1;
                }
                if (get().right) {
                    movement.x = 1;
                }

                // No need to update rotationTarget here as it's handled by mouse movement
            }

            if (movement.x !== 0 || movement.z !== 0) {
                if (scheme === 'simple') {
                    characterRotationTarget.current = Math.atan2(movement.x, movement.z);
                    vel.x = Math.sin(rotationTarget.current + characterRotationTarget.current) * speed;
                    vel.z = Math.cos(rotationTarget.current + characterRotationTarget.current) * speed;
                } else if (scheme === 'fps') {
                    // For FPS, calculate direction vectors based on camera rotation
                    const angle = rotationTarget.current;

                    // Calculate forward and right vectors based on camera direction
                    const forwardX = Math.sin(angle);
                    const forwardZ = Math.cos(angle);
                    const rightX = Math.sin(angle - Math.PI / 2);
                    const rightZ = Math.cos(angle - Math.PI / 2);

                    // Combine movement inputs with direction vectors
                    vel.x = (movement.x * rightX + movement.z * forwardX) * speed;
                    vel.z = (movement.x * rightZ + movement.z * forwardZ) * speed;

                    // In FPS mode, character always faces the camera direction
                    characterRotationTarget.current = 0;
                }

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
        }

        // Update camera
        if (!container.current) return;
        container.current.rotation.y = MathUtils.lerp(
            container.current.rotation.y,
            rotationTarget.current,
            0.1
        );

        if (scheme !== 'none') {
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
        <>
            <RigidBody colliders={false} lockRotations ref={rb} userData={{ type: "player" }}>
                <group ref={container}>
                    <group ref={cameraTarget} position-z={1.5} />
                    <group ref={cameraPosition} position-y={2} position-z={-3} />
                    <group ref={character}>
                        <AnimatedModel model="/remilio.glb" animation={animation} height={0.4}
                            animationOverrides={{ run: "anim/run2.fbx", idle: "anim/idle2.fbx", walk: "anim/walk2.fbx", kick: "anim/kick.fbx", punch: "anim/punch.fbx", }}
                        />
                    </group>
                </group>
                <CapsuleCollider args={[0.3, 0.15]} />
            </RigidBody>
        </>
    );
};