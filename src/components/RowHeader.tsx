import React, { CSSProperties, MouseEventHandler } from 'react';
import { CollectionQuery } from 'query/CollectionQuery';
import Query, * as query from 'query/Query';
import './DataTable.css';
import { ColumnDefinition } from 'query/ColumnDefinition';
import { ComplexColumnDefinition } from 'query/ComplexColumnDefinition';
import { miniButton } from './DataTable';

// TODO If the size of the contents div changes:
//  https://www.pluralsight.com/guides/re-render-react-component-on-window-resize


export interface RowHeaderProps {
    column : ColumnDefinition;
    layout : CSSProperties;
    orderedBy: query.OrderedBy;
    onOrderBy: (c:ColumnDefinition, o:query.OrderedBy) => void;
    startResizeColumn: (ev: React.MouseEvent<HTMLDivElement>, column : ColumnDefinition) => void;
    columnsChanged : () => void;
}

export interface RowHeaderState {
    // I... have no state!?
}

export class RowHeader extends React.Component<RowHeaderProps, RowHeaderState> {
    constructor(props: Readonly<RowHeaderProps>) {
        super(props);
        this.state = {
            isExpanded: false,
            width: 100 // TODO: magic number
        };
        this.onExpandComplexColumn = this.onExpandComplexColumn.bind(this);
        this.onUnexpandComplexColumn = this.onUnexpandComplexColumn.bind(this);
    }

    /* Render one column heading. */
    public render = () => {
        let column : ColumnDefinition = this.props.column;
        let collapse: JSX.Element;
        if (column.hasChildren()) {
            if (column.isExpanded) {
                collapse = miniButton("datatable-expandbutton", "⏷",
                    (e) => this.onUnexpandComplexColumn(e) );
            } else {
                collapse = miniButton("datatable-expandbutton", "⏵",
                    (e) => this.onExpandComplexColumn(e) );
            }
        } else {
            collapse = <></>;
        }

        let xorderBy: JSX.Element;
        switch (this.props.orderedBy) {
            case query.OrderedBy.ASC:
                xorderBy = miniButton("datatable-sortbutton", "◢", (e) => {
                    this.props.onOrderBy(column, query.OrderedBy.DESC);
                });
                break;
            case query.OrderedBy.DESC:
                xorderBy = miniButton("datatable-sortbutton", "◥", (e) => {
                    this.props.onOrderBy(column, query.OrderedBy.NA);
                });
                break;
            default:
                xorderBy = miniButton("datatable-sortbutton", "◇", (e) => {
                    this.props.onOrderBy(column, query.OrderedBy.ASC);
                });
                break;
        }

        // We need to do this to make the absolute positioning of the resize grip work.
        // TODO - don't mutate props.
        this.props.layout['position'] = 'relative';

        /* TODO: It looks like this package bit-rotted.
        Maybe implement it myself. 
        <ContextMenuTrigger
        id="contextmenu
        holdToDisplay={1000}>
        */

        return <div
            id={`heading_${column.name}`}
            style={this.props.layout}
            onContextMenu={this.onContextMenu}>
            {/* We assume the first child here has data-columnName */}
            <div
                className="datatable-head-cell"
                data-columnname={column.name}
                draggable={true}
                onDragStart={this.onHeadingDragStart}>
                {collapse}
                <span>{column.name}</span>
                {xorderBy}

            </div>
            {/* A mini div to drag-resize columns. */}
            <div style={{
                position: 'absolute',
                width: 6,
                height: '100%',
                right: 0,
                top: 0,
                cursor: 'ew-resize',
            }} onMouseDown={(ev) => this.props.startResizeColumn(ev, column)}>
            </div>
        </div>;
    }

    private onExpandComplexColumn(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    )
        : void {
        this.props.column.isExpanded = true;
        this.props.columnsChanged();
    }

    private onUnexpandComplexColumn(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    )
        : void {
            this.props.column.isExpanded = false;
            this.props.columnsChanged();
    }

    // DragEventHandler<HTMLDivElement> | undefined;
    onHeadingDragStart(ev: React.DragEvent<HTMLDivElement>) {
        //ev.preventDefault();
        const id = (ev.target as HTMLDivElement).id;
        console.log(`Drag: ${id}`)
        ev.dataTransfer.setData("text", id);
    }

    onContextMenu: MouseEventHandler<HTMLDivElement> = (ev) => {
        ev.preventDefault(); // Prevent the browser context menu.
        alert("Context menu.");
    }

}