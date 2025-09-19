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

    // Progress animation until API finishes
    let progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) return prev + 2; // slowly increase until 90%
        return prev;
      });
    }, 200);

    try {
      const response = await fetch("http://localhost:4000/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      setReport(data.response || "⚠️ No report available");

      // When response arrives → set 100%
      clearInterval(progressInterval);
      setProgress(100);

      // Small delay before hiding loader
      setTimeout(() => setLoading(false), 500);
    } catch (err) {
      console.error(err);
      alert("Error fetching audit report.");
      clearInterval(progressInterval);
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>🔍 SEO Guardian</h1>
        <p>
          Enter your website URL below to generate a detailed, evidence-based
          SEO audit report. This tool checks meta tags, Core Web Vitals,
          sitemaps, robots.txt, and more — giving you actionable insights.
        </p>
      </header>

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
          <p>Analyzing website... {progress}%</p>
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
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
