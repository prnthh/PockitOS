import { useEffect, useState } from "react";
import useGameStore, { NpcEntity, ThingEntity } from "../../store/gameStore";
import { useShallow } from "zustand/react/shallow";
import { useRapier } from "@react-three/rapier";
import { Vector3 } from "three";
import WanderGoal from "./behaviors/wanderGoal";
import BurgerSeekGoal from "./behaviors/burgerseekGoal";
import IdleGoal from "./behaviors/idleGoal";

// Types
export type NPCGoal = "idle" | "wander" | "burgerseek";

interface NPCControllerProps {
    id: string;
    setAnimation: (animation: string) => void;
    isMoving: boolean;
    targetReached: boolean;
}

// Utility Component
export const NPCUtils = {
    getRandomTarget: (position: [number, number, number]): [number, number, number] => [
        position[0] + (Math.random() * 20 - 10),
        0,
        position[2] + (Math.random() * 20 - 10),
    ],
    getDistance: (pos1: Vector3, pos2: Vector3): number => pos1.distanceTo(pos2),
    getBodyPosition: (world: any, handle?: number) =>
        world.getRigidBody(handle) ? new Vector3().copy(world.getRigidBody(handle)?.translation()) : undefined,
};

// Core Controller Component
function NPCControllerCore({ id, setAnimation, targetReached }: NPCControllerProps) {
    const { updateEntity } = useGameStore();
    const person = useGameStore(useShallow((state) => {
        const entity = state.entities[id];
        return entity?.type === "npc" ? (entity as NpcEntity) : undefined;
    }));

    useEffect(() => {
        if (!person?.currentGoal) {
            updateEntity(id, { currentGoal: "wander" });
        }
    }, [id, person?.currentGoal, updateEntity]);

    return (
        <>
            <NPCTimer id={id} targetReached={targetReached} />
            {person?.currentGoal === "wander" && <WanderGoal id={id} setAnimation={setAnimation} />}
            {person?.currentGoal === "burgerseek" && <BurgerSeekGoal id={id} setAnimation={setAnimation} />}
            {person?.currentGoal === "idle" && <IdleGoal id={id} setAnimation={setAnimation} />}        </>
    );
}

// Timer Management Component
function NPCTimer({ id, targetReached }: { id: string; targetReached: boolean }) {
    const { updateEntity } = useGameStore();
    const person = useGameStore(useShallow((state) => state.entities[id] as NpcEntity));
    const [waitTime, setWaitTime] = useState(0);
    const [goalChangeCooldown, setGoalChangeCooldown] = useState(0);

    useEffect(() => {
        if (targetReached && person?.currentAction?.startsWith("walk-")) {
            updateEntity(id, { currentAction: undefined });
            setWaitTime(3); // Wait after reaching a walk target
        } else if (person?.currentAction === "wait") {
            setWaitTime(3); // Set wait time for "wait" action
        }
    }, [targetReached, person?.currentAction, id, updateEntity]);

    useEffect(() => {
        if (waitTime > 0 || goalChangeCooldown > 0) {
            const interval = setInterval(() => {
                setWaitTime((prev) => {
                    const newTime = Math.max(0, prev - 0.016);
                    if (newTime === 0 && person?.currentAction === "wait") {
                        updateEntity(id, { currentAction: undefined }); // Clear "wait" when time expires
                    }
                    return newTime;
                });
                setGoalChangeCooldown((prev) => Math.max(0, prev - 0.016));
            }, 16);
            return () => clearInterval(interval);
        }
    }, [waitTime, goalChangeCooldown, person?.currentAction, id, updateEntity]);

    return null;
}

export default NPCControllerCore;