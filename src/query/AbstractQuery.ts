import { ColumnDefinition } from "./ColumnDefinition";
import { ComplexColumnDefinition } from "./ComplexColumnDefinition";
import Query, { OrderedBy, OrderedByEntry, Row } from "./Query";

export default abstract class AbstractQuery implements Query {
    _tableName: string;
    _orderBy: Array<OrderedByEntry>; // Which columns to sort by.
    _select: ComplexColumnDefinition; // The visible columns, and whether they're expanded.
    _count: boolean; // TODO whether I'm a 'select count(*)'
    filter?: any; // TODO
    _search?: string; // TODO - generic string search
    //[key: string]: any;

    constructor() {
        this._tableName = "";
        this._orderBy = [];
        this._count = false;

        // We use this super-column to contain a list of my actual visible columns.
        this._select = new ComplexColumnDefinition("Supercolumn", undefined);
        this._select.isExpanded = true;
        this.copyFrom = this.copyFrom.bind(this);
        this.orderBy = this.orderBy.bind(this);
    }

    abstract copy() : Query;

    copyFrom(other: AbstractQuery): Query {
        this._tableName = other._tableName;
        this._orderBy = other._orderBy;
        this._count = other._count;
        this._select = other._select;
        return this;
    }

    get name() { return this._tableName; }

    set name(tableName: string) {
        this._tableName = tableName;
    }

    get select(): ComplexColumnDefinition  {
        return this._select;
    }

    getOrderBy = () => {
        return this._orderBy;
    }

    expand = (column: ColumnDefinition) => {
        column.isExpanded = true;
        return this;
    }

    unexpand = (column: ColumnDefinition) => {
        column.isExpanded = false;
        return this;
    }

    isExpanded(column: ColumnDefinition): boolean {
        return column.isExpanded==true;
    }

    orderBy(column: ColumnDefinition, by: OrderedBy) {
        this._orderBy = [{ column: column, orderedBy: by }];
        return this;
    }

    abstract count() : number ;

    get columns() : ColumnDefinition[] {
        return this._select.childColumns;
    }

    get expandedColumns() : ColumnDefinition[] {
        return this._select.expandedColumns;
    }

    numColumns : () => number = () => {
        return this._select.numColumns();
    }

    /* Retrieve table contents for the given row range. */
    abstract get(from: number, to: number) : Row[];

    refetchColumns() {}
    refetchContents() {}

    columnIndex = (c : ColumnDefinition) => {
        let i : number = 0;
        while (i<this._select.columns.length) {
            if (this._select.columns[i] == c) {
                return i;
            } else {
                i++;
            }
        }
        return -1;
    }

    moveColumn = (c: ColumnDefinition, expandedColumnsIndex: number) => {
        let actualFrom = this._select.columns.findIndex((each) => each===c);

        if (-1 === expandedColumnsIndex) {
            if (this._select.columns[0]===c) return; 
            this._select.columns.unshift(c); 
            actualFrom++;
        } else {
            let actualTo = this.expandedIndexToActualIndex(expandedColumnsIndex);
            if (-1===actualTo) return;
            if (actualFrom===actualTo) return;
            this.select.columns.splice(actualTo+1, 0, c);
            if (actualFrom > actualTo + 1) {
                actualFrom ++;
            }
        }

        //  Remove the column.
        this._select.columns.splice(actualFrom, 1); 
        this.refetchContents(); // OPTIMIZATION: This can be lazy.
    }

    private expandedIndexToActualIndex(expandedIndex: number) {
        let c : ColumnDefinition = this.expandedColumns[expandedIndex];
        return this._select.columns.findIndex((each) => each===c);
    }

}

