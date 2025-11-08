import prices from "./prices.json";

function App() {
    return <div className="font-geist">{JSON.stringify(prices, null, 2)}</div>;
}

export default App;
