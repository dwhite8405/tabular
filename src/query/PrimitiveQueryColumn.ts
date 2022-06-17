import { QueryColumn } from "./QueryColumn";
import { PrimitiveType } from "./Query";
import TableColumn from "table/TableColumn";

export class PrimitiveQueryColumn extends QueryColumn {
    constructor(basedOn : TableColumn, parent?: QueryColumn) {
        super(basedOn, parent);
    }

    hasChildren() : boolean {
        return false;
    }

    renumberColumnsImpl = (from:number[]) => {
        this.columnNumber = from[0];
        from[0] = from[0]+1;
    }
}