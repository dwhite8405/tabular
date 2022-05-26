import React, { CSSProperties, MouseEventHandler, ReactElement } from 'react';
import { CollectionQuery } from 'query/CollectionQuery';
import Query, * as query from 'query/Query';
import './DataTable.css';
//import { ContextMenu, ContextMenuTrigger, MenuItem } from 'react-contextmenu';
import { ColumnDefinition } from 'query/ColumnDefinition';
import { ComplexColumnDefinition } from 'query/ComplexColumnDefinition';
import { RowHeader } from './RowHeader';

// TODO If the size of the contents div changes:
//  https://www.pluralsight.com/guides/re-render-react-component-on-window-resize


export interface DataTableProps {
    query: Query;
    refetch: any; // function. TODO: what is its type?
    children: never[];
}

export interface DataTableState {
    firstVisibleRow: number; // Index of the row at the top of the visible table.  
    dropColumnMarkerPosition: number | null;
    resizingColumn?: ColumnDefinition; // null, or which column we're resizing.
}

export class DataTable extends React.Component<DataTableProps, DataTableState> {
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
        this.state = {
            firstVisibleRow: 0,
            dropColumnMarkerPosition: null,
            resizingColumn: undefined
        };
        this.contentDivRef = React.createRef();

        this.onOrderBy = this.onOrderBy.bind(this);
        this.renderHeadings = this.renderHeadings.bind(this);
        this.renderTableContent = this.renderTableContent.bind(this);
    }

    public static defaultProps = {
        table: (new CollectionQuery([], [])),
        refetch: (() => { })
    }

    render = () => {

        this.numRows = this.props.query.count();
        let gridStyle = this.gridStyle();

        this.firstRenderedRow = this.state.firstVisibleRow;
        this.lastRenderedRow = this.state.firstVisibleRow + this.numVisibleRows + 2;

        return (
            <div className="datatable"
                onMouseMove={this.onMouseMove}
                onMouseUp={this.onMouseUp}
                onMouseLeave={this.onMouseUp}
                onDrop={this.onHeadingDrop}
                onDragOver={this.onHeadingDragOver}>
                {/* The "filter" box above the table. */}
                <div className="datatable-filterdiv">
                    Filter goes here.
                </div>

                {/* The column headings. */}
                <div
                    className="datatable-headerdiv"
                    style={gridStyle}>
                    {this.renderDropColumnMarker()}
                    {this.renderHeadings()}
                </div>

                {/* The scroll bar. */}
                <div
                    className="datatable-contentsdiv"
                    style={gridStyle}
                    onScroll={(e) => this.handleScroll(e)}
                    ref={this.contentDivRef}>

                    {/* The enourmous div to make the scroll bar happen. */}
                    <div style={{ height: this.pixelsPerRow * this.numRows }}>

                        {/* Only the currently visible rows. */}
                        <div style={{
                            ...gridStyle,
                            transform: `translateY(${this.state.firstVisibleRow * this.pixelsPerRow}px)`
                        }}>
                            {this.renderTableContent()}
                        </div>
                    </div>
                </div>

                {/*this.contextMenus()*/}
            </div>
        );
    }

    private gridStyle = () => {
        let columnWidths = (
            this.props.query.expandedColumns
                .map((each) => each.pixelWidth));

        let c =
            columnWidths
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
        let rootColumn: ComplexColumnDefinition = this.props.query.select;
        if (rootColumn.isEmpty()) {
            return <></>;
        }

        let laidOutColumns: ColumnsLaidOut = ColumnsLaidOut.fromColumnDefinition(rootColumn);

        // TODO: working here. Add divs with position:absolute as the drop markers for a column.
        return <>{
            laidOutColumns.map(each => {
                let layout = {
                    gridRowStart: each.row + 1,
                    gridRowEnd: each.row + 2,
                    gridColumnStart: each.columnStart + 1,
                    gridColumnEnd: each.columnEnd + 2
                };

                let key = `G${each.row}|${each.columnStart}|${each.columnEnd}`

                return <RowHeader
                    column={each.columnDefinition}
                    layout={layout}
                    key={key}
                    orderedBy={query.orderedBy(this.props.query, each.columnDefinition)}
                    onOrderBy={this.onOrderBy}
                    startResizeColumn={this.onMouseDown}
                    columnsChanged={this.columnsChanged}
                />
            })
        }</>;
    }

    /** Render only the visible cells. */
    private renderTableContent(): JSX.Element[] {
        let rows = this.props.query.get(this.firstRenderedRow, this.lastRenderedRow);
        let bgColor: string;
        if (this.state.resizingColumn) {
            bgColor = 'red';
        } else {
            bgColor = 'pink';
        }

        let renderRows: Array<ReactElement> = [];
        for (let y = 0; y < rows.length; y++) {
            for (let x = 0; x < rows[y].cells.length; x++) {
                const layout: React.CSSProperties = {
                    overflowX: "hidden",
                    height: this.pixelsPerRow,
                    gridRowStart: y + 1,
                    gridRowEnd: y + 2,
                    gridColumnStart: x + 1,
                    gridColumnEnd: x + 2,
                    whiteSpace: 'nowrap',
                    backgroundColor: bgColor,
                    textAlign: "right" // It would be nice to making decimal points match.
                }

                renderRows.push(<div style={layout} key={`R${y}C${x}`}>
                    {this.asString(rows[y].cells[x])}
                </div>);
            }
        }

        return renderRows;
    }

    private renderDropColumnMarker(): JSX.Element {
        if (null === this.state.dropColumnMarkerPosition) {
            return <></>
        } else {
            let style: CSSProperties = {
                backgroundColor: 'yellow',
                position: 'absolute',
                marginLeft: `${this.state.dropColumnMarkerPosition}px`,
                width: 10,
                height: 200
            }
            return <div style={style}>XXX</div>
        }
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

    /* Callback from ColumnHeaders to order by that column. */
    private onOrderBy(
        column: ColumnDefinition,
        orderBy: query.OrderedBy
    )
        : void {
        console.log(`Ordering by ${orderBy}`);
        this.props.query.orderBy(column, orderBy);
        this.props.refetch(this.props.query);
    }

    /* Callback from columns when there are changes in orderedBy, expand. 
       OPTIMIZATION: This can be split up into multiple event handlers. */
    private columnsChanged = () => {
        this.props.query.select.renumberColumns();
        this.forceUpdate();
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

    /*
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
    }*/


    // DragEventHandler<HTMLDivElement> | undefined;
    onHeadingDrop = (ev: React.DragEvent<HTMLDivElement>) => {
        // Don't forget about the potential of drag/dropping columns between multiple tables.
        ev.preventDefault();
        let data = ev.dataTransfer.getData("text");
        console.log(`Drop: ${(ev.currentTarget as HTMLDivElement).id} got data ${data}`);
        if (data.startsWith("column_")) {
            this.moveColumn(data, ev.clientX);
        }
        this.setState({ dropColumnMarkerPosition: null });
    }

    /* Move the column from the drag&drop text to the given pixel position. */
    private moveColumn(dropData: string, pixelX: number) {
        let from: ColumnDefinition | null = this.findColumnWithTextualId(dropData);
        if (null == from) return;
        let to: number = this.findExpandedColumnIndexAtPixelX(pixelX);

        let q: Query = this.props.query;
        q.moveColumn(from, to);
        this.columnsChanged();
    }

    private findColumnWithTextualId = (dropData: string) => {
        for (let c of this.props.query.expandedColumns) {
            if (c.textualId == dropData) {
                return c;
            }
        }
        return null;
    }

    private findExpandedColumnIndexAtPixelX = (pixelPosition: number) => {
        // -1 means insert before the first column.
        let index = -1;
        // Start at half a column's width to the left of the first column.
        let widthSoFar = 0;
        for (let c of this.props.query.expandedColumns) {
            if (widthSoFar + c.pixelWidth/2 > pixelPosition) {
                return index;
            }
            widthSoFar = widthSoFar + c.pixelWidth;
            index++;
        }

        return index;
    }

    // DragEventHandler<HTMLDivElement> | undefined;
    onHeadingDragOver = (ev: React.DragEvent<HTMLDivElement>) => {
        ev.preventDefault();
        this.setState({ dropColumnMarkerPosition: this.snapToColumnEdge(ev.clientX) });
    }

    private snapToColumnEdge(x: number) {
        let widthSoFar = 0;
        for (let c of this.props.query.expandedColumns) {
            if (widthSoFar > x - c.pixelWidth / 2) {
                return widthSoFar;
            }
            widthSoFar = widthSoFar + c.pixelWidth;
        }
        return widthSoFar;
    }

    onMouseMove: MouseEventHandler<HTMLDivElement> = (ev) => {
        if (this.state.resizingColumn) {
            console.log(`Resizing column: ${this.state.resizingColumn.name} which has width ${this.state.resizingColumn.pixelWidth}`);

            ev.preventDefault(); // Stop us from selecting text.
            let columnLeft = this.props.query.expandedColumns
                .slice(0, this.state.resizingColumn.columnNumber)
                .map(each => each.pixelWidth)
                .reduce((x, y) => x + y, 0);

            this.state.resizingColumn.pixelWidth = ev.clientX - columnLeft;
            // TODO: use React properly here. Make header components.
            console.log(`Resizing to ${ev.clientX} - ${columnLeft}`);
            this.setState(this.state);
        }
    }

    onMouseDown = (ev: React.MouseEvent<HTMLDivElement>, column: ColumnDefinition) => {
        ev.preventDefault(); // Stop us from selecting text instead.
        this.setState({ resizingColumn: column });
    }

    onMouseUp: MouseEventHandler<HTMLDivElement> = (ev) => {
        this.setState({ resizingColumn: undefined });
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
                while (1 + x + thisWidth < row.length && undefined === row[1 + x + thisWidth]) {
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

export function miniButton(
    cssClass: string,
    contents: string,
    action: ((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void)) {
    return (<button onClick={action} className={cssClass}>{contents}</button>);
}

