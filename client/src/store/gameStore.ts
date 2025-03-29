import {create} from 'zustand';

// Type definitions
type Position = [number, number, number];
type TimeOfDay = 'day' | 'night' | 'dawn' | 'dusk';

interface Cutscene {
  isActive: boolean;
  currentScene: string | null;
}

// Base entity interface
interface BaseEntity {
  id: string;
  type: string;
  position: Position;
  rigidbodyhandle?: number; // Consider replacing with a more specific type
}

// Specific entity types
export interface NpcEntity extends BaseEntity {
  type: 'npc';
  currentGoal: string;
  currentAction?: string;
}

export interface ThingEntity extends BaseEntity {
  type: 'thing';
  name: string;
}

// Union type for all entity types
type Entity = NpcEntity | ThingEntity;

// Store state type
interface GameState {
  timeOfDay: TimeOfDay;
  cutscene: Cutscene;
  entities: Record<string, Entity>;
  
  // Actions
  setTimeOfDay: (newTime: TimeOfDay) => void;
  startCutscene: (scene: string) => void;
  endCutscene: () => void;
  addEntity: (entity: Entity) => void;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  
  // Queries
  getEntitiesByType: <T extends Entity>(type: string) => T[];
  findNearestEntity: <T extends Entity>(
    position: Position, 
    type: string, 
    filterFn?: (entity: T) => boolean
  ) => T | null;
}

// Utility function to calculate 3D distance between two positions [x, y, z]
const distance = (pos1: Position, pos2: Position): number => {
  const dx = pos1[0] - pos2[0];
  const dy = pos1[1] - pos2[1];
  const dz = pos2[2] - pos2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Create the Zustand store
const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  timeOfDay: 'day',
  cutscene: {
    isActive: false,
    currentScene: null,
  },
  entities: {}, // Map of all entities keyed by id

  // Actions for timeOfDay
  setTimeOfDay: (newTime: TimeOfDay) => set({ timeOfDay: newTime }),

  // Actions for cutscene
  startCutscene: (scene: string) =>
    set((state) => ({
      cutscene: { ...state.cutscene, isActive: true, currentScene: scene },
    })),
  endCutscene: () =>
    set((state) => ({
      cutscene: { ...state.cutscene, isActive: false, currentScene: null },
    })),

  // Actions for entities
  addEntity: (entity: Entity) =>
    set((state) => ({
      entities: { ...state.entities, [entity.id]: entity },
    })),
  removeEntity: (id: string) =>
    set((state) => {
      const { [id]: _, ...rest } = state.entities;
      return { entities: rest };
    }),
  updateEntity: (id: string, updates: Partial<Entity>) =>
    set((state) => {
      const currentEntity = state.entities[id];
      if (!currentEntity) return state;
      
      // Ensure type consistency by checking entity type
      const updatedEntity = { ...currentEntity, ...updates } as Entity;
      
      return {
        entities: {
          ...state.entities,
          [id]: updatedEntity,
        },
      };
    }),

  // Query functions
  getEntitiesByType: <T extends Entity>(type: string) =>
    Object.values(get().entities).filter((entity) => entity.type === type) as T[],
  findNearestEntity: <T extends Entity>(position: Position, type: string, filterFn?: (entity: T) => boolean) => {
    const entities = Object.values(get().entities).filter(
      (entity) => entity.type === type && (!filterFn || filterFn(entity as T))
    ) as T[];
    if (entities.length === 0) return null;
    return entities.reduce(
      (nearest, entity) => {
        const dist = distance(position, entity.position);
        return dist < nearest.dist ? { entity, dist } : nearest;
      },
      { entity: null as T | null, dist: Infinity }
    ).entity;
  },
}));

export default useGameStore;