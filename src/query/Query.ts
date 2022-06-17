import { QueryColumn } from "./QueryColumn";
import { ComplexQueryColumn } from "./ComplexQueryColumn";
import Table from "table/Table";

/* A "Query" is the model for a data table on the screen. It contains all 
the state of a query, plus the contents of the current screen-full of data. 
*/
export default class Query {
    // The Table I'm based on.
    _table : Table;

    // The name of this query. It starts out as the table name.
    // It might eventually describe the whole query, e.g. "Person, registered on 2022-04-05, sorted by name"
    // This will be visible in e.g. saved queries (TODO)
    _name: string;

    // "select" is the list of currently visible columns.
    // It is a tree structure. Expandable columns can be expanded or not expanded.
    _select: ComplexQueryColumn; 

    // Which columns to sort by.
    _orderBy: Array<OrderedByEntry>;

    _count: boolean; // TODO whether I'm a 'select count(*)'
    _filter?: any; // TODO
    _search?: string; // TODO - generic string search

    constructor(t : Table) {
        this._table = t;

        this._name = t.name;
        this._orderBy = [];
        this._count = false;

        // We use this super-column to contain a list of my actual visible columns.
        this._select = new ComplexQueryColumn("Supercolumn", undefined);
        this._select.isExpanded = true;
        this._select.addAll(t.columns);

        this.copyFrom = this.copyFrom.bind(this);
        this.orderBy = this.orderBy.bind(this);
    }

    copyFrom(other: Query): Query {
        this._name = other._name;
        this._orderBy = other._orderBy;
        this._count = other._count;
        this._select = other._select;
        return this;
    }

    get name() { return this._name; }

    set name(name: string) {
        this._name = name;
    }

    get select(): ComplexQueryColumn  {
        return this._select;
    }

    getOrderBy = () => {
        return this._orderBy;
    }

    expand = (column: QueryColumn) => {
        column.isExpanded = true;
        return this;
    }

    unexpand = (column: QueryColumn) => {
        column.isExpanded = false;
        return this;
    }

    isExpanded(column: QueryColumn): boolean {
        return column.isExpanded==true;
    }

    orderBy(column: QueryColumn, by: OrderedBy) {
        this._orderBy = [{ column: column, orderedBy: by }];
        return this;
    }

    count() {
        this._count = true;
    }

    get columns() : QueryColumn[] {
        return this._select.childColumns;
    }

    get expandedColumns() : QueryColumn[] {
        return this._select.expandedColumns;
    }

    numColumns : () => number = () => {
        return this._select.numColumns();
    }

    /* Retrieve table contents for the given row range. */
    get(from: number, to: number) : Row[] {
        return this._table.get(this, from, to);
    }

    refetchColumns() {}
    refetchContents() {}

    columnIndex = (c : QueryColumn) => {
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

    moveColumn = (c: QueryColumn, expandedColumnsIndex: number) => {
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
        let c : QueryColumn = this.expandedColumns[expandedIndex];
        return this._select.columns.findIndex((each) => each===c);
    }
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
    left?: FilterClause;
    right?: FilterClause;
}

class OrClause implements FilterClause {
    left?: FilterClause;
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

interface ValueClause { }

class LiteralClause implements ValueClause {
    value: any;
}

class ColumnClause implements ValueClause {
    column?: QueryColumn;
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

export interface OrderedByEntry {
    column: QueryColumn;
    orderedBy: OrderedBy;
}

export interface Row {
    cells: Array<any>;
}

/** Return how that column in the query is ordered. */
export function orderedBy(table: Query, column: QueryColumn): OrderedBy {
    let possibleResult = table.getOrderBy().find(
        each => each.column.name === column.name);
    if (possibleResult) {
        return possibleResult.orderedBy;
    } else {
        return OrderedBy.NA;
    }
}
