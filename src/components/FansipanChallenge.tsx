import React, { useState, useEffect } from 'react';
import { GEOGRAPHY_QUESTIONS, GEOGRAPHY_SUBJECTS } from '../data/geographyData';
import { GeographySubject } from '../types/game';
import { sound } from '../utils/audio';
import { Mountain, ArrowLeft, Trophy, CheckCircle2, XCircle, Award, Compass } from 'lucide-react';

interface FansipanChallengeProps {
  subject?: GeographySubject;
  onBackToMap: () => void;
  onRecordScore: (points: number) => void;
}

export const FansipanChallenge: React.FC<FansipanChallengeProps> = ({
  subject = 'natural',
  onBackToMap,
  onRecordScore,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // 5 climbing stages: 800m -> 1500m -> 2200m -> 2800m -> 3143m
  const altitudes = [800, 1500, 2200, 2800, 3143];
  const subjectQuestions = GEOGRAPHY_QUESTIONS.filter((q) => q.subject === subject);
  const questions = subjectQuestions.length >= 5 ? subjectQuestions.slice(0, 5) : GEOGRAPHY_QUESTIONS.slice(0, 5);

  const currentQ = questions[currentStep] || GEOGRAPHY_QUESTIONS[0];
  const currentSubjInfo = GEOGRAPHY_SUBJECTS[subject];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctAnswer;
    if (isCorrect) {
      sound.playQuizCorrect();
      setScore((prev) => prev + 300);
    } else {
      sound.playQuizWrong();
    }
  };

  const handleNextAltitude = () => {
    if (currentStep < altitudes.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
      sound.playVictory();
      onRecordScore(score + 500);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={onBackToMap}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>VỀ BẢN ĐỒ</span>
        </button>

        <div className="flex items-center gap-2">
          <Mountain className="w-5 h-5 text-emerald-400" />
          <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
            Thử Thách: Leo Đỉnh Fansipan 3.143m
          </h1>
          <span className={`hidden sm:inline-flex px-2 py-0.5 rounded text-[11px] font-mono border font-bold ${currentSubjInfo.badgeClass}`}>
            {currentSubjInfo.icon} {currentSubjInfo.name}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="font-bold tabular-nums">{score} đ</span>
        </div>
      </header>

      {/* Main Climbing Arena */}
      <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-center py-6">
        {!isFinished ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Altitude Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">TRẠM DỪNG CHÂN {currentStep + 1}/5</span>
                <span className="text-emerald-400 font-bold">
                  ĐỘ CAO: {altitudes[currentStep]} MÉT
                </span>
              </div>

              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / altitudes.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
                <Compass className="w-4 h-4" />
                <span>CÂU HỎI VƯỢT DỐC NÚI HOÀNG LIÊN SƠN</span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {currentQ.question}
              </h2>

              {/* 4 Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentQ.options.map((opt, i) => {
                  const letter = ['A', 'B', 'C', 'D'][i];
                  const isSelected = selectedOption === i;
                  const isCorrect = i === currentQ.correctAnswer;

                  let style = 'bg-slate-800 border-slate-700 hover:border-amber-400/50 text-slate-200';
                  if (isAnswered) {
                    if (isCorrect) {
                      style = 'bg-emerald-950/80 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/50';
                    } else if (isSelected && !isCorrect) {
                      style = 'bg-rose-950/80 border-rose-500 text-rose-100 ring-2 ring-rose-500/50';
                    } else {
                      style = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      disabled={isAnswered}
                      className={`p-3.5 rounded-xl border text-left text-sm font-medium transition flex items-start gap-3 ${style}`}
                    >
                      <span className="w-6 h-6 rounded-md bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {letter}
                      </span>
                      <span className="flex-1 leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback & Next Button */}
            {isAnswered && (
              <div className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
                <div
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                    selectedOption === currentQ.correctAnswer
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                      : 'bg-amber-950/40 border-amber-800 text-amber-200'
                  }`}
                >
                  {selectedOption === currentQ.correctAnswer ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>{currentQ.explanation}</div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNextAltitude}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    {currentStep < altitudes.length - 1 ? 'Leo tiếp trạm sau →' : 'Chạm đỉnh Fansipan! 🏆'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Victory Summit Screen */
          <div className="bg-slate-900/90 border-2 border-amber-400/80 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center mx-auto text-3xl">
              🏔️
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-amber-400 font-bold">
                CHỨNG NHẬN CHINH PHỤC NÓC NHÀ ĐÔNG DƯƠNG
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Chúc mừng bạn đã chạm đỉnh Fansipan 3.143m!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Mario và bạn đã hoàn thành xuất sắc các chặng thử thách tri thức địa mạo, khí hậu và tự nhiên Việt Nam.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-around text-center">
              <div>
                <div className="text-[11px] text-slate-400 font-mono">TỔNG ĐIỂM</div>
                <div className="text-xl font-bold text-amber-400 tabular-nums">{score + 500} đ</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-mono">ĐỘ CAO ĐẠT ĐƯỢC</div>
                <div className="text-xl font-bold text-emerald-400 tabular-nums">3.143 m</div>
              </div>
            </div>

            <button
              onClick={onBackToMap}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 active:scale-95"
            >
              Trở về bản đồ thế giới
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
