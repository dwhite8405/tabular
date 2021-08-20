import { AbstractQuery, PrimitiveColumnDefinition, PrimitiveType, Row, Query } from "./query";

export interface CollectionQueryColumn {
    name: string;
}

export class CollectionQuery extends AbstractQuery {
    contents:  Array<Array<any>> ;

    constructor(columns: Array<CollectionQueryColumn>, contents: Array<any>) {
        super();
        columns.forEach( each => 
            this.select.columns.push(new PrimitiveColumnDefinition(each.name, PrimitiveType.String)));
        this.contents = contents;
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
        return new CollectionQuery(this.select.columns, this.contents).copyFrom(this);
    }
}
