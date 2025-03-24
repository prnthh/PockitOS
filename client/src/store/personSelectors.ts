import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './store';

export const selectPersonById = createSelector(
  [(state: RootState) => state.persons, (_: RootState, id: string) => id],
  (persons, id) => persons[id]
);

export const getCameraTarget = createSelector(
  [(state: RootState) => state.persons],
  (persons) => {
    const target = Object.values(persons).find((person) => person.cameraTarget);
    return target?.id;
  }
);
