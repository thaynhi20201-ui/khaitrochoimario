import { Block, Collectible, Enemy } from '../types/game';

export interface LevelMap {
  levelId: number;
  width: number;
  height: number;
  playerStart: { x: number; y: number };
  blocks: Block[];
  enemies: Enemy[];
  collectibles: Collectible[];
}

export function generateLevelData(levelId: number): LevelMap {
  const height = 480;
  const width = 2800;
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const collectibles: Collectible[] = [];

  const groundY = height - 60;
  const blockSize = 32;

  // Ground segments with strategic chasms (hố vực địa lý)
  const groundGaps: { start: number; end: number }[] = [];
  if (levelId === 1) {
    // Vietnam delta: 2 small water canals (kênh rạch)
    groundGaps.push({ start: 800, end: 896 });
    groundGaps.push({ start: 1600, end: 1728 });
  } else if (levelId === 2) {
    // Himalaya: ice chasms (khe nứt băng)
    groundGaps.push({ start: 640, end: 768 });
    groundGaps.push({ start: 1300, end: 1440 });
    groundGaps.push({ start: 1950, end: 2080 });
  } else if (levelId === 3) {
    // Amazon/Sahara: quicksand pits (hố cát lún)
    groundGaps.push({ start: 700, end: 820 });
    groundGaps.push({ start: 1450, end: 1600 });
    groundGaps.push({ start: 2100, end: 2260 });
  } else {
    // Tectonic rift / magma fissures (hố nham thạch)
    groundGaps.push({ start: 600, end: 750 });
    groundGaps.push({ start: 1200, end: 1360 });
    groundGaps.push({ start: 1850, end: 2020 });
  }

  // Build ground
  for (let x = 0; x < width - 200; x += blockSize) {
    const inGap = groundGaps.some((g) => x >= g.start && x < g.end);
    if (!inGap) {
      blocks.push({
        id: `ground-${x}`,
        x,
        y: groundY,
        width: blockSize,
        height: 60,
        type: 'ground',
        hit: false,
        bumpOffset: 0,
        content: 'none',
      });
    }
  }

  // Helper for adding platforms and blocks
  let bIndex = 0;
  const addBlock = (
    x: number,
    y: number,
    type: 'brick' | 'question' | 'pipe' | 'pipe_top' | 'stone',
    content: 'coin' | 'quiz' | 'powerup' | 'none' = 'none',
    questionId?: string,
    questionIndex?: number
  ) => {
    blocks.push({
      id: `block-${levelId}-${bIndex++}`,
      x,
      y,
      width: blockSize,
      height: blockSize,
      type,
      hit: false,
      bumpOffset: 0,
      content,
      questionId,
      questionIndex,
    });
  };

  // Helper for adding pipes
  const addPipe = (x: number, pipeHeight: number = 64) => {
    const pipeY = groundY - pipeHeight;
    blocks.push({
      id: `pipe-top-${x}`,
      x: x,
      y: pipeY,
      width: 48,
      height: 24,
      type: 'pipe_top',
      hit: false,
      bumpOffset: 0,
      content: 'none',
    });
    blocks.push({
      id: `pipe-body-${x}`,
      x: x + 4,
      y: pipeY + 24,
      width: 40,
      height: pipeHeight - 24,
      type: 'pipe',
      hit: false,
      bumpOffset: 0,
      content: 'none',
    });
  };

  // Section 1: Introduction blocks
  addBlock(240, groundY - 96, 'question', 'coin');
  addBlock(272, groundY - 96, 'brick', 'coin');
  addBlock(304, groundY - 96, 'question', 'quiz', undefined, 0);
  addBlock(336, groundY - 96, 'brick', 'coin');
  addBlock(368, groundY - 96, 'question', 'powerup');

  // Pipe 1
  addPipe(460, 56);

  // Section 2: Higher platform + Question 2
  addBlock(580, groundY - 96, 'brick', 'coin');
  addBlock(612, groundY - 140, 'question', 'quiz', undefined, 1);
  addBlock(644, groundY - 140, 'brick', 'coin');
  addBlock(676, groundY - 96, 'brick', 'coin');

  // CỔNG PHONG ẤN ĐỊA LÝ 1 (Rào chắn năng lượng phong tỏa đường đi tại x=840)
  blocks.push({
    id: `barrier-1-${levelId}`,
    x: 840,
    y: groundY - 140,
    width: 24,
    height: 140,
    type: 'barrier_gate',
    hit: false,
    bumpOffset: 0,
    barrierActive: true,
    content: 'quiz',
  });

  // Pipe 2 (Bridge near gap)
  addPipe(940, 72);

  // Section 3: Terraced platforms (Ruộng bậc thang / Bậc thang địa hình)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j <= i; j++) {
      addBlock(1060 + i * blockSize, groundY - (j + 1) * blockSize, 'stone', 'none');
    }
  }

  // Floating row with Question 3
  addBlock(1220, groundY - 110, 'brick', 'coin');
  addBlock(1252, groundY - 110, 'question', 'quiz', undefined, 2);
  addBlock(1284, groundY - 110, 'brick', 'coin');
  addBlock(1316, groundY - 110, 'question', 'coin');

  // Pipe 3
  addPipe(1480, 80);

  // CỔNG PHONG ẤN ĐỊA LÝ 2 (Rào chắn phong tỏa trước thềm tiến vào vòng cuối tại x=1680)
  blocks.push({
    id: `barrier-2-${levelId}`,
    x: 1680,
    y: groundY - 140,
    width: 24,
    height: 140,
    type: 'barrier_gate',
    hit: false,
    bumpOffset: 0,
    barrierActive: true,
    content: 'quiz',
  });

  // Section 4: High challenge platform + Question 4
  addBlock(1760, groundY - 100, 'brick', 'coin');
  addBlock(1792, groundY - 100, 'question', 'powerup');
  addBlock(1824, groundY - 100, 'brick', 'coin');
  addBlock(1856, groundY - 144, 'question', 'quiz', undefined, 3);
  addBlock(1888, groundY - 100, 'brick', 'coin');

  // Stepping stones across second gap
  addBlock(1960, groundY - 64, 'stone', 'none');
  addBlock(2020, groundY - 96, 'stone', 'none');

  // Section 5: Final stretch with Question 5 (Boss gatekeeper quiz)
  addBlock(2180, groundY - 100, 'brick', 'coin');
  addBlock(2212, groundY - 100, 'question', 'quiz', undefined, 4);
  addBlock(2244, groundY - 100, 'brick', 'coin');

  // Staircase leading to flagpole
  const stairX = 2360;
  for (let step = 0; step < 7; step++) {
    for (let h = 0; h <= step; h++) {
      addBlock(stairX + step * blockSize, groundY - (h + 1) * blockSize, 'stone', 'none');
    }
  }

  // Flagpole & flag top
  const flagX = stairX + 8 * blockSize + 20;
  blocks.push({
    id: 'flagpole',
    x: flagX,
    y: groundY - 240,
    width: 12,
    height: 240,
    type: 'flagpole',
    hit: false,
    bumpOffset: 0,
  });
  blocks.push({
    id: 'flag_top',
    x: flagX - 4,
    y: groundY - 252,
    width: 20,
    height: 14,
    type: 'flag_top',
    hit: false,
    bumpOffset: 0,
  });

  // Geography Castle at the end
  blocks.push({
    id: 'castle',
    x: flagX + 70,
    y: groundY - 120,
    width: 130,
    height: 120,
    type: 'castle',
    hit: false,
    bumpOffset: 0,
  });

  // Populate floating collectibles (Coins, Compasses, Stars)
  const coinCoords = [
    { x: 240, y: groundY - 140 },
    { x: 304, y: groundY - 140 },
    { x: 368, y: groundY - 140 },
    { x: 500, y: groundY - 40 },
    { x: 740, y: groundY - 130 },
    { x: 770, y: groundY - 130 },
    { x: 800, y: groundY - 130 },
    { x: 1140, y: groundY - 160 },
    { x: 1220, y: groundY - 150 },
    { x: 1252, y: groundY - 150 },
    { x: 1284, y: groundY - 150 },
    { x: 1540, y: groundY - 40 },
    { x: 1792, y: groundY - 180 },
    { x: 1960, y: groundY - 100 },
    { x: 2020, y: groundY - 130 },
    { x: 2212, y: groundY - 140 },
  ];

  coinCoords.forEach((c, idx) => {
    collectibles.push({
      id: `coin-${levelId}-${idx}`,
      x: c.x,
      y: c.y,
      width: 20,
      height: 22,
      type: idx % 5 === 0 ? 'compass' : 'coin',
      collected: false,
    });
  });

  // Populate Themed Enemies based on Level Theme
  const enemyTypes: { x: number; type: 'goomba' | 'koopa' | 'crab' | 'sandstorm' | 'magma'; name: string }[] = 
    levelId === 1 ? [
      { x: 390, type: 'crab', name: 'Cua Đồng Bằng' },
      { x: 720, type: 'goomba', name: 'Nấm Bụi Rậm' },
      { x: 1180, type: 'koopa', name: 'Rùa Sông Hồng' },
      { x: 1550, type: 'crab', name: 'Cua Phù Sa' },
      { x: 1920, type: 'goomba', name: 'Gió Mùa Vàng' },
      { x: 2130, type: 'koopa', name: 'Rùa Sông Cửu Long' },
    ] : levelId === 2 ? [
      { x: 400, type: 'goomba', name: 'Quái Băng Tuyết' },
      { x: 740, type: 'koopa', name: 'Rùa Vùng Cao' },
      { x: 1190, type: 'goomba', name: 'Cục Băng Trượt' },
      { x: 1560, type: 'koopa', name: 'Bò Tót Tây Tạng' },
      { x: 1900, type: 'goomba', name: 'Băng Nứt' },
      { x: 2150, type: 'koopa', name: 'Rùa Tuyết Everest' },
    ] : levelId === 3 ? [
      { x: 380, type: 'sandstorm', name: 'Lốc Xoáy Sahara' },
      { x: 720, type: 'goomba', name: 'Bọ Cạp Cát' },
      { x: 1200, type: 'sandstorm', name: 'Bão Cát Vàng' },
      { x: 1580, type: 'goomba', name: 'Trăn Amazon' },
      { x: 1920, type: 'sandstorm', name: 'Cột Cát Nóng' },
      { x: 2120, type: 'koopa', name: 'Thằn Lằn Hoang Mạc' },
    ] : [
      { x: 380, type: 'magma', name: 'Cục Dung Nham' },
      { x: 730, type: 'goomba', name: 'Quái Tro Bụi' },
      { x: 1210, type: 'magma', name: 'Nham Thạch Nóng' },
      { x: 1590, type: 'magma', name: 'Sóng Thần Mini' },
      { x: 1910, type: 'goomba', name: 'Mảnh Kiến Tạo' },
      { x: 2140, type: 'magma', name: 'Quái Núi Lửa Phú Sĩ' },
    ];

  enemyTypes.forEach((e, idx) => {
    enemies.push({
      id: `enemy-${levelId}-${idx}`,
      x: e.x,
      y: groundY - 28,
      vx: -1.2,
      vy: 0,
      width: 28,
      height: 28,
      type: e.type,
      name: e.name,
      isAlive: true,
      isSquished: false,
      squishTimer: 0,
      startX: e.x,
      patrolRange: 90,
      direction: -1,
      shootTimer: 60 + idx * 35,
      shootInterval: 140 + (idx % 2) * 40,
    });
  });

  return {
    levelId,
    width,
    height,
    playerStart: { x: 80, y: groundY - 40 },
    blocks,
    enemies,
    collectibles,
  };
}
