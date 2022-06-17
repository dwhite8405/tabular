import * as OData from 'odata/OData';
import { QueryColumn } from '../query/QueryColumn';
import Query, { Row, OrderedBy } from '../query/Query';
import Table from './Table';
import TableColumn from './TableColumn';

export class ODataTable extends Table {
    _baseURL: string;
    _skip?: number;
    _top?: number;
    _contents: Array<Row>;

    static create(baseURL: string, name: string): Table {
        let result = new this().baseURL(baseURL);
        result.name = name;
        return result;
    }

    constructor() {
        super();
        this._baseURL = "";
        this._contents = [];
        this.url = this.url.bind(this);
        this.refetchColumns = this.refetchColumns.bind(this);
        this.refetchContents = this.refetchContents.bind(this);
    }

    private baseURL(url: string): Table {
        this._baseURL = url;
        return this;
    }


    private url(q: Query): string {
        let base = this._baseURL + "/" + this.name;
        if (q._orderBy.length > 0) {
            return base + "?" + this.urlOrderedBy(q);
        } else {
            return base;
        }
    }

    private urlOrderedBy(q: Query): string {
        let result: string = "$orderby=" + q._orderBy[0].column.name + "%20";
        switch (q._orderBy[0].orderedBy) {
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
        OData.setTableColumns(this, await data, this.name);
    }
    
    private async refetchContents(q: Query) {
        let response = fetch(this.url(q));
        OData.setContents(this, await ((await response).json()));
    }

    get contents(): Array<Row> {
        return this._contents;
    }

    set contents(c: Array<Row>) {
        this._contents = c;
        console.log(`Got ${this._contents.length} elements.`);
    }

    count = () => {
        // TODO
        return this._contents.length;
    }

    get: (q:Query, from: number, to: number) => Row[] = 
    (q:Query, from: number, to: number) => {
        this.refetchContents(q);
        return this._contents.slice(from, to);
    }

    getCount(q: Query): number {
        throw new Error('Method not implemented.');
    }
}
