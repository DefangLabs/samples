import React, { Fragment } from "react";
import "./App.css";
import Input from "./components/Input";
import List from "./components/List";

function App() {
  return (
    <Fragment>
      <div className="container">
        <Input />
        <List />
      </div>
    </Fragment>
  );
}

export default App;