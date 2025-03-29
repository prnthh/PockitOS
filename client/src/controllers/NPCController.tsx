import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import useGameStore, { ThingEntity } from "../store/gameStore";
import { useShallow } from "zustand/react/shallow";
import { ExtractState } from "zustand";
import { NpcEntity } from "../store/gameStore";
import { useRapier } from "@react-three/rapier";
import { Vector3 } from "three";

// Possible NPC goals
export type NPCGoal = "idle" | "wander";

// Possible NPC actions

interface NPCControllerProps {
    id: string;
    setAnimation: (animation: string) => void;
    isMoving: boolean;
    targetReached: boolean;
}

type NPCState = ExtractState<typeof useGameStore>

export default function NPCController({
    id,
    setAnimation,
    isMoving,
    targetReached,
}: NPCControllerProps) {
    const { updateEntity, findNearestEntity, removeEntity } = useGameStore();
    const person = useGameStore(
        useShallow((state) => {
            const entity = state.entities[id];
            // Type guard to ensure we have an NpcEntity
            return entity && entity.type === "npc" ? entity as NpcEntity : undefined;
        })
    );
    const waitTimeRef = useRef(0); // Time remaining for "wait" state
    const goalChangeCooldownRef = useRef(0); // Cooldown before changing goals

    const { world } = useRapier();

    // Initialize goal if none exists
    useEffect(() => {
        if (!person?.currentGoal) {
            updateEntity(id, { currentGoal: "wander" });
        }
    }, [id, person?.currentGoal]);

    // Handle target reached event
    useEffect(() => {
        if (targetReached && person?.currentAction?.startsWith('walk-')) {
            updateEntity(id, { currentAction: undefined });
            waitTimeRef.current = 3; // Wait 3 seconds
        }
    }, [targetReached, person?.currentAction]);

    const requestNextAction = () => {
        if (!person) return;

        switch (person.currentGoal) {
            case "wander":
                if (!person.currentAction) {
                    // Set a new random target when idle
                    const randomTarget: [number, number, number] = [
                        person.position[0] + (Math.random() * 20 - 10),
                        0,
                        person.position[2] + (Math.random() * 20 - 10),
                    ];
                    const walkAction = `walk-${JSON.stringify(randomTarget)}`;
                    updateEntity(id, { currentAction: walkAction });
                } else if (person.currentAction === "wait" && waitTimeRef.current <= 0) {
                    // Wait time over, return to idle and possibly change goal
                    updateEntity(id, { currentAction: "idle" });
                    if (goalChangeCooldownRef.current <= 0 && Math.random() > 0.7) {
                        const goals: NPCGoal[] = ["idle", "wander"];
                        const newGoal = goals[Math.floor(Math.random() * goals.length)];
                        updateEntity(id, { currentGoal: newGoal });
                        goalChangeCooldownRef.current = 10 + Math.random() * 10; // 10-20s cooldown
                    }
                }
                break;

            case "burgerseek":
                if (!person.currentAction && waitTimeRef.current <= 0) {
                    const nearestBurger = findNearestEntity(
                        person.position,
                        "thing",
                        (entity) => entity.type == "thing" && entity.name === "burger"
                    );

                    if (nearestBurger) {
                        updateEntity(id, { currentAction: "approachBurger" });
                    }
                    console.log("nearestBurger", nearestBurger);
                    waitTimeRef.current = 3; // Wait 3 seconds
                } else if (person.currentAction === "approachBurger") {
                    // Wait time over, return to idle and possibly change goal
                    console.log("waitTimeRef", waitTimeRef.current);
                    const nearestBurger = findNearestEntity(
                        person.position,
                        "thing",
                        (entity) => entity.type == "thing" && entity.name === "burger"
                    ) as ThingEntity;

                    const burgerPosition = nearestBurger.rigidbodyhandle && world.getRigidBody(nearestBurger.rigidbodyhandle).translation();

                    const personPosition = person.rigidbodyhandle && world.getRigidBody(person.rigidbodyhandle).translation();

                    if (burgerPosition && personPosition) {
                        const distance = new Vector3(burgerPosition.x, burgerPosition.y, burgerPosition.z).distanceTo(
                            new Vector3(personPosition.x, personPosition.y, personPosition.z)
                        );
                        console.log("distance", distance);
                        if (distance < 1) {
                            removeEntity(nearestBurger.id);
                            updateEntity(id, { currentAction: "wait" });
                        }
                        updateEntity(id, { currentAction: "walk-" + JSON.stringify([burgerPosition.x, burgerPosition.y, burgerPosition.z]) });
                    } else waitTimeRef.current = 3; // Wait 3 seconds
                }

                break;
            case "idle":
                if (!person.currentAction?.startsWith('recover')) {
                    updateEntity(id, { currentAction: "idle" });
                } else if (goalChangeCooldownRef.current <= 0 && Math.random() > 0.5) {
                    // 50% chance to switch to wander after cooldown
                    updateEntity(id, { currentGoal: "wander" });
                    goalChangeCooldownRef.current = 10 + Math.random() * 10; // 10-20s cooldown
                }
                break;

            default:
                updateEntity(id, { currentGoal: "idle" });
                break;
        }
    };

    // State machine logic using frame updates
    useFrame((state, delta) => {
        // Update timers
        if (waitTimeRef.current > 0) {
            waitTimeRef.current = Math.max(0, waitTimeRef.current - delta);
        }
        if (goalChangeCooldownRef.current > 0) {
            goalChangeCooldownRef.current = Math.max(0, goalChangeCooldownRef.current - delta);
        }

        requestNextAction();
    });

    // Sync animation with current action (handled by usePhysicsWalk for "walk"/"run")
    useEffect(() => {
        if (!person) return;
        if (person.currentAction === "idle" || person.currentAction === "wait" || person.currentAction === "recover") {
            setAnimation(person.currentAction === "recover" ? "recover" : "idle");
        }
        // "walk" and "run" animations are set by usePhysicsWalk based on speed
    }, [person?.currentAction, setAnimation]);

    return null;
}