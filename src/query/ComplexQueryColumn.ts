import TableColumn from "table/TableColumn";
import { PrimitiveQueryColumn } from "./PrimitiveQueryColumn";
import { QueryColumn } from "./QueryColumn";

export class ComplexQueryColumn extends QueryColumn {
    public childColumns: QueryColumn[];

    constructor(basedOn : TableColumn, parent?: QueryColumn) {
        super(basedOn, parent);
        this.childColumns = [];
    }

    hasChildren(): boolean {
        return true;
    }

    /* As a column with other columns below it, how many columns wide am I on the UI? */
    columnsAcross(): number {
        if (!this.isExpanded) {
            return 1;
        }

        let totalWidth = 0;
        for (let i = 0; i < this.childColumns.length; i++) {
            let current = this.childColumns[i].columnsAcross();
            totalWidth = totalWidth + current;

        }
        return totalWidth;
    }

    /* How many columns are below me. NOT how deep I am. */
    depth(): number {
        if (!this.isExpanded) {
            return 1;
        }

        let maxDepth = 0;
        for (let i = 0; i < this.childColumns.length; i++) {
            let current = this.childColumns[i].depth();
            if (current > maxDepth) {
                maxDepth = current;
            }
        }
        return maxDepth + 1;
    }

    addColumn = (c : TableColumn) => {
        let addMe : QueryColumn;
        if (c.isComplex) {
            addMe = new ComplexQueryColumn(c, this);
            for (let each of c.children) {
                this.addColumn(each);
            }
        } else {
            addMe = new PrimitiveQueryColumn(c, this);
        }
        this.childColumns.push(addMe);
    }

    map<U>(callbackfn: (value: QueryColumn, index: number, array: QueryColumn[]) => U, thisArg?: any): U[] {
        return this.childColumns.map(callbackfn);
    }

    isEmpty(): boolean {
        return this.childColumns.length === 0;
    }

    get columns(): Array<QueryColumn> {
        return this.childColumns;
    }

    set columns(c: Array<QueryColumn>) {
        this.childColumns = c;
    }

    numColumns(): number {
        let sum = 0;
        for (let i = 0; i < this.childColumns.length; i++) {
            sum = sum + this.childColumns[i].numColumns();
        }
        return Math.max(1, sum);
    }

    /* Re-number the columns and populate this.columnNumber */
    renumberColumns = () => { this.renumberColumnsImpl([0]); }

    renumberColumnsImpl = (from: number[]) => {
        if (this.isExpanded) {
            for (let each of this.childColumns) {
                each.renumberColumnsImpl(from);
            }
        } else {
            this.columnNumber = from[0];
            from[0] = from[0]+1;
        }
    }

    get expandedColumns() : QueryColumn[] {
        let result: QueryColumn[] = [];
        this.expandedColumnsImpl(this, result);
        return result;
    }

    private expandedColumnsImpl(c:QueryColumn, result:QueryColumn[]) {
        if (c.numColumns() > 0 && c.isExpanded ) {
            for (let each of c.childs()) {
                this.expandedColumnsImpl(each, result);
            }
        }
        else {
            result.push(c);
        }
    }

}
