import { useRapier } from "@react-three/rapier";
import useGameStore, { NpcEntity, ThingEntity } from "../../../store/gameStore";
import { useShallow } from "zustand/react/shallow";
import { useEffect } from "react";
import { NPCUtils } from "../NPCController";
import { Vector3 } from "three";

// Burger Seek Goal Component
function BurgerSeekGoal({ id, setAnimation }: { id: string; setAnimation: (animation: string) => void }) {
    const { updateEntity, findNearestEntity, addToInventory, removeFromInventory } = useGameStore();
    const { world } = useRapier();
    const person = useGameStore(useShallow((state) => state.entities[id] as NpcEntity));

    // Define stash location - this could be a fixed point or dynamic
    const stashLocation = { x: 5, y: 0, z: 5 }; // Example fixed stash point

    const findNearestBurger = () =>
        findNearestEntity(
            person!.position,
            "thing",
            (entity) => entity.type === "thing" && entity.name === "burger"
        ) as ThingEntity | undefined;

    // Check if the NPC has a burger in inventory
    const hasBurgerInInventory = () => {
        return person?.inventory?.some(item => {
            return item && item.type === "thing" && item.name === "burger";
        });
    };

    useEffect(() => {
        if (!person) return;

        // No action - decide what to do
        if (!person.currentAction) {
            console.log("No action - deciding what to do", hasBurgerInInventory());
            if (hasBurgerInInventory()) {
                // If already has a burger, go stash it
                updateEntity(id, { currentAction: "putInStash" });
                setAnimation("walk");
            } else {
                // Look for a burger to pick up
                const nearestBurger = findNearestBurger();
                console.log("Nearest burger:", nearestBurger);
                if (nearestBurger) {
                    updateEntity(id, { currentAction: "approachBurger" });
                    setAnimation("walk");
                } else {
                    updateEntity(id, { currentAction: "wait" });
                    setAnimation("idle");
                }
            }
        }
        // Approaching burger
        else if (person.currentAction === "approachBurger") {
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
                    // After picking up burger, go to stash
                    addToInventory(id, burger.id);
                    updateEntity(id, { currentAction: "putInStash" });
                    setAnimation("walk");
                    console.log("Picked up burger:", burger.id);
                } else {
                    updateEntity(id, { currentAction: `walk-${JSON.stringify([burgerPos.x, burgerPos.y, burgerPos.z])}` });
                    setAnimation("walk");
                }
            }
        }
        // Going to stash location
        else if (person.currentAction === "putInStash") {
            const personPos = NPCUtils.getBodyPosition(world, person.rigidbodyhandle);

            if (personPos) {
                const distance = NPCUtils.getDistance(
                    new Vector3(personPos.x, personPos.y, personPos.z),
                    new Vector3(stashLocation.x, stashLocation.y, stashLocation.z),
                );

                if (distance < 1) {
                    // At stash location - remove burger from inventory
                    const burger = person.inventory?.find(item => {
                        return item && item.type === "thing" && item.name === "burger";
                    });

                    if (burger) {
                        removeFromInventory(id, burger.id, [stashLocation.x, stashLocation.y, stashLocation.z]);
                    }

                    // Reset state to look for more burgers
                    updateEntity(id, { currentAction: undefined });
                    setAnimation("idle");
                } else {
                    // Keep walking to stash
                    updateEntity(id, {
                        currentAction: `walk-${JSON.stringify([stashLocation.x, stashLocation.y, stashLocation.z])}`
                    });
                    setAnimation("walk");
                }
            }
        }
        // Waiting state
        else if (person.currentAction === "wait") {
            setAnimation("idle");
        }
    }, [id, person?.currentAction]);

    return null;
}

export default BurgerSeekGoal;