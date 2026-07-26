import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";

const API_URL = "http://vanguard-ai.fastapicloud.dev";
const SESSION_ID = 1;

export default function ChatPage() {
  const token = localStorage.getItem("token");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadHistory();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setListening(false);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadHistory() {
    try {
      const res = await fetch(`${API_URL}/chat/${SESSION_ID}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  }

  function speak(text) {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    if (recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    } else {
      alert("Voice recognition not supported in this browser. Try Chrome or Edge.");
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", message: userMessage }]);
    setLoading(true);

    try {
      const url = `${API_URL}/chat?message=${encodeURIComponent(userMessage)}&session_id=${SESSION_ID}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "ai", message: data.reply }]);
      speak(data.reply);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex bg-bg min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col p-8 max-w-3xl h-screen">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-display text-2xl text-charcoal">AI Chat Assistant</h1>
          <label className="flex items-center gap-2 text-sm text-slate">
            <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} />
            Voice Replies
          </label>
        </div>

        <div className="flex-1 overflow-y-auto bg-white border border-emerald-pale rounded-2xl p-4 space-y-3 mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${m.sender === "user" ? "bg-emerald text-white" : "bg-emerald-pale/50 text-charcoal"
                }`}>
                {m.message}
              </div>
            </div>
          ))}
          {loading && <p className="text-xs text-slate">Vanguard AI is typing...</p>}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendMessage} className="flex gap-2">
          <button type="button" onClick={startListening}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${listening ? "bg-red-500 text-white" : "bg-gold text-white hover:bg-gold-soft"
              }`}>
            {listening ? "Listening..." : "🎤"}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or use the mic..."
            className="flex-1 border border-emerald-pale rounded-xl px-4 py-2 text-sm"
          />
          <button type="submit" disabled={loading}
            className="bg-emerald text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-light transition disabled:opacity-50">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}