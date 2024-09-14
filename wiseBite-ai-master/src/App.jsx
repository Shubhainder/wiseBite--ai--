import React, { useState } from "react";
import "./App.css";
import "./index.css";
import analyzeProduct from "./api/analyze";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const analysisResult = await analyzeProduct(url);
      setResult(analysisResult);
    } catch (error) {
      setResult("Error analyzing product: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (text) => {
    const lines = text.split("\n");
    const elements = [];

    lines.forEach((line, index) => {
      line = line.replace(/\*/g, ""); // Remove all asterisks from the line

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
      <img src="../logo.png" alt="" />
      <h1 id="heading">wiseBite</h1>
      <h4 className="tagline">Know what you Consume.</h4>
      {result == null ? (
        <div className="guide">
          Guide: If there are no ingredients on the page, make sure to slide to
          the image with the ingredients in it. No need to open the image. Paste
          the link and click on Analyze button.
        </div>
      ) : null}
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL"
      />
      {url.trim() != "" ? (
        <button id="check-btn" onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Product"}
        </button>
      ) : (
        ""
      )}
      {loading ? <div className="loader"></div> : null}
      {loading ? (
        <div className="waiting">
          Analyzing your product choice, please wait...
        </div>
      ) : null}
      {result && (
        <div className="result">
          <div id="responseContainer">{renderContent(result)}</div>
        </div>
      )}
    </div>
  );
}

export default App;
