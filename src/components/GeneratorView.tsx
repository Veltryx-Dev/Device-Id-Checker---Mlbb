import React, { useState } from "react";
import { Sparkles, Copy, Download, RefreshCw, Check, ShieldCheck, Cpu } from "lucide-react";

export const GeneratorView: React.FC = () => {
  const [count, setCount] = useState(50);
  const [brand, setBrand] = useState("random");
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, brand }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.device_ids)) {
        setGeneratedIds(data.device_ids);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(generatedIds.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const content = generatedIds.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lunaris_${brand}_device_ids_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Generator Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">High-Quality Device ID Generator</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Generate cryptographically verified `and_...` device IDs with authentic hardware TAC profiles and Luhn checksum.</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/25 transition disabled:opacity-50 text-sm"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Generate IDs</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          {/* Brand Profile Selector */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-purple-500" />
              <span>Hardware Device Profile</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "random", name: "Mixed / Random" },
                { id: "samsung", name: "Samsung Galaxy" },
                { id: "rog", name: "ASUS ROG Phone" },
                { id: "pixel", name: "Google Pixel" },
                { id: "xiaomi", name: "Xiaomi / POCO" },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBrand(b.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                    brand === b.id
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-500/50"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Slider */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Quantity (Up to 1,000):</span>
              <span className="font-mono text-purple-600 dark:text-purple-400">{count} IDs</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer pt-2"
            />
            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>TAC Prefix + Luhn Checksum + SHA256 Salted Entropy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generated IDs Output */}
      {generatedIds.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Generated {brand.toUpperCase()} Device IDs
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-semibold">
                {generatedIds.length} generated
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCopyAll}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied!" : "Copy All"}</span>
              </button>
              <button
                onClick={handleDownloadTxt}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition"
              >
                <Download className="w-4 h-4" />
                <span>Download .txt</span>
              </button>
            </div>
          </div>

          <div className="h-[450px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/50 font-mono text-xs space-y-1.5">
            {generatedIds.map((did, idx) => (
              <div key={idx} className="text-slate-700 dark:text-slate-300 select-all hover:bg-indigo-500/10 p-1.5 rounded transition flex items-center justify-between">
                <span>{did}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
