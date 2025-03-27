import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './store';

const selectPersonsSlice = (state: RootState) => state.persons;

export const selectPersonById = createSelector(
  [(state: RootState) => selectPersonsSlice(state), (_: RootState, id: string) => id],
  (persons, id) => persons[id]
);

export const getCameraTarget = createSelector(
  [selectPersonsSlice],
  (persons) => {
    const target = Object.values(persons).find((person) => person.cameraTarget);
    return target?.id;
  }
);

export const getPersonIds = createSelector(
  [selectPersonsSlice],
  (persons) => Object.keys(persons)
);