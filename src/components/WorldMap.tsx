import React from 'react';
import { GeographySubject, LevelInfo } from '../types/game';
import { Compass, BookOpen, Mountain, Trophy, Star, Play, CheckCircle2, Lock } from 'lucide-react';
import { sound } from '../utils/audio';
import { GEOGRAPHY_SUBJECTS } from '../data/geographyData';

interface WorldMapProps {
  levels: LevelInfo[];
  selectedLevelId: number;
  selectedSubject: GeographySubject;
  onSelectSubject: (subject: GeographySubject) => void;
  onSelectLevel: (id: number) => void;
  onStartLevel: (id: number) => void;
  onOpenEncyclopedia: () => void;
  onOpenFansipanChallenge: () => void;
  totalScore: number;
  totalStars: number;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  levels,
  selectedLevelId,
  selectedSubject,
  onSelectSubject,
  onSelectLevel,
  onStartLevel,
  onOpenEncyclopedia,
  onOpenFansipanChallenge,
  totalScore,
  totalStars,
}) => {
  const selectedLevel = levels.find((l) => l.id === selectedLevelId) || levels[0];

  const handleLevelClick = (lvl: LevelInfo) => {
    if (!lvl.unlocked) return;
    sound.playCoin();
    onSelectLevel(lvl.id);
  };

  const handleStart = () => {
    sound.playPowerup();
    onStartLevel(selectedLevel.id);
  };

  const currentSubjectInfo = GEOGRAPHY_SUBJECTS[selectedSubject];

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Top Bar Contract (3 zones) */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-amber-400 font-mono">
            MARIO ĐỊA LÝ
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">· Thám Hiểm Trái Đất</span>
        </div>

        <nav className="flex items-center gap-4 text-xs sm:text-sm font-medium">
          <button
            onClick={onOpenEncyclopedia}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Sổ Tay Địa Lý</span>
          </button>

          <button
            onClick={onOpenFansipanChallenge}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-700 transition active:scale-95"
          >
            <Mountain className="w-4 h-4 text-emerald-400" />
            <span>Đỉnh Fansipan</span>
          </button>
        </nav>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 text-amber-300">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="tabular-nums font-bold">{totalScore}</span>
          </div>
          <div className="flex items-center gap-1 text-sky-300">
            <Star className="w-4 h-4 text-sky-400 fill-sky-400" />
            <span className="tabular-nums font-bold">{totalStars}</span>
          </div>
        </div>
      </header>

      {/* Subject Switcher Strip */}
      <div className="w-full max-w-6xl mx-auto mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Phân môn đang học:</span>
          <span className={`px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1.5 ${currentSubjectInfo.badgeClass}`}>
            <span>{currentSubjectInfo.icon}</span>
            <span>{currentSubjectInfo.name}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 text-[11px] hidden sm:inline">Chuyển môn:</span>
          {(['natural', 'social', 'spatial'] as GeographySubject[]).map((subjKey) => {
            const subj = GEOGRAPHY_SUBJECTS[subjKey];
            const isCurrent = selectedSubject === subjKey;
            return (
              <button
                key={subjKey}
                onClick={() => {
                  sound.playCoin();
                  onSelectSubject(subjKey);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                  isCurrent
                    ? `${subj.badgeClass} ring-2 ring-amber-400/40 shadow-sm`
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <span>{subj.icon}</span>
                <span>{subj.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mx-auto flex-1 flex flex-col lg:flex-row gap-6 items-stretch mt-6">
        {/* Left: Overworld Interactive Map View */}
        <div className="flex-1 relative rounded-2xl border-2 border-slate-800 overflow-hidden shadow-2xl min-h-[380px] lg:min-h-[500px] flex flex-col justify-between">
          {/* Overworld Map Background */}
          <img
            src="/src/assets/images/mario_geography_map_1790562262337.jpg"
            alt="Bản đồ thế giới Mario Địa lý"
            className="absolute inset-0 w-full h-full object-cover opacity-75"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/60" />

          {/* Level Markers along path */}
          <div className="relative z-10 p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-center text-xs text-slate-300 font-mono">
              <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700/80 backdrop-blur">
                HÀNH TRÌNH ĐỊA LÝ TOÀN CẦU
              </span>
              <span className="text-amber-400 font-bold">4 ĐỊA BÀN CHÍNH</span>
            </div>

            {/* Map Level Checkpoints Nodes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-auto py-8">
              {levels.map((lvl) => {
                const isSelected = lvl.id === selectedLevelId;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => handleLevelClick(lvl)}
                    disabled={!lvl.unlocked}
                    className={`group relative p-4 rounded-xl border backdrop-blur-md transition-all duration-200 flex flex-col items-center text-center ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-xl shadow-amber-500/10'
                        : lvl.unlocked
                        ? 'bg-slate-900/70 border-slate-700 hover:border-slate-500 hover:bg-slate-800/80 cursor-pointer'
                        : 'bg-slate-950/70 border-slate-800/80 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {/* Level Number Orb */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-base mb-2 transition-transform duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 scale-110 shadow-lg'
                          : lvl.unlocked
                          ? 'bg-slate-800 text-amber-300 group-hover:scale-105'
                          : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      {lvl.unlocked ? lvl.id : <Lock className="w-5 h-5 text-slate-500" />}
                    </div>

                    <div className="font-bold text-xs text-white leading-tight mb-1 truncate w-full">
                      {lvl.region.split('·')[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate w-full">
                      Màn {lvl.id}
                    </div>

                    {lvl.starsEarned > 0 && (
                      <div className="flex items-center gap-0.5 mt-2 text-amber-400 text-xs">
                        {Array.from({ length: lvl.starsEarned }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Map Tips */}
            <div className="text-[11px] text-slate-300 bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 backdrop-blur">
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Gợi ý: Nhảy cụng đầu vào khối <b>[ ? ]</b> để giải đố nhận thêm La Bàn & Điểm thưởng!</span>
            </div>
          </div>
        </div>

        {/* Right: Selected Level Dossier & Action Card */}
        <aside className="w-full lg:w-96 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                {selectedLevel.region}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Mục tiêu: {selectedLevel.targetScore} đ
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white leading-snug">
                {selectedLevel.title}
              </h2>
              <p className="text-xs text-amber-200/80 font-medium mt-0.5">
                {selectedLevel.subtitle}
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
              {selectedLevel.description}
            </p>

            {/* Level Highlights */}
            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs text-slate-300">
              <div className="font-semibold text-white">Kiến thức khám phá:</div>
              <ul className="space-y-1.5 list-disc list-inside text-slate-400">
                {selectedLevel.id === 1 && (
                  <>
                    <li>Đỉnh Fansipan 3.143m & Hoàng Liên Sơn</li>
                    <li>Đồng bằng sông Hồng & sông Cửu Long</li>
                    <li>Vịnh Hạ Long & chủ quyền Hoàng Sa, Trường Sa</li>
                  </>
                )}
                {selectedLevel.id === 2 && (
                  <>
                    <li>Nóc nhà thế giới Everest 8.848m</li>
                    <li>Thượng nguồn sông Mê Kông & Dương Tử</li>
                    <li>Hồ Baikal sâu nhất hành tinh</li>
                  </>
                )}
                {selectedLevel.id === 3 && (
                  <>
                    <li>Lá phổi xanh rừng mưa nhiệt đới Amazon</li>
                    <li>Sa mạc nhiệt đới lớn nhất Sahara</li>
                    <li>Hệ thống vĩ tuyến Xích đạo & đới khí hậu</li>
                  </>
                )}
                {selectedLevel.id === 4 && (
                  <>
                    <li>Vành đai lửa Thái Bình Dương</li>
                    <li>Rãnh đại dương sâu nhất Mariana ~11.000m</li>
                    <li>Kiến tạo thạch quyển & hiện tượng sóng thần</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Start Level CTA Button */}
          <div className="pt-6">
            <button
              onClick={handleStart}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-98"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>BẮT ĐẦU THÁM HIỂM MÀN {selectedLevel.id}</span>
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
};
