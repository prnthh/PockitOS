/* state.ts */
import { World } from "miniplex"
import createReactAPI from "miniplex-react"
import { Object3D } from "three";

/* Our entity type */
export type Entity = {
  type: "player" | "building" | "ped"
  position: { x: number; y: number; z: number }
  velocity?: { x: number; y: number; z: number }
  health?: {
    current: number
    max: number
  }
  object3D?: Object3D
  cameraTarget?: true
}

/* Create a Miniplex world that holds our entities */
export const world = new World<Entity>()

/* Create and export React bindings */
export const ECS = createReactAPI(world)