import JSZip from 'jszip';
interface CellData {
    value: any;
    cellRef: string;
}
class RowData {
    public rowNumber:number=0;
    public cells:CellData[] = [];
}
class WorksheetData {
    rows: RowData[] = [];
    get(cellRef: string): CellData | CellData[] | CellData[][] {
        throw new Error('not implemented');
    }
    get allData():string[][]{
        const result:string[][]=[];
        for(let i=0; i< this.rows.length; i++){
            if(this.rows[i]){
                const row:string[] = [];
                for(let j=0; j< this.rows[i].cells.length; j++){
                    row[j] = this.rows[i].cells[j].value.toString();
                }
                result.push(row);
            }
        }
        return result;
    }
}
interface WorkbookData {
    [key: string]: WorksheetData;
}

interface WorkbookRefs {
    [key: string]: number;
}


export class Workbook {

    private constructor(public sheets: WorkbookData) { }

    public static async parse(zipData: JSZip): Promise<Workbook> {

        const workbookInfo = await Workbook.parseFile<WorkbookRefs>(zipData, 'xl/workbook.xml', (xmlDoc, result: WorkbookRefs) => {
            const sheets = xmlDoc.getElementsByTagName('sheet');
            for (let i = 0; i < sheets.length; i++) {
                result[sheets[i].getAttribute('name') || ''] = parseInt(sheets[i].getAttribute('sheetId') || '');
            }
            return result;
        }, {});
        const sharedStrings = await Workbook.parseFile<string[]>(zipData, 'xl/sharedStrings.xml', xmlDoc => {
            const result: string[] = [];
            const elements = xmlDoc.getElementsByTagName('t');
            for (let i = 0; i < elements.length; i++) {
                result.push(elements[i].textContent || '');
            }
            return result;
        }, []);
        const result: WorkbookData = {};
        for (const [sheetName, sheetId] of Object.entries(workbookInfo || {})) {
            result[sheetName] = await Workbook.parseWorksheet(zipData, sheetId, sharedStrings);
        }
        return new Workbook(result);
    }
    private static parseWorksheet(zipData: JSZip, sheetId: number, sharedStrings: string[]) {
        return Workbook.parseFile(zipData, 'xl/worksheets/sheet' + sheetId.toString() + '.xml', (xmlDoc, result: WorksheetData) => {
            const rows = xmlDoc.getElementsByTagName('row');
            for (let i = 0; i < rows.length; i++) {
                const row = this.parseRow(rows[i], sharedStrings);
                result.rows[row.rowNumber] = row;
            }
            return result;
        }, new WorksheetData());
    }
    private static parseCell(xmlElement: Element, sharedStrings: string[]): CellData {
        if(xmlElement.childElementCount > 0){
            const value = xmlElement.children[0].textContent || '';
            return {
                cellRef: xmlElement.getAttribute('r') || '',
                value: xmlElement.getAttribute('t') === 's' ? sharedStrings[parseInt(value)] : value
            };
        }
        return  {
            cellRef: '',
            value: ''
        };
    }
    private static parseRow(xmlElement: Element, sharedStrings: string[]): RowData {
        const result: RowData = new RowData();
        result.rowNumber = parseInt(xmlElement.getAttribute("r") || '-1');
        const cells = xmlElement.getElementsByTagName('c');
        for (let i = 0; i < cells.length; i++) {
            const cell = Workbook.parseCell(cells[i], sharedStrings);
            //todo parse the cell ref into an array index to deal with the posiblity of sparse sheets
            result.cells.push(cell);
        }
        return result;
    }


    private static async parseFile<T>(zipData: JSZip, file: string, processor: (xmlDoc: Document, defaultValue: T) => T, defaultValue: T): Promise<T> {
        const filedata = zipData?.file(file);
        if (filedata) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(await filedata.async('string'), 'text/xml');
            return processor(xmlDoc, defaultValue);
        }
        return defaultValue;
    }

}