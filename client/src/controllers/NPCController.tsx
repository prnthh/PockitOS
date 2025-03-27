import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RapierRigidBody } from "@react-three/rapier";
import { selectPersonById } from "../store/personSelectors";
import { RootState } from "../store/store";
import { addToInventory, setCurrentAction, setCurrentGoal } from "../store/PersonSlice";

// Possible NPC goals
export type NPCGoal =
    | "idle"
    | "wander"
    | "interactWithPlayer"
    | "takeItem"
    | "moveItem"
    | "interactWithNPC"
    | "followPath";

// Possible NPC actions
export type NPCAction =
    | "idle"
    | "walk"
    | "run"
    | "talk"
    | "pickup"
    | "use"
    | "give"
    | "wait"
    | "recover";

interface NPCControllerProps {
    id: string;
    rigidBodyRef: React.RefObject<RapierRigidBody | null>;
    setAnimation: (animation: string) => void;
    setTarget: (target: number[] | undefined) => void;
}

export default function NPCController({
    id,
    rigidBodyRef,
    setAnimation,
    setTarget,
}: NPCControllerProps) {
    const person = useSelector((state: RootState) => selectPersonById(state, id));
    const dispatch = useDispatch();
    const goalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const interactionCooldownRef = useRef<boolean>(false);

    // Goal management
    useEffect(() => {
        // Initialize goal if none exists
        if (!person.currentGoal) {
            dispatch(setCurrentGoal({ id, goal: "wander" }));
        }

        return () => {
            if (goalTimeoutRef.current) {
                clearTimeout(goalTimeoutRef.current);
            }
        };
    }, [dispatch, id, person.currentGoal]);

    // Memoize handler functions
    const handleWander = useCallback(() => {
        if (person.currentAction === "wait" || person.currentAction === "recover") {
            return;
        }

        if (person.currentAction !== "walk" && person.currentAction !== "run") {
            // Set random position within a reasonable distance
            const randomPosition: [number, number, number] = [
                Math.random() * 20 - 10,
                0,
                Math.random() * 20 - 10
            ];

            setTarget(randomPosition);
            dispatch(setCurrentAction({ id, action: "walk" }));

            // After walking for a while, wait
            goalTimeoutRef.current = setTimeout(() => {
                dispatch(setCurrentAction({ id, action: "wait" }));
                setTarget(undefined);

                // After waiting, go back to wandering
                goalTimeoutRef.current = setTimeout(() => {
                    dispatch(setCurrentAction({ id, action: "idle" }));

                    // Occasionally change to a different goal
                    if (Math.random() > 0.7 && !interactionCooldownRef.current) {
                        const goals: NPCGoal[] = ["idle", "wander", "interactWithNPC"];
                        const randomGoal = goals[Math.floor(Math.random() * goals.length)];
                        dispatch(setCurrentGoal({ id, goal: randomGoal }));
                    }
                }, 3000 + Math.random() * 3000);
            }, 5000 + Math.random() * 5000);
        }
    }, [id, dispatch, setTarget, person.currentAction]);

    const handleInteractWithPlayer = useCallback(() => {
        if (interactionCooldownRef.current) return;

        // Logic for finding and approaching the player would go here
        dispatch(setCurrentAction({ id, action: "talk" }));
        setAnimation("idle"); // Could use a talk animation if available

        goalTimeoutRef.current = setTimeout(() => {
            dispatch(setCurrentAction({ id, action: "idle" }));
            dispatch(setCurrentGoal({ id, goal: "wander" }));

            // Set cooldown to prevent immediate re-interaction
            interactionCooldownRef.current = true;
            setTimeout(() => {
                interactionCooldownRef.current = false;
            }, 10000);
        }, 3000);
    }, [id, dispatch, setAnimation]);

    const handleInteractWithItem = useCallback(() => {
        if (interactionCooldownRef.current) {
            dispatch(setCurrentGoal({ id, goal: "wander" }));
            return;
        }

        // Logic to find nearest item would go here
        // For now, just pretend to look for something nearby
        dispatch(setCurrentAction({ id, action: "walk" }));

        // Set a random nearby position
        const randomNearbyPos: [number, number, number] = [
            person.position[0] + (Math.random() * 6 - 3),
            0,
            person.position[2] + (Math.random() * 6 - 3)
        ];
        setTarget(randomNearbyPos);

        goalTimeoutRef.current = setTimeout(() => {
            setTarget(undefined);
            dispatch(setCurrentAction({ id, action: "pickup" }));
            setAnimation("idle"); // Could use a pickup animation
            dispatch(addToInventory({ id, item: "item" }));

            goalTimeoutRef.current = setTimeout(() => {
                dispatch(setCurrentAction({ id, action: "idle" }));
                dispatch(setCurrentGoal({ id, goal: "wander" }));

                interactionCooldownRef.current = true;
                setTimeout(() => {
                    interactionCooldownRef.current = false;
                }, 10000);
            }, 2000);
        }, 3000);
    }, [id, dispatch, setTarget, setAnimation, person.position]);

    const handleInteractWithNPC = useCallback(() => {
        if (interactionCooldownRef.current) {
            dispatch(setCurrentGoal({ id, goal: "wander" }));
            return;
        }

        // Logic to find another NPC would go here
        // For now, just pretend to look for someone
        dispatch(setCurrentAction({ id, action: "walk" }));

        // Set a random position that might contain another NPC
        const randomPos: [number, number, number] = [
            Math.random() * 10 - 5,
            0,
            Math.random() * 10 - 5
        ];
        setTarget(randomPos);

        goalTimeoutRef.current = setTimeout(() => {
            setTarget(undefined);
            dispatch(setCurrentAction({ id, action: "talk" }));
            setAnimation("idle"); // Could use a talk animation

            goalTimeoutRef.current = setTimeout(() => {
                dispatch(setCurrentAction({ id, action: "idle" }));
                dispatch(setCurrentGoal({ id, goal: "wander" }));

                interactionCooldownRef.current = true;
                setTimeout(() => {
                    interactionCooldownRef.current = false;
                }, 15000);
            }, 3000);
        }, 4000);
    }, [id, dispatch, setTarget, setAnimation]);

    const handleFollowPath = useCallback(() => {
        // Logic for following waypoints would go here
        // For now, just wander
        dispatch(setCurrentGoal({ id, goal: "wander" }));
    }, [id, dispatch]);

    // Handle different goals
    useEffect(() => {
        if (!rigidBodyRef.current || !person.currentGoal) return;

        console.log("Handling goal", person.currentGoal);


        switch (person.currentGoal) {
            case "wander":
                handleWander();
                break;
            case "interactWithPlayer":
                handleInteractWithPlayer();
                break;
            case "takeItem":
                handleInteractWithItem();
                break;
            case "interactWithNPC":
                handleInteractWithNPC();
                break;
            case "followPath":
                handleFollowPath();
                break;
            case "idle":
            default:
                if (person.currentAction !== "idle") {
                    dispatch(setCurrentAction({ id, action: "idle" }));
                    setAnimation("idle");
                }
                break;
        }
    }, [
        person.currentGoal,
        dispatch,
        id,
        handleWander,
        handleInteractWithPlayer,
        handleInteractWithItem,
        handleInteractWithNPC,
        handleFollowPath,
        rigidBodyRef,
        setAnimation,
        person.currentAction
    ]);

    return null; // This component doesn't render anything
}
