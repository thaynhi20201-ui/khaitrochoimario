import React from 'react';
import { Volume2, VolumeX, Pause, Play, Compass, Star, Heart, Zap, Crosshair } from 'lucide-react';
import { sound } from '../utils/audio';
import { GeographySubject, WeaponType } from '../types/game';
import { GEOGRAPHY_SUBJECTS } from '../data/geographyData';

interface HUDProps {
  score: number;
  coins: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  shieldTimer: number;
  bulletProof?: boolean;
  weapon: WeaponType;
  stars: number;
  levelTitle: string;
  subject?: GeographySubject;
  isPaused: boolean;
  onTogglePause: () => void;
  onExitToMap: () => void;
  timeRemaining?: number;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  coins,
  hp,
  maxHp,
  mana,
  maxMana,
  shieldTimer,
  bulletProof = false,
  weapon,
  stars,
  levelTitle,
  subject,
  isPaused,
  onTogglePause,
  onExitToMap,
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.isMuted);

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const manaPercent = Math.max(0, Math.min(100, (mana / maxMana) * 100));

  const subjInfo = subject ? GEOGRAPHY_SUBJECTS[subject] : null;

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none select-none px-3 sm:px-6 py-2.5 flex items-center justify-between text-white font-mono bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent backdrop-blur-[2px]">
      {/* Brand & Level Title & Subject */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        <button
          onClick={onExitToMap}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 transition flex items-center gap-1.5 shadow-sm active:scale-95 text-slate-200"
          title="Trở về bản đồ thế giới"
        >
          <span className="text-amber-400 font-bold">← BẢN ĐỒ</span>
        </button>
        <div className="hidden md:block">
          <div className="text-xs tracking-wider text-amber-300 font-bold drop-shadow">
            MARIO ĐỊA LÝ
          </div>
          <div className="text-[11px] text-slate-300 truncate max-w-[160px] drop-shadow">
            {levelTitle}
          </div>
        </div>

        {subjInfo && (
          <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] ${subjInfo.badgeClass}`}>
            <span>{subjInfo.icon}</span>
            <span className="font-bold">{subjInfo.name}</span>
          </div>
        )}
      </div>

      {/* Main Player Status Bars: HP & MANA */}
      <div className="flex items-center gap-3 sm:gap-6 pointer-events-auto">
        {/* HP Bar */}
        <div className="flex flex-col gap-0.5 min-w-[110px] sm:min-w-[150px]">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-rose-400 flex items-center gap-1">
              <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
              <span>HP</span>
            </span>
            <span className="text-rose-200 tabular-nums">
              {Math.max(0, Math.round(hp))}/{maxHp}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full border border-rose-900/80 p-0.5 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                hp > 50
                  ? 'bg-gradient-to-r from-emerald-500 to-rose-500'
                  : hp > 25
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-rose-600 animate-pulse'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* MANA Bar */}
        <div className="flex flex-col gap-0.5 min-w-[110px] sm:min-w-[150px]">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-cyan-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-ping" />
              <span>MANA (K)</span>
            </span>
            <span className="text-cyan-200 tabular-nums">
              {Math.max(0, Math.round(mana))}/{maxMana}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full border border-cyan-900/80 p-0.5 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 rounded-full transition-all duration-150"
              style={{ width: `${manaPercent}%` }}
            />
          </div>
        </div>

        {/* Weapon Type Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-sm font-bold text-xs"
          style={{
            backgroundColor: weapon === 'laser' ? 'rgba(147, 51, 234, 0.2)' : weapon === 'spread' ? 'rgba(234, 88, 12, 0.2)' : 'rgba(30, 41, 59, 0.6)',
            borderColor: weapon === 'laser' ? '#A855F7' : weapon === 'spread' ? '#F97316' : '#475569',
            color: weapon === 'laser' ? '#D8B4FE' : weapon === 'spread' ? '#FDBA74' : '#94A3B8',
          }}
        >
          {weapon === 'laser' ? (
            <>
              <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>SÚNG [L] LASER</span>
            </>
          ) : weapon === 'spread' ? (
            <>
              <Crosshair className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              <span>SÚNG [S] 3 TIA</span>
            </>
          ) : (
            <span>SÚNG THƯỜNG</span>
          )}
        </div>

        {/* Shield & Bullet Immunity active indicator badge */}
        {(shieldTimer > 0 || bulletProof) && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-400/80 text-[11px] text-amber-300 shadow-sm animate-pulse">
            <span>🛡️ KHÁNG ĐẠN</span>
            <span className="text-[10px] text-emerald-300 font-bold hidden sm:inline">· ĐI TIẾP</span>
            {shieldTimer > 0 && (
              <span className="tabular-nums font-bold text-amber-200">({Math.ceil(shieldTimer / 60)}s)</span>
            )}
          </div>
        )}
      </div>

      {/* Score, Coins & Controls */}
      <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto">
        {/* Score & Coins (Hidden on very small mobile) */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-400 font-semibold">ĐIỂM</span>
            <span className="font-bold tabular-nums text-amber-300">
              {score.toString().padStart(6, '0')}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-md border border-amber-500/30">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-400 border border-amber-200" />
            <span className="font-bold tabular-nums text-amber-200 text-xs">
              ×{coins.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-md border border-sky-500/30">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-bold text-sky-200 tabular-nums">×{stars}</span>
          </div>
        </div>

        {/* Controls */}
        <button
          onClick={handleToggleMute}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          aria-label="Toggle Sound"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          onClick={onTogglePause}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
          title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          aria-label="Toggle Pause"
        >
          {isPaused ? <Play className="w-4 h-4 text-amber-400 fill-amber-400" /> : <Pause className="w-4 h-4 text-slate-300" />}
        </button>
      </div>
    </header>
  );
};
