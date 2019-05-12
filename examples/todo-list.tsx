import * as React from "react";

type State = {
  currentValue: string;
  items: Array<string>;
};

type Action =
  | { type: "input-change"; value: string }
  | { type: "add" }
  | { type: "delete"; index: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "input-change": {
      return { ...state, currentValue: action.value };
    }
    case "add": {
      return {
        ...state,
        items: [...state.items, state.currentValue]
      };
    }
    case "delete": {
      const s = {
        ...state,
        items: state.items.filter((value, index) => index !== action.index)
      };

      return s;
    }
  }
  return state;
}

const initialState: State = {
  currentValue: "",
  items: []
};

export default function TodoList() {
  const [{ items }, dispatch] = React.useReducer(reducer, initialState);

  function onChange(event: any) {
    dispatch({ type: "input-change", value: event.target.value });
  }

  function addItem() {
    dispatch({ type: "add" });
  }

  return (
    <div>
      <input type="text" onChange={onChange} />
      <button onClick={addItem}>Add</button>
      <ul>
        {items.map(function(item, index) {
          return (
            <li key={index}>
              {item}
              <button
                onClick={function() {
                  dispatch({ type: "delete", index });
                }}
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
