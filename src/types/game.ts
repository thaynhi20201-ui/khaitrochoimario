export type GameState = 
  | 'TITLE_MENU'
  | 'WORLD_MAP'
  | 'PLAYING'
  | 'QUIZ_PAUSED'
  | 'LEVEL_CLEARED'
  | 'GAME_OVER'
  | 'ENCYCLOPEDIA'
  | 'FANSIPAN_CHALLENGE';

export type WeaponType = 'normal' | 'spread' | 'laser';

export type GeographySubject = 'natural' | 'social' | 'spatial';

export interface SubjectInfo {
  id: GeographySubject;
  name: string;
  englishName: string;
  icon: string;
  tagline: string;
  description: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  badgeClass: string;
  keyTopics: string[];
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  isJumping: boolean;
  isCrouching: boolean; // Phím S / Mũi tên xuống: cúi người né đạn
  facing: 'left' | 'right';
  animFrame: number;
  animTimer: number;
  isInvulnerable: boolean;
  invulnerableTimer: number;
  powerState: 'normal' | 'super' | 'star';
  starTimer: number;
  hp: number; // HP = 100
  maxHp: number;
  mana: number; // Mana năng lượng
  maxMana: number;
  shieldTimer: number; // Kỹ năng khiên hộ thể tạm thời
  bulletImmunityTimer?: number; // Thời gian kháng đạn
  hasAnsweredCorrectly?: boolean; // Đã trả lời đúng: dính đạn không sao được đi tiếp
  weapon: WeaponType; // Súng thường, Súng S (Spread) hoặc Súng L (Laser)
  weaponAmmo?: number;
}

export interface SupplyBox {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  itemInside: 'mushroom' | 'spread_gun' | 'laser_gun';
  isAlive: boolean;
  bobTimer: number;
}

export interface DroppedItem {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: 'mushroom' | 'spread_gun' | 'laser_gun';
  collected: boolean;
  isGrounded: boolean;
  parachute: boolean;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fromPlayer: boolean;
  isSuperExplosive?: boolean; // Đạn nổ lớn kỹ năng K
  isLaser?: boolean; // Tia laser dài xuyên thấu qua mọi kẻ địch
  length?: number;
  damage: number;
  color: string;
  life: number;
  pierceCount?: number; // Số lần xuyên qua quái
}

export interface Block {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'brick' | 'question' | 'pipe' | 'pipe_top' | 'stone' | 'cloud' | 'flagpole' | 'flag_top' | 'castle' | 'barrier_gate';
  hit: boolean;
  bumpOffset: number;
  content?: 'coin' | 'quiz' | 'powerup' | 'none';
  questionId?: string;
  questionIndex?: number;
  subType?: string;
  barrierActive?: boolean;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: 'goomba' | 'koopa' | 'crab' | 'sandstorm' | 'magma';
  name: string;
  isAlive: boolean;
  isSquished: boolean;
  squishTimer: number;
  startX: number;
  patrolRange: number;
  direction: 1 | -1;
  shootTimer?: number;
  shootInterval?: number;
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'coin' | 'star' | 'compass' | 'globe';
  collected: boolean;
  vy?: number;
  origY?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  text?: string;
}

export interface GeographyQuestion {
  id: string;
  levelId: number;
  subject: GeographySubject;
  category: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: number; // 0-3
  explanation: string;
  funFact: string;
  coordinateOrRegion?: string;
}

export interface LevelInfo {
  id: number;
  title: string;
  subtitle: string;
  region: string;
  theme: 'vietnam_delta' | 'himalaya_snow' | 'amazon_sahara' | 'fire_ocean';
  bgColor: string;
  skyGradient: [string, string];
  groundColor: string;
  groundSubColor: string;
  mountainColor: string;
  description: string;
  targetScore: number;
  unlocked: boolean;
  starsEarned: number;
  highScore: number;
}

export interface LandmarkFact {
  id: string;
  title: string;
  category: string;
  subject?: GeographySubject;
  location: string;
  heightOrLength: string;
  description: string;
  importance: string;
  iconType: 'mountain' | 'river' | 'sea' | 'desert' | 'volcano' | 'forest' | 'city' | 'space';
}
