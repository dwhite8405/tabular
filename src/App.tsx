import React from 'react';
import { DataTable, range } from './DataTable';
import { Room } from './Room';
import * as query from './query';
import { ODataQuery } from './oDataQuery';
import { CollectionQuery } from './collectionQuery';

import './App.css';
import './DataTable.css';

interface AppProps {}
interface AppState {
  currentQuery: query.Query;
}

class App extends React.Component<AppProps, AppState> {
  private readonly url: string = 'https://services.odata.org/V4/TripPinServiceRW/';
  readonly tableName = 'People';
  private queries : query.Query[];
  
  constructor(props: Readonly<AppProps>) {
    super(props);
    this.queries = this.makeQueries();
    this.state = {currentQuery: this.queries[0]};
  }

  render() {
    return (
      <div className="App">
        <Room query={this.state.currentQuery}>
          <select onChange={(e:React.ChangeEvent<HTMLSelectElement>) => this.changed(e)}>
            {this.queries.map((each, index) => {
              return <option key={index} value={index}>{each.name}</option>
            })}
          </select>
          <DataTable query={this.state.currentQuery}>
          </DataTable>
        </Room>
      </div>
    );
  }

  private makeQueries = () => {
    let q1 : query.Query = ODataQuery.create(this.url, this.tableName);
    let q2 : query.Query = new CollectionQuery(
      [{name:'foo'}, {name: 'bar'}, {name: 'baz'}], 
      range(20000).map(each => [each, each+100, each+10000]));
      q2.name = "20000 items.";
    let q3: query.Query = this.makeBigLocalInterestingQuery();
    return [q3, q2, q1];
  }

  private makeBigLocalInterestingQuery() : query.Query {
    let size = 200;

    let contents = range(size).map(index => {
      let integer = index;
      let float = index+(1/index);
      let text = "abcd"+index;
      let expandable = [integer+10, `inside ${text}`, 'inside date'];
      return [integer, float, [expandable, expandable, expandable], 
        text, "a date", "a select"];
    });

    let q = new CollectionQuery(
      [
        {name:'Integer', type:query.PrimitiveType.Int32}, 
        {name: 'Float', type:query.PrimitiveType.Decimal}, 
        {name: 'Expandable', contents: [
          {name:'Inside Integer', type:query.PrimitiveType.Int32}, 
          {name: 'Inside Text', type:query.PrimitiveType.String},
          {name: 'Inside Date', type:query.PrimitiveType.Date}
        ]},
        {name: 'Text', type:query.PrimitiveType.String},
        {name: 'Date', type:query.PrimitiveType.Date},
        {name: 'Select'},
      ], 
      contents);
    q.name = "Interesting stuff";
    return q;
  }

  private changed(e:React.ChangeEvent<HTMLSelectElement>) {
    this.setState({currentQuery:this.queries[parseInt(e.target.value)]});
  }

}

export default App;
