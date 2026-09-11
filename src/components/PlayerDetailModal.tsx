import React, { useState } from "react";
import { PlayerData } from "../types";
import { X, Shield, Trophy, User, Calendar, MapPin, Award, Users, Swords, AlertTriangle, CheckCircle2 } from "lucide-react";

interface PlayerDetailModalProps {
  deviceId: string;
  player: PlayerData;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ deviceId, player, onClose }) => {
  const [copiedId, setCopiedId] = useState(false);

  const isBanned = player.ban_status.toLowerCase().includes("ban") || player.ban_status.toLowerCase().includes("suspend");

  const handleCopyId = () => {
    navigator.clipboard.writeText(player.player_id.toString());
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${isBanned ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {isBanned ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{player.nickname}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Device: {deviceId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account ID</div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-bold text-lg">{player.player_id}</span>
                <button
                  onClick={handleCopyId}
                  className="text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-100 transition"
                >
                  {copiedId ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Server & Level</div>
              <div className="font-mono font-bold text-lg mt-1">
                Server {player.server} <span className="text-xs font-normal text-slate-500">(Lv. {player.level})</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isBanned ? 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
              <div className="text-xs font-medium uppercase tracking-wider opacity-80">Ban Status</div>
              <div className="font-bold text-lg mt-1">{player.ban_status}</div>
              {player.ban_end !== "N/A" && <div className="text-xs opacity-75 mt-0.5">{player.ban_end}</div>}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Current Rank</span>
              </div>
              <div className="font-bold text-base">{player.current_rank}</div>
              <div className="text-xs text-slate-500 mt-0.5">Peak: {player.high_rank}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                <Swords className="w-4 h-4 text-indigo-500" />
                <span>Win Rate</span>
              </div>
              <div className="font-bold text-base text-indigo-600 dark:text-indigo-400">{player.win_rate}</div>
              <div className="text-xs text-slate-500 mt-0.5">{player.total_battles} total battles</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                <Award className="w-4 h-4 text-violet-500" />
                <span>Heroes & Skins</span>
              </div>
              <div className="font-bold text-base">{player.hero_count} Heroes</div>
              <div className="text-xs text-slate-500 mt-0.5">{player.skin_count} Skins ({player.collector_tier})</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                <Users className="w-4 h-4 text-teal-500" />
                <span>Squad & Affinity</span>
              </div>
              <div className="font-bold text-base truncate">{player.squad}</div>
              <div className="text-xs text-slate-500 mt-0.5">Affinity: {player.affinity}</div>
            </div>
          </div>

          {/* Additional details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 space-y-2">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 font-semibold mb-3">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Activity & Location</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/30">
                <span className="text-slate-500">Last Login:</span>
                <span className="font-medium">{player.last_login}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/30">
                <span className="text-slate-500">Login Country:</span>
                <span className="font-medium">{player.last_login_country}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Location GPS:</span>
                <span className="font-medium">{player.location}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 space-y-2">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 font-semibold mb-3">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Hero Pool & Match History</span>
              </div>
              {player.last_match ? (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/30">
                    <span className="text-slate-500">Frequent Hero:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{player.last_match.hero_name}</span>
                  </div>
                  <div className="py-1">
                    <span className="text-slate-500 block mb-1">Recent Heroes:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {player.last_match.prev.map((hero, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md">
                          {hero}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-sm italic">No recent match data available</div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
