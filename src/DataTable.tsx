import React from 'react';
import { CollectionQuery } from './collectionQuery';
import * as query from './query';
import './App.css';
import './DataTable.css';
import { ContextMenu, ContextMenuTrigger, MenuItem } from 'react-contextmenu';
import { ColumnDefinition, ComplexColumnDefinition } from './query';
import { RoomState } from './Room';

// TODO If the size of the contents div changes:
//  https://www.pluralsight.com/guides/re-render-react-component-on-window-resize


export interface DataTableProps {
    query: query.Query;
    refetch: any; // function. TODO: what is its type?
    children: never[];
}

export interface DataTableState {
    firstVisibleRow: number; // Index of the row at the top of the visible table.
}

export class DataTable extends React.Component<DataTableProps, DataTableState> {
    private columnWidths: Array<number>;

    // A mechanism to get to the DOM to get the content div height.
    private contentDivRef: React.RefObject<HTMLDivElement>;

    private height: number = 100; // Height in pixels of the visible table contents.

    // Managing virtual scrolling:
    private pixelsPerRow: number = 30;
    private numVisibleRows: number = 3; // Should be height/pixelsPerRow
    private firstRenderedRow: number = 0; // Off-screen, the first row we render.
    private lastRenderedRow: number = 0; // Off-screen, the last row we render.
    private numRows: number = 1;

    constructor(props: Readonly<DataTableProps>) {
        super(props);
        this.columnWidths = [];
        this.state = {
            firstVisibleRow: 0
        };
        this.contentDivRef = React.createRef();

        this.onOrderBy = this.onOrderBy.bind(this);
        this.onExpandComplexColumn = this.onExpandComplexColumn.bind(this);
        this.onUnexpandComplexColumn = this.onUnexpandComplexColumn.bind(this);
        this.renderHeadingToHtml = this.renderHeadingToHtml.bind(this);
        this.renderHeadings = this.renderHeadings.bind(this);
        this.renderTableContent = this.renderTableContent.bind(this);
    }

    public static defaultProps = {
        table: (new CollectionQuery([], [])),
        refetch: (() => { })
    }

    render = () => {
        this.numRows = this.props.query.count();
        this.columnWidths = (
            range(this.props.query.numColumns())
                .map((a) => 100));

        this.firstRenderedRow = this.state.firstVisibleRow;
        this.lastRenderedRow = this.state.firstVisibleRow + this.numVisibleRows + 2;

        return (
            <div className="datatable">
                {/* The "filter" box above the table. */}
                <div className="datatable-filterdiv">
                    Filter
                </div>

                {/* The column headings. */}
                <div
                    className="datatable-headerdiv"
                    style={this.gridStyle()}>
                    {this.renderHeadings()}
                </div>

                {/* The scroll bar. */}
                <div
                    className="datatable-contentsdiv"
                    style={this.gridStyle()}
                    onScroll={(e) => this.handleScroll(e)}
                    ref={this.contentDivRef}>

                    {/* The enourmous div to make the scroll bar happen. */}
                    <div style={{ height: this.pixelsPerRow * this.numRows }}>

                        {/* Only the currently visible rows. */}
                        <div style={{
                            ...this.gridStyle(),
                            transform: `translateY(${this.state.firstVisibleRow * this.pixelsPerRow}px)`
                        }}>
                            {this.renderTableContent()}
                        </div>
                    </div>
                </div>
                {this.contextMenus()}
            </div>
        );
    }

    private gridStyle = () => {
        let c =
            this.columnWidths
                .map((each) => `${each}px `)
                .reduce((a, v) => a.concat(v), "");

        return {
            display: 'grid',
            gridTemplateColumns: c,
            backgroundColor: "blue"
        };
    }

    /* Render the column headings.
       They could be turned into a seperate component, but it's
       actually simpler to manage having all this in the same
       component... for now. */
    private renderHeadings(): JSX.Element {
        let rootColumn: query.ComplexColumnDefinition = this.props.query.select;
        if (rootColumn.isEmpty()) {
            return <></>;
        }

        let laidOutColumns: ColumnsLaidOut = ColumnsLaidOut.fromColumnDefinition(rootColumn);

        return <>{
            laidOutColumns.map(each => {
                let layout = {
                    gridRowStart: each.row+1,
                    gridRowEnd: each.row+2,
                    gridColumnStart: each.columnStart + 1,
                    gridColumnEnd: each.columnEnd + 2
                };

                let key = `G${each.row}|${each.columnStart}|${each.columnEnd}`

                return this.renderHeadingToHtml(each.columnDefinition, layout, key);
            })
        }</>;
    }

    /* Render one column heading. */
    private renderHeadingToHtml = (
        column: query.ColumnDefinition,
        layout: any,
        key: string) => {

        let t = this.props.query;

        let collapse: JSX.Element;
        if (column.hasChildren()) {
            if (this.props.query.isExpanded(column)) {
                collapse = miniButton("datatable-expandbutton", "⏷",
                    (e) => this.onUnexpandComplexColumn(e, t, column));
            } else {
                collapse = miniButton("datatable-expandbutton", "⏵",
                    (e) => this.onExpandComplexColumn(e, t, column));
            }
        } else {
            collapse = <></>;
        }

        let xorderBy: JSX.Element;
        switch (query.orderedBy(t, column)) {
            case query.OrderedBy.ASC:
                xorderBy = miniButton("datatable-sortbutton", "◢", (e) =>
                    this.onOrderBy(e, t, column, query.OrderedBy.DESC));
                break;
            case query.OrderedBy.DESC:
                xorderBy = miniButton("datatable-sortbutton", "◥", (e) =>
                    this.onOrderBy(e, t, column, query.OrderedBy.NA));
                break;
            default:
                xorderBy = miniButton("datatable-sortbutton", "◇", (e) =>
                    this.onOrderBy(e, t, column, query.OrderedBy.ASC));
                break;
        }

        return <div style={layout} key={key}>
            <ContextMenuTrigger
                id="contextmenu"
                holdToDisplay={1000}>
                {/* We assume the first child here has data-columnName */}
                <div
                    className="datatable-head-cell"
                    data-columnname={column.name}>
                    {collapse}
                    <span>{column.name}</span>
                    {xorderBy}
                </div>
            </ContextMenuTrigger>
        </div>;
    }

    /** Render only the visible cells. */
    private renderTableContent(): JSX.Element[] {
        let rows = this.props.query.get(this.firstRenderedRow, this.lastRenderedRow);
        return (
            rows.map((eachRow, row) =>
                <>
                    {eachRow.cells.map((eachCell, column) => {
                        const layout: React.CSSProperties = {
                            overflowX: "hidden",
                            height: this.pixelsPerRow,
                            gridRowStart: row + 1,
                            gridRowEnd: row + 2,
                            gridColumnStart: column + 1,
                            gridColumnEnd: column + 2,
                            whiteSpace: 'nowrap',
                            backgroundColor: "red",
                            textAlign: "right" // It would be nice to making decimal points match.
                        }
                        return <div key={`R${row}C${column}`}
                            style={layout}>
                            {this.asString(eachCell)}
                        </div>
                    }
                    )}
                </>
            ));
    }

    private asString(o: any): string {
        if ("object" === typeof o) {
            let v = Object.values(o);
            if (v.length > 0) {
                return this.asString(Object.values(o)[0]);
            } else {
                return "";
            }
        } else {
            return String(o);
        }
    }

    private onOrderBy(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        t: query.Query,
        column: query.ColumnDefinition,
        orderBy: query.OrderedBy
    )
        : void {
        console.log(`Ordering by ${orderBy}`);
        let t2 = t.copy();
        t2.orderBy(column, orderBy);
        this.props.refetch(t2);
    }

    private onExpandComplexColumn(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        t: query.Query,
        column: query.ColumnDefinition
    )
        : void {
        console.log("Expand " + column.name);

        this.props.refetch(t.copy().expand(column));
    }

    private onUnexpandComplexColumn(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        t: query.Query,
        column: query.ColumnDefinition
    )
        : void {
        console.log("Unexpand " + column.name);
        this.props.refetch(t.copy().unexpand(column));
    }

    // For a discussion of some problems with this:
    // https://firefox-source-docs.mozilla.org/performance/scroll-linked_effects.html
    handleScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
        let scrollY = (event.target as any).scrollTop;
        let currentTopVisibleRow = Math.floor(scrollY / this.pixelsPerRow);
        this.setState({ firstVisibleRow: currentTopVisibleRow });
    }


    componentDidMount: () => void = () => {
        console.log("componentDidMount");
        if (null !== this.contentDivRef.current) {
            this.height = this.contentDivRef.current.clientHeight;
            // Plus 2 - one to counteract Math.floor, one to cover the gap at the bottom.
            this.numVisibleRows = Math.floor(this.height / this.pixelsPerRow) + 1;
        }
    }

    contextMenus = () => {
        return <ContextMenu id="contextmenu">
            <MenuItem data={{ foo: 'bar' }} onClick={this.contextMenuOnClick}>
                Click me.
            </MenuItem>
        </ContextMenu>
    }

    contextMenuOnClick = (
        e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement, MouseEvent>,
        data: Object,
        target: HTMLElement) => {
        let columnHeading: string | null = target.getAttribute("data-column-heading");

        alert(`Clicked on ${target?.firstElementChild?.getAttribute('data-columnname')}`)
    }
}

interface PositionedHeading {
    columnStart: number;
    columnEnd: number;
    row: number;
    columnDefinition: ColumnDefinition;
}

/* I'm a processed copy of the columns to make rendering easier. Instead of a tree, I'm 
organised by row of columns. 

To be honest, I'm really just a 2D array.
*/
class ColumnsLaidOut {
    private columnRows: Array<Array<ColumnDefinition | undefined>> = [];

    static fromColumnDefinition(root: ComplexColumnDefinition): ColumnsLaidOut {
        let result: ColumnsLaidOut = new ColumnsLaidOut();
        let rightEdge: number[] = [0]; // I'm a container for a mutable value.
        this.fromColumnDefinitionImpl(root, 0, rightEdge, result);
        return result;
    }

    static fromColumnDefinitionImpl(
        column: ComplexColumnDefinition,
        depth: number,
        rightEdge: number[],
        result: ColumnsLaidOut) {
        for (let each of column.childs()) {
            result.put(rightEdge[0], depth, each);
            if (each instanceof ComplexColumnDefinition && each.isExpanded) {
                this.fromColumnDefinitionImpl(each, depth + 1, rightEdge, result);
            } else {
                rightEdge[0] = rightEdge[0] + 1;
            }
        }
    }

    /* Put that object at x,y. I'm effectively a 2D array. Pad with undefineds when necessary. */
    put = (x: number, y: number, me: ColumnDefinition) => {
        while (this.columnRows.length <= y) {
            this.columnRows.push([]);
        }
        let myRow = this.columnRows[y];
        while (myRow.length <= x) {
            myRow.push(undefined);
        }
        myRow[x] = me;
    }

    /* Map a function, passing a PositionedHeading in. */
    map<U>(
        callbackfn: (value: PositionedHeading, index: number, array: PositionedHeading[]) => U,
        thisArg?: any)
        : U[] {
        let result: U[] = [];
        let y: number = 0;
        for (let rowIter of this.columnRows) {
            // This code is funky because I'm having compiler issues.
            let row: Array<ColumnDefinition | undefined> = rowIter;
            for (let x: number = 0; x < row.length; x++) {
                let r: ColumnDefinition;
                if (undefined !== row[x]) {
                    r = row[x] as ColumnDefinition;
                } else {
                    continue;
                }

                // The width of a row includes all the "undefined" columns after it.
                let thisWidth = 0;
                while (1+x+thisWidth < row.length && undefined === row[1+x+thisWidth]) {
                    thisWidth++;
                }

                let value = {
                    columnStart: x,
                    columnEnd: x + thisWidth,
                    row: y,
                    columnDefinition: r
                };
                let resultValue = callbackfn(value, x, [value]);
                result.push(resultValue);
            }
            y++;
        }
        return result;
    }

    get = (x: number, y: number) => {
        return this.columnRows[y][x];
    }
}

export function range(to: number) {
    let result = Array.from(Array(to + 1).keys());
    result.shift(); // Remove the zero.
    return result;
}

function flatten(list: Array<any>) {
    return [].concat.apply([], list);
}

function miniButton(
    cssClass: string,
    contents: string,
    action: ((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void)) {
    return (<button onClick={action} className={cssClass}>{contents}</button>);
}

