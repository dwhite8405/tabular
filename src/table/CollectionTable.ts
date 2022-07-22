import { QueryColumn } from "../query/QueryColumn";
import { ComplexQueryColumn } from "../query/ComplexQueryColumn";
import { PrimitiveQueryColumn } from "../query/PrimitiveQueryColumn";
import Query, { PrimitiveType, Row, OrderedBy } from "../query/Query";
import Table from "./Table"
import TableColumn from "./TableColumn";

interface CollectionTableColumn {
    name: string;
    type?: PrimitiveType;
}

interface ComplexCollectionTableColumn {
    name: string;
    contents: CollectionColumnDefs[];
}

type CollectionColumnDefs = CollectionTableColumn | ComplexCollectionTableColumn

/* Working here: 

Need to introduce the concept of a "table", which is the definition that a query builds on. 
Table contains the original ColumnDefinitions.

The user can expand, unexpand columns, move columns, remove and add columns. We need to
pull these from the table.

It's possible for a query to have the same column from a table twice, and that column
could be inside an expanded column at two different ends of the header.

*/
type Path = number[]; // sequence of indexes into a column tree to find a particular column.

export class CollectionTable extends Table {
    contents: Array<Array<any>>;

    constructor(columns: Array<CollectionColumnDefs>, contents: Array<any>) {
        super();
        this.addColumns(columns);
        this.contents = contents;
    }

    private addColumns = (defs: CollectionColumnDefs[], parent?: TableColumn) => {
        defs.forEach(each => {
            if ('contents' in each) {
                let t = new TableColumn(each.name, PrimitiveType.String);
                this.addColumns(each.contents, t);
                this.columns.push(t);
            } else {
                let t = new TableColumn(each.name, each.type ?? PrimitiveType.String);
                this.columns.push(t);
            }
        });
    }

    count = () => {
        return this.contents.length;
    }

    get = (q: Query, from: number, to: number) => {
        let s: any[] = this.contents.slice(from, to);
        let selectedColumns: QueryColumn[] = [];
        this.flatten(selectedColumns, q._select);
        let paths: Path[];
        let result: Row[] = [];

        paths = this.makePaths(selectedColumns, q.table);

        for (let each of s) {
            let cells: any[] = [];
            this.addCellsOfRow(each, paths, cells);
            result.push({ cells: cells });
        }

        return result;
    }

    private flatten = (result: QueryColumn[], q: QueryColumn) => {
        if (q.columns.length > 0) {
            for (let qeach of q.columns) {
                if (q.isExpanded) {
                    this.flatten(result, qeach);
                } else {
                    result.push(qeach);
                }
            }
        }
        else {
            result.push(q);
        }
    }

    private makePaths = (columns: QueryColumn[], table: Table) => {
        let result: Path[] = [];
        for (let c of columns) {
            let thisPath = this.pathOf(c, table.columns);
            if (null !== thisPath) {
                result.push(thisPath);
            } else {
                result.push([]);
            }

        }
        return result;
    }

    private pathOf: (c: QueryColumn, t: TableColumn[]) => (Path | null)
        = (c: QueryColumn, t: TableColumn[]) => {
            let index = 0;
            for (let tEach of t) {
                if (tEach == c._basedOn) {
                    return [index];
                }
                if (tEach.children.length > 0) {
                    let r: Path | null = this.pathOf(c, tEach.children);
                    if (null !== r) {
                        return [index].concat(r);
                    }
                } 
                index++;
            }
            return null;
        }

    private addCellsOfRow = (source: any[], paths: Path[], cells: any[]) => {
        for (let path of paths) {
            this.addCell(source, path, cells);
        }
    }

    private addCell = (source: any[], path: Path, cells: any[]) => {
        if (0 == path.length) {
            cells.push("???");
        } else if (1 == path.length) {
            cells.push(source[path[0]]);
        } else {
            this.addCell(source[path[0]], path.slice(1), cells);
        }
    }

    /* TODO Rewrite this. Maybe the query gets a copy of the data?
    private orderBy(column: QueryColumn, by: OrderedBy) {
        let i : number = this.columnIndex(column);
        switch (by) {
            case OrderedBy.ASC:
                this.contents.sort( (a, b) => this.magnitude(a[i] > b[i]) );
                break;
            case OrderedBy.DESC:
                this.contents.sort( (a, b) => this.magnitude(a[i] < b[i]) );
                break;
            case OrderedBy.NA:
                break;
        }
        
        return this;
    } */

    private magnitude(b: boolean) {
        switch (b) {
            case true:
                return 1;
            case false:
                return -1;
        }
    }

    getCount(q: Query): number {
        return this.contents.length;
    }

    refetchColumns(): void {

    }
}
