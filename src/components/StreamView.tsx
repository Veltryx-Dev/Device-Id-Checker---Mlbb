import React, { useState, useEffect, useRef } from "react";
import { CheckResult, PlayerData } from "../types";
import { Play, Square, Download, RefreshCw, Users, Trophy, Shield, AlertTriangle, CheckCircle2, ChevronRight, Filter } from "lucide-react";
import { PlayerDetailModal } from "./PlayerDetailModal";

interface StreamViewProps {
  onSaveHistory: (session: { title: string; count: number; registered: number; date: string; results: CheckResult[] }) => void;
}

export const StreamView: React.FC<StreamViewProps> = ({ onSaveHistory }) => {
  const [count, setCount] = useState(100);
  const [workers, setWorkers] = useState(12);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ done: 0, registered: 0, unregistered: 0, invalid: 0 });
  const [results, setResults] = useState<CheckResult[]>([]);
  const [filter, setFilter] = useState<"all" | "registered" | "unregistered">("all");
  const [selectedPlayer, setSelectedPlayer] = useState<{ deviceId: string; player: PlayerData } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleStart = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress(0);
    setStats({ done: 0, registered: 0, unregistered: 0, invalid: 0 });
    setResults([]);

    abortControllerRef.current = new AbortController();

    try {
      // 1. Generate IDs first
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
        signal: abortControllerRef.current.signal,
      });
      const genData = await genRes.json();
      if (!genData.success) {
        setIsRunning(false);
        return;
      }

      const deviceIds: string[] = genData.device_ids;
      const batchSize = Math.max(5, Math.min(20, workers));
      let doneCount = 0;
      let regCount = 0;
      let unregCount = 0;
      let invCount = 0;
      const allResults: CheckResult[] = [];

      for (let i = 0; i < deviceIds.length; i += batchSize) {
        if (abortControllerRef.current?.signal.aborted) break;

        const chunk = deviceIds.slice(i, i + batchSize);
        const checkRes = await fetch("/api/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_ids: chunk }),
          signal: abortControllerRef.current.signal,
        });
        const checkData = await checkRes.json();

        if (checkData.success && Array.isArray(checkData.results)) {
          for (const res of checkData.results) {
            doneCount++;
            allResults.push(res);
            if (res.status === "registered") regCount++;
            else if (res.status === "unregistered") unregCount++;
            else invCount++;
          }
          setStats({ done: doneCount, registered: regCount, unregistered: unregCount, invalid: invCount });
          setProgress(Math.round((doneCount / deviceIds.length) * 100));
          setResults([...allResults]);

          // auto scroll
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }

        // small delay for smooth streaming effect
        await new Promise((r) => setTimeout(r, 80));
      }

      setIsRunning(false);
      onSaveHistory({
        title: `Stream Check (${deviceIds.length} IDs)`,
        count: deviceIds.length,
        registered: regCount,
        date: new Date().toLocaleString(),
        results: allResults,
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error(err);
      }
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
  };

  const handleExportTxt = () => {
    const regList = results.filter((r) => r.status === "registered" && r.player_data);
    const content = regList.map((r) => `${r.device_id} | ${r.player_data?.nickname} | ID:${r.player_data?.player_id} | Rank:${r.player_data?.current_rank}`).join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lunaris_registered_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredResults = results.filter((r) => {
    if (filter === "registered") return r.status === "registered";
    if (filter === "unregistered") return r.status === "unregistered";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Control Panel Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Live Generator & Stream Checker</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Stream realistic device IDs and check registration status in real-time with concurrent worker threads.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {isRunning ? (
              <button
                onClick={handleStop}
                className="flex items-center space-x-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Stream</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Stream</span>
              </button>
            )}

            {results.length > 0 && !isRunning && (
              <button
                onClick={handleExportTxt}
                className="flex items-center space-x-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition"
              >
                <Download className="w-4 h-4" />
                <span>Export Hits</span>
              </button>
            )}
          </div>

        </div>

        {/* Sliders & Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-slate-600 dark:text-slate-300">Target Count:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{count.toLocaleString()} IDs</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-slate-600 dark:text-slate-300">Worker Threads:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{workers} Workers</span>
            </div>
            <input
              type="range"
              min="4"
              max="50"
              step="2"
              value={workers}
              onChange={(e) => setWorkers(parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Progress bar & Stats */}
        {(isRunning || stats.done > 0) && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Progress: <strong className="font-mono">{stats.done}</strong> / {count} ({progress}%)
              </span>
              <div className="flex space-x-4 font-mono text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Registered: {stats.registered}</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Unregistered: {stats.unregistered}</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">Invalid: {stats.invalid}</span>
              </div>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">Live Stream Log ({filteredResults.length})</h3>
          </div>

          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filter === "all" ? "bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("registered")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filter === "registered" ? "bg-white dark:bg-slate-900 shadow-sm text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}
            >
              Registered
            </button>
            <button
              onClick={() => setFilter("unregistered")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filter === "unregistered" ? "bg-white dark:bg-slate-900 shadow-sm text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"}`}
            >
              Unregistered
            </button>
          </div>
        </div>

        {/* Stream Log Box */}
        <div
          ref={scrollRef}
          className="h-[480px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
        >
          {filteredResults.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 opacity-40 animate-spin" />
              <p className="text-sm">Click "Start Stream" to begin checking device IDs...</p>
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

      {/* Detail Modal */}
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
