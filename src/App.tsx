import React from 'react';
import { DataTable, range } from './DataTable';
import { Room } from './Room';
import * as query from './query';

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
          <DataTable>
          </DataTable>
        </Room>
      </div>
    );
  }

  private makeQueries = () => {
    let q1 : query.Query = query.ODataQuery.create(this.url, this.tableName);
    let q2 : query.Query = new query.CollectionQuery(
      [{name:'foo'}, {name: 'bar'}, {name: 'baz'}], 
      range(20000).map(each => [each, each+100, each+10000]));
      q2.name = "20000 items.";
    return [q1, q2];
  }

  private changed(e:React.ChangeEvent<HTMLSelectElement>) {
    this.setState({currentQuery:this.queries[parseInt(e.target.value)]});
  }

}

export default App;
