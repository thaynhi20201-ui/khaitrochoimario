import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Block, Collectible, Enemy, Particle, Player, Projectile, SupplyBox, DroppedItem, WeaponType, GeographyQuestion, GeographySubject } from '../types/game';
import { generateLevelData, LevelMap } from '../data/levels';
import { LEVEL_DEFINITIONS, GEOGRAPHY_QUESTIONS, getQuestionForBlock, getRandomQuestionForSubject } from '../data/geographyData';
import { sound } from '../utils/audio';

interface GameCanvasProps {
  levelId: number;
  subject: GeographySubject;
  onOpenQuiz: (
    question: GeographyQuestion,
    isBarrier?: boolean,
    onSolved?: () => void,
    quizType?: 'block' | 'barrier' | 'bullet_rescue'
  ) => void;
  onLevelComplete: (finalScore: number, stars: number) => void;
  onGameOver: () => void;
  onUpdateHUD: (
    score: number,
    coins: number,
    hp: number,
    maxHp: number,
    mana: number,
    maxMana: number,
    shieldTimer: number,
    weapon: WeaponType,
    stars: number,
    bulletProof?: boolean
  ) => void;
  isPaused: boolean;
  activeInputRef: React.MutableRefObject<{
    left: boolean;
    right: boolean;
    jump: boolean;
    sprint: boolean;
    down: boolean;
    shoot: boolean;
    skill: boolean;
  }>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  levelId,
  subject,
  onOpenQuiz,
  onLevelComplete,
  onGameOver,
  onUpdateHUD,
  isPaused,
  activeInputRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game internal state stored in refs for 60fps loop
  const levelDataRef = useRef<LevelMap>(generateLevelData(levelId));
  const currentLevelInfo = LEVEL_DEFINITIONS.find((l) => l.id === levelId) || LEVEL_DEFINITIONS[0];

  const scoreRef = useRef<number>(0);
  const coinsRef = useRef<number>(0);
  const starsRef = useRef<number>(0);

  // Flying Supply Boxes & Dropped Items
  const supplyBoxesRef = useRef<SupplyBox[]>([]);
  const droppedItemsRef = useRef<DroppedItem[]>([]);
  const supplySpawnTimerRef = useRef<number>(180); // Spawn supply box every ~8-10 seconds

  // Projectiles
  const projectilesRef = useRef<Projectile[]>([]);
  const shootCooldownRef = useRef<number>(0);

  const particlesRef = useRef<Particle[]>([]);
  const cameraXRef = useRef<number>(0);
  const isClearingRef = useRef<boolean>(false);
  const clearTimerRef = useRef<number>(0);

  // Player state: HP=100, Mana=100, crouching, shieldTimer, weapon (normal, spread, laser)
  const playerRef = useRef<Player>({
    x: 80,
    y: 380,
    vx: 0,
    vy: 0,
    width: 24,
    height: 32,
    isGrounded: false,
    isJumping: false,
    isCrouching: false,
    facing: 'right',
    animFrame: 0,
    animTimer: 0,
    isInvulnerable: false,
    invulnerableTimer: 0,
    powerState: 'normal',
    starTimer: 0,
    hp: 100,
    maxHp: 100,
    mana: 100,
    maxMana: 100,
    shieldTimer: 0,
    bulletImmunityTimer: 0,
    hasAnsweredCorrectly: false,
    weapon: 'normal',
    weaponAmmo: 0,
  });

  // Hào quang Kháng Đạn & Bảo hộ Tri Thức Địa Lý:
  // "Trả lời đúng dính đạn ko sao được đi tiếp"
  const hasAnsweredCorrectlyRef = useRef<boolean>(false);
  const bulletImmunityTimerRef = useRef<number>(0);
  const bulletShieldChargesRef = useRef<number>(0);

  // Re-sync HUD
  const syncHUD = useCallback(() => {
    const p = playerRef.current;
    const isBulletProof = hasAnsweredCorrectlyRef.current || bulletImmunityTimerRef.current > 0 || p.shieldTimer > 0;
    onUpdateHUD(
      scoreRef.current,
      coinsRef.current,
      p.hp,
      p.maxHp,
      p.mana,
      p.maxMana,
      p.shieldTimer,
      p.weapon,
      starsRef.current,
      isBulletProof
    );
  }, [onUpdateHUD]);

  // Cấp hiệu ứng Hào quang Kháng Đạn khi trả lời đúng:
  // Dính đạn không sao, được đi tiếp
  const grantBulletImmunity = useCallback((title: string = 'TRẢ LỜI ĐÚNG! KHÁNG ĐẠN') => {
    const p = playerRef.current;
    hasAnsweredCorrectlyRef.current = true;
    p.hasAnsweredCorrectly = true;
    bulletImmunityTimerRef.current = Math.max(bulletImmunityTimerRef.current, 1500); // 25s
    p.shieldTimer = Math.max(p.shieldTimer, 900); // 15s visible aura
    bulletShieldChargesRef.current += 5; // Tối thiểu 5 lượt đỡ đạn chắc chắn
    p.hp = Math.min(p.maxHp, p.hp + 35); // Hồi máu
    p.mana = Math.min(p.maxMana, p.mana + 30); // Hồi mana

    // Tiêu hủy toàn bộ đạn địch đang có trên màn hình để đảm bảo an toàn tuyệt đối
    for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
      const pr = projectilesRef.current[i];
      if (!pr.fromPlayer) {
        addSparkleParticles(pr.x, pr.y, '#FBBF24', 6);
        projectilesRef.current.splice(i, 1);
      }
    }

    sound.playPowerup();
    addSparkleParticles(p.x + p.width / 2, p.y + p.height / 2, '#10B981', 16);
    addSparkleParticles(p.x + p.width / 2, p.y + p.height / 2, '#FBBF24', 16);
    addTextParticle(p.x + p.width / 2, p.y - 25, title, '#10B981');
    addTextParticle(p.x + p.width / 2, p.y - 45, '🛡️ DÍNH ĐẠN KO SAO - ĐI TIẾP!', '#F59E0B');
    scoreRef.current += 200;
    syncHUD();
  }, [syncHUD]);

  // Particle helpers
  const addTextParticle = (x: number, y: number, text: string, color: string = '#FBBF24') => {
    particlesRef.current.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -2,
      size: 13,
      color,
      life: 48,
      maxLife: 48,
      text,
    });
  };

  const addSparkleParticles = (x: number, y: number, color: string = '#FDE047', count: number = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * (1.8 + Math.random() * 2),
        vy: Math.sin(angle) * (1.8 + Math.random() * 2),
        size: 3 + Math.random() * 2,
        color,
        life: 25,
        maxLife: 25,
      });
    }
  };

  const addExplosionParticles = (x: number, y: number) => {
    const colors = ['#EF4444', '#F97316', '#FBBF24', '#FEF08A', '#FFFFFF'];
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 30,
        maxLife: 30,
      });
    }
  };

  // Reset or switch level
  useEffect(() => {
    levelDataRef.current = generateLevelData(levelId);
    const p = playerRef.current;
    p.x = levelDataRef.current.playerStart.x;
    p.y = levelDataRef.current.playerStart.y;
    p.vx = 0;
    p.vy = 0;
    p.hp = 100;
    p.mana = 100;
    p.shieldTimer = 0;
    p.isCrouching = false;
    p.isInvulnerable = false;
    p.weapon = 'normal';
    p.weaponAmmo = 0;
    projectilesRef.current = [];
    supplyBoxesRef.current = [];
    droppedItemsRef.current = [];
    supplySpawnTimerRef.current = 150;
    cameraXRef.current = 0;
    isClearingRef.current = false;
    clearTimerRef.current = 0;
    particlesRef.current = [];
    syncHUD();
  }, [levelId, syncHUD]);

  // Handle keyboard inputs: A/D (move), W/Space/Up (jump), S/Down (crouch), J/Mouse (shoot), K (mana skill)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        activeInputRef.current.left = true;
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        activeInputRef.current.right = true;
      }
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        if (!activeInputRef.current.jump) {
          activeInputRef.current.jump = true;
        }
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        activeInputRef.current.down = true;
      }
      if (['KeyJ'].includes(e.code)) {
        activeInputRef.current.shoot = true;
      }
      if (['KeyK'].includes(e.code)) {
        activeInputRef.current.skill = true;
      }
      if (['ShiftLeft', 'ShiftRight'].includes(e.code)) {
        activeInputRef.current.sprint = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        activeInputRef.current.left = false;
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        activeInputRef.current.right = false;
      }
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        activeInputRef.current.jump = false;
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        activeInputRef.current.down = false;
      }
      if (['KeyJ'].includes(e.code)) {
        activeInputRef.current.shoot = false;
      }
      if (['KeyK'].includes(e.code)) {
        activeInputRef.current.skill = false;
      }
      if (['ShiftLeft', 'ShiftRight'].includes(e.code)) {
        activeInputRef.current.sprint = false;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        activeInputRef.current.shoot = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        activeInputRef.current.shoot = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeInputRef]);

  // Main Game Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gravity = 0.52;
    const walkSpeed = 3.2;
    const sprintSpeed = 5.2;
    const jumpForce = -10.5;

    const gameLoop = () => {
      if (!isPaused) {
        const player = playerRef.current;
        const level = levelDataRef.current;
        const input = activeInputRef.current;

        // Passive Mana regeneration (+0.15 per frame up to maxMana)
        if (player.mana < player.maxMana) {
          player.mana = Math.min(player.maxMana, player.mana + 0.15);
        }

        // Active Shield timer countdown
        if (player.shieldTimer > 0) {
          player.shieldTimer--;
        }

        // Shoot cooldown
        if (shootCooldownRef.current > 0) {
          shootCooldownRef.current--;
        }

        // --- 0. Supply Box Spawner (Hộp tiếp tế bay trên trời bằng khinh khí cầu/cánh quạt) ---
        supplySpawnTimerRef.current--;
        if (supplySpawnTimerRef.current <= 0) {
          supplySpawnTimerRef.current = 450 + Math.floor(Math.random() * 200); // 7 - 10 giây một hộp

          // Cycle or random item: mushroom, spread_gun, laser_gun
          const pool: ('mushroom' | 'spread_gun' | 'laser_gun')[] = ['mushroom', 'spread_gun', 'laser_gun'];
          const randomItem = pool[Math.floor(Math.random() * pool.length)];

          // Spawn flying box ahead of player across screen sky
          const spawnX = Math.max(player.x + 350, cameraXRef.current + canvas.width + 20);
          const spawnY = 70 + Math.random() * 60; // Flying high in sky

          supplyBoxesRef.current.push({
            id: `supply-${Date.now()}-${Math.random()}`,
            x: spawnX,
            y: spawnY,
            vx: -1.2, // Fly smoothly across sky from right to left
            vy: 0,
            width: 34,
            height: 34,
            hp: 30, // 1-2 hits from gun to destroy
            maxHp: 30,
            itemInside: randomItem,
            isAlive: true,
            bobTimer: Math.random() * Math.PI,
          });
        }

        // --- 1. Level Clearing Sequence (Flagpole touched) ---
        if (isClearingRef.current) {
          clearTimerRef.current++;
          player.vx = 1.8;
          player.facing = 'right';
          player.animTimer++;
          if (player.animTimer % 6 === 0) {
            player.animFrame = (player.animFrame + 1) % 4;
          }
          player.x += player.vx;

          if (clearTimerRef.current % 15 === 0) {
            const fx = player.x + (Math.random() - 0.5) * 160;
            const fy = player.y - 120 - Math.random() * 80;
            const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
            addSparkleParticles(fx, fy, colors[Math.floor(Math.random() * colors.length)], 10);
          }

          if (clearTimerRef.current > 180) {
            onLevelComplete(scoreRef.current, starsRef.current);
            return;
          }
        } else {
          // --- 2. Crouch logic (Phím S / Mũi tên xuống: cúi người né đạn) ---
          player.isCrouching = input.down && player.isGrounded;
          const effectiveHeight = player.isCrouching ? 18 : 32;
          player.height = effectiveHeight;

          // --- 3. Normal Movement Physics ---
          const maxSpd = input.sprint ? sprintSpeed : walkSpeed;
          const accel = 0.45;
          const friction = 0.82;

          if (!player.isCrouching) {
            if (input.left) {
              player.vx = Math.max(player.vx - accel, -maxSpd);
              player.facing = 'left';
            } else if (input.right) {
              player.vx = Math.min(player.vx + accel, maxSpd);
              player.facing = 'right';
            } else {
              player.vx *= friction;
              if (Math.abs(player.vx) < 0.1) player.vx = 0;
            }
          } else {
            player.vx *= 0.7;
          }

          // Jump logic: Up / W / Space
          if (input.jump && player.isGrounded && !player.isCrouching) {
            player.vy = jumpForce;
            player.isGrounded = false;
            player.isJumping = true;
            sound.playJump();
            addSparkleParticles(player.x + player.width / 2, player.y + player.height, '#CBD5E1', 6);
          }

          // Gravity
          player.vy += gravity;
          if (player.vy > 12) player.vy = 12;

          // Invulnerability timer
          if (player.isInvulnerable) {
            player.invulnerableTimer--;
            if (player.invulnerableTimer <= 0) {
              player.isInvulnerable = false;
            }
          }

          // Shield timer & Bullet Immunity timer
          if (player.shieldTimer > 0) {
            player.shieldTimer--;
          }
          if (bulletImmunityTimerRef.current > 0) {
            bulletImmunityTimerRef.current--;
          }

          // --- 4. Shooting: Bắn súng Thường, Súng S (3 tia tỏa) hoặc Súng L (Laser dài xuyên thấu) ---
          if (input.shoot && shootCooldownRef.current <= 0) {
            const dir = player.facing === 'right' ? 1 : -1;
            const spawnX = dir === 1 ? player.x + player.width + 4 : player.x - 8;
            const spawnY = player.y + (player.isCrouching ? 6 : 14);

            if (player.weapon === 'spread') {
              // SÚNG S (Spread Gun): Bắn đạn chùm tỏa 3 tia hình quạt
              shootCooldownRef.current = 15;
              sound.playSpread();

              // Tia giữa
              projectilesRef.current.push({
                id: `p-${Date.now()}-1`,
                x: spawnX,
                y: spawnY,
                vx: dir * 8.5,
                vy: 0,
                radius: 5,
                fromPlayer: true,
                damage: 55,
                color: '#FB923C',
                life: 65,
              });

              // Tia chéo lên
              projectilesRef.current.push({
                id: `p-${Date.now()}-2`,
                x: spawnX,
                y: spawnY,
                vx: dir * 8.0,
                vy: -3.2,
                radius: 5,
                fromPlayer: true,
                damage: 55,
                color: '#F97316',
                life: 65,
              });

              // Tia chéo xuống
              projectilesRef.current.push({
                id: `p-${Date.now()}-3`,
                x: spawnX,
                y: spawnY,
                vx: dir * 8.0,
                vy: 3.2,
                radius: 5,
                fromPlayer: true,
                damage: 55,
                color: '#EA580C',
                life: 65,
              });

              addSparkleParticles(spawnX, spawnY, '#FB923C', 6);
            } else if (player.weapon === 'laser') {
              // SÚNG L (Laser Gun): Bắn tia laser dài xuyên thấu qua mọi kẻ địch
              shootCooldownRef.current = 18;
              sound.playLaser();

              projectilesRef.current.push({
                id: `laser-${Date.now()}`,
                x: spawnX,
                y: spawnY,
                vx: dir * 14.0, // High velocity beam
                vy: 0,
                radius: 7,
                length: 45,
                fromPlayer: true,
                isLaser: true,
                pierceCount: 999, // Xuyên thấu qua mọi quái vật
                damage: 110, // Sát thương cực lớn
                color: '#C084FC',
                life: 70,
              });

              addSparkleParticles(spawnX, spawnY, '#A855F7', 8);
            } else {
              // SÚNG THƯỜNG: Bắn thẳng hoặc bắn chéo khi đang nhảy
              shootCooldownRef.current = 14;
              const isDiagonal = input.jump || (!player.isGrounded && input.jump);

              projectilesRef.current.push({
                id: `p-${Date.now()}-${Math.random()}`,
                x: spawnX,
                y: spawnY,
                vx: dir * (isDiagonal ? 6.5 : 8.5),
                vy: isDiagonal ? -5 : 0,
                radius: 4,
                fromPlayer: true,
                damage: 50,
                color: isDiagonal ? '#38BDF8' : '#F59E0B',
                life: 65,
              });

              sound.playShoot(isDiagonal);
              addSparkleParticles(spawnX, spawnY, '#FDE047', 4);
            }
          }

          // --- 5. Mana Skill (Phím K): Khiên hộ thể & Sóng chấn động đạn nổ lớn ---
          if (input.skill) {
            if (player.mana >= 30 && player.shieldTimer <= 0) {
              player.mana -= 30;
              player.shieldTimer = 300;
              sound.playShield();
              addTextParticle(player.x, player.y - 20, '🛡️ KHIÊN HỘ THỂ (5S)!', '#38BDF8');
              addSparkleParticles(player.x + player.width / 2, player.y + player.height / 2, '#38BDF8', 16);

              projectilesRef.current.push({
                id: `super-${Date.now()}`,
                x: player.x + (player.facing === 'right' ? player.width + 4 : -14),
                y: player.y + 10,
                vx: (player.facing === 'right' ? 1 : -1) * 7.5,
                vy: 0,
                radius: 12,
                fromPlayer: true,
                isSuperExplosive: true,
                damage: 200,
                color: '#06B6D4',
                life: 90,
              });

              syncHUD();
            } else if (player.mana < 30) {
              sound.playManaOut();
              addTextParticle(player.x, player.y - 20, 'HẾT MANA (CẦN 30)!', '#F43F5E');
            }
            input.skill = false;
          }

          // Horizontal movement & collision
          player.x += player.vx;
          if (player.x < 0) {
            player.x = 0;
            player.vx = 0;
          }

          // Block collisions (X axis)
          for (const b of level.blocks) {
            if (b.type === 'flagpole' || b.type === 'flag_top' || b.type === 'castle') continue;

            // Rào chắn / Cổng phong ấn: khi chạm cổng, lập tức tạm dừng và hiện câu hỏi
            if (b.type === 'barrier_gate') {
              if (b.barrierActive) {
                if (
                  player.x + player.width >= b.x - 4 &&
                  player.x <= b.x + b.width + 4 &&
                  player.y + player.height >= b.y &&
                  player.y <= b.y + b.height
                ) {
                  player.vx = 0;
                  player.x = b.x - player.width - 2;

                  const randomQ = getRandomQuestionForSubject(subject, levelId);

                  sound.playBump();

                  onOpenQuiz(randomQ, true, () => {
                    b.barrierActive = false;
                    sound.playExplosion();
                    addExplosionParticles(b.x + b.width / 2, b.y + b.height / 2);
                    addExplosionParticles(b.x + b.width / 2, b.y + 30);
                    addExplosionParticles(b.x + b.width / 2, b.y + b.height - 30);
                    addTextParticle(b.x + b.width / 2, b.y - 20, '💥 PHONG ẤN ĐÃ BỊ PHÁ!', '#10B981');
                    scoreRef.current += 300;
                    grantBulletImmunity('PHÁ PHONG ẤN! KHÁNG ĐẠN');
                    syncHUD();
                  }, 'barrier');
                }
              }
              continue;
            }

            if (
              player.x < b.x + b.width &&
              player.x + player.width > b.x &&
              player.y < b.y + b.height &&
              player.y + player.height > b.y
            ) {
              if (player.vx > 0) {
                player.x = b.x - player.width;
                player.vx = 0;
              } else if (player.vx < 0) {
                player.x = b.x + b.width;
                player.vx = 0;
              }
            }
          }

          // Vertical movement & collision
          player.y += player.vy;
          player.isGrounded = false;

          for (const b of level.blocks) {
            if (b.type === 'flagpole') {
              if (
                player.x + player.width >= b.x &&
                player.x <= b.x + b.width &&
                player.y + player.height >= b.y &&
                player.y <= b.y + b.height
              ) {
                isClearingRef.current = true;
                sound.playVictory();
                scoreRef.current += 1000;
                addTextParticle(player.x, player.y - 30, '+1000 VICTORY!', '#10B981');
                syncHUD();
                break;
              }
              continue;
            }
            if (b.type === 'flag_top' || b.type === 'castle') continue;

            if (
              player.x < b.x + b.width &&
              player.x + player.width > b.x &&
              player.y < b.y + b.height &&
              player.y + player.height > b.y
            ) {
              if (player.vy > 0 && player.y + player.height - player.vy <= b.y + 8) {
                player.y = b.y - player.height;
                player.vy = 0;
                player.isGrounded = true;
                player.isJumping = false;
              } else if (player.vy < 0 && player.y - player.vy >= b.y + b.height - 8) {
                player.y = b.y + b.height;
                player.vy = 1;

                if (!b.hit) {
                  b.bumpOffset = -8;
                  sound.playBump();

                  if (b.type === 'question') {
                    b.hit = true;
                    if (b.content === 'quiz') {
                      const q = b.questionIndex !== undefined
                        ? getQuestionForBlock(subject, levelId, b.questionIndex)
                        : (b.questionId ? GEOGRAPHY_QUESTIONS.find((item) => item.id === b.questionId) : null) || getRandomQuestionForSubject(subject, levelId);
                      if (q) {
                        onOpenQuiz(q, false, () => {
                          grantBulletImmunity('TRẢ LỜI ĐÚNG! KHÁNG ĐẠN');
                        }, 'block');
                      }
                    } else if (b.content === 'powerup') {
                      starsRef.current += 1;
                      scoreRef.current += 300;
                      player.mana = player.maxMana;
                      player.hp = Math.min(player.maxHp, player.hp + 30);
                      sound.playPowerup();
                      addTextParticle(b.x, b.y - 20, '★ HỒI ĐẦY MANA +30 HP!', '#38BDF8');
                      syncHUD();
                    } else {
                      coinsRef.current += 1;
                      scoreRef.current += 100;
                      player.mana = Math.min(player.maxMana, player.mana + 15);
                      sound.playCoin();
                      addTextParticle(b.x, b.y - 20, '+100 Đ (+15 Mana)', '#FBBF24');
                      syncHUD();
                    }
                  } else if (b.type === 'brick') {
                    scoreRef.current += 50;
                    addTextParticle(b.x, b.y - 10, '+50', '#F59E0B');
                    syncHUD();
                  }
                }
              }
            }
          }

          // Smoothly decay bump offset
          for (const b of level.blocks) {
            if (b.bumpOffset < 0) {
              b.bumpOffset += 1.5;
              if (b.bumpOffset > 0) b.bumpOffset = 0;
            }
          }

          // Walk animation frames
          if (Math.abs(player.vx) > 0.2 && !player.isCrouching) {
            player.animTimer++;
            const animThreshold = input.sprint ? 4 : 7;
            if (player.animTimer % animThreshold === 0) {
              player.animFrame = (player.animFrame + 1) % 4;
            }
          } else {
            player.animFrame = 0;
          }

          // Abyss pit check
          if (player.y > canvas.height + 60) {
            player.hp = 0;
            sound.playGameOver();
            syncHUD();
            onGameOver();
            return;
          }

          // --- 6. Collectibles Update ---
          for (const item of level.collectibles) {
            if (item.collected) continue;
            if (
              player.x < item.x + item.width &&
              player.x + player.width > item.x &&
              player.y < item.y + item.height &&
              player.y + player.height > item.y
            ) {
              item.collected = true;
              if (item.type === 'compass') {
                starsRef.current += 1;
                scoreRef.current += 200;
                player.mana = Math.min(player.maxMana, player.mana + 35);
                sound.playPowerup();
                addTextParticle(item.x, item.y - 10, '🧭 LA BÀN (+35 Mana)!', '#38BDF8');
              } else {
                coinsRef.current += 1;
                scoreRef.current += 50;
                player.mana = Math.min(player.maxMana, player.mana + 10);
                sound.playCoin();
                addTextParticle(item.x, item.y - 10, '+50', '#FBBF24');
              }
              addSparkleParticles(item.x, item.y, '#FBBF24', 6);
              syncHUD();
            }
          }

          // --- 7. Flying Supply Boxes Movement & Bobbing ---
          for (let sIdx = supplyBoxesRef.current.length - 1; sIdx >= 0; sIdx--) {
            const sBox = supplyBoxesRef.current[sIdx];
            sBox.x += sBox.vx;
            sBox.bobTimer += 0.04;
            sBox.y += Math.sin(sBox.bobTimer) * 0.4;

            // Remove if flown far off left side
            if (sBox.x < cameraXRef.current - 120) {
              supplyBoxesRef.current.splice(sIdx, 1);
            }
          }

          // --- 8. Dropped Items Falling from Sky to Ground ---
          for (let dIdx = droppedItemsRef.current.length - 1; dIdx >= 0; dIdx--) {
            const item = droppedItemsRef.current[dIdx];
            if (item.collected) {
              droppedItemsRef.current.splice(dIdx, 1);
              continue;
            }

            // Fall gently with parachute (vy = 1.6)
            if (!item.isGrounded) {
              item.y += item.vy;
              // Check collision with ground blocks
              for (const b of level.blocks) {
                if (b.type === 'ground' || b.type === 'stone' || b.type === 'brick') {
                  if (
                    item.x + item.width > b.x &&
                    item.x < b.x + b.width &&
                    item.y + item.height >= b.y &&
                    item.y < b.y + b.height
                  ) {
                    item.y = b.y - item.height;
                    item.isGrounded = true;
                    item.parachute = false; // Drop parachute when touching ground
                    break;
                  }
                }
              }
            }

            // Player pickup dropped supply item!
            if (
              player.x < item.x + item.width + 6 &&
              player.x + player.width > item.x - 6 &&
              player.y < item.y + item.height + 6 &&
              player.y + player.height > item.y - 6
            ) {
              item.collected = true;
              sound.playPowerup();

              if (item.type === 'mushroom') {
                // + Nấm thần kỳ: Hồi 100% thanh Máu (HP) và Mana
                player.hp = player.maxHp;
                player.mana = player.maxMana;
                addExplosionParticles(item.x, item.y);
                addTextParticle(player.x, player.y - 25, '🍄 NẤM THẦN: 100% HP & MANA!', '#10B981');
              } else if (item.type === 'spread_gun') {
                // + Súng S (Spread Gun): Chuyển sang bắn đạn chùm tỏa 3 tia
                player.weapon = 'spread';
                player.weaponAmmo = 60;
                addSparkleParticles(item.x, item.y, '#F97316', 16);
                addTextParticle(player.x, player.y - 25, '🔥 NHẬN SÚNG [S] BẮN 3 TIA!', '#F97316');
              } else if (item.type === 'laser_gun') {
                // + Súng L (Laser Gun): Bắn tia laser dài xuyên thấu qua mọi kẻ địch
                player.weapon = 'laser';
                player.weaponAmmo = 45;
                addSparkleParticles(item.x, item.y, '#A855F7', 16);
                addTextParticle(player.x, player.y - 25, '⚡ NHẬN SÚNG [L] LASER XUYÊN THẤU!', '#C084FC');
              }

              scoreRef.current += 200;
              syncHUD();
              droppedItemsRef.current.splice(dIdx, 1);
            }
          }

          // --- 9. Enemies Update, Patrol & Enemy Projectile Shooting ---
          for (const enemy of level.enemies) {
            if (!enemy.isAlive) {
              if (enemy.isSquished) {
                enemy.squishTimer++;
              }
              continue;
            }

            enemy.x += enemy.vx;
            if (enemy.x > enemy.startX + enemy.patrolRange) {
              enemy.vx = -Math.abs(enemy.vx);
            } else if (enemy.x < enemy.startX - enemy.patrolRange) {
              enemy.vx = Math.abs(enemy.vx);
            }

            if (enemy.shootTimer !== undefined) {
              enemy.shootTimer--;
              if (enemy.shootTimer <= 0) {
                enemy.shootTimer = enemy.shootInterval || 140;

                if (Math.abs(enemy.x - player.x) < 450) {
                  const dirToPlayer = player.x < enemy.x ? -1 : 1;
                  projectilesRef.current.push({
                    id: `ep-${Date.now()}-${Math.random()}`,
                    x: enemy.x + (dirToPlayer === 1 ? enemy.width : 0),
                    y: enemy.y + 10,
                    vx: dirToPlayer * 3.8,
                    vy: 0,
                    radius: 5,
                    fromPlayer: false,
                    damage: 25,
                    color: '#EF4444',
                    life: 110,
                  });
                  addSparkleParticles(enemy.x + 14, enemy.y + 10, '#EF4444', 4);
                }
              }
            }

            // Direct melee collision
            if (
              player.x < enemy.x + enemy.width &&
              player.x + player.width > enemy.x &&
              player.y < enemy.y + enemy.height &&
              player.y + player.height > enemy.y
            ) {
              if (player.vy > 0 && player.y + player.height - player.vy <= enemy.y + 12) {
                enemy.isAlive = false;
                enemy.isSquished = true;
                player.vy = -7.5;
                sound.playStomp();
                scoreRef.current += 150;
                player.mana = Math.min(player.maxMana, player.mana + 20);
                addTextParticle(enemy.x, enemy.y - 10, '+150 (+20 Mana)', '#34D399');
                addSparkleParticles(enemy.x + 14, enemy.y + 14, '#10B981', 8);
                syncHUD();
              } else if (!player.isInvulnerable) {
                if (player.shieldTimer > 0) {
                  sound.playShield();
                  enemy.isAlive = false;
                  enemy.isSquished = true;
                  addTextParticle(player.x, player.y - 20, 'KHIÊN PHẢN ĐÒN!', '#38BDF8');
                  addSparkleParticles(player.x, player.y, '#38BDF8', 12);
                } else {
                  player.hp = Math.max(0, player.hp - 25);
                  sound.playQuizWrong();
                  player.isInvulnerable = true;
                  player.invulnerableTimer = 75;

                  const isCrab = enemy.type === 'crab' || enemy.name.toLowerCase().includes('cua');
                  const isIce =
                    enemy.name.toLowerCase().includes('băng') ||
                    enemy.name.toLowerCase().includes('tuyết') ||
                    levelId === 2;

                  if (isCrab) {
                    // BỎ chức năng đụng vào cua sẽ đi ngược lại:
                    // Người chơi KHÔNG bị đẩy lùi hay văng ngược chiều, chỉ khựng nhẹ và tiếp tục tiến tới
                    player.vy = -1.5;
                    player.vx = 0; // Không bị văng lùi lại phía sau
                    addTextParticle(player.x, player.y - 20, '-25 HP', '#EF4444');
                  } else if (isIce) {
                    // GIỮ chức năng băng quay ngược lại:
                    // Va chạm với quái Băng Tuyết: nhân vật bị trượt văng và quay ngược hướng lại
                    player.vy = -4.5;
                    player.facing = player.facing === 'right' ? 'left' : 'right';
                    player.vx = player.facing === 'right' ? 5.5 : -5.5;
                    addTextParticle(player.x, player.y - 20, '❄ BĂNG QUAY NGƯỢC! -25 HP', '#38BDF8');
                    addSparkleParticles(player.x, player.y, '#38BDF8', 14);
                  } else {
                    player.vy = -4.0;
                    player.vx = player.facing === 'right' ? -3.5 : 3.5;
                    addTextParticle(player.x, player.y - 20, '-25 HP', '#EF4444');
                  }

                  syncHUD();

                  if (player.hp <= 0) {
                    sound.playGameOver();
                    onGameOver();
                    return;
                  }
                }
              }
            }
          }

          // --- 10. Projectiles Physics & Collision Handling (Including hitting Flying Supply Boxes & Laser Pierce) ---
          for (let pIdx = projectilesRef.current.length - 1; pIdx >= 0; pIdx--) {
            const p = projectilesRef.current[pIdx];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            // Check hit walls (Laser pierces enemies but dissolves on solid ground/stone blocks)
            let hitWall = false;
            for (const b of level.blocks) {
              if (b.type === 'flagpole' || b.type === 'flag_top' || b.type === 'castle') continue;
              if (b.type === 'barrier_gate' && !b.barrierActive) continue;

              if (p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height) {
                hitWall = true;
                break;
              }
            }

            if (hitWall || p.life <= 0) {
              if (p.isSuperExplosive) {
                sound.playExplosion();
                addExplosionParticles(p.x, p.y);
              } else {
                addSparkleParticles(p.x, p.y, p.color, 4);
              }
              projectilesRef.current.splice(pIdx, 1);
              continue;
            }

            // Case A: Player Projectile hits Flying Supply Box (Bắn vỡ hộp tiếp tế bay trên trời)
            if (p.fromPlayer) {
              let hitBox = false;
              for (let sIdx = supplyBoxesRef.current.length - 1; sIdx >= 0; sIdx--) {
                const sBox = supplyBoxesRef.current[sIdx];
                if (!sBox.isAlive) continue;

                if (
                  p.x + p.radius >= sBox.x &&
                  p.x - p.radius <= sBox.x + sBox.width &&
                  p.y + p.radius >= sBox.y &&
                  p.y - p.radius <= sBox.y + sBox.height
                ) {
                  hitBox = true;
                  sBox.hp -= p.damage;

                  if (sBox.hp <= 0) {
                    // Box destroyed! Vỡ hộp tiếp tế rơi vật phẩm xuống đất
                    sBox.isAlive = false;
                    sound.playExplosion();
                    addExplosionParticles(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2);
                    addTextParticle(sBox.x, sBox.y - 15, '📦 TIẾP TẾ RƠI!', '#FDE047');

                    // Drop item into world
                    droppedItemsRef.current.push({
                      id: `drop-${Date.now()}-${Math.random()}`,
                      x: sBox.x + 4,
                      y: sBox.y + 10,
                      vx: 0,
                      vy: 1.6, // gentle parachute fall
                      width: 24,
                      height: 24,
                      type: sBox.itemInside,
                      collected: false,
                      isGrounded: false,
                      parachute: true,
                    });

                    supplyBoxesRef.current.splice(sIdx, 1);
                  } else {
                    sound.playBump();
                    addSparkleParticles(p.x, p.y, '#FBBF24', 4);
                  }
                  break;
                }
              }

              if (hitBox && !p.isLaser) {
                projectilesRef.current.splice(pIdx, 1);
                continue;
              }
            }

            // Case B: Player Projectile hits Enemy
            if (p.fromPlayer) {
              let hitEnemy = false;
              for (const enemy of level.enemies) {
                if (!enemy.isAlive) continue;
                if (
                  p.x + (p.isLaser ? (p.length || 30) : p.radius) >= enemy.x &&
                  p.x - p.radius <= enemy.x + enemy.width &&
                  p.y + p.radius >= enemy.y &&
                  p.y - p.radius <= enemy.y + enemy.height
                ) {
                  hitEnemy = true;
                  enemy.isAlive = false;
                  enemy.isSquished = true;

                  if (p.isLaser) {
                    sound.playLaser();
                    addSparkleParticles(enemy.x + 14, enemy.y + 14, '#C084FC', 12);
                    addTextParticle(enemy.x, enemy.y - 15, '⚡ LASER XUYÊN QUA!', '#C084FC');
                    scoreRef.current += 200;
                  } else if (p.isSuperExplosive) {
                    sound.playExplosion();
                    addExplosionParticles(p.x, p.y);
                    addTextParticle(enemy.x, enemy.y - 15, 'BOOM! TIÊU DIỆT', '#F97316');
                    scoreRef.current += 300;
                  } else {
                    sound.playStomp();
                    addSparkleParticles(p.x, p.y, p.color, 6);
                    addTextParticle(enemy.x, enemy.y - 10, '+150 BẮN TRÚNG!', p.color);
                    scoreRef.current += 150;
                  }

                  player.mana = Math.min(player.maxMana, player.mana + 15);
                  syncHUD();

                  // If laser: continue piercing without destroying projectile!
                  if (!p.isLaser) {
                    break;
                  }
                }
              }

              if (hitEnemy && !p.isLaser) {
                projectilesRef.current.splice(pIdx, 1);
                continue;
              }
            }

            // Case C: Enemy Projectile hits Player
            if (!p.fromPlayer) {
              const playerHitTop = player.isCrouching ? player.y + 12 : player.y;
              const playerHitHeight = player.isCrouching ? 20 : 32;

              if (
                p.x + p.radius >= player.x &&
                p.x - p.radius <= player.x + player.width &&
                p.y + p.radius >= playerHitTop &&
                p.y - p.radius <= playerHitTop + playerHitHeight
              ) {
                // Xóa viên đạn địch khi chạm người chơi
                projectilesRef.current.splice(pIdx, 1);

                // 1. Nếu đã trả lời đúng hoặc đang có khiên/kháng đạn:
                // "Trả lời đúng dính đạn ko sao được đi tiếp"
                if (
                  hasAnsweredCorrectlyRef.current ||
                  player.shieldTimer > 0 ||
                  bulletImmunityTimerRef.current > 0 ||
                  bulletShieldChargesRef.current > 0
                ) {
                  if (bulletShieldChargesRef.current > 0) {
                    bulletShieldChargesRef.current--;
                  }
                  sound.playShield();
                  addSparkleParticles(p.x, p.y, '#FDE047', 12);
                  addSparkleParticles(player.x + player.width / 2, player.y + player.height / 2, '#10B981', 8);
                  addTextParticle(player.x, player.y - 20, '🛡️ DÍNH ĐẠN KO SAO - ĐI TIẾP!', '#10B981');
                  scoreRef.current += 50;
                  syncHUD();
                  continue;
                }

                // 2. Nếu chưa trả lời đúng hoặc chưa có khiên:
                // Kích hoạt ngay Thử Thách Cứu Nguy Tri Thức
                // "Trả lời đúng dính đạn ko sao được đi tiếp"
                if (!player.isInvulnerable) {
                  sound.playBump();
                  const rescueQ = getRandomQuestionForSubject(subject, levelId);
                  onOpenQuiz(
                    rescueQ,
                    false,
                    () => {
                      grantBulletImmunity('TRẢ LỜI ĐÚNG: HÓA GIẢI ĐẠN ĐI TIẾP');
                    },
                    'bullet_rescue'
                  );
                  continue;
                }
              }
            }
          }

          // --- 11. Camera follow player ---
          const targetCamX = player.x - canvas.width * 0.38;
          cameraXRef.current += (targetCamX - cameraXRef.current) * 0.12;
          if (cameraXRef.current < 0) cameraXRef.current = 0;
          if (cameraXRef.current > level.width - canvas.width) {
            cameraXRef.current = level.width - canvas.width;
          }
        }

        // --- 12. Particles update ---
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
          }
        }
      }

      // --- 13. RENDERING PASS ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const camX = cameraXRef.current;
      const level = levelDataRef.current;
      const player = playerRef.current;

      // Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, currentLevelInfo.skyGradient[0]);
      skyGrad.addColorStop(1, currentLevelInfo.skyGradient[1]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Mountains Layer
      ctx.save();
      const mountainParallax = camX * 0.2;
      ctx.fillStyle = currentLevelInfo.mountainColor;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let i = 0; i <= canvas.width + 120; i += 80) {
        const worldX = i + mountainParallax;
        const peakHeight = Math.sin(worldX * 0.008) * 80 + Math.cos(worldX * 0.004) * 60 + 200;
        ctx.lineTo(i, canvas.height - peakHeight);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.globalAlpha = 0.45;
      ctx.fill();
      ctx.restore();

      // Clouds Layer
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.65;
      const cloudParallax = camX * 0.4;
      for (let c = 0; c < 12; c++) {
        const cx = (c * 280 - cloudParallax) % (canvas.width + 400);
        const cy = 60 + (c % 3) * 35;
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.arc(cx + 20, cy - 8, 28, 0, Math.PI * 2);
        ctx.arc(cx + 42, cy, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Camera Translate
      ctx.save();
      ctx.translate(-camX, 0);

      // Render Blocks
      for (const b of level.blocks) {
        if (b.x + b.width < camX || b.x > camX + canvas.width) continue;
        const drawY = b.y + b.bumpOffset;

        if (b.type === 'ground') {
          ctx.fillStyle = currentLevelInfo.groundColor;
          ctx.fillRect(b.x, drawY, b.width, 12);
          ctx.fillStyle = currentLevelInfo.groundSubColor;
          ctx.fillRect(b.x, drawY + 12, b.width, b.height - 12);
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = 0.2;
          ctx.fillRect(b.x, drawY, b.width, 2);
          ctx.globalAlpha = 1.0;
        } else if (b.type === 'question') {
          if (b.hit) {
            ctx.fillStyle = '#78716C';
            ctx.fillRect(b.x, drawY, b.width, b.height);
            ctx.strokeStyle = '#44403C';
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x, drawY, b.width, b.height);
          } else {
            ctx.fillStyle = b.content === 'quiz' ? '#F59E0B' : '#EAB308';
            ctx.fillRect(b.x, drawY, b.width, b.height);
            ctx.strokeStyle = '#B45309';
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x, drawY, b.width, b.height);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', b.x + b.width / 2, drawY + b.height / 2 + 1);
          }
        } else if (b.type === 'brick') {
          ctx.fillStyle = '#C2410C';
          ctx.fillRect(b.x, drawY, b.width, b.height);
          ctx.strokeStyle = '#7C2D12';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, drawY, b.width, b.height);
          ctx.beginPath();
          ctx.moveTo(b.x, drawY + b.height / 2);
          ctx.lineTo(b.x + b.width, drawY + b.height / 2);
          ctx.moveTo(b.x + b.width / 2, drawY);
          ctx.lineTo(b.x + b.width / 2, drawY + b.height / 2);
          ctx.stroke();
        } else if (b.type === 'stone') {
          ctx.fillStyle = '#475569';
          ctx.fillRect(b.x, drawY, b.width, b.height);
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(b.x, drawY, b.width, b.height);
        } else if (b.type === 'pipe_top') {
          ctx.fillStyle = '#15803D';
          ctx.fillRect(b.x, drawY, b.width, b.height);
          ctx.fillStyle = '#4ADE80';
          ctx.fillRect(b.x + 4, drawY + 2, 8, b.height - 4);
          ctx.strokeStyle = '#14532D';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, drawY, b.width, b.height);
        } else if (b.type === 'pipe') {
          ctx.fillStyle = '#16A34A';
          ctx.fillRect(b.x, drawY, b.width, b.height);
          ctx.fillStyle = '#4ADE80';
          ctx.fillRect(b.x + 3, drawY, 6, b.height);
          ctx.strokeStyle = '#14532D';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, drawY, b.width, b.height);
        } else if (b.type === 'flagpole') {
          ctx.fillStyle = '#CBD5E1';
          ctx.fillRect(b.x + 4, drawY, 4, b.height);

          const flagYPos = isClearingRef.current ? drawY + b.height - 40 : drawY + 10;
          ctx.fillStyle = '#DC2626';
          ctx.beginPath();
          ctx.moveTo(b.x + 8, flagYPos);
          ctx.lineTo(b.x + 42, flagYPos + 14);
          ctx.lineTo(b.x + 8, flagYPos + 28);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#FBBF24';
          ctx.beginPath();
          ctx.arc(b.x + 20, flagYPos + 14, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.type === 'flag_top') {
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, drawY + b.height / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.type === 'castle') {
          ctx.fillStyle = '#64748B';
          ctx.fillRect(b.x, drawY, b.width, b.height);
          for (let i = 0; i < 5; i++) {
            ctx.fillStyle = '#475569';
            ctx.fillRect(b.x + i * 26, drawY - 14, 18, 14);
          }
          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, drawY + b.height - 24, 20, Math.PI, 0);
          ctx.rect(b.x + b.width / 2 - 20, drawY + b.height - 24, 40, 24);
          ctx.fill();

          ctx.fillStyle = '#FBBF24';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('ĐỊA LÝ', b.x + b.width / 2, drawY + 24);
        } else if (b.type === 'barrier_gate') {
          if (b.barrierActive) {
            const now = Date.now();
            const pulse = (Math.sin(now * 0.008) + 1) * 0.5;

            ctx.fillStyle = '#1E293B';
            ctx.fillRect(b.x, drawY, b.width, b.height);
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x, drawY, b.width, b.height);

            ctx.save();
            ctx.fillStyle = `rgba(245, 158, 11, ${0.25 + pulse * 0.25})`;
            ctx.fillRect(b.x - 2, drawY, b.width + 4, b.height);

            ctx.strokeStyle = '#FBBF24';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let yOffset = 10; yOffset < b.height; yOffset += 24) {
              const jitter = Math.sin(now * 0.02 + yOffset) * 4;
              ctx.moveTo(b.x - 4 + jitter, drawY + yOffset);
              ctx.lineTo(b.x + b.width + 4 - jitter, drawY + yOffset);
            }
            ctx.stroke();

            ctx.shadowColor = '#F59E0B';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#FEF08A';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('🔒', b.x + b.width / 2, drawY + b.height / 2 - 10);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('PHONG ẤN', b.x + b.width / 2, drawY + b.height / 2 + 14);
            ctx.restore();
          }
        }
      }

      // Render Floating Supply Boxes (Khinh khí cầu mang hộp tiếp tế bay ngang trời)
      const now = Date.now();
      for (const sBox of supplyBoxesRef.current) {
        if (!sBox.isAlive) continue;
        if (sBox.x < camX - 60 || sBox.x > camX + canvas.width + 60) continue;

        ctx.save();
        // 1. Balloon envelope on top
        ctx.fillStyle = sBox.itemInside === 'mushroom' ? '#10B981' : sBox.itemInside === 'spread_gun' ? '#F97316' : '#A855F7';
        ctx.beginPath();
        ctx.arc(sBox.x + sBox.width / 2, sBox.y - 12, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Balloon stripe
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(sBox.x + sBox.width / 2, sBox.y - 12, 5, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ropes connecting to crate
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sBox.x + 4, sBox.y);
        ctx.lineTo(sBox.x + sBox.width / 2 - 8, sBox.y - 4);
        ctx.moveTo(sBox.x + sBox.width - 4, sBox.y);
        ctx.lineTo(sBox.x + sBox.width / 2 + 8, sBox.y - 4);
        ctx.stroke();

        // 2. Wooden Supply Crate
        ctx.fillStyle = '#B45309';
        ctx.fillRect(sBox.x, sBox.y, sBox.width, sBox.height);
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 2;
        ctx.strokeRect(sBox.x, sBox.y, sBox.width, sBox.height);

        // Cross straps
        ctx.strokeStyle = '#D97706';
        ctx.beginPath();
        ctx.moveTo(sBox.x, sBox.y);
        ctx.lineTo(sBox.x + sBox.width, sBox.y + sBox.height);
        ctx.moveTo(sBox.x + sBox.width, sBox.y);
        ctx.lineTo(sBox.x, sBox.y + sBox.height);
        ctx.stroke();

        // Crate Badge Icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = sBox.itemInside === 'mushroom' ? '🍄' : sBox.itemInside === 'spread_gun' ? 'S' : 'L';
        ctx.fillText(label, sBox.x + sBox.width / 2, sBox.y + sBox.height / 2);

        // HP bar above box
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(sBox.x + 2, sBox.y - 28, (sBox.hp / sBox.maxHp) * (sBox.width - 4), 3);

        ctx.restore();
      }

      // Render Dropped Items (Vật phẩm rơi từ hộp tiếp tế xuống đất)
      for (const item of droppedItemsRef.current) {
        if (item.collected) continue;
        if (item.x < camX - 60 || item.x > camX + canvas.width + 60) continue;

        ctx.save();
        // Draw Parachute if still falling
        if (item.parachute) {
          ctx.fillStyle = '#F8FAFC';
          ctx.beginPath();
          ctx.arc(item.x + item.width / 2, item.y - 12, 14, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#94A3B8';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Lines
          ctx.beginPath();
          ctx.moveTo(item.x + 2, item.y);
          ctx.lineTo(item.x + item.width / 2 - 12, item.y - 12);
          ctx.moveTo(item.x + item.width - 2, item.y);
          ctx.lineTo(item.x + item.width / 2 + 12, item.y - 12);
          ctx.stroke();
        }

        // Draw Item Capsule / Entity
        if (item.type === 'mushroom') {
          // Nấm thần kỳ: đỏ chấm trắng phát sáng
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(item.x + item.width / 2, item.y + 10, 11, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
          // White dots
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(item.x + item.width / 2, item.y + 4, 3, 0, Math.PI * 2);
          ctx.arc(item.x + item.width / 2 - 6, item.y + 7, 2, 0, Math.PI * 2);
          ctx.arc(item.x + item.width / 2 + 6, item.y + 7, 2, 0, Math.PI * 2);
          ctx.fill();
          // Stem
          ctx.fillStyle = '#FDE68A';
          ctx.fillRect(item.x + item.width / 2 - 5, item.y + 10, 10, 8);
        } else if (item.type === 'spread_gun') {
          // Súng S (Spread Gun) - Viên ngọc cam chữ S phát sáng
          ctx.fillStyle = '#EA580C';
          ctx.beginPath();
          ctx.arc(item.x + item.width / 2, item.y + item.height / 2, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FDBA74';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 13px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('S', item.x + item.width / 2, item.y + item.height / 2 + 1);
        } else {
          // Súng L (Laser Gun) - Viên ngọc tím chữ L phát sáng
          ctx.fillStyle = '#7E22CE';
          ctx.beginPath();
          ctx.arc(item.x + item.width / 2, item.y + item.height / 2, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#D8B4FE';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 13px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('L', item.x + item.width / 2, item.y + item.height / 2 + 1);
        }
        ctx.restore();
      }

      // Render Collectibles (Coins & Compasses)
      for (const item of level.collectibles) {
        if (item.collected) continue;
        if (item.x + item.width < camX || item.x > camX + canvas.width) continue;

        const floatY = item.y + Math.sin(now * 0.005 + item.x) * 3;

        if (item.type === 'compass') {
          ctx.fillStyle = '#0284C7';
          ctx.beginPath();
          ctx.arc(item.x + item.width / 2, floatY + item.height / 2, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#BAE6FD';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.moveTo(item.x + item.width / 2, floatY + 3);
          ctx.lineTo(item.x + item.width / 2 + 3, floatY + item.height / 2);
          ctx.lineTo(item.x + item.width / 2 - 3, floatY + item.height / 2);
          ctx.fill();
        } else {
          const scaleX = Math.abs(Math.cos(now * 0.006 + item.x * 0.05));
          ctx.save();
          ctx.translate(item.x + item.width / 2, floatY + item.height / 2);
          ctx.scale(Math.max(scaleX, 0.2), 1);
          ctx.fillStyle = '#FBBF24';
          ctx.beginPath();
          ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Render Projectiles (Standard, 3-tia Spread, Laser dài xuyên thấu, Super Blast)
      for (const p of projectilesRef.current) {
        if (p.x < camX - 40 || p.x > camX + canvas.width + 40) continue;
        ctx.save();

        if (p.isLaser) {
          // Tia Laser dài màu tím neon phát sáng xuyên qua mọi vật cản
          const dir = p.vx > 0 ? 1 : -1;
          const beamLen = p.length || 45;
          ctx.strokeStyle = '#C084FC';
          ctx.shadowColor = '#A855F7';
          ctx.shadowBlur = 14;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - dir * beamLen, p.y);
          ctx.stroke();

          // Laser core (White)
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - dir * beamLen, p.y);
          ctx.stroke();
        } else if (p.isSuperExplosive) {
          ctx.fillStyle = '#06B6D4';
          ctx.shadowColor = '#22D3EE';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.fromPlayer) {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#EF4444';
          ctx.shadowColor = '#DC2626';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FEE2E2';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Render Enemies
      for (const enemy of level.enemies) {
        if (enemy.x + enemy.width < camX || enemy.x > camX + canvas.width) continue;

        if (!enemy.isAlive) {
          if (enemy.isSquished && enemy.squishTimer < 25) {
            ctx.fillStyle = '#92400E';
            ctx.fillRect(enemy.x, enemy.y + 18, enemy.width, 10);
          }
          continue;
        }

        if (enemy.type === 'crab') {
          ctx.fillStyle = '#DC2626';
          ctx.beginPath();
          ctx.ellipse(enemy.x + 14, enemy.y + 16, 12, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(enemy.x + 1, enemy.y + 8, 6, 6);
          ctx.fillRect(enemy.x + 21, enemy.y + 8, 6, 6);
        } else if (enemy.type === 'sandstorm' || enemy.type === 'magma') {
          ctx.fillStyle = enemy.type === 'magma' ? '#EF4444' : '#F59E0B';
          ctx.beginPath();
          ctx.arc(enemy.x + 14, enemy.y + 14, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          ctx.arc(enemy.x + 14, enemy.y + 14, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#78350F';
          ctx.beginPath();
          ctx.arc(enemy.x + 14, enemy.y + 12, 12, Math.PI, 0);
          ctx.lineTo(enemy.x + 26, enemy.y + 22);
          ctx.lineTo(enemy.x + 2, enemy.y + 22);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(enemy.x + 7, enemy.y + 10, 4, 6);
          ctx.fillRect(enemy.x + 17, enemy.y + 10, 4, 6);
          ctx.fillStyle = '#000000';
          ctx.fillRect(enemy.x + 8, enemy.y + 12, 2, 4);
          ctx.fillRect(enemy.x + 18, enemy.y + 12, 2, 4);

          const footWobble = Math.sin(now * 0.015) * 2;
          ctx.fillStyle = '#000000';
          ctx.fillRect(enemy.x + 2, enemy.y + 22, 9, 5 + footWobble);
          ctx.fillRect(enemy.x + 17, enemy.y + 22, 9, 5 - footWobble);
        }

        ctx.fillStyle = '#F8FAFC';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.name, enemy.x + 14, enemy.y - 4);
      }

      // Render Mario Explorer Character
      ctx.save();
      if (player.isInvulnerable && Math.floor(now / 80) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      const px = player.x;
      const py = player.y;
      const isRight = player.facing === 'right';

      ctx.translate(px + player.width / 2, py + (player.isCrouching ? player.height / 2 + 6 : player.height / 2));
      if (!isRight) {
        ctx.scale(-1, 1);
      }

      // 1. Protective Energy Shield Render (Phím K hoặc Trả lời đúng nhận khiên)
      const isShieldActive = player.shieldTimer > 0 || bulletImmunityTimerRef.current > 0 || hasAnsweredCorrectlyRef.current;
      if (isShieldActive) {
        ctx.save();
        const shieldPulse = (Math.sin(now * 0.01) + 1) * 0.15 + 0.7;
        const isGold = hasAnsweredCorrectlyRef.current || bulletImmunityTimerRef.current > 0;
        ctx.strokeStyle = isGold ? '#F59E0B' : '#38BDF8';
        ctx.shadowColor = isGold ? '#FBBF24' : '#0284C7';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 24 * shieldPulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = isGold ? '#FDE047' : '#38BDF8';
        ctx.globalAlpha = 0.18;
        ctx.fill();

        // Orbiting star sparkle particles for Geography Knowledge protection
        if (isGold) {
          const orbitAngle = now * 0.005;
          const orbitRadius = 26;
          for (let starI = 0; starI < 3; starI++) {
            const angle = orbitAngle + (starI * Math.PI * 2) / 3;
            const sx = Math.cos(angle) * orbitRadius;
            const sy = Math.sin(angle) * orbitRadius;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 2. Explorer Cap (Red cap with bill)
      ctx.fillStyle = '#DC2626';
      if (player.isCrouching) {
        ctx.fillRect(-10, -8, 20, 7);
        ctx.fillRect(-4, -6, 16, 4);

        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(-8, -1, 16, 9);

        ctx.fillStyle = '#0F172A';
        ctx.fillRect(1, 1, 3, 3);

        ctx.fillStyle = '#451A03';
        ctx.fillRect(-2, 4, 10, 3);

        ctx.fillStyle = '#D97706';
        ctx.fillRect(-8, 7, 16, 8);
        ctx.fillStyle = '#2563EB';
        ctx.fillRect(-7, 11, 14, 5);

        ctx.fillStyle = '#78350F';
        ctx.fillRect(-9, 14, 8, 4);
        ctx.fillRect(1, 14, 8, 4);
      } else {
        ctx.fillRect(-10, -16, 20, 8);
        ctx.fillRect(-4, -13, 16, 4);

        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(-8, -8, 16, 10);

        ctx.fillStyle = '#0F172A';
        ctx.fillRect(1, -6, 3, 4);

        ctx.fillStyle = '#451A03';
        ctx.fillRect(-2, -2, 10, 3);

        ctx.fillStyle = '#854D0E';
        ctx.fillRect(-13, -3, 5, 12);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(-14, -7, 4, 5);

        ctx.fillStyle = '#DC2626';
        ctx.fillRect(-8, 2, 16, 12);
        ctx.fillStyle = '#D97706';
        ctx.fillRect(-7, 2, 6, 10);

        ctx.fillStyle = '#2563EB';
        ctx.fillRect(-8, 8, 16, 6);

        ctx.fillStyle = '#FDE047';
        ctx.fillRect(1, 9, 2, 2);

        ctx.fillStyle = '#1D4ED8';
        const legOffset = Math.sin(player.animFrame * Math.PI / 2) * 4;
        ctx.fillRect(-7, 14, 6, 6 + (player.isGrounded ? legOffset : -2));
        ctx.fillRect(1, 14, 6, 6 + (player.isGrounded ? -legOffset : 2));

        ctx.fillStyle = '#78350F';
        ctx.fillRect(-9, 19 + (player.isGrounded ? legOffset : -2), 8, 4);
        ctx.fillRect(0, 19 + (player.isGrounded ? -legOffset : 2), 8, 4);

        // Weapon barrel indicator on Mario's hand
        if (player.weapon === 'laser') {
          ctx.fillStyle = '#A855F7';
          ctx.fillRect(8, 6, 10, 4);
        } else if (player.weapon === 'spread') {
          ctx.fillStyle = '#EA580C';
          ctx.fillRect(8, 5, 8, 6);
        }
      }

      ctx.restore();

      // Render Floating Text & Sparkle Particles
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        if (p.text) {
          ctx.font = 'bold 12px monospace';
          ctx.fillStyle = p.color;
          ctx.textAlign = 'center';
          ctx.fillText(p.text, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore(); // Restore camera translation

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [levelId, isPaused, currentLevelInfo, onOpenQuiz, onLevelComplete, onGameOver, activeInputRef, syncHUD]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={800}
        height={480}
        className="w-full h-full object-contain max-h-[85vh] aspect-[5/3] rounded-lg shadow-2xl border border-slate-800"
      />
    </div>
  );
};
