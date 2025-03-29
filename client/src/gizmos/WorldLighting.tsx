import { Environment } from "@react-three/drei"
import { FollowLighting } from "./FollowLighting"

const WorldLighting = () => {
    return <>
        <Environment preset="night" background />
        <color attach="background" args={['#222233']} />
        <fogExp2 attach="fog" args={['#222233', 0.04]} />

        <ambientLight intensity={0.8} />
        <FollowLighting />
    </>
}

export default WorldLighting