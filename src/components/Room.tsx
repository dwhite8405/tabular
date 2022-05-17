import React from 'react';
import Query, * as query from 'query/Query';

/* A room contains the state of a table - the data, a list of edits, the selected row, the selected column, etc.

You put DataTables and other components inside me.

Any component inside me gets updated with the currently selected row and any
edited elements in that table.
*/

export interface RoomProps {
    children: React.ReactNode;
    query: Query;
}

export interface RoomState {
    query: Query;
}

export class Room extends React.Component<RoomProps, RoomState> {
    constructor(props: Readonly<RoomProps>) {
        super(props);
        this.state = { query: props.query };
        this.refetch = this.refetch.bind(this);
        this.render = this.render.bind(this);
    }

    componentDidMount = () => {
        this.refetch(this.state.query.copy());
    }

    componentDidUpdate = (previous : RoomProps) => {
        if (previous.query !== this.props.query) {
            this.refetch(this.props.query);
        }
    }

    refetch(q: Query) {
        q.refetchColumns();
        this.setState({ query: q }); // Show the columns.
        q.refetchContents();
        this.setState({ query: q }); // Show the contents.
    }

    //React.Children.forEach(children, (each) => console.log("Child: "+each));

    render() {
        return React.Children.map(this.props.children, (each) =>
            React.cloneElement(each as React.ReactElement<any>,
                { query: this.state.query, refetch: this.refetch }));
    }
}
