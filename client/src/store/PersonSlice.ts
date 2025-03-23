// src/store/walletSlice.ts
import { type PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit'

export interface PersonsState {
    [id:string]: {
        id: string,
        position: [number, number, number]
        targetPosition?: [number, number, number]
        inventory: string[],
        currentGoal?: string
        currentAction?: string
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
    addNPC
} = personSlice.actions

export default personSlice.reducer
