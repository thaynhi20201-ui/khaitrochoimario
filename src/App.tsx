/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GameState, GeographyQuestion, GeographySubject, LevelInfo, WeaponType } from './types/game';
import { LEVEL_DEFINITIONS } from './data/geographyData';
import { TitleScreen } from './components/TitleScreen';
import { WorldMap } from './components/WorldMap';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { QuizModal } from './components/QuizModal';
import { TouchControls } from './components/TouchControls';
import { EncyclopediaModal } from './components/EncyclopediaModal';
import { FansipanChallenge } from './components/FansipanChallenge';
import { LevelClearedModal } from './components/LevelClearedModal';
import { GameOverModal } from './components/GameOverModal';
import { sound } from './utils/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [levels, setLevels] = useState<LevelInfo[]>(() => {
    try {
      const saved = localStorage.getItem('mario_geo_levels');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return LEVEL_DEFINITIONS;
  });

  const [selectedSubject, setSelectedSubject] = useState<GeographySubject>(() => {
    try {
      const saved = localStorage.getItem('mario_geo_subject');
      if (saved === 'natural' || saved === 'social' || saved === 'spatial') {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'natural';
  });

  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeQuiz, setActiveQuiz] = useState<GeographyQuestion | null>(null);
  const [isBarrierQuiz, setIsBarrierQuiz] = useState<boolean>(false);
  const [quizType, setQuizType] = useState<'block' | 'barrier' | 'bullet_rescue'>('block');
  const [bulletProof, setBulletProof] = useState<boolean>(false);
  const barrierSolveCallbackRef = useRef<(() => void) | null>(null);

  // HUD stats
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [hp, setHp] = useState<number>(100);
  const [maxHp, setMaxHp] = useState<number>(100);
  const [mana, setMana] = useState<number>(100);
  const [maxMana, setMaxMana] = useState<number>(100);
  const [shieldTimer, setShieldTimer] = useState<number>(0);
  const [weapon, setWeapon] = useState<WeaponType>('normal');
  const [stars, setStars] = useState<number>(0);

  // Completed level stats for modal
  const [lastClearedScore, setLastClearedScore] = useState<number>(0);
  const [lastClearedStars, setLastClearedStars] = useState<number>(0);

  // Active keyboard / touch input state
  const activeInputRef = useRef<{
    left: boolean;
    right: boolean;
    jump: boolean;
    sprint: boolean;
    down: boolean;
    shoot: boolean;
    skill: boolean;
  }>({
    left: false,
    right: false,
    jump: false,
    sprint: false,
    down: false,
    shoot: false,
    skill: false,
  });

  // Save level progression
  useEffect(() => {
    try {
      localStorage.setItem('mario_geo_levels', JSON.stringify(levels));
    } catch {
      // Ignore storage errors
    }
  }, [levels]);

  // Save selected geography subject
  useEffect(() => {
    try {
      localStorage.setItem('mario_geo_subject', selectedSubject);
    } catch {
      // Ignore storage errors
    }
  }, [selectedSubject]);

  const currentLevelInfo = levels.find((l) => l.id === currentLevelId) || levels[0];

  const totalScore = levels.reduce((sum, l) => sum + (l.highScore || 0), 0) + score;
  const totalStars = levels.reduce((sum, l) => sum + (l.starsEarned || 0), 0) + stars;

  // Handle touch input
  const handleTouchInput = (action: 'left' | 'right' | 'jump' | 'sprint' | 'down' | 'shoot' | 'skill', isPressed: boolean) => {
    activeInputRef.current[action] = isPressed;
  };

  // Open quiz when hitting [ ? ] block, reaching sealed barrier gate, or bullet rescue
  const handleOpenQuiz = (
    question: GeographyQuestion,
    isBarrier: boolean = false,
    onSolved?: () => void,
    type: 'block' | 'barrier' | 'bullet_rescue' = isBarrier ? 'barrier' : 'block'
  ) => {
    setActiveQuiz(question);
    setIsBarrierQuiz(isBarrier);
    setQuizType(type);
    barrierSolveCallbackRef.current = onSolved || null;
    setIsPaused(true);
  };

  // Quiz answered handler
  const handleQuizAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore((prev) => prev + 200);
      setStars((prev) => prev + 1);
      setBulletProof(true);
      // Trigger solve callback (grant bullet immunity, remove barrier, etc.)
      if (barrierSolveCallbackRef.current) {
        barrierSolveCallbackRef.current();
        barrierSolveCallbackRef.current = null;
      }
    }
    setActiveQuiz(null);
    setIsBarrierQuiz(false);
    setIsPaused(false);
  };

  // Level cleared handler
  const handleLevelComplete = (finalScore: number, finalStars: number) => {
    setLastClearedScore(finalScore);
    setLastClearedStars(finalStars);

    // Update level definition unlocked next
    setLevels((prev) =>
      prev.map((lvl) => {
        if (lvl.id === currentLevelId) {
          return {
            ...lvl,
            highScore: Math.max(lvl.highScore, finalScore),
            starsEarned: Math.max(lvl.starsEarned, finalStars),
          };
        }
        if (lvl.id === currentLevelId + 1) {
          return {
            ...lvl,
            unlocked: true,
          };
        }
        return lvl;
      })
    );

    setGameState('LEVEL_CLEARED');
  };

  // Game over handler
  const handleGameOver = () => {
    setGameState('GAME_OVER');
  };

  // Start a specific level
  const handleStartLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setScore(0);
    setCoins(0);
    setHp(100);
    setMaxHp(100);
    setMana(100);
    setMaxMana(100);
    setShieldTimer(0);
    setWeapon('normal');
    setStars(0);
    setIsPaused(false);
    setActiveQuiz(null);
    setGameState('PLAYING');
  };

  // Next level progression
  const handleNextLevel = () => {
    const nextId = currentLevelId + 1;
    if (nextId <= 4) {
      handleStartLevel(nextId);
    } else {
      setGameState('WORLD_MAP');
    }
  };

  // Retry current level
  const handleRetry = () => {
    handleStartLevel(currentLevelId);
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* 1. Title Screen */}
      {gameState === 'TITLE_MENU' && (
        <TitleScreen
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
          onStartGame={() => handleStartLevel(1)}
          onOpenMap={() => setGameState('WORLD_MAP')}
          onOpenEncyclopedia={() => setGameState('ENCYCLOPEDIA')}
          onOpenFansipan={() => setGameState('FANSIPAN_CHALLENGE')}
        />
      )}

      {/* 2. World Map Overworld */}
      {gameState === 'WORLD_MAP' && (
        <WorldMap
          levels={levels}
          selectedLevelId={currentLevelId}
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
          onSelectLevel={(id) => setCurrentLevelId(id)}
          onStartLevel={(id) => handleStartLevel(id)}
          onOpenEncyclopedia={() => setGameState('ENCYCLOPEDIA')}
          onOpenFansipanChallenge={() => setGameState('FANSIPAN_CHALLENGE')}
          totalScore={totalScore}
          totalStars={totalStars}
        />
      )}

      {/* 3. Fansipan Mountain Challenge */}
      {gameState === 'FANSIPAN_CHALLENGE' && (
        <FansipanChallenge
          subject={selectedSubject}
          onBackToMap={() => setGameState('WORLD_MAP')}
          onRecordScore={(pts) => {
            setScore((prev) => prev + pts);
          }}
        />
      )}

      {/* 4. Active Platformer Play View */}
      {(gameState === 'PLAYING' || gameState === 'LEVEL_CLEARED' || gameState === 'GAME_OVER') && (
        <div className="relative w-full h-screen flex flex-col justify-center items-center bg-slate-950">
          {/* Top HUD */}
          <HUD
            score={score}
            coins={coins}
            hp={hp}
            maxHp={maxHp}
            mana={mana}
            maxMana={maxMana}
            shieldTimer={shieldTimer}
            bulletProof={bulletProof}
            weapon={weapon}
            stars={stars}
            levelTitle={currentLevelInfo.title}
            subject={selectedSubject}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((prev) => !prev)}
            onExitToMap={() => setGameState('WORLD_MAP')}
          />

          {/* 60FPS Canvas Platformer */}
          <GameCanvas
            levelId={currentLevelId}
            subject={selectedSubject}
            onOpenQuiz={handleOpenQuiz}
            onLevelComplete={handleLevelComplete}
            onGameOver={handleGameOver}
            onUpdateHUD={(s, c, playerHp, playerMaxHp, playerMana, playerMaxMana, playerShield, playerWeapon, st, isBulletProof) => {
              setScore(s);
              setCoins(c);
              setHp(playerHp);
              setMaxHp(playerMaxHp);
              setMana(playerMana);
              setMaxMana(playerMaxMana);
              setShieldTimer(playerShield);
              setWeapon(playerWeapon);
              setStars(st);
              setBulletProof(Boolean(isBulletProof));
            }}
            isPaused={isPaused || Boolean(activeQuiz)}
            activeInputRef={activeInputRef}
          />

          {/* Virtual Gamepad for Mobile/Touch */}
          <TouchControls onInput={handleTouchInput} mana={mana} />

          {/* Interactive Geography Quiz Modal */}
          {activeQuiz && (
            <QuizModal
              question={activeQuiz}
              onAnswer={handleQuizAnswer}
              isBarrier={isBarrierQuiz}
              quizType={quizType}
            />
          )}

          {/* Level Cleared Modal */}
          {gameState === 'LEVEL_CLEARED' && (
            <LevelClearedModal
              level={currentLevelInfo}
              score={lastClearedScore}
              starsEarned={lastClearedStars}
              onNextLevel={handleNextLevel}
              onReplay={handleRetry}
              onBackToMap={() => setGameState('WORLD_MAP')}
              hasNextLevel={currentLevelId < 4}
            />
          )}

          {/* Game Over Modal */}
          {gameState === 'GAME_OVER' && (
            <GameOverModal
              onRetry={handleRetry}
              onBackToMap={() => setGameState('WORLD_MAP')}
              onOpenEncyclopedia={() => setGameState('ENCYCLOPEDIA')}
            />
          )}
        </div>
      )}

      {/* 5. Sổ Tay Bách Khoa Địa Lý Modal */}
      {gameState === 'ENCYCLOPEDIA' && (
        <EncyclopediaModal
          onClose={() => setGameState('WORLD_MAP')}
          defaultSubject={selectedSubject}
        />
      )}
    </div>
  );
}
