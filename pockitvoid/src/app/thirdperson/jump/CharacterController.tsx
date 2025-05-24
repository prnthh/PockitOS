import { Box, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RapierRigidBody, RigidBody, useRapier } from "@react-three/rapier";
import { useEffect, useRef, useState, MutableRefObject } from "react";
import { MathUtils, Vector3, Group, PerspectiveCamera, Euler, Quaternion } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import AnimatedModel from "@/shared/animatedModel";
import * as THREE from "three";

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

export const CharacterController = () => {
    const WALK_SPEED = 2, RUN_SPEED = 4, JUMP_FORCE = 5.5;

    const height = 0.95
    const roundHeight = 0.25

    const { rapier, world } = useRapier();
    const rb = useRef<RapierRigidBody | null>(null);
    const container = useRef<Group>(null);
    const character = useRef<Group>(null);
    const characterRotationTarget = useRef<number>(0);
    const rotationTarget = useRef<number>(0);
    const verticalRotation = useRef<number>(0); // Add this line
    const cameraTarget = useRef<Group>(null);
    const cameraPosition = useRef<Group>(null);
    const cameraWorldPosition = useRef<Vector3>(new Vector3());
    const cameraLookAtWorldPosition = useRef<Vector3>(new Vector3());
    const cameraLookAt = useRef<Vector3>(new Vector3());
    const [, get] = useKeyboardControls();
    const isPointerLocked = useRef<boolean>(false);
    const lastMouseX = useRef<number | null>(null);
    const [animation, setAnimation] = useState<"idle" | "walk" | "run" | "jump">("idle");
    const [shoulderCamMode, setShoulderCamMode] = useState(false);
    const [canJump, setCanJump] = useState(true); // Add canJump state

    useEffect(() => {
        const onMouseDown = (e: MouseEvent | TouchEvent) => {
            if (e instanceof MouseEvent && e.target instanceof HTMLElement) {
                e.target.requestPointerLock?.();
            }
        };
        const onMouseMove = (e: MouseEvent) => {
            if (!isPointerLocked.current) return;
            const deltaX = e.movementX;
            const deltaY = e.movementY;
            rotationTarget.current -= deltaX * 0.005;
            // Clamp vertical rotation between -85 and 85 degrees
            verticalRotation.current = MathUtils.clamp(
                verticalRotation.current + deltaY * 0.005,
                degToRad(-85),
                degToRad(85)
            );
        };
        const onPointerLockChange = () => {
            isPointerLocked.current = document.pointerLockElement !== null;
            if (!isPointerLocked.current) lastMouseX.current = null;
        };
        const onMouseButtonChange = (e: MouseEvent) => {
            if (e.button === 2) { // Right mouse button
                setShoulderCamMode(e.type === 'mousedown');
            }
        };

        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("pointerlockchange", onPointerLockChange);
        document.addEventListener("touchstart", onMouseDown);
        document.addEventListener("mousedown", onMouseButtonChange);
        document.addEventListener("mouseup", onMouseButtonChange);
        // Prevent context menu from appearing on right click
        document.addEventListener("contextmenu", (e) => e.preventDefault());

        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("pointerlockchange", onPointerLockChange);
            document.removeEventListener("touchstart", onMouseDown);
            document.removeEventListener("mousedown", onMouseButtonChange);
            document.removeEventListener("mouseup", onMouseButtonChange);
            document.removeEventListener("contextmenu", (e) => e.preventDefault());
        };
    }, []);

    // Ground check and jump logic using raycast
    const jump = () => {
        if (!rb.current || !rapier) return;
        rb.current.wakeUp && rb.current.wakeUp();

        // Use new Rapier Ray syntax (origin and direction as plain objects)
        const origin = rb.current.translation();
        const rayOrigin = { x: origin.x, y: origin.y - (height / 2) - 0.01, z: origin.z };
        const direction = { x: 0, y: -1, z: 0 };
        const ray = new rapier.Ray(rayOrigin, direction);
        const maxToi = 0.3;
        const solid = true;
        const hit = world.castRay(ray, maxToi, solid);

        // Only jump if something is close below and vertical velocity is near zero
        const vel = rb.current.linvel();
        if (hit && hit.timeOfImpact < 0.15 && Math.abs(vel.y) < 0.2) {
            // Set the velocity directly, just like x/z movement
            rb.current.setLinvel({
                x: vel.x,
                y: JUMP_FORCE,
                z: vel.z
            }, true);
            setCanJump(false);
        }
    };

    useEffect(() => {
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                setCanJump(true);
            }
        };
        window.addEventListener("keyup", handleKeyUp);
        return () => window.removeEventListener("keyup", handleKeyUp);
    }, []);

    useFrame(({ camera }) => {
        if (rb.current) {
            const vel = rb.current.linvel();

            let moveX = 0, moveZ = 0;

            // Handle movement
            if (get().forward) moveZ += 1;
            if (get().backward) moveZ -= 1;
            if (get().left) moveX += 1;
            if (get().right) moveX -= 1;

            // Use raycast-based jump
            if (get().jump && canJump) {
                jump();
            }

            const speed = get().run ? RUN_SPEED : WALK_SPEED;
            if (moveX !== 0 || moveZ !== 0) {
                const dir = new Vector3(moveX, 0, moveZ).normalize();
                dir.applyAxisAngle(new Vector3(0, 1, 0), rotationTarget.current);

                // Apply movement with current Y velocity preserved
                rb.current.setLinvel({
                    x: dir.x * speed,
                    y: rb.current.linvel().y,
                    z: dir.z * speed
                }, true);

                setAnimation(speed === RUN_SPEED ? "run" : "walk");
            } else {
                rb.current.setLinvel({
                    x: 0,
                    y: rb.current.linvel().y,
                    z: 0
                }, true);
                setAnimation("idle");
            }

            // Apply rotation to the container
            if (container.current) {
                container.current.rotation.y = rotationTarget.current;
            }
        }
        if (cameraPosition.current) {
            if (shoulderCamMode) {
                // Right shoulder position
                cameraPosition.current.position.x = -0.5;
                cameraPosition.current.position.y = height + 0.3;
                cameraPosition.current.position.z = -0.5;
            } else {
                // Normal third person position
                cameraPosition.current.position.x = 0;
                cameraPosition.current.position.y = 1 + Math.sin(verticalRotation.current);
                cameraPosition.current.position.z = -1 - Math.cos(verticalRotation.current);
            }
            cameraPosition.current.getWorldPosition(cameraWorldPosition.current);
            camera.position.lerp(cameraWorldPosition.current, 0.1);
        }
        if (cameraTarget.current) {
            if (shoulderCamMode) {
                cameraTarget.current.position.x = 0;
                cameraTarget.current.position.y = height - 0.3;
                cameraTarget.current.position.z = 3;
            } else {
                cameraTarget.current.position.x = 0;
                cameraTarget.current.position.y = height * 0.8;
                cameraTarget.current.position.z = 1.5;
            }
            cameraTarget.current.getWorldPosition(cameraLookAtWorldPosition.current);
            cameraLookAt.current.lerp(cameraLookAtWorldPosition.current, 0.1);
            camera.lookAt(cameraLookAt.current);
        }
    });

    return (
        <RigidBody colliders={false} lockRotations ref={rb} position={[0, 4, 0]}>
            <group ref={container}>
                <group ref={cameraTarget} position-z={1.5} position-y={height * 0.8}>
                    <Box args={[0.1, 0.1, 0.1]}>
                        <meshBasicMaterial wireframe color="red" />
                    </Box>
                </group>
                <group ref={cameraPosition} position-y={height * 0.8} position-z={-1}>
                    <Box args={[0.1, 0.1, 0.1]}>
                        <meshBasicMaterial wireframe color="blue" />
                    </Box>
                </group>
                <group ref={character}>
                    <AnimatedModel
                        model="/models/rigga.glb"
                        animation={animation}
                        height={height}
                    />
                </group>
            </group>
            <CapsuleCollider args={[(height - (roundHeight * 1.9)) / 2, roundHeight]} position={[0, (height / 2), 0]} />
        </RigidBody>
    );
};