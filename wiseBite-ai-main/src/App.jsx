import React, { useState } from "react";
import "./App.css";
import logo from "../logo.png";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState(null);

  const handleAnalyze = () => {
    setLoading(true);
    setResult(null);
    setError(null);
    chrome.runtime.sendMessage(
      { action: "analyzeProduct", url: url },
      (response) => {
        setLoading(false);
        if (chrome.runtime.lastError) {
          setError("Error: " + chrome.runtime.lastError.message);
        } else if (response.error) {
          setError("Error analyzing product: " + response.error);
        } else {
          setResult(response.result);
        }
      }
    );
  };

  const renderContent = (text) => {
    const lines = text.split("\n");
    const elements = [];

    lines.forEach((line, index) => {
      line = line.replace(/\*/g, "");

      if (line.startsWith("## ")) {
        elements.push(<h2 key={index}>{line.replace("## ", "")}</h2>);
      } else if (line.includes(":")) {
        const parts = line.split(":");
        if (parts.length > 1) {
          elements.push(<h3 key={index}>{parts[0]}:</h3>);
          elements.push(
            <p key={`${index}-content`}>{parts.slice(1).join(":").trim()}</p>
          );
        } else {
          elements.push(<p key={index}>{line}</p>);
        }
      } else if (line.trim() !== "") {
        elements.push(<p key={index}>{line}</p>);
      }
    });

    return elements;
  };

  return (
    <div className="App">
      <img src={logo} alt="" />
      <h1 id="heading">wiseBite</h1>
      <h4 className="tagline">Know what you Consume.</h4>
      {!result && (
        <div className="guide">
          Guide: You can directly analyze the product if you are on the product
          page by clicking on the Analyze this Page button OR you can enter the
          URL and analyze.
        </div>
      )}
      <div className="input-holder">
        <button id="check-btn" onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze this Page"}
        </button>
        <span>OR</span>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL (Optional)"
        />
        <button id="check-btn-url" onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze URL"}
        </button>
      </div>
      {loading && <div className="loader"></div>}
      {loading && (
        <div className="waiting">
          Analyzing your product choice, please wait...
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <div id="responseContainer">{renderContent(result)}</div>
        </div>
      )}
    </div>
  );
}

export default App;
