import React, { useState } from 'react';
import { ENCYCLOPEDIA_FACTS } from '../data/geographyData';
import { GeographySubject, LandmarkFact } from '../types/game';
import { X, Search, Mountain, Waves, TreePine, Sun, Flame, MapPin, Globe } from 'lucide-react';
import { sound } from '../utils/audio';

interface EncyclopediaModalProps {
  onClose: () => void;
  defaultSubject?: GeographySubject;
}

export const EncyclopediaModal: React.FC<EncyclopediaModalProps> = ({ onClose, defaultSubject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(defaultSubject || 'all');
  const [selectedFact, setSelectedFact] = useState<LandmarkFact>(ENCYCLOPEDIA_FACTS[0]);

  const filteredFacts = ENCYCLOPEDIA_FACTS.filter((fact) => {
    const matchesSubject = selectedSubjectFilter === 'all' || !fact.subject || fact.subject === selectedSubjectFilter;
    const q = searchTerm.toLowerCase();
    const matchesQuery = (
      fact.title.toLowerCase().includes(q) ||
      fact.location.toLowerCase().includes(q) ||
      fact.category.toLowerCase().includes(q) ||
      fact.description.toLowerCase().includes(q)
    );
    return matchesSubject && matchesQuery;
  });

  const getIcon = (type: LandmarkFact['iconType']) => {
    switch (type) {
      case 'mountain':
        return <Mountain className="w-4 h-4 text-emerald-400" />;
      case 'river':
      case 'sea':
        return <Waves className="w-4 h-4 text-sky-400" />;
      case 'forest':
        return <TreePine className="w-4 h-4 text-green-400" />;
      case 'desert':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'volcano':
        return <Flame className="w-4 h-4 text-rose-400" />;
      default:
        return <MapPin className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[720px] overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              📖
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Sổ Tay Bách Khoa Địa Lý Của Mario
              </h2>
              <div className="text-xs text-slate-400">
                Kho tri thức danh thắng, sông núi, khí hậu & địa mạo toàn cầu
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playBump();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-700/60 hover:bg-slate-750 text-slate-300 hover:text-white transition active:scale-95"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Landmark List & Search */}
          <div className="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/40">
            {/* Search Input & Subject Filters */}
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm danh thắng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Subject Tabs */}
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'natural', label: '🌿 Tự nhiên' },
                  { id: 'social', label: '🏙️ Xã hội' },
                  { id: 'spatial', label: '🛰️ K.Gian' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sound.playBump();
                      setSelectedSubjectFilter(tab.id);
                    }}
                    className={`py-1 px-1 rounded text-center truncate transition active:scale-95 ${
                      selectedSubjectFilter === tab.id
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredFacts.map((fact) => {
                const isSelected = selectedFact.id === fact.id;
                return (
                  <button
                    key={fact.id}
                    onClick={() => {
                      sound.playBump();
                      setSelectedFact(fact);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(fact.iconType)}</div>
                    <div className="flex-1 truncate">
                      <div className="text-xs font-bold truncate text-white">
                        {fact.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {fact.category}
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredFacts.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  Không tìm thấy địa danh phù hợp.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Landmark Profile */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
                {getIcon(selectedFact.iconType)}
                <span>{selectedFact.category}</span>
                <span>·</span>
                <span>{selectedFact.heightOrLength}</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                {selectedFact.title}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{selectedFact.location}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3">
              <div className="text-xs font-bold text-amber-300 font-mono">
                ĐẶC ĐIỂM ĐỊA LÝ & HÌNH THÀNH
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedFact.description}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-2">
              <div className="text-xs font-bold text-sky-300 font-mono">
                Ý NGHĨA KHOA HỌC & SINH THÁI
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedFact.importance}
              </p>
            </div>

            {/* Trivia note */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed">
              💡 <b>Kiến thức ứng dụng trong game:</b> Bạn sẽ gặp câu hỏi trắc nghiệm liên quan đến địa danh này khi cụng đầu vào các khối hỏi chấm <b>[ ? ]</b> trên đường phiêu lưu của Mario.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
