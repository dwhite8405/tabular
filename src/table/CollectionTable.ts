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

export class CollectionTable extends Table {
    contents:  Array<Array<any>> ;

    constructor(columns: Array<CollectionColumnDefs>, contents: Array<any>) {
        super();
        this.addColumns(columns);
        this.contents = contents;
    }

    private addColumns = (defs: CollectionColumnDefs[], parent?: TableColumn) => {
        defs.forEach( each => {
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

    get = (q:Query, from: number, to: number) => {
            q._select.renumberColumns();
            let s : any[] = this.contents.slice(from, to);
            let result : Row[] = [];
            for (let each of s) {
                let cells : any[] = [];
                this.addCells(each, q._select, cells);
                result.push({cells:cells});
            }

            return result;
    }

    private addCells = (source:any[], column: QueryColumn, cells: any[]) => {

        for(let i in column.childs()) {
            let c = column.childs()[i];
            if (c.isExpanded) {
                this.addCells(source[i], c, cells);
            } else {
                if (undefined===source) {
                    cells.push("Undefinedx");
                } else {
                    cells.push(source[i]);
                }
            }
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

    private magnitude(b : boolean) {
        switch(b) {
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
