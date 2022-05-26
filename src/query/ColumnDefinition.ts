/* The column heading, and it's type. */
export abstract class ColumnDefinition {
    isExpanded: boolean; // Only used by ComplexColumnDefinitions.
    columnNumber: number = 0; // Used when I'm in a query; I get changed if columns are moved.
    _name: string;
    _pixelWidth: number; // Can be used by complex columns if they are unexpanded.

    // _type and childColumns are mutually exclusive.
    _parent?: ColumnDefinition;
    // TODO _isCollection: boolean;

    constructor(name: string, parent?: ColumnDefinition) {
        this._name = name;
        this._parent = undefined;
        this.isExpanded = false;
        this._pixelWidth = 100;
        //this._isCollection = false;
    }

    abstract hasChildren(): boolean;

    get name(): string {
        return this._name;
    }

    equals(c: ColumnDefinition): boolean {
        return this._name === c._name && this._parent === c._parent;
    }

    childs(): Array<ColumnDefinition> {
        return [];
    }

    // If I am expanded, how many columns wide am I on the screen?
    columnsAcross(): number { 
        return 1;
    }

    // How many columns are below me.
    depth(): number {
        return 1;
    }

    numColumns() : number { 
        return 1;
    }

    abstract renumberColumnsImpl(from: number[]) : void;

    get pixelWidth () : number {
        return this._pixelWidth;
    }

    set pixelWidth(width: number) {
        if (width > 3) {
            this._pixelWidth = width;
        }
    }

    /* Return an ID used for drag and drop. */
    get textualId() : string {
        if (!this._parent) {
            return "column_"+this._name;
        } else {
            return this._parent.textualId + "/" + this._name;
        }
    }
}
