import React from 'react';
import { Star, Trophy, ArrowRight, RotateCcw, Map } from 'lucide-react';
import { LevelInfo } from '../types/game';
import { sound } from '../utils/audio';

interface LevelClearedModalProps {
  level: LevelInfo;
  score: number;
  starsEarned: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onBackToMap: () => void;
  hasNextLevel: boolean;
}

export const LevelClearedModal: React.FC<LevelClearedModalProps> = ({
  level,
  score,
  starsEarned,
  onNextLevel,
  onReplay,
  onBackToMap,
  hasNextLevel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-6">
        {/* Flag Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-amber-500/30">
          🚩
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">
            KHU VỰC ĐÃ CHINH PHỤC!
          </span>
          <h2 className="text-2xl font-black text-white">
            {level.title}
          </h2>
          <p className="text-xs text-slate-300">
            Bạn đã vượt qua mọi hiểm trở và hoàn thành xuất sắc các câu hỏi địa lý của {level.region}!
          </p>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className={`w-8 h-8 transition-transform duration-300 ${
                i < Math.max(1, starsEarned)
                  ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow'
                  : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Score metrics */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-around">
          <div>
            <div className="text-[11px] text-slate-400 font-mono">ĐIỂM ĐẠT ĐƯỢC</div>
            <div className="text-xl font-bold text-amber-300 tabular-nums font-mono">{score}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-mono">LA BÀN THU THẬP</div>
            <div className="text-xl font-bold text-sky-400 tabular-nums font-mono">×{starsEarned}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {hasNextLevel ? (
            <button
              onClick={() => {
                sound.playPowerup();
                onNextLevel();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Mở khóa màn kế tiếp</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700 text-emerald-300 text-xs font-semibold">
              🎉 Bạn đã chinh phục toàn bộ 4 lục địa & kỳ quan thế giới!
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onReplay}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi lại màn</span>
            </button>
            <button
              onClick={onBackToMap}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Map className="w-3.5 h-3.5 text-sky-400" />
              <span>Bản đồ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
