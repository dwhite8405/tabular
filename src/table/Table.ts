import Query, { Row } from "query/Query";
import TableColumn from "./TableColumn";

export default abstract class Table {
    public name: string = "Unnamed Table";
    private _columns : TableColumn[];

    /* Return the column hierarchy. */
    abstract get columns(): TableColumn[];

    /* Get the rows from "from" to "to", according to the parameters in the given query. */
    abstract get(q:Query, from:number, to:number): Row[];

    // TODO: are these methods needed???
    abstract refetchColumns() : void;
    abstract refetchContents() : void;
}