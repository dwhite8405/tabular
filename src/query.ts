import { resourceLimits } from "worker_threads";

/* A "Query" is the model for a data table on the screen. It contains all 
the state of a query, plus the contents of the current screen-full of data. 
*/
export interface Query {
    name: String;

    // "select" is the list of currently visible columns.
    // It is a tree structure. Expandable columns can be expanded or not expanded.
    select: ComplexColumnDefinition;

    // "filter" is the filter at the top, or the "WHERE" part of SQL.
    filter?: FilterClause;

    // "expand" is which hierarchical (sub-)columns are visible.
    expand(column: ColumnDefinition) : Query;
    unexpand(column: ColumnDefinition) : Query;
    isExpanded(column: ColumnDefinition): boolean;

    // "orderBy" is the sort ordering of the table.
    getOrderBy() : OrderedByEntry[];
    orderBy(column: ColumnDefinition, by: OrderedBy) : Query;
    
    // "count" is the number of rows.
    count() : number;

    get columns() : ColumnDefinition[];
    numColumns(): number;

    // Get rows from the table.
    get(from: number, to: number) : Row[];

    copy() : Query; // Needed to make React prop updates work.

    // Ask the server for a fresh list of column headings.
    refetchColumns() : void;

    // Ask the server for a fresh list of rows.
    refetchContents() : void;
}



export enum OrderedBy {
    ASC,
    DESC,
    NA
}


/* This list is from the OData XML or JSON specs:
https://docs.oasis-open.org/odata/odata-csdl-xml/v4.01/odata-csdl-xml-v4.01.html

https://docs.oasis-open.org/odata/odata-csdl-json/v4.01/odata-csdl-json-v4.01.html#_Toc31791166

Note that very few of these are implemented yet.

*/
export enum PrimitiveType {

    Binary, //	Binary data
    Boolean, //	Binary-valued logic
    Byte, //	Unsigned 8-bit integer
    Date, //	Date without a time-zone offset
    DateTimeOffset, //	Date and time with a time-zone offset, no leap seconds
    Decimal, //	Numeric values with decimal representation
    Double, //	IEEE 754 binary64 floating-point number (15-17 decimal digits)
    Duration, //	Signed duration in days, hours, minutes, and (sub)seconds
    Guid, //	16-byte (128-bit) unique identifier
    Int16, //	Signed 16-bit integer
    Int32, //	Signed 32-bit integer
    Int64, //	Signed 64-bit integer
    SByte, //	Signed 8-bit integer
    Single, //	IEEE 754 binary32 floating-point number (6-9 decimal digits)
    Stream, //	Binary data stream
    String, //	Sequence of characters
    TimeOfDay, //	Clock time 00:00-23:59:59.999999999999
    Geography, //	Abstract base type for all Geography types
    GeographyPoint, //	A point in a round-earth coordinate system
    GeographyLineString, //	Line string in a round-earth coordinate system
    GeographyPolygon, //	Polygon in a round-earth coordinate system
    GeographyMultiPoint, //	Collection of points in a round-earth coordinate system
    GeographyMultiLineString, //	Collection of line strings in a round-earth coordinate system
    GeographyMultiPolygon, //	Collection of polygons in a round-earth coordinate system
    GeographyCollection, //	Collection of arbitrary Geography values
    Geometry, //	Abstract base type for all Geometry types
    GeometryPoint, //	Point in a flat-earth coordinate system
    GeometryLineString, //	Line string in a flat-earth coordinate system
    GeometryPolygon, //	Polygon in a flat-earth coordinate system
    GeometryMultiPoint, //	Collection of points in a flat-earth coordinate system
    GeometryMultiLineString, //	Collection of line strings in a flat-earth coordinate system
    GeometryMultiPolygon, //	Collection of polygons in a flat-earth coordinate system
    GeometryCollection, //	Collection of arbitrary Geometry values
}

interface FilterClause {

}

class AndClause implements FilterClause {
    left? : FilterClause;
    right?: FilterClause;
}

class OrClause implements FilterClause {
    left? : FilterClause;
    right?: FilterClause;
}

class NotClause implements FilterClause {
    clause?: FilterClause;
}

class OperatorClause implements FilterClause {
    operator?: Operator;
    left?: ValueClause;
    right?: ValueClause;
}

interface ValueClause {}

class LiteralClause implements ValueClause {
    value: any;
}

class ColumnClause implements ValueClause {
    column?: ColumnDefinition;
}

enum Operator {
    equals,
    greaterThan,
    lessThan,
    like, // Must be string.
    startsWith,
    endsWith,
    in, // Must be list
}

export abstract class AbstractQuery implements Query {
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

}


interface OrderedByEntry {
    column: ColumnDefinition;
    orderedBy: OrderedBy;
}

/* The column heading, and it's type. */
export abstract class ColumnDefinition {
    isExpanded: boolean; // Only used by ComplexColumnDefinitions.
    columnNumber: number = 0;
    _name: string;
    _pixelWidth: number = 100;

    // _type and childColumns are mutually exclusive.
    _parent?: ColumnDefinition;
    // TODO _isCollection: boolean;

    constructor(name: string, parent?: ColumnDefinition) {
        this._name = name;
        this._parent = undefined;
        this.isExpanded = false;
        //this._isCollection = false;
    }

    abstract hasChildren(): boolean;

    get name(): string {
        return this._name;
    }

    equals(c: ColumnDefinition): boolean {
        return this._name === c._name && this._parent === c._parent;
    }

    childs(): Array<ColumnDefinition> {
        return [];
    }

    // If I am expanded, how many columns wide am I on the screen?
    columnsAcross(): number { 
        return 1;
    }

    get pixelWidth () : number {
        return this._pixelWidth;
    }

    set pixelWidth(width: number) {
        this._pixelWidth = width;
    }

    // How many columns are below me.
    depth(): number {
        return 1;
    }

    numColumns() : number { 
        return 1;
    }

    abstract renumberColumnsImpl(from: number[]) : void;
}

export class PrimitiveColumnDefinition extends ColumnDefinition {
    _type: PrimitiveType;

    constructor(name: string, type?: PrimitiveType, parent?: ColumnDefinition) {
        super(name, parent);
        if (undefined===type) {
            this._type = PrimitiveType.String;
        } else {
            this._type = type;
        }
    }

    hasChildren() : boolean {
        return false;
    }

    renumberColumnsImpl = (from:number[]) => {
        this.columnNumber = from[0];
        from[0] = from[0]+1;
    }
}

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

export interface Row {
    cells: Array<any>;
}

/** Return how that column in the query is ordered. */
export function orderedBy(table: Query, column: ColumnDefinition): OrderedBy {
    let possibleResult = table.getOrderBy().find(
        each => each.column.name === column.name);
    if (possibleResult) {
        return possibleResult.orderedBy;
    } else {
        return OrderedBy.NA;
    }
}
