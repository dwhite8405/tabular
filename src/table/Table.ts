import TableColumn from "./TableColumn";

export default abstract class Table {
    public name: String = "Unnamed Table";

    abstract get columns(): TableColumn[];
}