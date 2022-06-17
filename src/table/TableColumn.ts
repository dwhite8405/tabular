import { PrimitiveType } from "query/Query";

export default class TableColumn {
    public name: string;
    _type: PrimitiveType;
    children: TableColumn[];

    // In the future, more metadata will be here, such as:
    // * Whether to show this column by default
    // * Sorted by default
    // * Readonly
    // * Required ("is not null")
    // * Validation rules
    // * Description
    // * For <select>, where the options are. (I need a subclass)
    // * 

    constructor(name: string, type: PrimitiveType) {
        this.name = name;
        this._type = type;
        this.children = []
    }

    get isComplex() {
        return this.children.length == 0;
    }
}