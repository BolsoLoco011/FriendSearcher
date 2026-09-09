import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Trophy, RotateCcw, Play, Pause, Volume2, VolumeX, Bot, Users, 
  Crown, Flame, Swords, Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ShieldAlert, Apple, Zap, Eye
} from 'lucide-react';
import { FriendProfile } from '../types';

interface Snake1v1GameProps {
  friends?: FriendProfile[];
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onOpenFriendDetail?: (friend: FriendProfile) => void;
}

type Mode = 'benja' | 'cpu' | 'local';
type Difficulty = 'easy' | 'medium' | 'expert';

interface Position {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 22; // 22x22 cells
const INITIAL_SPEED = 130; // ms per tick

const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT'
};

const DIRECTION_OFFSETS: Record<Direction, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

export const Snake1v1Game: React.FC<Snake1v1GameProps> = ({
  friends = [],
  soundEnabled = true,
  onToggleSound,
  onOpenFriendDetail
}) => {
  // Game Setup
  const [mode, setMode] = useState<Mode>('benja');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [wallCollisions, setWallCollisions] = useState<boolean>(true); // Solid walls vs Toroidal wrap
  const [gameSpeed, setGameSpeed] = useState<number>(INITIAL_SPEED);

  // Game Run State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);
  const [winnerSnake, setWinnerSnake] = useState<'p1' | 'p2' | 'draw' | null>(null);

  // Scoreboard
  const [scores, setScores] = useState({ p1: 0, p2: 0, draws: 0 });

  // Snakes State
  const [p1Snake, setP1Snake] = useState<Position[]>([
    { x: 3, y: 11 },
    { x: 2, y: 11 },
    { x: 1, y: 11 }
  ]);
  const [p2Snake, setP2Snake] = useState<Position[]>([
    { x: 18, y: 11 },
    { x: 19, y: 11 },
    { x: 20, y: 11 }
  ]);

  const [p1Dir, setP1Dir] = useState<Direction>('RIGHT');
  const [p2Dir, setP2Dir] = useState<Direction>('LEFT');

  // Next directions buffer to avoid double turns in 1 tick
  const nextP1Dir = useRef<Direction>('RIGHT');
  const nextP2Dir = useRef<Direction>('LEFT');

  // Apples on Board (3 apples always available)
  const [apples, setApples] = useState<Position[]>([
    { x: 11, y: 5 },
    { x: 11, y: 11 },
    { x: 11, y: 17 }
  ]);

  // Benja Live Comments
  const [benjaQuote, setBenjaQuote] = useState<string>('¡A comer manzanas! Quien sea más grande puede atrapar al otro.');

  // Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const benjaFriend = friends.find(f => f.id === 'f-1' || f.name.toLowerCase().includes('benja'));

  // Web Audio Synthesizer
  const playSound = useCallback((type: 'eat' | 'win' | 'catch' | 'crash' | 'start') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      if (type === 'eat') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.09);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      } else if (type === 'catch') {
        // Epic capture sound
        [587.33, 739.99, 880, 1174.66].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (idx + 1) * 0.08);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + (idx + 1) * 0.08);
        });
      } else if (type === 'crash') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === 'win') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (idx + 1) * 0.1);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + (idx + 1) * 0.1);
        });
      }
    } catch {
      // Audio playback suppressed safely if blocked by browser policy
    }
  }, [soundEnabled]);

  // Helper to spawn a new apple that does not intersect snakes or other apples
  const generateNewApple = useCallback((currentSnakes: Position[][], existingApples: Position[]): Position => {
    const occupied = new Set<string>();
    currentSnakes.forEach(snake => {
      snake.forEach(seg => occupied.add(`${seg.x},${seg.y}`));
    });
    existingApples.forEach(app => occupied.add(`${app.x},${app.y}`));

    const available: Position[] = [];
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      for (let y = 1; y < GRID_SIZE - 1; y++) {
        if (!occupied.has(`${x},${y}`)) {
          available.push({ x, y });
        }
      }
    }

    if (available.length === 0) {
      return { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    }
    return available[Math.floor(Math.random() * available.length)];
  }, []);

  // Reset Round Function
  const resetRound = useCallback(() => {
    const p1Init = [
      { x: 3, y: 11 },
      { x: 2, y: 11 },
      { x: 1, y: 11 }
    ];
    const p2Init = [
      { x: 18, y: 11 },
      { x: 19, y: 11 },
      { x: 20, y: 11 }
    ];

    setP1Snake(p1Init);
    setP2Snake(p2Init);
    setP1Dir('RIGHT');
    setP2Dir('LEFT');
    nextP1Dir.current = 'RIGHT';
    nextP2Dir.current = 'LEFT';

    setApples([
      { x: 11, y: 5 },
      { x: 11, y: 11 },
      { x: 11, y: 17 }
    ]);

    setIsGameOver(false);
    setWinnerMessage(null);
    setWinnerSnake(null);
    setIsPlaying(false);

    if (mode === 'benja') {
      setBenjaQuote('¡Nueva ronda lista! Come manzanas para hacerte más grande y atraparme.');
    }
  }, [mode]);

  // Start / Pause toggle
  const togglePlay = () => {
    if (isGameOver) {
      resetRound();
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling when using game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Space') {
        togglePlay();
        return;
      }

      // Player 1 controls (Arrow keys)
      if (e.code === 'ArrowUp' && p1Dir !== 'DOWN') nextP1Dir.current = 'UP';
      else if (e.code === 'ArrowDown' && p1Dir !== 'UP') nextP1Dir.current = 'DOWN';
      else if (e.code === 'ArrowLeft' && p1Dir !== 'RIGHT') nextP1Dir.current = 'LEFT';
      else if (e.code === 'ArrowRight' && p1Dir !== 'LEFT') nextP1Dir.current = 'RIGHT';

      // Player 2 controls in Local 2-Player mode (WASD)
      if (mode === 'local') {
        if ((e.code === 'KeyW' || e.key === 'w' || e.key === 'W') && p2Dir !== 'DOWN') nextP2Dir.current = 'UP';
        else if ((e.code === 'KeyS' || e.key === 's' || e.key === 'S') && p2Dir !== 'UP') nextP2Dir.current = 'DOWN';
        else if ((e.code === 'KeyA' || e.key === 'a' || e.key === 'A') && p2Dir !== 'RIGHT') nextP2Dir.current = 'LEFT';
        else if ((e.code === 'KeyD' || e.key === 'd' || e.key === 'D') && p2Dir !== 'LEFT') nextP2Dir.current = 'RIGHT';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [p1Dir, p2Dir, mode, isGameOver]);

  // AI Decision Engine for Player 2 (Benja or CPU)
  const calculateAiMove = useCallback((
    currentP2: Position[],
    currentP1: Position[],
    currentApples: Position[],
    currentP2Dir: Direction
  ): Direction => {
    const head = currentP2[0];
    const p1Head = currentP1[0];
    const p2IsBigger = currentP2.length > currentP1.length;
    const p1IsBigger = currentP1.length > currentP2.length;

    // All possible next steps
    const validDirs: Direction[] = [];
    const possibleDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

    for (const d of possibleDirs) {
      if (d === OPPOSITE_DIRECTIONS[currentP2Dir]) continue;
      const offset = DIRECTION_OFFSETS[d];
      let nextX = head.x + offset.x;
      let nextY = head.y + offset.y;

      if (!wallCollisions) {
        nextX = (nextX + GRID_SIZE) % GRID_SIZE;
        nextY = (nextY + GRID_SIZE) % GRID_SIZE;
      } else {
        if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
          continue; // hits solid wall
        }
      }

      // Avoid self body
      const hitsSelf = currentP2.slice(0, -1).some(seg => seg.x === nextX && seg.y === nextY);
      if (hitsSelf) continue;

      // Check collision with P1
      const hitsP1Head = p1Head.x === nextX && p1Head.y === nextY;
      const hitsP1Body = currentP1.slice(1).some(seg => seg.x === nextX && seg.y === nextY);

      if (hitsP1Head || hitsP1Body) {
        // If P2 is smaller, NEVER collide with P1!
        if (p1IsBigger || currentP1.length === currentP2.length) {
          continue;
        }
        // If P2 is bigger, hitting P1 means capturing P1! This is a winning move!
        if (p2IsBigger) {
          return d;
        }
      }

      validDirs.push(d);
    }

    if (validDirs.length === 0) {
      // Trap fallback
      return currentP2Dir;
    }

    // Determine target
    let target: Position;

    if (p2IsBigger && (difficulty === 'expert' || (difficulty === 'medium' && Math.random() < 0.75))) {
      // Hunter Mode: Chase Player 1's head or body to catch them!
      target = p1Head;
    } else {
      // Gatherer / Escape Mode: Target the closest apple
      let closestApple = currentApples[0];
      let minDist = Infinity;

      for (const apple of currentApples) {
        const dist = Math.abs(apple.x - head.x) + Math.abs(apple.y - head.y);
        if (dist < minDist) {
          minDist = dist;
          closestApple = apple;
        }
      }
      target = closestApple || { x: 11, y: 11 };
    }

    // Pick direction that minimizes Manhattan distance to target
    let bestDir = validDirs[0];
    let bestDist = Infinity;

    for (const d of validDirs) {
      const offset = DIRECTION_OFFSETS[d];
      let nextX = head.x + offset.x;
      let nextY = head.y + offset.y;
      if (!wallCollisions) {
        nextX = (nextX + GRID_SIZE) % GRID_SIZE;
        nextY = (nextY + GRID_SIZE) % GRID_SIZE;
      }

      // If smaller than P1, add penalty for being near P1's head
      let penalty = 0;
      if (p1IsBigger) {
        const distToP1 = Math.abs(nextX - p1Head.x) + Math.abs(nextY - p1Head.y);
        if (distToP1 <= 2) penalty = 15;
      }

      const dist = Math.abs(nextX - target.x) + Math.abs(nextY - target.y) + penalty;
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = d;
      }
    }

    return bestDir;
  }, [difficulty, wallCollisions]);

  // Main Game Loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const gameInterval = setInterval(() => {
      // 1. Determine next directions
      const currentP1Direction = nextP1Dir.current;
      setP1Dir(currentP1Direction);

      let currentP2Direction = nextP2Dir.current;
      if (mode === 'benja' || mode === 'cpu') {
        currentP2Direction = calculateAiMove(p2Snake, p1Snake, apples, p2Dir);
        nextP2Dir.current = currentP2Direction;
      }
      setP2Dir(currentP2Direction);

      // 2. Compute new head positions
      const p1Head = p1Snake[0];
      const p2Head = p2Snake[0];

      const p1Offset = DIRECTION_OFFSETS[currentP1Direction];
      const p2Offset = DIRECTION_OFFSETS[currentP2Direction];

      let newP1HeadX = p1Head.x + p1Offset.x;
      let newP1HeadY = p1Head.y + p1Offset.y;

      let newP2HeadX = p2Head.x + p2Offset.x;
      let newP2HeadY = p2Head.y + p2Offset.y;

      // Wall handling
      if (!wallCollisions) {
        newP1HeadX = (newP1HeadX + GRID_SIZE) % GRID_SIZE;
        newP1HeadY = (newP1HeadY + GRID_SIZE) % GRID_SIZE;
        newP2HeadX = (newP2HeadX + GRID_SIZE) % GRID_SIZE;
        newP2HeadY = (newP2HeadY + GRID_SIZE) % GRID_SIZE;
      }

      const p1NewHead: Position = { x: newP1HeadX, y: newP1HeadY };
      const p2NewHead: Position = { x: newP2HeadX, y: newP2HeadY };

      // Wall crash checks if walls are solid
      const p1HitWall = wallCollisions && (newP1HeadX < 0 || newP1HeadX >= GRID_SIZE || newP1HeadY < 0 || newP1HeadY >= GRID_SIZE);
      const p2HitWall = wallCollisions && (newP2HeadX < 0 || newP2HeadX >= GRID_SIZE || newP2HeadY < 0 || newP2HeadY >= GRID_SIZE);

      if (p1HitWall && p2HitWall) {
        setIsGameOver(true);
        setIsPlaying(false);
        playSound('crash');
        setWinnerMessage('¡Ambas serpientes chocaron contra el muro exterior! Empate.');
        setWinnerSnake('draw');
        setScores(s => ({ ...s, draws: s.draws + 1 }));
        return;
      }
      if (p1HitWall) {
        setIsGameOver(true);
        setIsPlaying(false);
        playSound('crash');
        setWinnerMessage(`¡Jugador 1 chocó contra la pared! Victoria para ${mode === 'benja' ? 'Benja' : 'Jugador 2'}.`);
        setWinnerSnake('p2');
        setScores(s => ({ ...s, p2: s.p2 + 1 }));
        if (mode === 'benja') setBenjaQuote('¡Te chocaste con la pared! Punto para mí.');
        return;
      }
      if (p2HitWall) {
        setIsGameOver(true);
        setIsPlaying(false);
        playSound('crash');
        setWinnerMessage(`¡${mode === 'benja' ? 'Benja' : 'Jugador 2'} chocó contra la pared! ¡Victoria para Jugador 1!`);
        setWinnerSnake('p1');
        setScores(s => ({ ...s, p1: s.p1 + 1 }));
        if (mode === 'benja') setBenjaQuote('¡Uff, no frené a tiempo y choqué! Bien jugado.');
        return;
      }

      // Self-collision checks
      const p1HitSelf = p1Snake.slice(0, -1).some(s => s.x === p1NewHead.x && s.y === p1NewHead.y);
      const p2HitSelf = p2Snake.slice(0, -1).some(s => s.x === p2NewHead.x && s.y === p2NewHead.y);

      if (p1HitSelf && p2HitSelf) {
        setIsGameOver(true);
        setIsPlaying(false);
        playSound('crash');
        setWinnerMessage('¡Ambas serpientes chocaron contra sus propios cuerpos! Empate.');
        setWinnerSnake('draw');
        setScores(s => ({ ...s, draws: s.draws + 1 }));
        return;
      }
      if (p1HitSelf) {
        setIsGameOver(true);
        setIsPlaying(false);
        playSound('crash');
        setWinnerMessage(`¡Jugador 1 chocó contra su propia cola! Victoria para ${mode === 'benja' ? 'Benja' : 'Jugador 2'}.`);
        setWinnerSnake('p2');
        setScores(s => ({ ...s, p2: s.p2 + 1 }));
        if (mode === 'benja') setBenjaQuote('¡Te mordiste la cola! Cuidado con los giros cerrados.');
        return;
      }
      if (p2HitSelf) {
        setIsGameOver(true);
        setIsPlaying(false);
        playSound('crash');
        setWinnerMessage(`¡${mode === 'benja' ? 'Benja' : 'Jugador 2'} chocó contra su cuerpo! ¡Victoria para Jugador 1!`);
        setWinnerSnake('p1');
        setScores(s => ({ ...s, p1: s.p1 + 1 }));
        if (mode === 'benja') setBenjaQuote('¡Me encerré solo! Punto para ti.');
        return;
      }

      // ==========================================
      // SPECIAL 1V1 "TRAP & CATCH" RULE:
      // "solo lo puedes atrapar si tu serpiente es más grande que la otra"
      // ==========================================
      const p1Len = p1Snake.length;
      const p2Len = p2Snake.length;

      // Case A: Head-to-Head Clash
      if (p1NewHead.x === p2NewHead.x && p1NewHead.y === p2NewHead.y) {
        setIsGameOver(true);
        setIsPlaying(false);
        if (p1Len > p2Len) {
          playSound('catch');
          setWinnerMessage(`¡Choque frontal! La serpiente del Jugador 1 (${p1Len}) era más grande que la de ${mode === 'benja' ? 'Benja' : 'Jugador 2'} (${p2Len}) y la devoró por completo.`);
          setWinnerSnake('p1');
          setScores(s => ({ ...s, p1: s.p1 + 1 }));
          if (mode === 'benja') setBenjaQuote('¡Eras más grande en el choque frontal! ¡Me atrapaste!');
        } else if (p2Len > p1Len) {
          playSound('catch');
          setWinnerMessage(`¡Choque frontal! La serpiente de ${mode === 'benja' ? 'Benja' : 'Jugador 2'} (${p2Len}) era más grande que la tuya (${p1Len}) y te atrapó.`);
          setWinnerSnake('p2');
          setScores(s => ({ ...s, p2: s.p2 + 1 }));
          if (mode === 'benja') setBenjaQuote('¡Mi serpiente creció más! Te atrapé de frente.');
        } else {
          playSound('crash');
          setWinnerMessage(`¡Choque frontal con el mismo tamaño exacto (${p1Len})! Ambas rebotaron sin vencedor. Empate.`);
          setWinnerSnake('draw');
          setScores(s => ({ ...s, draws: s.draws + 1 }));
          if (mode === 'benja') setBenjaQuote('¡Teníamos exactamente el mismo tamaño! Empate total.');
        }
        return;
      }

      // Case B: P1 hits P2's body
      const p1HitsP2Body = p2Snake.some(s => s.x === p1NewHead.x && s.y === p1NewHead.y);
      if (p1HitsP2Body) {
        setIsGameOver(true);
        setIsPlaying(false);
        if (p1Len > p2Len) {
          // P1 is larger: P1 CATCHES / TRAPS P2! P1 WINS!
          playSound('catch');
          setWinnerMessage(`👑 ¡ATRAPADO! Jugador 1 es más grande (${p1Len} vs ${p2Len}) e interceptó a ${mode === 'benja' ? 'Benja' : 'Jugador 2'}. ¡Victoria dominante!`);
          setWinnerSnake('p1');
          setScores(s => ({ ...s, p1: s.p1 + 1 }));
          if (mode === 'benja') setBenjaQuote('¡Uff, me encerraste siendo más grande! Imposible escapar.');
        } else {
          // P1 is smaller or equal: P1 crashed into the bigger body! P1 LOSES!
          playSound('crash');
          setWinnerMessage(`⚠️ ¡Chocaste contra el rival! Tu serpiente (${p1Len}) no era más grande que la de ${mode === 'benja' ? 'Benja' : 'Jugador 2'} (${p2Len}). Pierdes la ronda.`);
          setWinnerSnake('p2');
          setScores(s => ({ ...s, p2: s.p2 + 1 }));
          if (mode === 'benja') setBenjaQuote('¡No podías atraparme porque eres más pequeño o igual! ¡Punto para mí!');
        }
        return;
      }

      // Case C: P2 hits P1's body
      const p2HitsP1Body = p1Snake.some(s => s.x === p2NewHead.x && s.y === p2NewHead.y);
      if (p2HitsP1Body) {
        setIsGameOver(true);
        setIsPlaying(false);
        if (p2Len > p1Len) {
          // P2 is larger: P2 catches P1!
          playSound('catch');
          setWinnerMessage(`💀 ¡${mode === 'benja' ? 'Benja' : 'Jugador 2'} es más grande (${p2Len} vs ${p1Len}) y te ha atrapado!`);
          setWinnerSnake('p2');
          setScores(s => ({ ...s, p2: s.p2 + 1 }));
          if (mode === 'benja') setBenjaQuote('¡Te alcancé con mi tamaño superior! 🐱👑');
        } else {
          // P2 is smaller or equal: P2 crashed into P1! P1 WINS!
          playSound('crash');
          setWinnerMessage(`🛡️ ¡${mode === 'benja' ? 'Benja' : 'Jugador 2'} (${p2Len}) chocó contra tu cuerpo sin ser más grande (${p1Len})! ¡Victoria para Jugador 1!`);
          setWinnerSnake('p1');
          setScores(s => ({ ...s, p1: s.p1 + 1 }));
          if (mode === 'benja') setBenjaQuote('¡Intenté atacarte pero eras más grande que yo! Mala mía.');
        }
        return;
      }

      // 3. Apple Eating & Snake Growth
      let newApples = [...apples];
      let p1Ate = false;
      let p2Ate = false;

      // Check if P1 ate an apple
      const p1AppleIdx = newApples.findIndex(a => a.x === p1NewHead.x && a.y === p1NewHead.y);
      if (p1AppleIdx !== -1) {
        p1Ate = true;
        playSound('eat');
        newApples.splice(p1AppleIdx, 1);
      }

      // Check if P2 ate an apple
      const p2AppleIdx = newApples.findIndex(a => a.x === p2NewHead.x && a.y === p2NewHead.y);
      if (p2AppleIdx !== -1) {
        p2Ate = true;
        playSound('eat');
        newApples.splice(p2AppleIdx, 1);
      }

      // Build updated snake bodies
      const nextP1Snake = [p1NewHead, ...p1Snake];
      if (!p1Ate) nextP1Snake.pop();

      const nextP2Snake = [p2NewHead, ...p2Snake];
      if (!p2Ate) nextP2Snake.pop();

      // Replenish apples if any were eaten (always maintain 3 apples)
      while (newApples.length < 3) {
        const spawned = generateNewApple([nextP1Snake, nextP2Snake], newApples);
        newApples.push(spawned);
      }

      setP1Snake(nextP1Snake);
      setP2Snake(nextP2Snake);
      setApples(newApples);

      // Random dynamic quotes during the match
      if (mode === 'benja' && Math.random() < 0.05) {
        if (nextP1Snake.length > nextP2Snake.length) {
          const escapeQuotes = [
            '¡Ojo que creciste más! Me tengo que alejar.',
            '¡No me persigas! Voy por otra manzana roja.',
            'Estás más largo, necesito comer urgente.'
          ];
          setBenjaQuote(escapeQuotes[Math.floor(Math.random() * escapeQuotes.length)]);
        } else if (nextP2Snake.length > nextP1Snake.length) {
          const huntQuotes = [
            '¡Ya soy más grande que tú! ¡A ver si te escapas!',
            '¡Te tengo en la mira! 👑',
            'Cuidado que si te toco te atrapo.'
          ];
          setBenjaQuote(huntQuotes[Math.floor(Math.random() * huntQuotes.length)]);
        }
      }

    }, gameSpeed);

    return () => clearInterval(gameInterval);
  }, [
    isPlaying, isGameOver, p1Snake, p2Snake, apples, p2Dir, mode, 
    wallCollisions, gameSpeed, calculateAiMove, generateNewApple, playSound
  ]);

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Background Arena Grid
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Outer Arena Border indicator (Electric walls if solid)
    if (wallCollisions) {
      ctx.strokeStyle = '#ef4444'; // red border alert
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
    } else {
      ctx.strokeStyle = '#38bdf8'; // sky portal border
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      ctx.setLineDash([]);
    }

    // Draw Apples (🍎 glowing red circles with stem/leaf)
    apples.forEach(apple => {
      const cx = apple.x * cellSize + cellSize / 2;
      const cy = apple.y * cellSize + cellSize / 2;
      const radius = cellSize * 0.42;

      // Glow effect
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.5);
      glow.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
      glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Apple Body
      ctx.fillStyle = '#ef4444'; // rose-500
      ctx.beginPath();
      ctx.arc(cx, cy + 1, radius, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Leaf
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(cx + 2, cy - radius * 0.9, radius * 0.35, radius * 0.2, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Snake 1 (Player 1 - Emerald / Cyan Neon)
    p1Snake.forEach((seg, index) => {
      const isHead = index === 0;
      const x = seg.x * cellSize;
      const y = seg.y * cellSize;

      if (isHead) {
        // P1 Head
        ctx.fillStyle = '#10b981'; // emerald-500
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 6);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        const eyeOffset = cellSize * 0.25;
        const eyeRadius = cellSize * 0.12;

        if (p1Dir === 'RIGHT') {
          ctx.beginPath();
          ctx.arc(x + cellSize - eyeOffset, y + eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.arc(x + cellSize - eyeOffset, y + cellSize - eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(x + cellSize - eyeOffset + 1, y + eyeOffset, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.arc(x + cellSize - eyeOffset + 1, y + cellSize - eyeOffset, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p1Dir === 'LEFT') {
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.arc(x + eyeOffset, y + cellSize - eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(x + eyeOffset - 1, y + eyeOffset, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.arc(x + eyeOffset - 1, y + cellSize - eyeOffset, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p1Dir === 'UP') {
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.arc(x + cellSize - eyeOffset, y + eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + eyeOffset - 1, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.arc(x + cellSize - eyeOffset, y + eyeOffset - 1, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + cellSize - eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.arc(x + cellSize - eyeOffset, y + cellSize - eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + cellSize - eyeOffset + 1, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.arc(x + cellSize - eyeOffset, y + cellSize - eyeOffset + 1, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Crown on head if P1 is strictly bigger!
        if (p1Snake.length > p2Snake.length) {
          ctx.fillStyle = '#f59e0b'; // amber crown
          ctx.beginPath();
          ctx.moveTo(x + cellSize * 0.2, y + 2);
          ctx.lineTo(x + cellSize * 0.5, y - 4);
          ctx.lineTo(x + cellSize * 0.8, y + 2);
          ctx.fill();
        }
      } else {
        // Body segments
        const opacity = Math.max(0.4, 1 - (index / p1Snake.length) * 0.5);
        ctx.fillStyle = `rgba(52, 211, 153, ${opacity})`; // emerald-400
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 4);
        ctx.fill();
      }
    });

    // Draw Snake 2 (Player 2 / Benja - Violet / Fuchsia / Amber)
    p2Snake.forEach((seg, index) => {
      const isHead = index === 0;
      const x = seg.x * cellSize;
      const y = seg.y * cellSize;

      if (isHead) {
        // P2 Head
        ctx.fillStyle = mode === 'benja' ? '#f59e0b' : '#8b5cf6'; // amber for Benja or violet
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 6);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        const eyeOffset = cellSize * 0.25;
        const eyeRadius = cellSize * 0.12;

        if (p2Dir === 'RIGHT') {
          ctx.beginPath();
          ctx.arc(x + cellSize - eyeOffset, y + eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.arc(x + cellSize - eyeOffset, y + cellSize - eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(x + cellSize - eyeOffset + 1, y + eyeOffset, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.arc(x + cellSize - eyeOffset + 1, y + cellSize - eyeOffset, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p2Dir === 'LEFT') {
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.arc(x + eyeOffset, y + cellSize - eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(x + eyeOffset - 1, y + eyeOffset, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.arc(x + eyeOffset - 1, y + cellSize - eyeOffset, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p2Dir === 'UP') {
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.arc(x + cellSize - eyeOffset, y + eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + eyeOffset - 1, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.arc(x + cellSize - eyeOffset, y + eyeOffset - 1, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + cellSize - eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.arc(x + cellSize - eyeOffset, y + cellSize - eyeOffset, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + cellSize - eyeOffset + 1, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.arc(x + cellSize - eyeOffset, y + cellSize - eyeOffset + 1, eyeRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Crown on head if P2 is strictly bigger!
        if (p2Snake.length > p1Snake.length) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(x + cellSize * 0.2, y + 2);
          ctx.lineTo(x + cellSize * 0.5, y - 4);
          ctx.lineTo(x + cellSize * 0.8, y + 2);
          ctx.fill();
        }
      } else {
        // Body segments
        const opacity = Math.max(0.4, 1 - (index / p2Snake.length) * 0.5);
        ctx.fillStyle = mode === 'benja' 
          ? `rgba(251, 191, 36, ${opacity})` 
          : `rgba(167, 139, 250, ${opacity})`;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 4);
        ctx.fill();
      }
    });

  }, [p1Snake, p2Snake, apples, p1Dir, p2Dir, wallCollisions, mode]);

  const p1IsBigger = p1Snake.length > p2Snake.length;
  const p2IsBigger = p2Snake.length > p1Snake.length;
  const isEqualSize = p1Snake.length === p2Snake.length;

  return (
    <div className="space-y-6">
      {/* Header Info & Match Status */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-2">
              <Swords className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>DUELO SNAKE 1V1 COMPETITIVO</span>
              <span className="text-teal-200">•</span>
              <span className="text-yellow-300 font-black">REGLA: ATRAPA SOLO SI ERES MÁS GRANDE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Snake 1v1: Atrapa o Sé Atrapado</span>
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              En el mapa van apareciendo manzanas rojas 🍎. Come para aumentar de tamaño. Si eres <strong>más grande que el rival</strong>, puedes interceptar su cuerpo o chocar de frente para devorarlo. Si eres más pequeño o igual, ¡escapa y sigue comiendo!
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => onToggleSound && onToggleSound()}
              title={soundEnabled ? 'Silenciar audio' : 'Activar audio'}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                soundEnabled 
                  ? 'bg-white/20 hover:bg-white/30 border-white/30 text-white' 
                  : 'bg-black/30 border-white/10 text-white/60'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4 text-rose-300" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sonido' : 'Mudo'}</span>
            </button>

            <button
              onClick={togglePlay}
              className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                isPlaying 
                  ? 'bg-amber-400 hover:bg-amber-300 text-amber-950' 
                  : 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isGameOver ? 'Revancha' : isPlaying ? 'Pausar' : 'Empezar'}</span>
            </button>

            <button
              onClick={resetRound}
              className="px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all border border-white/30 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Game Arena vs Control & Settings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Center: Interactive Canvas Arena & Mobile Touch Controls */}
        <div className="lg:col-span-8 flex flex-col items-center bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm">
          
          {/* Real-time Snake Comparison Bar */}
          <div className="w-full flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            
            {/* P1 Stats */}
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-200" />
              <div>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                  Jugador 1 (Tú)
                  {p1IsBigger && <Crown className="w-3.5 h-3.5 text-amber-500 inline" />}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Longitud: {p1Snake.length}
                </span>
              </div>
            </div>

            {/* Tactical Advantage Indicator */}
            <div className="hidden sm:flex flex-col items-center">
              {p1IsBigger ? (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-black flex items-center gap-1 animate-pulse">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>¡Eres Cazador! (+{p1Snake.length - p2Snake.length} más grande)</span>
                </span>
              ) : p2IsBigger ? (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-black flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>⚠️ Eres Presa (-{p2Snake.length - p1Snake.length}) ¡Come manzanas!</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold">
                  Mismo tamaño ({p1Snake.length}) • ¡Coman manzanas para atrapar!
                </span>
              )}
            </div>

            {/* P2 Stats */}
            <div className="flex items-center gap-2.5 text-right">
              <div>
                <span className="text-xs font-black text-slate-800 flex items-center justify-end gap-1">
                  {p2IsBigger && <Crown className="w-3.5 h-3.5 text-amber-500 inline" />}
                  {mode === 'benja' ? 'Benja' : mode === 'cpu' ? 'Máquina' : 'Jugador 2'}
                </span>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Longitud: {p2Snake.length}
                </span>
              </div>
              <div className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-200" />
            </div>

          </div>

          {/* Benja Dialog Box during Match */}
          {mode === 'benja' && (
            <div className="w-full mb-4 p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-teal-50 to-emerald-50 border border-amber-200 flex items-center gap-3">
              <img 
                src={benjaFriend?.avatar || '/benja.svg'} 
                alt="Benja" 
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400 bg-black shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900">Benja (Rival en Arena)</span>
                  <span className="text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded-md">
                    {p2IsBigger ? 'Modo Cazador 👑' : 'Buscando Manzanas 🍎'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium italic mt-0.5 truncate sm:whitespace-normal">
                  "{benjaQuote}"
                </p>
              </div>
            </div>
          )}

          {/* Game Canvas Container */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 max-w-full">
            <canvas
              ref={canvasRef}
              width={440}
              height={440}
              className="block aspect-square w-[320px] sm:w-[420px] md:w-[440px] touch-none"
            />

            {/* Overlay if Not Playing or Game Over */}
            {(!isPlaying || isGameOver) && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
                {isGameOver ? (
                  <div className="space-y-3 max-w-sm">
                    <div className="inline-flex p-3 rounded-2xl bg-white/10 border border-white/20 text-yellow-300">
                      {winnerSnake === 'p1' ? <Trophy className="w-8 h-8 animate-bounce" /> : <Flame className="w-8 h-8" />}
                    </div>
                    <h3 className="text-xl font-black text-white">
                      {winnerSnake === 'p1' ? '¡Victoria de Jugador 1!' : winnerSnake === 'p2' ? `¡Victoria de ${mode === 'benja' ? 'Benja' : 'Jugador 2'}!` : '¡Ronda Empatada!'}
                    </h3>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {winnerMessage}
                    </p>
                    <button
                      onClick={() => {
                        resetRound();
                        setIsPlaying(true);
                      }}
                      className="mt-3 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg cursor-pointer inline-flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Jugar Revancha</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-w-xs">
                    <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-emerald-400 inline-block">
                      <Play className="w-8 h-8 ml-0.5" />
                    </div>
                    <h3 className="text-lg font-black text-white">¿Listo para el Snake 1v1?</h3>
                    <p className="text-xs text-slate-300">
                      Controla tu serpiente con las flechas del teclado o los botones en pantalla. Come manzanas para crecer y atrapar al rival.
                    </p>
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs transition-all shadow-lg cursor-pointer"
                    >
                      ¡Comenzar Duelo!
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Touch D-Pad Controls for Mobile & Desktop clickers */}
          <div className="w-full mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* P1 Controls D-Pad */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Controles Jugador 1 (Flechas / Botones)
              </span>
              <div className="grid grid-cols-3 gap-1.5 w-36">
                <div />
                <button
                  onClick={() => { if (p1Dir !== 'DOWN') nextP1Dir.current = 'UP'; }}
                  className="p-2.5 rounded-xl bg-slate-100 active:bg-emerald-500 active:text-white text-slate-700 font-black shadow-xs flex items-center justify-center cursor-pointer"
                  title="Arriba (↑)"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
                <div />

                <button
                  onClick={() => { if (p1Dir !== 'RIGHT') nextP1Dir.current = 'LEFT'; }}
                  className="p-2.5 rounded-xl bg-slate-100 active:bg-emerald-500 active:text-white text-slate-700 font-black shadow-xs flex items-center justify-center cursor-pointer"
                  title="Izquierda (←)"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { if (p1Dir !== 'UP') nextP1Dir.current = 'DOWN'; }}
                  className="p-2.5 rounded-xl bg-slate-100 active:bg-emerald-500 active:text-white text-slate-700 font-black shadow-xs flex items-center justify-center cursor-pointer"
                  title="Abajo (↓)"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { if (p1Dir !== 'LEFT') nextP1Dir.current = 'RIGHT'; }}
                  className="p-2.5 rounded-xl bg-slate-100 active:bg-emerald-500 active:text-white text-slate-700 font-black shadow-xs flex items-center justify-center cursor-pointer"
                  title="Derecha (→)"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* P2 Controls in 2-Player Local Mode */}
            {mode === 'local' && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                  Controles Jugador 2 (Teclas W, A, S, D)
                </span>
                <div className="grid grid-cols-3 gap-1.5 w-36">
                  <div />
                  <button
                    onClick={() => { if (p2Dir !== 'DOWN') nextP2Dir.current = 'UP'; }}
                    className="p-2.5 rounded-xl bg-amber-50 active:bg-amber-500 active:text-white text-amber-800 font-black shadow-xs flex items-center justify-center cursor-pointer border border-amber-200"
                    title="W - Arriba"
                  >
                    W
                  </button>
                  <div />

                  <button
                    onClick={() => { if (p2Dir !== 'RIGHT') nextP2Dir.current = 'LEFT'; }}
                    className="p-2.5 rounded-xl bg-amber-50 active:bg-amber-500 active:text-white text-amber-800 font-black shadow-xs flex items-center justify-center cursor-pointer border border-amber-200"
                    title="A - Izquierda"
                  >
                    A
                  </button>
                  <button
                    onClick={() => { if (p2Dir !== 'UP') nextP2Dir.current = 'DOWN'; }}
                    className="p-2.5 rounded-xl bg-amber-50 active:bg-amber-500 active:text-white text-amber-800 font-black shadow-xs flex items-center justify-center cursor-pointer border border-amber-200"
                    title="S - Abajo"
                  >
                    S
                  </button>
                  <button
                    onClick={() => { if (p2Dir !== 'LEFT') nextP2Dir.current = 'RIGHT'; }}
                    className="p-2.5 rounded-xl bg-amber-50 active:bg-amber-500 active:text-white text-amber-800 font-black shadow-xs flex items-center justify-center cursor-pointer border border-amber-200"
                    title="D - Derecha"
                  >
                    D
                  </button>
                </div>
              </div>
            )}

            {/* Quick Rules Legend */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-w-xs text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Mecánica 1v1 Clave:</span>
              </p>
              <p>• Si tu longitud &gt; rival: lo atrapas y ganas la ronda.</p>
              <p>• Si tu longitud &le; rival: te estrellas contra su cuerpo o rebotas.</p>
              <p>• 🍎 Hay 3 manzanas simultáneas en la arena.</p>
            </div>

          </div>

        </div>

        {/* Right: Scoreboard, Modes & Arena Customization */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Live Match Scoreboard */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Marcador de Rondas</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold">Al mejor de varias</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                <span className="text-xs font-bold text-emerald-900 block truncate">Tú (P1)</span>
                <span className="text-2xl font-black text-emerald-600">{scores.p1}</span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Victorias</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <span className="text-xs font-bold text-slate-700 block truncate">Empates</span>
                <span className="text-2xl font-black text-slate-700">{scores.draws}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Tablas</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                <span className="text-xs font-bold text-amber-900 block truncate">
                  {mode === 'benja' ? 'Benja' : mode === 'cpu' ? 'Máquina' : 'Jugador 2'}
                </span>
                <span className="text-2xl font-black text-amber-600">{scores.p2}</span>
                <span className="text-[10px] text-amber-700 block mt-0.5">Victorias</span>
              </div>
            </div>

            <button
              onClick={() => {
                setScores({ p1: 0, p2: 0, draws: 0 });
                resetRound();
              }}
              className="w-full py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Reiniciar Marcador a 0
            </button>
          </div>

          {/* Game Mode Selector */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Swords className="w-4 h-4 text-emerald-600" />
              <span>Modalidad de Juego</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setMode('benja');
                  resetRound();
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  mode === 'benja'
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-800">vs Benja</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">Rival con frases y personalidad</span>
              </button>

              <button
                onClick={() => {
                  setMode('cpu');
                  resetRound();
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  mode === 'cpu'
                    ? 'bg-violet-50 border-violet-400 ring-2 ring-violet-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Bot className="w-4 h-4 text-violet-600" />
                  <span className="text-xs font-bold text-slate-800">vs Máquina</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">IA con dificultad configurable</span>
              </button>

              <button
                onClick={() => {
                  setMode('local');
                  resetRound();
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  mode === 'local'
                    ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-800">2 Jugadores</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">Flechas vs WASD local</span>
              </button>
            </div>

            {/* CPU Difficulty Selector */}
            {mode === 'cpu' && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600 font-semibold">Dificultad IA:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {(['easy', 'medium', 'expert'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setDifficulty(d);
                        resetRound();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        difficulty === d 
                          ? 'bg-teal-600 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Normal' : 'Experto'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Arena Rules & Speed Settings */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Reglas de Arena & Velocidad</span>
            </h3>

            {/* Wall Collision Toggle */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Tipo de Muros</span>
                <span className="text-[10px] text-slate-500">
                  {wallCollisions ? 'Muros sólidos (Chocar = Pierdes)' : 'Bordes infinitos (Teletransporte)'}
                </span>
              </div>
              <button
                onClick={() => setWallCollisions(!wallCollisions)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  wallCollisions
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-sky-500 text-white shadow-xs'
                }`}
              >
                {wallCollisions ? 'Muro Rojo' : 'Portal'}
              </button>
            </div>

            {/* Speed Adjuster */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Velocidad de Juego</span>
                <span className="text-[10px] text-slate-500">
                  {gameSpeed === 160 ? 'Tranquilo' : gameSpeed === 130 ? 'Normal' : 'Rápido'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[
                  { label: '1x', speed: 160 },
                  { label: '2x', speed: 130 },
                  { label: '3x', speed: 100 }
                ].map(s => (
                  <button
                    key={s.speed}
                    onClick={() => setGameSpeed(s.speed)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      gameSpeed === s.speed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Benja Profile Link */}
          {benjaFriend && (
            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-5 shadow-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={benjaFriend.avatar}
                  alt={benjaFriend.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 bg-black"
                />
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {benjaFriend.name}, {benjaFriend.age}
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </h4>
                  <p className="text-[11px] text-slate-300">{benjaFriend.occupation}</p>
                  <p className="text-[10px] text-amber-400 mt-0.5">🐍 Experto en Snake y Duelos Arcade</p>
                </div>
              </div>

              {onOpenFriendDetail && (
                <button
                  onClick={() => onOpenFriendDetail(benjaFriend)}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  Perfil
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
