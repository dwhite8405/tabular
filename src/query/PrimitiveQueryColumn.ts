import { QueryColumn } from "./QueryColumn";
import { PrimitiveType } from "./Query";

export class PrimitiveQueryColumn extends QueryColumn {
    _type: PrimitiveType;

    constructor(name: string, type?: PrimitiveType, parent?: QueryColumn) {
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