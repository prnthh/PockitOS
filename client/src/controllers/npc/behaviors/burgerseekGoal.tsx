import { useRapier } from "@react-three/rapier";
import useGameStore, { NpcEntity, ThingEntity } from "../../../store/gameStore";
import { useShallow } from "zustand/react/shallow";
import { useEffect } from "react";
import { NPCUtils } from "../NPCController";

// Burger Seek Goal Component
function BurgerSeekGoal({ id, setAnimation }: { id: string; setAnimation: (animation: string) => void }) {
    const { updateEntity, findNearestEntity, removeEntity } = useGameStore();
    const { world } = useRapier();
    const person = useGameStore(useShallow((state) => state.entities[id] as NpcEntity));

    const findNearestBurger = () =>
        findNearestEntity(
            person!.position,
            "thing",
            (entity) => entity.type === "thing" && entity.name === "burger"
        ) as ThingEntity | undefined;

    useEffect(() => {
        if (!person) return;

        if (!person.currentAction) {
            const nearestBurger = findNearestBurger();
            if (nearestBurger) {
                updateEntity(id, { currentAction: "approachBurger" });
                setAnimation("walk"); // Ensure animation updates when starting to approach
            } else {
                updateEntity(id, { currentAction: "wait" });
                setAnimation("idle");
            }
        } else if (person.currentAction === "approachBurger") {
            const burger = findNearestBurger();
            if (!burger) {
                updateEntity(id, { currentAction: "wait" });
                setAnimation("idle");
                return;
            }

            const burgerPos = NPCUtils.getBodyPosition(world, burger.rigidbodyhandle);
            const personPos = NPCUtils.getBodyPosition(world, person.rigidbodyhandle);

            if (burgerPos && personPos) {
                const distance = NPCUtils.getDistance(burgerPos, personPos);
                if (distance < 1) {
                    removeEntity(burger.id);
                    updateEntity(id, { currentAction: "wait" });
                    setAnimation("idle");
                } else {
                    updateEntity(id, { currentAction: `walk-${JSON.stringify([burgerPos.x, burgerPos.y, burgerPos.z])}` });
                    setAnimation("walk"); // Ensure walking animation is set
                }
            }
        } else if (person.currentAction === "wait") {
            setAnimation("idle");
        }
    }, [id, person, updateEntity, removeEntity, setAnimation, world]);

    return null;
}

export default BurgerSeekGoal;