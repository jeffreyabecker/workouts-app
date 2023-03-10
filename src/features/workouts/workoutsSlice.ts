import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from '../../app/store';
import { WorkoutsClient, WorkoutSet, WorkoutsListing } from '../shared';


export interface WorkoutsState {
    workouts: WorkoutsListing | null;
    currentRoutine:string|null;
    currentExercise:string|null;
    currentSet:number|null;
    currentSetData: WorkoutSet|null;
    status: 'idle' | 'loading' | 'failed';
}

const initialState: WorkoutsState = {
    workouts: null,
    currentRoutine:null,
    currentExercise:null,
    currentSet:null,
    currentSetData:null,
    status: 'idle',
};


// The function below is called a thunk and allows us to perform async logic. It
// can be dispatched like a regular action: `dispatch(incrementAsync(10))`. This
// will call the thunk with the `dispatch` function as the first argument. Async
// code can then be executed and other actions can be dispatched. Thunks are
// typically used to make async requests.
export const fetchWorkoutsAsync = createAsyncThunk(
    'workouts/fetchWorkouts',
    async () =>{
        let permission = Notification.permission;
        if(permission !== 'granted'){
            permission = await Notification.requestPermission();
        }        
        if(permission === 'granted'){
            WorkoutsClient.getWorkouts();
        }
    }
);


export const workoutsSlice = createSlice({
    name: 'workouts',
    initialState,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
        // increment: (state) => {
        //     // Redux Toolkit allows us to write "mutating" logic in reducers. It
        //     // doesn't actually mutate the state because it uses the Immer library,
        //     // which detects changes to a "draft state" and produces a brand new
        //     // immutable state based off those changes
        //     state.value += 1;
        // },
        // decrement: (state) => {
        //     state.value -= 1;
        // },
        // // Use the PayloadAction type to declare the contents of `action.payload`
        // incrementByAmount: (state, action: PayloadAction<number>) => {
        //     state.value += action.payload;
        // },
        setCurrentWorkout:(state, action:PayloadAction<string>)=>{
            state.currentRoutine = action.payload;
        },
        setCurrentExercise:(state, action:PayloadAction<string>)=>{
            state.currentExercise = action.payload;
        },
        setCurrentSet:(state:WorkoutsState, action:PayloadAction<number>)=>{
            if(state.workouts){
                state.currentSet = action.payload;            
                state.currentSetData = state.workouts[state.currentRoutine||''][state.currentExercise||''].sets[state.currentSet];
            }
        },
    },
    // The `extraReducers` field lets the slice handle actions defined elsewhere,
    // including actions generated by createAsyncThunk or in other slices.
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkoutsAsync.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchWorkoutsAsync.fulfilled, (state, action) => {
                state.status = 'idle';
                state.workouts = action.payload;
            })
            .addCase(fetchWorkoutsAsync.rejected, (state) => {
                state.status = 'failed';
            });
    },
});


export const { setCurrentWorkout, setCurrentExercise, setCurrentSet } = workoutsSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
//export const selectCount = (state: RootState) => state.counter.value;

// We can also write thunks by hand, which may contain both sync and async logic.
// Here's an example of conditionally dispatching actions based on current state.
// export const incrementIfOdd =
//   (amount: number): AppThunk =>
//   (dispatch, getState) => {
//     const currentValue = selectCount(getState());
//     if (currentValue % 2 === 1) {
//       dispatch(incrementByAmount(amount));
//     }
//   };

export default workoutsSlice.reducer;