"use client";
import React, { useState } from "react";

export default function ChatInterface() {
  const [prompt, setPrompt] = useState("");
  const [chatLog, setChatLog] = useState<{ sender: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;

    const userMessage = prompt;
    setChatLog((prev) => [...prev, { sender: "User", text: userMessage }]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });
      
      const data = await res.json();
      let responseText = data.message || data.error || `Processed action: ${data.parsedData?.action || "Unknown"}`;
      
      setChatLog((prev) => [
        ...prev,
        { sender: "Agent", text: responseText },
      ]);
    } catch (err) {
      setChatLog((prev) => [...prev, { sender: "Agent", text: "Connection failed!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", background: "#1e293b", color: "#fff", borderRadius: "10px", margin: "20px 0" }}>
      <h2>🤖 AI Financial Agent Chat</h2>
      
      <div style={{ height: "200px", overflowY: "auto", background: "#0f172a", padding: "10px", borderRadius: "5px", marginBottom: "10px" }}>
        {chatLog.length === 0 && <p style={{ color: "#94a3b8" }}>Type your command below...</p>}
        {chatLog.map((msg, i) => (
          <div key={i} style={{ margin: "5px 0", color: msg.sender === "User" ? "#60a5fa" : "#4ade80" }}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
        {loading && <p style={{ color: "#facc15" }}>Thinking...</p>}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type here (e.g. Send 5 USDXM)..."
          style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "1px solid #ccc", color: "#000", background: "#fff" }}
        />
        <button 
          onClick={handleSend}
          style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
