import React, { useState } from 'react';
import { GeographyQuestion } from '../types/game';
import { sound } from '../utils/audio';
import { CheckCircle2, XCircle, Lightbulb, Compass, RotateCcw, Sparkles, ShieldAlert, ShieldCheck } from 'lucide-react';
import { GEOGRAPHY_SUBJECTS } from '../data/geographyData';

interface QuizModalProps {
  question: GeographyQuestion;
  onAnswer: (isCorrect: boolean) => void;
  isBarrier?: boolean;
  quizType?: 'block' | 'barrier' | 'bullet_rescue';
}

export const QuizModal: React.FC<QuizModalProps> = ({ question, onAnswer, isBarrier = false, quizType = isBarrier ? 'barrier' : 'block' }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  const isBulletRescue = quizType === 'bullet_rescue';

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedIndex(index);
    setIsAnswered(true);
    setAttempts((prev) => prev + 1);

    const isCorrect = index === question.correctAnswer;
    if (isCorrect) {
      sound.playQuizCorrect();
    } else {
      sound.playQuizWrong();
    }
  };

  const handleRetry = () => {
    setSelectedIndex(null);
    setIsAnswered(false);
  };

  const handleUnlockAndResume = () => {
    if (selectedIndex === null) return;
    onAnswer(true);
  };

  const isCorrect = selectedIndex === question.correctAnswer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-xl bg-slate-900 border-2 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
        isBulletRescue
          ? 'border-emerald-400 ring-4 ring-emerald-500/30'
          : isBarrier
          ? 'border-amber-400 ring-4 ring-amber-500/20'
          : 'border-amber-500/80 ring-2 ring-amber-500/20'
      }`}>
        {/* Retro Header Banner */}
        <div className={`px-6 py-3.5 flex items-center justify-between text-slate-950 ${
          isBulletRescue
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400'
            : isBarrier
            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400'
            : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-slate-950 text-amber-400 font-mono font-black text-sm">
              {isBulletRescue ? <ShieldCheck className="w-4 h-4 text-emerald-400 inline" /> : isBarrier ? <ShieldAlert className="w-4 h-4 text-amber-400 inline" /> : '?'}
            </span>
            <span className="font-extrabold text-sm tracking-wide uppercase">
              {isBulletRescue
                ? 'CỨU NGUY TRI THỨC - HÓA GIẢI ĐẠN ĐỊCH'
                : isBarrier
                ? 'CỔNG PHONG ẤN ĐỊA LÝ - ĐÓNG BĂNG CHIẾN TRƯỜNG'
                : 'Thử Thách Trí Tuệ Địa Lý'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-950/90">
            <Compass className="w-4 h-4" />
            <span>{question.coordinateOrRegion || 'Cổng thử thách'}</span>
          </div>
        </div>

        {/* Question Body */}
        <div className="p-6 space-y-5">
          {/* Status notification */}
          {isBulletRescue ? (
            <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2">
              <span className="text-emerald-400 text-base">🛡️</span>
              <span><b>DÍNH ĐẠN:</b> Trả lời đúng câu hỏi dưới đây để hóa giải đạn, nhận <b>Khiên Kháng Đạn</b> và <b>được đi tiếp</b> an toàn!</span>
            </div>
          ) : isBarrier ? (
            <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-2">
              <span className="text-amber-400 text-sm">🔒</span>
              <span>Cổng phong ấn đang chặn đường! Bạn phải trả lời đúng để giải phóng rào chắn, nhận Khiên Kháng Đạn và mở đường đi tiếp.</span>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-sky-950/60 border border-sky-500/40 text-[11px] text-sky-200 flex items-center gap-2">
              <span className="text-sky-400 text-sm">💡</span>
              <span>Trả lời đúng để nhận Điểm thưởng & Hào quang Kháng Đạn: <b>Dính đạn không sao, được đi tiếp!</b></span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="text-xs text-amber-400 font-mono font-bold flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {question.subject && GEOGRAPHY_SUBJECTS[question.subject] && (
                  <span className={`px-2 py-0.5 rounded text-[11px] border font-bold flex items-center gap-1 ${GEOGRAPHY_SUBJECTS[question.subject].badgeClass}`}>
                    <span>{GEOGRAPHY_SUBJECTS[question.subject].icon}</span>
                    <span>{GEOGRAPHY_SUBJECTS[question.subject].name}</span>
                  </span>
                )}
                <span className="text-slate-300">· {question.category}</span>
              </div>
              {attempts > 0 && <span className="text-slate-400">Lần thử: {attempts}</span>}
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white leading-snug">
              {question.question}
            </h3>
          </div>

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((option, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx];
              const isSelected = selectedIndex === idx;
              const isTargetCorrect = idx === question.correctAnswer;

              let buttonStyle = 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-750 hover:border-amber-400/60';
              if (isAnswered) {
                if (isTargetCorrect) {
                  buttonStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/50';
                } else if (isSelected && !isTargetCorrect) {
                  buttonStyle = 'bg-rose-950/80 border-rose-500 text-rose-100 ring-2 ring-rose-500/50';
                } else {
                  buttonStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-all duration-150 flex items-start gap-3 ${buttonStyle} ${
                    !isAnswered ? 'active:scale-98' : ''
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold shrink-0 ${
                      isAnswered && isTargetCorrect
                        ? 'bg-emerald-500 text-slate-950'
                        : isAnswered && isSelected && !isTargetCorrect
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-700 text-amber-300'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1 leading-snug">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Answer Feedback, Hints & Action Buttons */}
          {isAnswered && (
            <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isCorrect
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="font-bold flex items-center gap-2">
                    {isCorrect ? (
                      <>
                        <span className="text-emerald-300">
                          {isBulletRescue
                            ? 'Chính xác! Đạn địch đã bị hóa giải hoàn toàn!'
                            : isBarrier
                            ? 'Chính xác! Cổng phong ấn đã bị phá vỡ!'
                            : 'Chính xác! Bạn nhận Hào quang Kháng Đạn!'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          +200 Điểm & Kháng Đạn Đi Tiếp
                        </span>
                      </>
                    ) : (
                      <span className="text-rose-300">
                        {isBulletRescue
                          ? 'Chưa chính xác! Đạn địch vẫn đang đe dọa, hãy chọn lại để hóa giải.'
                          : isBarrier
                          ? 'Chưa chính xác! Cổng phong ấn vẫn khóa chặt đường đi.'
                          : 'Chưa chính xác! Hãy suy nghĩ và thử lại.'}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 leading-relaxed">{question.explanation}</p>
                </div>
              </div>

              {/* Gợi ý cho câu hỏi khi chọn sai */}
              {!isCorrect && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/50 flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200/90 space-y-1">
                    <span className="font-bold text-amber-400">Gợi ý thám hiểm: </span>
                    <span>Hãy đọc kỹ vùng địa lý <b>{question.coordinateOrRegion || 'chủ đề'}</b> và chi tiết trong phần giải thích ở trên để chọn lại đáp án đúng!</span>
                  </div>
                </div>
              )}

              {/* Em có biết? khi chọn đúng */}
              {isCorrect && (
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <span className="font-bold text-amber-400">Em có biết? </span>
                    <span>{question.funFact}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons: If WRONG -> CHỌN LẠI (Bắt buộc chọn lại cho đến khi đúng, không cho đi tiếp). If CORRECT -> MỞ CỔNG TIẾP TỤC */}
              <div className="flex justify-end pt-2">
                {!isCorrect ? (
                  <button
                    onClick={handleRetry}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition shadow-lg shadow-rose-600/20 flex items-center gap-2 active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Chọn lại cho đến khi đúng</span>
                  </button>
                ) : (
                  <button
                    onClick={handleUnlockAndResume}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isBulletRescue
                        ? '🛡️ Hóa giải đạn & Được đi tiếp'
                        : isBarrier
                        ? '💥 Phá phong ấn & Đi tiếp'
                        : '✨ Nhận thưởng & Kháng đạn đi tiếp'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
