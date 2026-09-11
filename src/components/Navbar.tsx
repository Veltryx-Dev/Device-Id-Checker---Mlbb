import React from "react";
import { TabMode } from "../types";
import { Moon, Sun, Shield, Terminal, Users, Sparkles, History, PlayCircle } from "lucide-react";

interface NavbarProps {
  currentTab: TabMode;
  setTab: (tab: TabMode) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setTab, darkMode, setDarkMode }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setTab("stream")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-pink-400 bg-clip-text text-transparent">
                LUNARIS
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono font-medium border border-indigo-200 dark:border-indigo-800/50">
                v2.1
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Lunaris Dev Id Checker</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-2">
          {/* Checker Group */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <span className="text-xs font-semibold px-2.5 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Checker</span>
            <button
              onClick={() => setTab("stream")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentTab === "stream"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Stream</span>
            </button>

            <button
              onClick={() => setTab("batch")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentTab === "batch"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Batch</span>
            </button>
          </div>

          {/* Generator Group (Separated) */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <span className="text-xs font-semibold px-2.5 text-purple-600 dark:text-purple-400 uppercase tracking-wider">Tool</span>
            <button
              onClick={() => setTab("generator")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentTab === "generator"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>ID Generator</span>
            </button>
          </div>

          <button
            onClick={() => setTab("history")}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition border ${
              currentTab === "history"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 overflow-x-auto space-x-1">
        <button
          onClick={() => setTab("stream")}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            currentTab === "stream" ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Stream</span>
        </button>
        <button
          onClick={() => setTab("batch")}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            currentTab === "batch" ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Batch</span>
        </button>
        <button
          onClick={() => setTab("generator")}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            currentTab === "generator" ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generator</span>
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            currentTab === "history" ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
        </button>
      </div>
    </header>
  );
};
