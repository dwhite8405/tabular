
import { AbstractQuery, Row, Query, OrderedBy, ColumnDefinition } from './query';
import * as OData from './odata/odata';


export class ODataQuery extends AbstractQuery {
    _baseURL: string;
    _skip?: number;
    _top?: number;
    _contents: Array<Row>;

    static create(baseURL: string, name: string): Query {
        let result = new this().baseURL(baseURL);
        result.name = name;
        return result;
    }

    constructor() {
        super();
        this._baseURL = "";
        this._contents = [];
        this.url = this.url.bind(this);
        this.copy = this.copy.bind(this);
        this.copyFrom = this.copyFrom.bind(this);
        this.refetchColumns = this.refetchColumns.bind(this);
        this.refetchContents = this.refetchContents.bind(this);
    }

    copy = () => {
        return new ODataQuery().copyFrom(this);
    }

    copyFrom(other: ODataQuery): Query {
        super.copyFrom(other);
        this._baseURL = other._baseURL;
        this._contents = other._contents;
        return this;
    }


    baseURL(url: string): Query {
        this._baseURL = url;
        return this;
    }


    url(): string {
        let base = this._baseURL + "/" + this._tableName;
        if (this._orderBy.length > 0) {
            return base + "?" + this.urlOrderedBy();
        } else {
            return base;
        }
    }

    urlOrderedBy(): string {
        let result: string = "$orderby=" + this._orderBy[0].column.name + "%20";
        switch (this._orderBy[0].orderedBy) {
            case OrderedBy.ASC:
                return result + "asc";
            case OrderedBy.DESC:
                return result + "desc";
            default:
                return "";
        }
    }

    async refetchColumns() {
        let response = fetch(OData.metadataURL(this._baseURL));
        let data = (await response).text();
        OData.setTableColumns(this, await data, this._tableName);
    }
    
    async refetchContents() {
        let response = fetch(this.url());
        OData.setContents(this, await ((await response).json()));
    }

    get contents(): Array<Row> {
        return this._contents;
    }

    set contents(c: Array<Row>) {
        this._contents = c;
        console.log(`Got ${this._contents.length} elements.`);
    }

    get columns() : Array<ColumnDefinition> {
        return this._select.columns;
    }

    set columns(columns : Array<ColumnDefinition>) {
        this._select.columns = columns;
    }

    count = () => {
        // TODO
        return this._contents.length;
    }

    get: (from: number, to: number) => Row[] = 
    (from: number, to: number) => {
        console.log(`Getting from ${from} to ${to}`);
        return this._contents.slice(from, to);
    }
}
