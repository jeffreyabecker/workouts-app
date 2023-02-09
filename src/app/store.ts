import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';
import timerReducer from '../features/timer/timerSlice';
import workoutsReducer from '../features/workouts/workoutsSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    workouts: workoutsReducer,
    timer:timerReducer
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
