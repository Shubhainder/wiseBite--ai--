import React, { useState } from "react";
import "./App.css";
import logo from "../logo.png";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleAnalyze = () => {
    setLoading(true);
    setResult(null);
    setError(null);

    if (selectedImage) {
      // Handle image analysis
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result.split(',')[1];
        chrome.runtime.sendMessage(
          { 
            action: "analyzeImage", 
            image: base64Image,
            question: userQuestion 
          },
          (response) => {
            handleAnalysisResponse(response);
          }
        );
      };
      reader.readAsDataURL(selectedImage);
    } else {
      // Existing URL analysis
      chrome.runtime.sendMessage(
        { 
          action: "analyzeProduct", 
          url: url,
          question: userQuestion 
        },
        (response) => {
          handleAnalysisResponse(response);
        }
      );
    }
  };

  const handleAnalysisResponse = (response) => {
    setLoading(false);
    if (chrome.runtime.lastError) {
      setError("Error: " + chrome.runtime.lastError.message);
    } else if (response.error) {
      setError("Error analyzing product: " + response.error);
    } else {
      setResult(response.result);
    }
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
          Guide: You can analyze a product by URL, current page, or by uploading an image of ingredients.
          Feel free to ask specific questions about the product.
        </div>
      )}
      <div className="input-holder">
        <button id="check-btn" onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze this Page"}
        </button>
      <div className="question-input">
        <input
          type="text"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          placeholder="Ask a specific question about the product (optional)"
        />
      </div>
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
        <span>OR</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          id="image-upload"
        />
        <label htmlFor="image-upload" className="upload-btn">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000" height="16px" width="16px" version="1.1" id="Layer_1" viewBox="0 0 455 455" xml:space="preserve">
<path d="M0,0v455h455V0H0z M259.405,80c17.949,0,32.5,14.551,32.5,32.5s-14.551,32.5-32.5,32.5s-32.5-14.551-32.5-32.5  S241.456,80,259.405,80z M375,375H80v-65.556l83.142-87.725l96.263,68.792l69.233-40.271L375,299.158V375z"/>
</svg>
          Upload Image
        </label>
        {selectedImage && (
          <button id="analyze-image" onClick={handleAnalyze} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Image"}
          </button>
        )}
      </div>
      {selectedImage && (
        <div className="selected-image">
          <p>Selected: {selectedImage.name}</p>
        </div>
      )}
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