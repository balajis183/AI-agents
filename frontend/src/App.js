import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAudit = async () => {
    if (!url) {
      alert("Please enter a website URL");
      return;
    }

    setReport(null);
    setLoading(true);
    setProgress(0);

    let fakeProgress = 0;
    const interval = setInterval(() => {
      fakeProgress += Math.floor(Math.random() * 8);
      if (fakeProgress >= 95) fakeProgress = 95;
      setProgress(fakeProgress);
    }, 400);

    try {
      const response = await fetch("http://localhost:4000/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      // Extract the Markdown from response
      setReport(data.response || "No report available");

      clearInterval(interval);
      setProgress(100);
    } catch (err) {
      console.error(err);
      alert("Error fetching audit report.");
      clearInterval(interval);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>🔍 SEO Audit Tool</h1>
      <p>Enter your website URL below to generate a detailed SEO Audit Report.</p>

      <div className="input-section">
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={handleAudit}>Run Audit</button>
      </div>

      {loading && (
        <div className="progress-container">
          <p>Generating report... {progress}%</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {report && (
        <div className="report-container">
          <h2>✅ Audit Result</h2>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default App;
