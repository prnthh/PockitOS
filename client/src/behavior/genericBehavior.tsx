import useGameStore from "../store/gameStore";

// In a component
const GameComponent = () => {
    const {
        timeOfDay,
        entities,
        addEntity,
        updateEntity,
        findNearestEntity,
    } = useGameStore();

    // Add an NPC
    addEntity({
        id: 'npc1',
        type: 'npc',
        position: [1, 0, 1],
        // rigidbodyhandle: someHandle,
        currentGoal: 'findTree',
        currentAction: 'idle',
    });

    // // NPC queries for the nearest tree
    // const nearestTree = findNearestEntity(
    //     entities['npc1'].position,
    //     'thing',
    //     (entity) => entity.name === 'Tree'
    // );
    // if (nearestTree) {
    //     updateEntity('npc1', {
    //         currentAction: 'moveTo',
    //         targetPosition: nearestTree.position,
    //     });
    // }

    return <div>Time of Day: {timeOfDay}</div>;
};