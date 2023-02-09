import JSZip from 'jszip';
import { Workbook } from './Workbook';
export interface WorkoutSet {
    name: string;
    reps: number;
    weight: number;
    rest: number;
}
interface WorkoutExercise {
    order: number;
    sets: WorkoutSet[];
}
interface WorkoutRoutine {
    [key: string]: WorkoutExercise;
}
export interface WorkoutsListing {
    [key: string]: WorkoutRoutine;
}
interface SupplimentsDay {
    date: string;
    day: number;
    week: number;
    clen: string;
    test: string;
    cut: string;
    liver: string;
}
export interface SupplimentsListing {
    [key: string]: SupplimentsDay;
}

export class WorkoutsService {
    private _workouts: WorkoutsListing | null = null;
    private _suppliments: SupplimentsListing | null = null;
    private _workbook: Workbook | null = null;


    constructor(private _sheetId: string) {
        console.log(this.constructor.name);
    }
    private async fetchWorkbook(): Promise<Workbook> {
        if (this._workbook == null) {
            const url = 'https://docs.google.com/spreadsheets/d/' + this._sheetId + '/export?format=xlsx';
            const response = await fetch(url);
            if (response.status < 200 || response.status > 299) {
                throw new Error(response.statusText);
            }
            const data = await response.blob();
            const zipData = await JSZip.loadAsync(data);
            this._workbook = await Workbook.parse(zipData);
        }
        return this._workbook;
    }

    public async getWorkouts(): Promise<WorkoutsListing> {
        if (this._workouts == null) {
            this._workouts = await this.getWorkoutsFromApi();
        }
        return this._workouts;
    }
    public async getSuppliments(): Promise<SupplimentsListing> {
        if (this._suppliments == null) {
            this._suppliments = await this.getSupplimentsFromApi();
        }
        return this._suppliments;
    }


    private static objectify(grid: string[][]): any[] {
        const rows: any[] = [];
        for (let i = 1; i < grid.length; i++) {
            const row: any = {};
            for (let j = 0; j < grid[0].length; j++) {
                row[grid[0][j].trim().toLowerCase()] = grid[i][j];
            }
            rows.push(row);
        }
        return rows;
    }
    private async getWorkoutsFromApi(): Promise<WorkoutsListing> {
        const workbook = await this.fetchWorkbook();
        const rows = WorkoutsService.objectify(workbook.sheets['exercises'].allData);
        const result: WorkoutsListing = {};
        let order = 0;
        for (let row of rows) {
            if (!result[row.routine]) {
                result[row.routine] = {};
                order = 0;
            }
            if (!result[row.routine][row.exercise]) {
                order++;
                result[row.routine][row.exercise] = { order: order, sets: [] };
            }
            result[row.routine][row.exercise].sets.push({ name: row.exercise, reps: parseInt(row.reps), weight: row.weight, rest: parseInt(row.rest) });
        }
        return result;
    }
    private async getSupplimentsFromApi() {
        const workbook = await this.fetchWorkbook();
        const rows = WorkoutsService.objectify(workbook.sheets['Suppliements'].allData);
        for (let row of rows) {
            row.date = WorkoutsService.fromOADate(parseFloat(row.date));
        }
        const result: SupplimentsListing = {};
        for (let row of rows) {
            result[row.date] = row;
        }
        return result;
    }
    private static fromOADate(oaDate: number) {
        let date = new Date('1899-12-30');
        date.setDate(date.getDate() + Math.floor(oaDate));
        return date.toISOString().substring(0, 10);
    }
}

