import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Crosshair, Shield, Zap } from 'lucide-react';

interface TouchControlsProps {
  onInput: (action: 'left' | 'right' | 'jump' | 'sprint' | 'down' | 'shoot' | 'skill', isPressed: boolean) => void;
  mana: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInput, mana }) => {
  const handleTouch = (action: 'left' | 'right' | 'jump' | 'sprint' | 'down' | 'shoot' | 'skill', isPressed: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onInput(action, isPressed);
  };

  return (
    <div className="md:hidden fixed bottom-3 left-0 right-0 z-40 px-3 sm:px-6 flex justify-between items-end pointer-events-none select-none">
      {/* D-Pad: Left, Down (Cúi né đạn), Right */}
      <div className="flex items-center gap-1.5 pointer-events-auto">
        <button
          onTouchStart={handleTouch('left', true)}
          onTouchEnd={handleTouch('left', false)}
          onMouseDown={handleTouch('left', true)}
          onMouseUp={handleTouch('left', false)}
          onMouseLeave={handleTouch('left', false)}
          className="w-12 h-12 rounded-xl bg-slate-900/85 active:bg-amber-500/80 border border-slate-700 active:border-amber-400 text-white flex items-center justify-center backdrop-blur shadow-lg active:scale-95 transition-transform"
          aria-label="Move Left (A)"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Down / Crouch (Phím S / Cúi né đạn) */}
        <button
          onTouchStart={handleTouch('down', true)}
          onTouchEnd={handleTouch('down', false)}
          onMouseDown={handleTouch('down', true)}
          onMouseUp={handleTouch('down', false)}
          onMouseLeave={handleTouch('down', false)}
          className="w-12 h-12 rounded-xl bg-slate-900/85 active:bg-sky-500/80 border border-slate-700 active:border-sky-400 text-sky-200 flex flex-col items-center justify-center backdrop-blur shadow-lg active:scale-95 transition-transform"
          aria-label="Crouch / Dodge (S)"
        >
          <ArrowDown className="w-5 h-5" />
          <span className="text-[8px] font-bold">CÚI</span>
        </button>

        <button
          onTouchStart={handleTouch('right', true)}
          onTouchEnd={handleTouch('right', false)}
          onMouseDown={handleTouch('right', true)}
          onMouseUp={handleTouch('right', false)}
          onMouseLeave={handleTouch('right', false)}
          className="w-12 h-12 rounded-xl bg-slate-900/85 active:bg-amber-500/80 border border-slate-700 active:border-amber-400 text-white flex items-center justify-center backdrop-blur shadow-lg active:scale-95 transition-transform"
          aria-label="Move Right (D)"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Action Buttons: Mana Skill (K), Shoot (J), Jump (W/Space) */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Mana Skill Button (K) */}
        <button
          onTouchStart={handleTouch('skill', true)}
          onTouchEnd={handleTouch('skill', false)}
          onMouseDown={handleTouch('skill', true)}
          onMouseUp={handleTouch('skill', false)}
          onMouseLeave={handleTouch('skill', false)}
          className={`w-12 h-12 rounded-full border-2 text-white flex flex-col items-center justify-center backdrop-blur shadow-lg active:scale-95 transition-transform ${
            mana >= 30
              ? 'bg-cyan-700/80 border-cyan-400 text-cyan-100 shadow-cyan-500/30 animate-pulse'
              : 'bg-slate-900/80 border-slate-700 text-slate-500 opacity-60'
          }`}
          aria-label="Mana Skill (K)"
        >
          <Shield className="w-4 h-4" />
          <span className="text-[8px] font-black">KHIÊN(K)</span>
        </button>

        {/* Shoot Button (J / Click chuột) */}
        <button
          onTouchStart={handleTouch('shoot', true)}
          onTouchEnd={handleTouch('shoot', false)}
          onMouseDown={handleTouch('shoot', true)}
          onMouseUp={handleTouch('shoot', false)}
          onMouseLeave={handleTouch('shoot', false)}
          className="w-13 h-13 rounded-full bg-rose-600/85 active:bg-rose-500 border-2 border-rose-400 text-white flex flex-col items-center justify-center backdrop-blur shadow-lg active:scale-95 transition-transform"
          aria-label="Shoot (J)"
        >
          <Crosshair className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[9px] font-black">BẮN (J)</span>
        </button>

        {/* Jump Button (W / Space) */}
        <button
          onTouchStart={handleTouch('jump', true)}
          onTouchEnd={handleTouch('jump', false)}
          onMouseDown={handleTouch('jump', true)}
          onMouseUp={handleTouch('jump', false)}
          onMouseLeave={handleTouch('jump', false)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 active:from-amber-500 active:to-yellow-400 border-2 border-amber-300 text-slate-950 font-black flex flex-col items-center justify-center backdrop-blur shadow-xl active:scale-95 transition-transform"
          aria-label="Jump (W)"
        >
          <ArrowUp className="w-6 h-6 stroke-[3]" />
          <span className="text-[9px] font-extrabold uppercase">NHẢY</span>
        </button>
      </div>
    </div>
  );
};
