import { ColumnDefinition } from "./ColumnDefinition";
import { ComplexColumnDefinition } from "./ComplexColumnDefinition";

/* A "Query" is the model for a data table on the screen. It contains all 
the state of a query, plus the contents of the current screen-full of data. 
*/
export default interface Query {
    name: String;

    // "select" is the list of currently visible columns.
    // It is a tree structure. Expandable columns can be expanded or not expanded.
    select: ComplexColumnDefinition;

    // "filter" is the filter at the top, or the "WHERE" part of SQL.
    filter?: FilterClause;

    // "expand" is which hierarchical (sub-)columns are visible.
    expand(column: ColumnDefinition): Query;
    unexpand(column: ColumnDefinition): Query;
    isExpanded(column: ColumnDefinition): boolean;

    // "orderBy" is the sort ordering of the table.
    getOrderBy(): OrderedByEntry[];
    orderBy(column: ColumnDefinition, by: OrderedBy): Query;

    // "count" is the number of rows.
    count(): number;

    get columns(): ColumnDefinition[];
    get expandedColumns(): ColumnDefinition[];
    numColumns(): number;

    // Get rows from the table.
    get(from: number, to: number): Row[];

    copy(): Query; // Needed to make React prop updates work.

    // Move the given column to the new index. Beware: the index is of expandedColumns,
    // not query.columns.
    moveColumn: (c: ColumnDefinition, expandedColumnsIndex: number) => void;

    // Ask the server for a fresh list of column headings.
    refetchColumns(): void;

    // Ask the server for a fresh list of rows.
    refetchContents(): void;
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

export interface OrderedByEntry {
    column: ColumnDefinition;
    orderedBy: OrderedBy;
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
