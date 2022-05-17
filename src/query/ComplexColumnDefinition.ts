import { ColumnDefinition } from "./ColumnDefinition";

export class ComplexColumnDefinition extends ColumnDefinition {
    childColumns: ColumnDefinition[];

    constructor(name: string, parent?: ColumnDefinition) {
        super(name, parent);
        this.childColumns = [];
    }

    hasChildren() : boolean {
        return true;
    }

    childs(): Array<ColumnDefinition> {
        return this.childColumns;
    }

    get pixelWidth() : number {
        let result : number = 0;
        for (let i=0; i<this.childColumns.length; i++) {
            let current = this.childColumns[i].pixelWidth;
            result = result + current;
        }
        if (this._pixelWidth > result) {
            return this._pixelWidth;
        } else {
            return result;
        }
    }

    /* As a column with other columns below it, how many columns wide am I on the UI? */
    columnsAcross() : number {
        if (!this.isExpanded) {
            return 1;
        }

        let totalWidth = 0;
        for (let i=0; i<this.childColumns.length; i++) {
            let current = this.childColumns[i].columnsAcross();
            totalWidth = totalWidth + current;
            
        }
        return totalWidth;    
    }

    /* How many columns are below me. NOT how deep I am. */
    depth() : number {
        if (!this.isExpanded) {
            return 1;
        }

        let maxDepth = 0;
        for (let i=0; i<this.childColumns.length; i++) {
            let current = this.childColumns[i].depth();
            if (current > maxDepth) {
                maxDepth = current;
            }
        }
        return maxDepth+1;
    }

    map<U>(callbackfn: (value: ColumnDefinition, index: number, array: ColumnDefinition[]) => U, thisArg?: any): U[] {
        return this.childColumns.map(callbackfn);
    }

    isEmpty() : boolean {
        return this.childColumns.length === 0;
    }

    get columns() : Array<ColumnDefinition> {
        return this.childColumns;
    }

    set columns(c : Array<ColumnDefinition>) {
        this.childColumns = c;
    }

    numColumns() : number {
        let sum=0; 
        for (let i=0; i<this.childColumns.length; i++) {
            sum = sum + this.childColumns[i].numColumns();
        }
        return Math.max(1, sum);
    }

    /* Re-number the columns and populate this.columnNumber */
    renumberColumns = () => { this.renumberColumnsImpl([0]); }

    renumberColumnsImpl = (from: number[]) => {
        for(let each of this.childColumns) {
            each.renumberColumnsImpl(from);
        }
    }
}
