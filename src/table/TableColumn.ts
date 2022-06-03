import { PrimitiveType } from "query/Query";

export default class TableColumn {
    public name: string;
    _type: PrimitiveType;
    children: TableColumn[];

    constructor(name: string, type: PrimitiveType) {
        this.name = name;
        this._type = type;
        this.children = []
    }
}