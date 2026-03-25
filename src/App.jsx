import { useState, useRef, useEffect } from "react";
import "./App.css";

// ─── Safe expression evaluator (no eval!) ────────────────────────────

function tokenize(expr) {
  // Tokenize into numbers and operators
  const tokens = [];
  let current = "";

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];

    if ("+-×÷".includes(ch)) {
      // Handle negative numbers: minus at start, or minus after another operator
      if (
        ch === "-" &&
        (tokens.length === 0 || "+-×÷".includes(tokens[tokens.length - 1]))
      ) {
        current += ch;
      } else {
        if (current !== "") {
          tokens.push(current);
          current = "";
        }
        tokens.push(ch);
      }
    } else {
      current += ch;
    }
  }
  if (current !== "") tokens.push(current);

  return tokens;
}

function evaluateTokens(tokens) {
  if (tokens.length === 0) return null;

  // Convert number strings to numbers, validate
  const nums = [];
  const ops = [];

  for (const token of tokens) {
    if ("+-×÷".includes(token) && token.length === 1) {
      ops.push(token);
    } else {
      const num = parseFloat(token);
      if (isNaN(num)) return null; // invalid
      nums.push(num);
    }
  }

  // There should be exactly one more number than operators
  if (nums.length !== ops.length + 1) return null;

  // Phase 1: handle × and ÷ (higher precedence)
  let i = 0;
  while (i < ops.length) {
    if (ops[i] === "×" || ops[i] === "÷") {
      if (ops[i] === "÷" && nums[i + 1] === 0) {
        return "divzero";
      }
      const result =
        ops[i] === "×" ? nums[i] * nums[i + 1] : nums[i] / nums[i + 1];
      nums.splice(i, 2, result);
      ops.splice(i, 1);
    } else {
      i++;
    }
  }

  // Phase 2: handle + and −
  let result = nums[0];
  for (let j = 0; j < ops.length; j++) {
    if (ops[j] === "+") result += nums[j + 1];
    else if (ops[j] === "-") result -= nums[j + 1];
  }

  return result;
}

function safeEvaluate(expression) {
  if (!expression || expression.trim() === "") return null;

  // Strip trailing operator
  let expr = expression.replace(/[+\-×÷]+$/, "");
  if (!expr) return null;

  const tokens = tokenize(expr);
  const result = evaluateTokens(tokens);

  if (result === "divzero") return "divzero";
  if (result === null || !isFinite(result)) return null;

  return result;
}

// ─── Number formatting with commas ───────────────────────────────────

function formatNumber(num) {
  if (num === null || num === undefined) return "";
  // Handle very large / very small numbers
  if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toExponential(4);
  }
  return num.toLocaleString("en-US", { maximumFractionDigits: 10 });
}

function formatExpression(expr) {
  // Add commas to numbers within the expression for display
  return expr.replace(/\d+\.?\d*/g, (match) => {
    const parts = match.split(".");
    parts[0] = parseInt(parts[0], 10).toLocaleString("en-US");
    return parts.join(".");
  });
}

// ─── App Component ───────────────────────────────────────────────────

export default function App() {
  const [expression, setExpression] = useState("");
  const [displayResult, setDisplayResult] = useState("");
  const [history, setHistory] = useState([]);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const historyEndRef = useRef(null);

  // Auto-scroll history to bottom
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const isOperator = (ch) => "+-×÷".includes(ch);
  const lastChar = () => expression[expression.length - 1];

  function handleClick(btn) {
    // ─── Clear ───
    if (btn === "C") {
      setExpression("");
      setDisplayResult("");
      setJustEvaluated(false);
      return;
    }

    // ─── Backspace ───
    if (btn === "B") {
      if (justEvaluated) {
        // After evaluation, clear everything
        setExpression("");
        setDisplayResult("");
        setJustEvaluated(false);
      } else {
        setExpression((prev) => prev.slice(0, -1));
      }
      return;
    }

    // ─── Equals ───
    if (btn === "=") {
      if (!expression) return; // no-op on empty

      const result = safeEvaluate(expression);

      if (result === "divzero") {
        setDisplayResult("Can't divide by zero");
        return;
      }

      if (result === null) {
        setDisplayResult("Error");
        return;
      }

      const formatted = formatNumber(result);

      // Push to history
      setHistory((prev) => [
        ...prev,
        {
          expression: formatExpression(expression),
          result: "= " + formatted,
        },
      ]);

      setDisplayResult("= " + formatted);
      // Keep the expression visible, mark as evaluated
      setJustEvaluated(true);
      return;
    }

    // ─── Percentage ───
    if (btn === "%") {
      if (!expression) return;

      // Find the last number in the expression and divide it by 100
      const match = expression.match(/(\d+\.?\d*)$/);
      if (match) {
        const num = parseFloat(match[1]);
        const percent = num / 100;
        const newExpr =
          expression.slice(0, expression.length - match[1].length) +
          String(percent);
        setExpression(newExpr);
        setJustEvaluated(false);
      }
      return;
    }

    // ─── Operators (+, -, ×, ÷) ───
    if (isOperator(btn)) {
      if (justEvaluated) {
        // Continue from result
        const result = safeEvaluate(expression);
        if (result !== null && result !== "divzero") {
          // Use raw number (no commas) as new expression base
          const rawNum =
            result % 1 === 0 ? String(result) : String(parseFloat(result.toFixed(10)));
          setExpression(rawNum + btn);
          setDisplayResult("");
          setJustEvaluated(false);
          return;
        }
      }

      // Don't allow operator at the very start (except minus for negative)
      if (!expression && btn !== "-") return;

      // Replace trailing operator with new one
      if (expression && isOperator(lastChar())) {
        setExpression((prev) => prev.slice(0, -1) + btn);
      } else {
        setExpression((prev) => prev + btn);
      }
      setJustEvaluated(false);
      return;
    }

    // ─── Decimal point ───
    if (btn === ".") {
      if (justEvaluated) {
        // Start fresh with "0."
        setExpression("0.");
        setDisplayResult("");
        setJustEvaluated(false);
        return;
      }

      // Find the last number segment (after last operator)
      const segments = expression.split(/[+\-×÷]/);
      const lastSegment = segments[segments.length - 1];

      // Don't allow multiple decimals in one number
      if (lastSegment && lastSegment.includes(".")) return;

      // If empty or after operator, prepend 0
      if (!expression || isOperator(lastChar())) {
        setExpression((prev) => prev + "0.");
      } else {
        setExpression((prev) => prev + ".");
      }
      return;
    }

    // ─── Number input ───
    if (justEvaluated) {
      // Start fresh expression
      setExpression(btn);
      setDisplayResult("");
      setJustEvaluated(false);
      return;
    }

    // Prevent leading zeros (e.g. "007")
    const segments = expression.split(/([+\-×÷])/);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment === "0" && btn !== ".") {
      // Replace the lone zero
      setExpression((prev) => prev.slice(0, -1) + btn);
    } else {
      setExpression((prev) => prev + btn);
    }
  }

  const buttons = [
    "C", "B", "%", "÷",
    "7", "8", "9", "×",
    "4", "5", "6", "-",
    "1", "2", "3", "+",
    "00", "0", ".", "=",
  ];

  return (
    <div className="main-container">
      {/* History panel */}
      <div className="history-area">
        {history.map((entry, i) => (
          <div key={i} className="history-entry">
            <p className="history-expression">{entry.expression}</p>
            <p className="history-result">{entry.result}</p>
          </div>
        ))}
        <div ref={historyEndRef} />
      </div>

      {/* Current calculation display */}
      <div className="display-area">
        <p className="equation">
          {formatExpression(expression) || "\u00A0"}
        </p>
        <p className={`result${displayResult === "Can't divide by zero" || displayResult === "Error" ? " error" : ""}`}>
          {displayResult || "\u00A0"}
        </p>
      </div>

      {/* Keypad */}
      <div className="keys">
        {buttons.map((btn, index) => {
          let btnClass = "btn";
          if (btn === "C" || btn === "B") btnClass += " text-orange";
          if (["÷", "×", "-", "+"].includes(btn)) btnClass += " operator";
          if (btn === "=") btnClass += " equals";
          if (btn === "%") btnClass += " percent";

          return (
            <button
              key={index}
              onClick={() => handleClick(btn)}
              className={btnClass}
            >
              {btn === "B" ? "⌫" : btn}
            </button>
          );
        })}
      </div>
    </div>
  );
}
