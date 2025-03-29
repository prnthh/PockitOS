import useGameStore, { NpcEntity } from "../../../store/gameStore";
import { useShallow } from "zustand/react/shallow";
import { useEffect } from "react";

// Idle Goal Component
function IdleGoal({ id, setAnimation }: { id: string; setAnimation: (animation: string) => void }) {
    const { updateEntity } = useGameStore();
    const person = useGameStore(useShallow((state) => state.entities[id] as NpcEntity));

    useEffect(() => {
        if (!person) return;
        if (!person.currentAction?.startsWith("recover")) {
            updateEntity(id, { currentAction: "idle" });
            setAnimation("idle");
        } else if (person.currentAction?.startsWith("recover")) {
            setAnimation("recover");
        }
    }, [id, person, updateEntity, setAnimation]);

    return null;
}

export default IdleGoal;
