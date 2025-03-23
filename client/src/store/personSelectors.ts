import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './store';

export const selectPersonById = createSelector(
  [(state: RootState) => state.persons, (_: RootState, id: string) => id],
  (persons, id) => persons[id]
);
