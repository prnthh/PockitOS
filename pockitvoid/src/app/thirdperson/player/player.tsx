import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { Vector3, Quaternion } from "three";
import * as THREE from "three";
import AnimatedModel from "@/shared/animatedModel";
import { useControlScheme } from "@/shared/ControlsProvider";

type AnimationState = "idle" | "walk" | "run" | "jump";

const WALK_SPEED = 1;
const RUN_SPEED = 3;
const ROTATION_SPEED = 0.02;
const JUMP_FORCE = 10001;

export const CharacterController = () => {

    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const [animation, setAnimation] = useState<AnimationState>("idle");
    const { scheme } = useControlScheme();
    const currentAngle = useRef(0);
    const [, get] = useKeyboardControls();
    const isClicking = useRef(false);
    const isGrounded = useRef(true); // Track if character is on ground

    // Mouse/touch controls for simple scheme
    useEffect(() => {
        const handleDown = () => (isClicking.current = true);
        const handleUp = () => (isClicking.current = false);

        if (scheme === "simple") {
            document.addEventListener("mousedown", handleDown);
            document.addEventListener("mouseup", handleUp);
            document.addEventListener("touchstart", handleDown);
            document.addEventListener("touchend", handleUp);
        }
        return () => {
            document.removeEventListener("mousedown", handleDown);
            document.removeEventListener("mouseup", handleUp);
            document.removeEventListener("touchstart", handleDown);
            document.removeEventListener("touchend", handleUp);
        };
    }, [scheme]);

    useFrame(({ mouse }) => {
        if (!rigidBodyRef.current) return;

        const vel = rigidBodyRef.current.linvel();
        const input = get();
        let rotationDelta = 0;
        let moveSpeed = 0;

        // Handle rotation
        rotationDelta =
            input.left ? ROTATION_SPEED :
                input.right ? -ROTATION_SPEED :
                    scheme === "simple" && isClicking.current && Math.abs(mouse.x) > 0.1 ?
                        mouse.x * -ROTATION_SPEED * 2 : 0;

        // Handle movement
        moveSpeed =
            input.forward ? (input.run ? RUN_SPEED : WALK_SPEED) :
                input.back ? -(input.run ? RUN_SPEED : WALK_SPEED) :
                    scheme === "simple" && isClicking.current && Math.abs(mouse.y) > 0.1 ?
                        Math.abs(mouse.y) > 0.5 ? 1.6 * mouse.y * RUN_SPEED : WALK_SPEED : 0;

        // Handle jump
        if (input.jump && isGrounded.current) {
            console.log("Jumping");
            rigidBodyRef.current.setLinvel({ x: 0, y: 50, z: 0 }, true);
            isGrounded.current = false;
            setAnimation("jump");
        }

        // Apply rotation
        if (rotationDelta) {
            currentAngle.current += rotationDelta;
            rigidBodyRef.current.setRotation(
                new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), currentAngle.current),
                true
            );
        }

        // Apply movement (only horizontal)
        const forward = new Vector3(0, 0, 1).applyQuaternion(rigidBodyRef.current.rotation());
        const targetVel = new Vector3(forward.x * moveSpeed, 0, forward.z * moveSpeed);

        // Only update horizontal velocity, preserve vertical velocity during jump
        const newVel = {
            x: THREE.MathUtils.lerp(vel.x, targetVel.x, 0.2),
            y: vel.y, // Preserve the y velocity
            z: THREE.MathUtils.lerp(vel.z, targetVel.z, 0.2)
        };

        // Update animation
        if (!isGrounded.current) {
            // Keep jump animation while in air
        } else if (moveSpeed !== 0) {
            setAnimation(Math.abs(moveSpeed) >= RUN_SPEED ? "run" : "walk");
        } else {
            setAnimation("idle");
        }

        rigidBodyRef.current.setLinvel(newVel, true);

        // Improved ground check
        isGrounded.current = Math.abs(vel.y) < 0.1;
    });


    return (
        <RigidBody
            ref={rigidBodyRef}
            colliders={false}
            enabledRotations={[false, true, false]}
            angularDamping={5.0}
            userData={{ type: "player" }}
            position={[0, 2, 0]}
            mass={0.01}
        >
            <AnimatedModel
                model="/models/rigga.glb"
                animation={animation}
                height={0.4}
            />
            <CapsuleCollider args={[0.3, 0.15]} />
        </RigidBody>
    );
};