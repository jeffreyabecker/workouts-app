import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from '../../app/store';

export type TimerStatus = 'stopped' | 'running';
export interface TimerState {
  ticks: number;
  value: number;
  intervalHandle: any | null;
  status: TimerStatus;
}
type TimerTickArgs = {
  intervalHandle: any | null;
  status: TimerStatus;
};

const initialState: TimerState = {
  ticks: 0,
  value: 0,
  intervalHandle: null,
  status: 'stopped',
};


export const timerSlice = createSlice({
  name: 'timer',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setIntervalHandle: (state, action: PayloadAction<any>) => {
      state.intervalHandle = action.payload;
    },
    resetTimer: (state, action: PayloadAction<{
      value: number | null;
      status: TimerStatus;
    }>) => {
      if (state.intervalHandle !== null) {
        clearInterval(state.intervalHandle);
        state.intervalHandle = null;
      }
      state.value = action.payload.value || state.value;
      state.ticks = state.value;
      state.status = action.payload.status;
    },
    timerTick: (state, action: PayloadAction) => {
      state.ticks -= 1;
      if (state.ticks === 0) {
        clearInterval(state.intervalHandle);
        state.intervalHandle = null;
        state.status = 'stopped';
      }
    }
  },

});

const { resetTimer, timerTick, setIntervalHandle } = timerSlice.actions;


export const selectTimer = (state: RootState) => state.timer;


export const startTimer = (amount: number): AppThunk =>
  (dispatch, getState) => {
    dispatch(resetTimer({
      value: amount,
      status: 'running'
    }));

    const intervalHandle = setInterval(() => dispatch(timerTick()), 1000);
    dispatch(setIntervalHandle(intervalHandle));
  };
export const stopTimer = (): AppThunk =>
  (dispatch, getState) => {
    dispatch(resetTimer({ value: null, status: 'stopped' }));
  };

export default timerSlice.reducer;
