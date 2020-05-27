import React, { Component } from "react";
import fetch from "node-fetch";
import "./App.css";
import fibonacci from "./js/fibonacci";
import wasmC from "./wasm/fibonacci.c";

class App extends Component {
  constructor() {
    super();
    this.state = {
      jsFibonacci: null,
      cFibonacci: null,
    };
  }

  componentDidMount() {
    console.log(process.env.NODE_ENV);
    if (process.env.NODE_ENV === "development") {
      wasmC({
        global: {},
        env: {
          memoryBase: 0,
          tableBase: 0,
          memory: new WebAssembly.Memory({ initial: 256 }),
          table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
        },
      }).then((result) => {
        const exports = result.instance.exports;
        const fibonacci = exports.fibonacci;
        this.doSomething(fibonacci);
      });
    } else {
      const wasmUrl = "/static/wasm/fibonacci.c.wasm";
      this.doSomething(wasmUrl);
    }
  }

  getExportFunction = async (url) => {
    const env = {
      memoryBase: 0,
      tableBase: 0,
      memory: new WebAssembly.Memory({
        initial: 256,
      }),
      table: new WebAssembly.Table({
        initial: 2,
        element: "anyfunc",
      }),
    };
    const instance = await fetch(url)
      .then((response) => {
        return response.arrayBuffer();
      })
      .then((bytes) => {
        return WebAssembly.instantiate(bytes, { env: env });
      })
      .then((instance) => {
        return instance.instance.exports;
      });
    return instance;
  };

  doSomething = async (wasm) => {
    if (process.env.NODE_ENV !== "development") {
      const { fibonacci } = await this.getExportFunction(wasm);
      this.setState({
        cFibonacci: this.getDuring(fibonacci),
        jsFibonacci: this.getDuring(fibonacci),
      });
      return;
    }
    this.setState({
      cFibonacci: this.getDuring(wasm),
      jsFibonacci: this.getDuring(fibonacci),
    });
  };

  getDuring(func) {
    const start = Date.now();
    func && func(40);
    return Date.now() - start;
  }

  render() {
    console.log(this.state);
    return (
      <div className="App">
        <header className="App-header">
          <h2>测试计算递归无优化的斐波那契数列性能</h2>
          <h3>当值为 40 时</h3>
          <span>
            Javascript实现的斐波那契函数耗费： {this.state.jsFibonacci} ms
          </span>
          <span>C实现的斐波那契函数耗费： {this.state.cFibonacci} ms</span>
        </header>
      </div>
    );
  }
}

export default App;
