import { AbstractQuery, PrimitiveColumnDefinition, PrimitiveType, Row, Query, ColumnDefinition, ComplexColumnDefinition } from "./query";

interface CollectionQueryColumn {
    name: string;
    type?: PrimitiveType;
}

interface ComplexCollectionQueryColumn {
    name: string;
    contents: CollectionColumnDefs[];
}

type CollectionColumnDefs = CollectionQueryColumn | ComplexCollectionQueryColumn

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
