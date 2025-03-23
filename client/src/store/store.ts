// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit'
import personReducer from './PersonSlice'
// import testOfStrengthReducer from './hammerSlice'
// import { productionEnv } from './sankoChainConfig'

export const store = configureStore({
  reducer: {
    persons: personReducer,
  },
//   devTools: !productionEnv,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
