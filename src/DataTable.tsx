import React from 'react';
import { CollectionQuery } from './collectionQuery';
import * as query from './query';
import './App.css';
import './DataTable.css';
import { ContextMenu, ContextMenuTrigger, MenuItem } from 'react-contextmenu';

// TODO If the size of the contents div changes:
//  https://www.pluralsight.com/guides/re-render-react-component-on-window-resize


export interface DataTableProps {
    table: query.Query;
    refetch: any; // function. TODO: what is its type?
    children: never[];
}

export interface DataTableState {
    firstVisibleRow: number; // Index of the row at the top of the visible table.
}

export class DataTable extends React.Component<DataTableProps, DataTableState> {
    // What percentage (actually 0 to 1) of rows to render off-screen as a buffer.

    private columnWidths: Array<number>;
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
        this.numRows = this.props.table.count();
        this.columnWidths = (
            range(this.props.table.numColumns())
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

    private renderHeadings(): JSX.Element {
        let columns: query.ComplexColumnDefinition = this.props.table.select;
        let mmaxDepth: number = columns.depth();
        

        if (columns.isEmpty()) {
            return <></>
        } else {
            return <> {
                range(mmaxDepth).map(ddepth =>
                (<>
                    {this.renderHeadingsToHtmlAtDepth(columns, ddepth,
                        mmaxDepth)}
                </>
                ))
            } </>
        }
    }

    /* Render one row of the columns. There are multiple rows depending on which
    columns have been expanded. */
    private renderHeadingsToHtmlAtDepth = (
        columns: query.ComplexColumnDefinition,
        ddepth: number,
        mmaxDepth: number) => {
            let widths : number[] = [0, ...columns.map(each => each.width())];
            

        return (<>
            {columns.map(
                (each, i) =>
                    this.renderHeadingToHtml(
                        each, i, widths, ddepth)
            )
            }
        </>);
    }

    /* Render one column heading. */
    private renderHeadingToHtml(
        column: query.ColumnDefinition,
        index: number,
        widths: number[],
        ddepth: number)
        : JSX.Element {
        console.log(`Rendering at depth ${ddepth}`)

        let t = this.props.table;

        let renderMe: Array<query.ColumnDefinition> =
            columnAtDepth(column, ddepth);

        let collapse: JSX.Element;
        if (column.isComplex()) {
            if (this.props.table.isExpanded(column)) {
                collapse = miniButton("datatable-expandbutton", "⏷",
                    (e) => this.onUnexpandComplexColumn(e, t, column));
            } else {
                collapse = miniButton("datatable-expandbutton", "⏵",
                    (e) => this.onExpandComplexColumn(e, t, column));
            }
        }

        let orderBy: JSX.Element;
        switch (query.orderedBy(t, column)) {
            case query.OrderedBy.ASC:
                orderBy = miniButton("datatable-sortbutton", "◢", (e) =>
                    this.onOrderBy(e, t, column, query.OrderedBy.DESC));
                break;
            case query.OrderedBy.DESC:
                orderBy = miniButton("datatable-sortbutton", "◥", (e) =>
                    this.onOrderBy(e, t, column, query.OrderedBy.NA));
                break;
            default:
                orderBy = miniButton("datatable-sortbutton", "◇", (e) =>
                    this.onOrderBy(e, t, column, query.OrderedBy.ASC));
                break;
        }

        let gridColumnStart = widths.slice(0, index+1).reduce( (sum, current) => sum+current );
        let gridColumnEnd = gridColumnStart + widths[index+1];
        
        const layout = {
            gridRowStart: ddepth,
            gridRowEnd: ddepth,
            gridColumnStart: gridColumnStart+1,
            gridColumnEnd: gridColumnEnd+1
        }


        return (<>
            {renderMe.map(each => {
                return <div style={layout}>
                    <ContextMenuTrigger
                        id="contextmenu"
                        holdToDisplay={1000}>
                        {/* We assume the first child here has data-columnName */}
                        <div
                            className="datatable-head-cell"
                            data-columnname={each.name}>
                            {collapse}
                            <span>{each.name}</span>
                            {orderBy}
                        </div>
                    </ContextMenuTrigger>
                </div>
            }
            )}
        </>);
    }

    /** Render only the visible cells. */
    private renderTableContent(): JSX.Element[] {
        let rows = this.props.table.get(this.firstRenderedRow, this.lastRenderedRow);
        return (
            rows.map((eachRow, row) =>
                <>
                    {eachRow.cells.map((eachCell, column) => {
                        const layout: React.CSSProperties = {
                            overflowX: "hidden",
                            height: this.pixelsPerRow,
                            gridRowStart: row + 1,
                            gridRowEnd: row + 1,
                            gridColumnStart: column + 1,
                            gridColumnEnd: column + 1,
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


/** Used to render hierarchical headings. */
function columnAtDepth(
    column: query.ColumnDefinition,
    ddepth: number)
    : Array<query.ColumnDefinition> {
    if (1 === ddepth) {
        return [column];
    } else {
        if (column.isComplex()) {
            let children: Array<query.ColumnDefinition> =
                column.childs();
            return flatten(
                children.map(columnAtDepth)
            );
        } else {
            return []; // We are below the depth of a primitive column.
        }
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

