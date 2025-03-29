import { useShallow } from "zustand/react/shallow";
import useGameStore, { NpcEntity } from "../../../store/gameStore";
import { useEffect } from "react";
import { NPCUtils } from "../NPCController";

// Wander Goal Component
function WanderGoal({ id, setAnimation }: { id: string; setAnimation: (animation: string) => void }) {
    const { updateEntity } = useGameStore();
    const person = useGameStore(useShallow((state) => state.entities[id] as NpcEntity));

    useEffect(() => {
        if (!person) return;
        if (!person.currentAction) {
            const target = NPCUtils.getRandomTarget(person.position);
            updateEntity(id, { currentAction: `walk-${JSON.stringify(target)}` });
        } else if (person.currentAction === "wait") {
            setAnimation("idle");
        }
    }, [id, person, updateEntity, setAnimation]);

    return null;
}

export default WanderGoal;