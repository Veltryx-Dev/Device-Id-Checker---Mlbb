import React from "react";
import { CheckResult } from "../types";
import { History, Trash2, Calendar, Trophy, CheckCircle2, Download } from "lucide-react";

interface HistorySession {
  title: string;
  count: number;
  registered: number;
  date: string;
  results: CheckResult[];
}

interface HistoryViewProps {
  sessions: HistorySession[];
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ sessions, onClearHistory }) => {
  const handleExportSession = (session: HistorySession) => {
    const regList = session.results.filter((r) => r.status === "registered" && r.player_data);
    const content = regList.map((r) => `${r.device_id} | ${r.player_data?.nickname} | ID:${r.player_data?.player_id} | Rank:${r.player_data?.current_rank}`).join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lunaris_history_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Session History</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Review past check sessions and registered account logs.</p>
          </div>
        </div>

        {sessions.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold rounded-xl transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-3">
          <History className="w-12 h-12 mx-auto opacity-30" />
          <p className="text-base font-medium">No check history recorded yet.</p>
          <p className="text-xs text-slate-500">Run a live stream check or batch check to populate history sessions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((session, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{session.title}</h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
                  {session.registered} Hits
                </span>
              </div>

              <div className="flex items-center space-x-4 text-xs text-slate-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{session.date}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>{session.count} Checked</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => handleExportSession(session)}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Hits</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
