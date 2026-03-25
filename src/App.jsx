import { useState } from "react";
import "./App.css";

export default function App() {
  const [output, setOutput] = useState(0);

  function handleClick(e) {
    setOutput((prev) => prev + e.target.value);
    console.log(e.target.value);
  }

  const buttons = [
    "C",
    "B",
    "%",
    "/",
    "7",
    "8",
    "9",
    "X",
    "4",
    "5",
    "6",
    "-",
    "1",
    "2",
    "3",
    "+",
    "00",
    "0",
    ".",
    "=",
  ];

  return (
    <div className="main-container">
      <p className="output">{output}</p>

      {
        <div className="keys">
          {buttons.map((btn, index) => (
            <button
              key={index}
              value={btn}
              onClick={handleClick}
              className="btn"
            >
              {btn}
            </button>
          ))}
        </div>
      }
    </div>
  );
}
