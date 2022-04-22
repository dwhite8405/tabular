import { textChangeRangeIsUnchanged } from "typescript";
import { AbstractQuery, PrimitiveColumnDefinition, PrimitiveType, Row, Query, ColumnDefinition, ComplexColumnDefinition, OrderedBy } from "./query";

interface CollectionQueryColumn {
    name: string;
    type?: PrimitiveType;
}

interface ComplexCollectionQueryColumn {
    name: string;
    contents: CollectionColumnDefs[];
}

type CollectionColumnDefs = CollectionQueryColumn | ComplexCollectionQueryColumn

/* Working here: 

Need to introduce the concept of a "table", which is the definition that a query builds on. 
Table contains the original ColumnDefinitions.

The user can expand, unexpand columns, move columns, remove and add columns. We need to
pull these from the table.

It's possible for a query to have the same column from a table twice, and that column
could be inside an expanded column at two different ends of the header.

*/

export class CollectionQuery extends AbstractQuery {
    contents:  Array<Array<any>> ;

    constructor(columns: Array<CollectionColumnDefs>, contents: Array<any>) {
        super();
        this.addColumns(columns, this.select.columns);
        this.contents = contents;
    }

    private addColumns = (defs: CollectionColumnDefs[], columns: ColumnDefinition[], parent?: ColumnDefinition) => {
        defs.forEach( each => {
            if ('contents' in each) {
                let b = new ComplexColumnDefinition(each.name, parent);
                this.addColumns(each.contents, b.childColumns);
                columns.push(b);
            } else {
                columns.push(new PrimitiveColumnDefinition(each.name, each.type))    
            }
        });
    }

    count = () => {
        return this.contents.length;
    }

    get: (from: number, to: number) => Row[] = 
        (from: number, to: number) => {
            let s : any[] = this.contents.slice(from, to);
            let rows : Row[] = s.map(each => { return {cells:each}})
            return rows;
    }

    orderBy(column: ColumnDefinition, by: OrderedBy) {
        console.log("Ordering by "+column.name);
        this._orderBy = [{ column: column, orderedBy: by }];
        let i : number = this.columnIndex(column);
        switch (by) {
            case OrderedBy.ASC:
                this.contents.sort( (a, b) => this.magnitude(a[i] < b[i]) );
                break;
            case OrderedBy.DESC:
                this.contents.sort( (a, b) => this.magnitude(a[i] > b[i]) );
                break;
            case OrderedBy.NA:
                break;
        }
        
        return this;
    }

    magnitude(b : boolean) {
        switch(b) {
            case true: 
                return 1;
            case false:
                return -1;
        }        
    }

    copy : () => Query = () => {
        let result = new CollectionQuery([], this.contents).copyFrom(this);
        return result;
    }

    copyFrom = (me : CollectionQuery) => {
        let result = super.copyFrom(me);
        result.select.columns = me.select.columns;
        return result;
    }
}
