import React from 'react';
import { RotateCcw, Map, BookOpen } from 'lucide-react';
import { sound } from '../utils/audio';

interface GameOverModalProps {
  onRetry: () => void;
  onBackToMap: () => void;
  onOpenEncyclopedia: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  onRetry,
  onBackToMap,
  onOpenEncyclopedia,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-rose-600/80 rounded-2xl shadow-2xl p-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-400 flex items-center justify-center mx-auto text-3xl">
          💥
        </div>

        <div className="space-y-1">
          <span className="text-xs font-mono font-bold text-rose-400 tracking-wider">
            CHUYẾN ĐI TẠM DỪNG
          </span>
          <h2 className="text-2xl font-black text-white font-mono">
            GAME OVER
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Đừng nản lòng! Mọi nhà thám hiểm địa lý vĩ đại đều từng gặp trở ngại trên đường đi.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              sound.playJump();
              onRetry();
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử lại ngay (Hồi phục 3 mạng)</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onBackToMap}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Map className="w-3.5 h-3.5 text-sky-400" />
              <span>Bản đồ</span>
            </button>
            <button
              onClick={onOpenEncyclopedia}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Ôn tập Địa lý</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
