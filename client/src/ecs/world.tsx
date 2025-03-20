import { useEffect, useState } from "react"
import { ECS, Entity } from "./state"
import MetaCamera from "../gizmos/MetaCamera"
import Player from "../models/player"
import Building from "../models/building"
import Ped from "../models/ped"
import { Box, OrbitControls } from "@react-three/drei"
import { useEntities } from "miniplex-react"
import { Physics, RigidBody } from "@react-three/rapier"

const Game = () => {
    // const [player] = useState(() =>
    //     ECS.world.add({
    //         type: "player",
    //         position: { x: 0, y: 0, z: 0 },
    //         health: { current: 100, max: 100 },
    //         cameraTarget: true
    //     })
    // )

    useEffect(() => {
        ECS.world.add({
            type: "player",
            position: { x: 3, y: 0, z: 0 },
            health: { current: 100, max: 100 },
            cameraTarget: true
        })
        for (let i = 0; i < 10; i++) {
            ECS.world.add({
                type: "building",
                position: { x: Math.random() * 10 - 5, y: 0, z: Math.random() * 10 - 5 }
            })
        }

        for (let i = 0; i < 10; i++) {
            ECS.world.add({
                type: "ped",
                position: { x: Math.random() * 10 - 5, y: 0, z: Math.random() * 10 - 5 }
            })
        }

        return () => {
            ECS.world.clear()
        }
    }, [])

    return (
        <>
            {/* All sorts of stuff */}
            <Physics debug>
                <Player />
                {/* <Buildings /> */}
                <Peds />
                <MetaCamera />
                <RigidBody type="fixed" position={[0, -0.051, 0]}>
                    <Box args={[50, 0.1, 50]} >
                        <meshStandardMaterial color="gray" />
                    </Box>
                </RigidBody>
            </Physics>

            {/* More stuff */}
            <gridHelper />
            <directionalLight />
            <ambientLight />
        </>
    )
}

const buildings = ECS.world.with("type").where(({ type }) => type === "building")

const Buildings = () => {
    const entities = useEntities(buildings)

    return (
        <ECS.Entities in={entities}>
            {(entity) => <Building entity={entity} />}
        </ECS.Entities>
    )
}

const peds = ECS.world.with("type").where(({ type }) => type === "ped")

const Peds = () => {
    const entities = useEntities(peds)

    return (
        <ECS.Entities in={entities}>
            {(entity) => <Ped entity={entity} />}
        </ECS.Entities>
    )
}



export default Game 