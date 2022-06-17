import Query, { PrimitiveType, Row } from "query/Query";
import TableColumn from "./TableColumn";

export default abstract class Table implements TableConstructor {
    public name: string = "Unnamed Table";
    private _columns : TableColumn[] = [];

    public query = () => {
        return new Query(this);
    }

    /* Return the column hierarchy. */
    get columns() {
        return this._columns;
    }

    /* Get the rows from "from" to "to", according to the parameters in the given query. */
    abstract get(q:Query, from:number, to:number): Row[];

    /* Get the number of rows that would be returned based on that query's filter. */
    abstract getCount(q:Query): number;

    abstract refetchColumns() : void;

    public addColumn = (name: string, type: PrimitiveType, parent?: TableColumn) => {
        let t : TableColumn = new TableColumn(name, type);
        if (null===parent) {
            this._columns.push(t);
        } else {
            parent?.children.push(t)
        }
    }
}

interface TableConstructor {
    addColumn(name: string, type: PrimitiveType, parent?: TableColumn) : void;
}