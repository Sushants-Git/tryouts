import prices from "./prices.json";

function App() {
    return <div>{JSON.stringify(prices, null, 2)}</div>;
}

export default App;
