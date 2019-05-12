import * as React from "react";

export default function Counter() {
  const [count, setCount] = React.useState(1);

  function increment() {
    setCount(count => count + 1);
  }
  function decrement() {
    setCount(count => count - 1);
  }

  return (
    <main>
      <div>Current Count: {count}</div>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </main>
  );
}
