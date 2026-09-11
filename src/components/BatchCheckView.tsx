import React, { useState, useRef } from "react";
import { CheckResult, PlayerData } from "../types";
import { Terminal, Play, Download, Search, CheckCircle2, AlertTriangle, ChevronRight, Trash2, Upload, BarChart3, Users, ShieldAlert, Zap, Activity, User, Sparkles, Send } from "lucide-react";
import { PlayerDetailModal } from "./PlayerDetailModal";

export const BatchCheckView: React.FC = () => {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Telegram Configuration State
  const [telegramBot, setTelegramBot] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramTesting, setTelegramTesting] = useState(false);

  // Single Mode State
  const [singleId, setSingleId] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<CheckResult | null>(null);

  // Bulk Mode State
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [results, setResults] = useState<CheckResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedPlayer, setSelectedPlayer] = useState<{ deviceId: string; player: PlayerData } | null>(null);

  const sendTelegramAlert = async (text: string) => {
    if (!telegramBot || !telegramChatId) return;
    try {
      await fetch("/api/telegram-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_token: telegramBot.trim(),
          chat_id: telegramChatId.trim(),
          message: text,
        }),
      });
    } catch (err) {
      console.error("Telegram send error:", err);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramBot.trim() || !telegramChatId.trim()) {
      alert("Please enter both Telegram bot token and user ID.");
      return;
    }
    setTelegramTesting(true);
    try {
      const res = await fetch("/api/telegram-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_token: telegramBot.trim(),
          chat_id: telegramChatId.trim(),
          message: "🟢 <b>Lunaris Dev Id Checker</b> Telegram Connected Successfully!",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Telegram test message sent successfully!");
        setTelegramEnabled(true);
      } else {
        alert(`Failed to send test message: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setTelegramTesting(false);
    }
  };

  // Handle Single Check
  const handleSingleCheck = async () => {
    const id = singleId.trim();
    if (!id) {
      alert("Please enter a Device ID.");
      return;
    }

    setSingleLoading(true);
    setSingleResult(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_ids: [id] }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        const resItem = data.results[0];
        setSingleResult(resItem);

        if (telegramEnabled && telegramBot && telegramChatId && resItem.status === "registered" && resItem.player_data) {
          const msg = `🎮 <b>Lunaris Active Hit Found (Single Mode)!</b>\n\n` +
                      `👤 <b>Nickname:</b> ${resItem.player_data.nickname}\n` +
                      `🆔 <b>Player ID:</b> ${resItem.player_data.player_id}\n` +
                      `🏆 <b>Rank:</b> ${resItem.player_data.current_rank}\n` +
                      `⚔️ <b>Win Rate:</b> ${resItem.player_data.win_rate}\n` +
                      `📱 <b>Device ID:</b> <code>${resItem.device_id}</code>`;
          sendTelegramAlert(msg);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to check device ID.");
    } finally {
      setSingleLoading(false);
    }
  };

  const handleLoadSingleSample = async () => {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 1 }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.device_ids) && data.device_ids.length > 0) {
        setSingleId(data.device_ids[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Bulk Stream Check
  const handleRunBulkCheck = async () => {
    const lines = inputText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length >= 15 && !l.startsWith("#"));

    if (lines.length === 0) {
      alert("Please enter valid Device IDs (one per line). Up to 1,000,000 IDs supported!");
      return;
    }

    setLoading(true);
    setResults([]);
    setProgress({ processed: 0, total: lines.length });

    try {
      const response = await fetch("/api/check-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_ids: lines }),
      });

      if (!response.body) {
        throw new Error("ReadableStream not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedResults: CheckResult[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") break;
            try {
              const data = JSON.parse(dataStr);
              if (data.success && Array.isArray(data.results)) {
                accumulatedResults = [...accumulatedResults, ...data.results];
                setResults([...accumulatedResults]);
                if (data.progress) {
                  setProgress(data.progress);
                }

                if (telegramEnabled && telegramBot && telegramChatId) {
                  for (const r of data.results) {
                    if (r.status === "registered" && r.player_data) {
                      const msg = `🎮 <b>Lunaris Active Hit Found!</b>\n\n` +
                                  `👤 <b>Nickname:</b> ${r.player_data.nickname}\n` +
                                  `🆔 <b>Player ID:</b> ${r.player_data.player_id}\n` +
                                  `🏆 <b>Rank:</b> ${r.player_data.current_rank}\n` +
                                  `⚔️ <b>Win Rate:</b> ${r.player_data.win_rate}\n` +
                                  `📱 <b>Device ID:</b> <code>${r.device_id}</code>`;
                      sendTelegramAlert(msg);
                    }
                  }
                }
              }
            } catch (e) {
              console.error("JSON parse error on stream chunk:", e);
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Stream error:", err);
      alert(`Batch check stream failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearBulk = () => {
    setInputText("");
    setResults([]);
    setProgress({ processed: 0, total: 0 });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLoadBulkSamples = async () => {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 50 }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.device_ids)) {
        setInputText(data.device_ids.join("\n"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportTxt = () => {
    const regList = results.filter((r) => r.status === "registered" && r.player_data);
    const content = regList.map((r) => `${r.device_id} | ${r.player_data?.nickname} | ID:${r.player_data?.player_id} | Rank:${r.player_data?.current_rank}`).join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lunaris_batch_hits_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredResults = results.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.device_id.toLowerCase().includes(q) ||
      r.player_data?.nickname.toLowerCase().includes(q) ||
      String(r.player_data?.player_id).includes(q)
    );
  });

  const registeredCount = results.filter((r) => r.status === "registered").length;
  const unregisteredCount = results.filter((r) => r.status === "unregistered").length;
  const invalidCount = results.filter((r) => r.status === "invalid").length;
  const errorCount = results.filter((r) => r.status === "error" || (r.error && r.status !== "invalid")).length;
  const hitRate = results.length > 0 ? ((registeredCount / results.length) * 100).toFixed(1) : "0.0";
  const bannedCount = results.filter((r) => r.player_data?.ban_status && r.player_data.ban_status !== "Not Banned").length;
  const percentComplete = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Mode Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Device ID Checker</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Verify single device IDs or bulk streams up to 1M items.</p>
          </div>
        </div>

        {/* Single / Bulk Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode("single")}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${
              mode === "single"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Single</span>
          </button>

          <button
            onClick={() => setMode("bulk")}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${
              mode === "bulk"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Bulk</span>
          </button>
        </div>
      </div>

      {/* Telegram Notification Configuration Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
            <Send className="w-4 h-4 text-sky-500" />
            <span>Receive Results on Telegram on Registered</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={telegramEnabled}
              onChange={(e) => setTelegramEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              {telegramEnabled ? "Enabled" : "Disabled"}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">enter telegram bot:</label>
            <input
              type="text"
              value={telegramBot}
              onChange={(e) => setTelegramBot(e.target.value)}
              placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">enter your user id:</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="e.g. 987654321"
                className="flex-1 font-mono text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleTestTelegram}
                disabled={telegramTesting}
                className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow transition disabled:opacity-50"
              >
                {telegramTesting ? "Testing..." : "Test Bot"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SINGLE MODE VIEW */}
      {mode === "single" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Single Device ID Lookup</h2>
              <button
                onClick={handleLoadSingleSample}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-xl transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample ID</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={singleId}
                onChange={(e) => setSingleId(e.target.value)}
                placeholder="Enter device ID (e.g. and_e3b0c44298fc1c14...)"
                className="flex-1 font-mono text-sm px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <button
                onClick={handleSingleCheck}
                disabled={singleLoading || !singleId.trim()}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{singleLoading ? "Checking..." : "Check Device"}</span>
              </button>
            </div>
          </div>

          {/* Single Result Card */}
          {singleResult && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${singleResult.status === "registered" ? "bg-emerald-500/10 text-emerald-500" : singleResult.status === "invalid" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"}`}>
                    {singleResult.status === "registered" ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      {singleResult.status === "registered" ? singleResult.player_data?.nickname : singleResult.status === "invalid" ? `Invalid (${singleResult.error || "Error"})` : "Unregistered Device"}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{singleResult.device_id}</p>
                  </div>
                </div>

                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  singleResult.status === "registered"
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : singleResult.status === "invalid"
                    ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                    : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                }`}>
                  {singleResult.status.toUpperCase()}
                </span>
              </div>

              {singleResult.status === "registered" && singleResult.player_data && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Rank: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{singleResult.player_data.current_rank}</span> | Win Rate: <span className="font-bold">{singleResult.player_data.win_rate}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Server: {singleResult.player_data.server} | Level: {singleResult.player_data.level} | ID: {singleResult.player_data.player_id}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPlayer({ deviceId: singleResult.device_id, player: singleResult.player_data! })}
                    className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BULK MODE VIEW */}
      {mode === "bulk" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Batch Stream Checker (Up to 1,000,000 IDs)</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">High-throughput real-time socket verification with live streaming print display.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.csv,.json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                </button>

                <button
                  onClick={handleLoadBulkSamples}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-semibold rounded-xl transition text-sm"
                >
                  <Zap className="w-4 h-4" />
                  <span>Load 50 Samples</span>
                </button>

                <button
                  onClick={handleClearBulk}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>

                <button
                  onClick={handleRunBulkCheck}
                  disabled={loading || !inputText.trim()}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition text-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{loading ? `Checking (${progress.processed}/${progress.total})...` : "Run Live Stream Check"}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste up to 1,000,000 device IDs here (one per line) or upload a file (.txt, .csv)..."
              className="w-full font-mono text-sm p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-y"
            />

            {/* Live Progress Bar during checking */}
            {loading && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                    <span>Live Streaming & Parsing Socket Stream...</span>
                  </span>
                  <span>{progress.processed} / {progress.total} ({percentComplete}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Live Statistics Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{results.length}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Checked So Far</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{registeredCount} <span className="text-xs font-normal text-emerald-600">({hitRate}%)</span></div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Registered</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{unregisteredCount}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Unregistered</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{invalidCount}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Invalid</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{errorCount}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Error</div>
              </div>
            </div>
          </div>

          {/* Results Section with Live Print Display */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Live Results Print Display</h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
                  {registeredCount} Registered / {results.length} Checked
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter results..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={handleExportTxt}
                  disabled={results.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Hits</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
              {filteredResults.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Terminal className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No results yet. Paste or upload device IDs and click "Run Live Stream Check".</p>
                </div>
              ) : (
                filteredResults.map((res, idx) => {
                  const isReg = res.status === "registered";
                  const isInvalid = res.status === "invalid";
                  const player = res.player_data;

                  return (
                    <div
                      key={idx}
                      onClick={() => isReg && player && setSelectedPlayer({ deviceId: res.device_id, player })}
                      className={`p-4 rounded-xl border transition ${
                        isReg
                          ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 cursor-pointer"
                          : isInvalid
                          ? "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40 opacity-75"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${isReg ? "bg-emerald-500/10 text-emerald-500" : isInvalid ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"}`}>
                            {isReg ? <CheckCircle2 className="w-5 h-5" /> : isInvalid ? <AlertTriangle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {isReg ? player?.nickname : isInvalid ? `Invalid (${res.error || "Error"})` : "Unregistered Device"}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isReg ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : isInvalid ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300" : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"}`}>
                                {res.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              {res.device_id}
                            </div>
                          </div>
                        </div>

                        {isReg && player && (
                          <div className="flex items-center space-x-4 text-xs font-medium">
                            <div className="text-right">
                              <div className="text-indigo-600 dark:text-indigo-400 font-bold">{player.current_rank}</div>
                              <div className="text-slate-500">Win Rate: {player.win_rate}</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {selectedPlayer && (
        <PlayerDetailModal
          deviceId={selectedPlayer.deviceId}
          player={selectedPlayer.player}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

    </div>
  );
};
