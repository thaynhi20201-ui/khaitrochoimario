import React from 'react';
import { Play, BookOpen, Mountain, Volume2, VolumeX, HelpCircle, Compass, CheckCircle2, Globe, Orbit, Users } from 'lucide-react';
import { sound } from '../utils/audio';
import { GeographySubject } from '../types/game';
import { GEOGRAPHY_SUBJECTS } from '../data/geographyData';

interface TitleScreenProps {
  selectedSubject: GeographySubject;
  onSelectSubject: (subject: GeographySubject) => void;
  onStartGame: () => void;
  onOpenMap: () => void;
  onOpenEncyclopedia: () => void;
  onOpenFansipan: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedSubject,
  onSelectSubject,
  onStartGame,
  onOpenMap,
  onOpenEncyclopedia,
  onOpenFansipan,
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.isMuted);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleSelect = (subj: GeographySubject) => {
    sound.playCoin();
    onSelectSubject(subj);
  };

  const handleStart = () => {
    sound.playPowerup();
    onStartGame();
  };

  const currentSubjInfo = GEOGRAPHY_SUBJECTS[selectedSubject];

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Background Artwork */}
      <img
        src="/src/assets/images/mario_geography_cover_1790562249188.jpg"
        alt="Mario Địa Lý Bìa Game"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-65 scale-105"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/85" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-lg sm:text-xl text-amber-400">
            MARIO ĐỊA LÝ
          </span>
          <span className="text-xs text-slate-300 hidden sm:inline">· Môn Địa Lý Học Đường</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition active:scale-95 flex items-center gap-1.5 text-xs font-mono"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Tắt tiếng' : 'Bật tiếng'}</span>
          </button>
        </div>
      </header>

      {/* Hero Title & Actions */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center text-center space-y-6 my-auto">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-semibold">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
            <span>TRÒ CHƠI GIÁO DỤC ĐỊA LÝ TƯƠNG TÁC CAO</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-2xl">
            MARIO <span className="text-amber-400">ĐỊA LÝ</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto drop-shadow leading-relaxed">
            Hóa thân thành Mario thám hiểm qua 4 vùng địa lý kỳ thú! Chọn 1 trong 3 phân môn bên dưới để trải nghiệm hệ thống câu hỏi chuyên sâu tương ứng.
          </p>
        </div>

        {/* 3 Geography Subjects Selector */}
        <div className="w-full max-w-4xl space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-mono font-bold text-slate-300">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Globe className="w-4 h-4" />
              <span>BƯỚC 1: CHỌN 1 TRONG 3 PHÂN MÔN ĐỊA LÝ ĐỂ CHƠI:</span>
            </div>
            <span className="text-[11px] text-slate-400">Click để đổi môn bất kỳ lúc nào</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Địa lý Tự nhiên */}
            {(() => {
              const info = GEOGRAPHY_SUBJECTS.natural;
              const isSelected = selectedSubject === 'natural';
              return (
                <button
                  type="button"
                  onClick={() => handleSelect('natural')}
                  className={`relative p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between group active:scale-[0.98] ${
                    isSelected
                      ? 'bg-slate-900/95 border-2 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-400/30'
                      : 'bg-slate-900/75 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <h3 className="font-black text-sm sm:text-base text-white tracking-wide group-hover:text-emerald-300 transition">
                            {info.name}
                          </h3>
                          <span className="text-[10px] text-emerald-400/80 font-mono block">
                            {info.englishName}
                          </span>
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ĐÃ CHỌN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono group-hover:bg-emerald-950 group-hover:text-emerald-300 transition">
                          Chọn môn
                        </span>
                      )}
                    </div>

                    <p className="text-[11.5px] text-slate-300 leading-snug line-clamp-2">
                      {info.tagline}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                    {info.keyTopics.slice(0, 3).map((topic, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                        {topic}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })()}

            {/* 2. Địa lý Xã hội */}
            {(() => {
              const info = GEOGRAPHY_SUBJECTS.social;
              const isSelected = selectedSubject === 'social';
              return (
                <button
                  type="button"
                  onClick={() => handleSelect('social')}
                  className={`relative p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between group active:scale-[0.98] ${
                    isSelected
                      ? 'bg-slate-900/95 border-2 border-amber-400 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400/30'
                      : 'bg-slate-900/75 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <h3 className="font-black text-sm sm:text-base text-white tracking-wide group-hover:text-amber-300 transition">
                            {info.name}
                          </h3>
                          <span className="text-[10px] text-amber-400/80 font-mono block">
                            {info.englishName}
                          </span>
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ĐÃ CHỌN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono group-hover:bg-amber-950 group-hover:text-amber-300 transition">
                          Chọn môn
                        </span>
                      )}
                    </div>

                    <p className="text-[11.5px] text-slate-300 leading-snug line-clamp-2">
                      {info.tagline}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                    {info.keyTopics.slice(0, 3).map((topic, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50">
                        {topic}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })()}

            {/* 3. Địa lý Không gian */}
            {(() => {
              const info = GEOGRAPHY_SUBJECTS.spatial;
              const isSelected = selectedSubject === 'spatial';
              return (
                <button
                  type="button"
                  onClick={() => handleSelect('spatial')}
                  className={`relative p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between group active:scale-[0.98] ${
                    isSelected
                      ? 'bg-slate-900/95 border-2 border-purple-400 shadow-xl shadow-purple-500/20 ring-2 ring-purple-400/30'
                      : 'bg-slate-900/75 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <h3 className="font-black text-sm sm:text-base text-white tracking-wide group-hover:text-purple-300 transition">
                            {info.name}
                          </h3>
                          <span className="text-[10px] text-purple-400/80 font-mono block">
                            {info.englishName}
                          </span>
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400 text-purple-300 text-[10px] font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ĐÃ CHỌN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono group-hover:bg-purple-950 group-hover:text-purple-300 transition">
                          Chọn môn
                        </span>
                      )}
                    </div>

                    <p className="text-[11.5px] text-slate-300 leading-snug line-clamp-2">
                      {info.tagline}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                    {info.keyTopics.slice(0, 3).map((topic, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50">
                        {topic}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })()}
          </div>
        </div>

        {/* Selected Subject Banner Notification */}
        <div className="w-full max-w-md p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono backdrop-blur-sm">
          <span className="text-slate-400">Phân môn đang khám phá:</span>
          <span className={`px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1.5 ${currentSubjInfo.badgeClass}`}>
            <span>{currentSubjInfo.icon}</span>
            <span>{currentSubjInfo.name}</span>
          </span>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
          <button
            onClick={handleStart}
            className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base tracking-wide shadow-xl shadow-amber-500/30 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>KHỞI HÀNH PHIÊU LƯU</span>
          </button>

          <button
            onClick={onOpenMap}
            className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border-2 border-slate-700 hover:border-amber-400/60 shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
          >
            <Compass className="w-4 h-4 text-sky-400" />
            <span>BẢN ĐỒ THẾ GIỚI</span>
          </button>
        </div>

        {/* Secondary Modules */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            onClick={onOpenEncyclopedia}
            className="px-4 py-2 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Sổ Tay Bách Khoa</span>
          </button>

          <button
            onClick={onOpenFansipan}
            className="px-4 py-2 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition active:scale-95"
          >
            <Mountain className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chinh Phục Fansipan 3.143m</span>
          </button>
        </div>

        {/* How to play card */}
        <div className="w-full max-w-2xl p-4 rounded-xl bg-slate-900/85 border border-slate-800/80 backdrop-blur-sm text-left text-xs text-slate-300 space-y-2.5">
          <div className="font-bold text-amber-400 flex items-center justify-between font-mono">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>HỆ THỐNG PHÍM ĐIỀU KHIỂN & CHỈ SỐ:</span>
            </div>
            <div className="text-[11px] text-cyan-300">
              HP: 100 · MANA: 100
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
              <span className="text-amber-300 font-bold block">A / D hoặc ← / →</span>
              <span className="text-slate-400">Chạy trái / phải</span>
            </div>
            <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
              <span className="text-amber-300 font-bold block">W / Space / ↑</span>
              <span className="text-slate-400">Nhảy lên bậc địa hình</span>
            </div>
            <div className="p-2 rounded bg-slate-800/60 border border-sky-700/40">
              <span className="text-sky-300 font-bold block">S hoặc Mũi tên xuống</span>
              <span className="text-slate-400">Cúi người né đạn quái</span>
            </div>
            <div className="p-2 rounded bg-slate-800/60 border border-rose-700/40">
              <span className="text-rose-300 font-bold block">Phím J / Click chuột</span>
              <span className="text-slate-400">Bắn đạn thẳng / chéo</span>
            </div>
            <div className="p-2 rounded bg-slate-800/60 border border-cyan-700/40">
              <span className="text-cyan-300 font-bold block">Kỹ năng Mana (Phím K)</span>
              <span className="text-slate-400">Khiên hộ thể & đạn nổ lớn</span>
            </div>
            <div className="p-2 rounded bg-slate-800/60 border border-amber-500/40">
              <span className="text-amber-300 font-bold block">🔒 Cổng Phong Ấn</span>
              <span className="text-slate-400">Giải đố phân môn mở đường</span>
            </div>
          </div>

          {/* Supply Box Items */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-amber-400 font-bold">📦 HỘP TIẾP TẾ BAY TRÊN TRỜI (BẮN ĐỂ RƠI):</span>
            <div className="flex flex-wrap gap-2 text-[10.5px]">
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/50 text-emerald-300">
                🍄 Nấm Thần: Hồi 100% HP & Mana
              </span>
              <span className="px-2 py-0.5 rounded bg-orange-950/80 border border-orange-600/50 text-orange-300">
                🔥 Súng S: Đạn chùm tỏa 3 tia
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-600/50 text-purple-300">
                ⚡ Súng L: Laser dài xuyên thấu quái
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 py-4 border-t border-slate-900 text-center text-xs text-slate-500">
        Trò chơi học tập tương tác môn Địa lý · Tích hợp 3 phân môn: Địa lý Tự nhiên, Địa lý Xã hội & Địa lý Không gian
      </footer>
    </div>
  );
};
