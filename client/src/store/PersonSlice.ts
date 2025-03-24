// src/store/walletSlice.ts
import { RapierRigidBody } from '@react-three/rapier'
import { type PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { RefObject } from 'react'

export interface PersonsState {
    [id:string]: {
        id: string,
        position: [number, number, number]
        targetPosition?: [number, number, number]
        rbRef?: { current: RapierRigidBody | null }
        inventory: string[],
        currentGoal?: string
        currentAction?: string
        cameraTarget?: true
    }
}
const initialState: PersonsState = {}

export const personSlice = createSlice({
    name: 'wallet',
    initialState,
    reducers: {
        resetState: (state) => {
            Object.assign(state, initialState)
        },
        addNPC: (state = initialState, action) => {
            return {
                ...state,
                [action.payload.id]: {
                    id: action.payload.id,
                    position: action.payload.position,
                    inventory: [],
                }
            }
        },
        setRigidBody: (state, action: PayloadAction<{ id: string, rb: RefObject<RapierRigidBody> }>) => {
            if (state[action.payload.id]) {
                // Store reference data instead of the ref object itself
                state[action.payload.id].rbRef = { current: action.payload.rb.current }
                console.log('setRigidBody', action.payload.id, state[action.payload.id].rbRef)
            }
        },
        makeCameraTarget: (state, action: PayloadAction<string | undefined>) => {
            Object.keys(state).forEach(key => {
            state[key].cameraTarget = undefined;
            });
            
            if (action.payload !== undefined && state[action.payload]) {
            state[action.payload].cameraTarget = true;
            }
        },
        },
        extraReducers: (builder) => {
        builder.addCase(getBunCount.pending, (state) => {
            //   state.status = 'loading'
        })
        builder.addCase(getBunCount.fulfilled, (state, action) => {
            //   state.address = action.payload as `0x${string}`
            //   state.status = 'succeeded'
        })
        builder.addCase(getBunCount.rejected, (state) => {
            //   state.status = 'failed'
        })
    },
})

export const getBunCount = createAsyncThunk(
    'wallet/fetchBunCount',
    async (userId: `0x${string}`, thunkAPI) => {
        
        return 12
    },
)

export const {
    addNPC,
    setRigidBody,
    makeCameraTarget,
} = personSlice.actions

export default personSlice.reducer
