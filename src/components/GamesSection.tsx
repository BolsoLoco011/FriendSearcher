import React, { useState, useEffect, useCallback } from 'react';
import { 
  Gamepad2, RotateCcw, Trophy, Volume2, VolumeX, Users, Bot, 
  Sparkles, Flame, CheckCircle2, ChevronRight, Crown, Smile, Zap, Swords, UserCheck
} from 'lucide-react';
import { FriendProfile } from '../types';
import { Snake1v1Game } from './Snake1v1Game';
import { RockPaperScissorsGame } from './RockPaperScissorsGame';

interface GamesSectionProps {
  friends?: FriendProfile[];
  onOpenFriendDetail?: (friend: FriendProfile) => void;
  currentUserProfile?: FriendProfile | null;
}

type GameMode = 'cpu' | 'local' | 'benja';
type Difficulty = 'easy' | 'medium' | 'expert';
type SymbolTheme = 'classic' | 'benja' | 'arcade' | 'gamer';

const THEMES: Record<SymbolTheme, { name: string; p1: string; p2: string; p1Icon: string; p2Icon: string; color1: string; color2: string }> = {
  classic: { name: 'Clásico (X / O)', p1: 'X', p2: 'O', p1Icon: '❌', p2Icon: '⭕', color1: 'text-sky-600', color2: 'text-amber-500' },
  benja: { name: 'Benja Style (👑 / 🐱)', p1: '👑', p2: '🐱', p1Icon: '👑', p2Icon: '🐱', color1: 'text-amber-500', color2: 'text-emerald-500' },
  arcade: { name: 'Arcade (⚡ / 🔥)', p1: '⚡', p2: '🔥', p1Icon: '⚡', p2Icon: '🔥', color1: 'text-yellow-400', color2: 'text-rose-500' },
  gamer: { name: 'Gamers (🎮 / 👾)', p1: '🎮', p2: '👾', p1Icon: '🎮', p2Icon: '👾', color1: 'text-indigo-500', color2: 'text-purple-500' }
};

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function checkWinner(board: Array<string | null>) {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  if (board.every(cell => cell !== null)) {
    return { winner: 'draw', line: null };
  }
  return null;
}

function minimax(board: Array<string | null>, depth: number, isMaximizing: boolean, aiSymbol: string, playerSymbol: string): number {
  const result = checkWinner(board);
  if (result) {
    if (result.winner === aiSymbol) return 10 - depth;
    if (result.winner === playerSymbol) return depth - 10;
    if (result.winner === 'draw') return 0;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiSymbol;
        const score = minimax(board, depth + 1, false, aiSymbol, playerSymbol);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = playerSymbol;
        const score = minimax(board, depth + 1, true, aiSymbol, playerSymbol);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function getBestMove(board: Array<string | null>, aiSymbol: string, playerSymbol: string, difficulty: Difficulty): number {
  const emptyIndices = board.map((v, i) => (v === null ? i : null)).filter((v): v is number => v !== null);
  if (emptyIndices.length === 0) return -1;

  if (difficulty === 'easy') {
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  if (difficulty === 'medium') {
    for (const i of emptyIndices) {
      board[i] = aiSymbol;
      if (checkWinner(board)?.winner === aiSymbol) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
    for (const i of emptyIndices) {
      board[i] = playerSymbol;
      if (checkWinner(board)?.winner === playerSymbol) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
    if (board[4] === null) return 4;
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  let bestScore = -Infinity;
  let move = emptyIndices[0];
  for (const i of emptyIndices) {
    board[i] = aiSymbol;
    const score = minimax(board, 0, false, aiSymbol, playerSymbol);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      move = i;
    }
  }
  return move;
}

export const GamesSection: React.FC<GamesSectionProps> = ({
  friends = [],
  onOpenFriendDetail,
  currentUserProfile
}) => {
  const [activeTab, setActiveTab] = useState<'tateti' | 'snake' | 'rps' | 'catalog'>('tateti');
  
  // Game Setup
  const [mode, setMode] = useState<GameMode>('benja');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [theme, setTheme] = useState<SymbolTheme>('benja');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Board State
  const [board, setBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [benjaQuote, setBenjaQuote] = useState<string>('¡Hola! Soy Benja. ¡A ver si me ganas en Ta-Te-Ti!');

  // Scores
  const [scores, setScores] = useState({
    p1: 0,
    p2: 0,
    draws: 0,
    streak: 0
  });

  const activeTheme = THEMES[theme];
  const p1Symbol = activeTheme.p1;
  const p2Symbol = activeTheme.p2;

  const currentWinner = checkWinner(board);

  // Synthesized Web Audio Sound Effects
  const playSound = useCallback((type: 'place' | 'win' | 'draw' | 'reset') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (type === 'place') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'win') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i + 1) * 0.09);
          osc.start(ctx.currentTime + i * 0.09);
          osc.stop(ctx.currentTime + (i + 1) * 0.09);
        });
      } else if (type === 'draw') {
        [440, 392, 330].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i + 1) * 0.1);
          osc.start(ctx.currentTime + i * 0.1);
          osc.stop(ctx.currentTime + (i + 1) * 0.1);
        });
      } else if (type === 'reset') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      }
    } catch {
      // Ignore audio failure if not allowed
    }
  }, [soundEnabled]);

  // Handle Winner side effects
  useEffect(() => {
    if (currentWinner) {
      if (currentWinner.winner === 'draw') {
        playSound('draw');
        setScores(prev => ({ ...prev, draws: prev.draws + 1, streak: 0 }));
        if (mode === 'benja') {
          setBenjaQuote('¡Empate! Estuvo muy peleada esta ronda.');
        }
      } else if (currentWinner.winner === p1Symbol) {
        playSound('win');
        setScores(prev => ({ ...prev, p1: prev.p1 + 1, streak: prev.streak + 1 }));
        if (mode === 'benja') {
          setBenjaQuote('¡Uff, buena jugada! Me ganaste bien. ¿Revancha?');
        }
      } else {
        playSound('win');
        setScores(prev => ({ ...prev, p2: prev.p2 + 1, streak: 0 }));
        if (mode === 'benja') {
          setBenjaQuote('¡Ja! ¡Punto para mí y mi gato! 🐱 Te toca mover mejor.');
        }
      }
    }
  }, [currentWinner, p1Symbol, playSound, mode]);

  // AI Turn Handling
  useEffect(() => {
    if ((mode === 'cpu' || mode === 'benja') && !isXNext && !currentWinner) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiDifficulty = mode === 'benja' ? 'medium' : difficulty;
        const bestIdx = getBestMove(board, p2Symbol, p1Symbol, aiDifficulty);
        if (bestIdx !== -1) {
          setBoard(prev => {
            const next = [...prev];
            next[bestIdx] = p2Symbol;
            return next;
          });
          playSound('place');
          setIsXNext(true);
        }
        setIsAiThinking(false);
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [isXNext, mode, difficulty, board, currentWinner, p1Symbol, p2Symbol, playSound]);

  const handleCellClick = (index: number) => {
    if (board[index] || currentWinner || isAiThinking) return;

    if (mode === 'cpu' || mode === 'benja') {
      if (!isXNext) return;
      setBoard(prev => {
        const next = [...prev];
        next[index] = p1Symbol;
        return next;
      });
      playSound('place');
      setIsXNext(false);
      if (mode === 'benja') {
        const thoughts = [
          'Hmm, interesante casilla...',
          'Ojo que por ahí me gusta colocar mi ficha.',
          'Pensando mi próximo movimiento...',
          'No te la voy a dejar tan fácil.'
        ];
        setBenjaQuote(thoughts[Math.floor(Math.random() * thoughts.length)]);
      }
    } else {
      // 2 Players Local
      const symbol = isXNext ? p1Symbol : p2Symbol;
      setBoard(prev => {
        const next = [...prev];
        next[index] = symbol;
        return next;
      });
      playSound('place');
      setIsXNext(!isXNext);
    }
  };

  const handleResetRound = () => {
    playSound('reset');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setIsAiThinking(false);
    if (mode === 'benja') {
      setBenjaQuote('¡Tablero limpio! Empiezas tú.');
    }
  };

  const handleResetScores = () => {
    setScores({ p1: 0, p2: 0, draws: 0, streak: 0 });
    handleResetRound();
  };

  const benjaFriend = friends.find(f => f.id === 'f-1' || f.name.toLowerCase().includes('benja'));

  return (
    <div className="space-y-6">
      {/* Prominent Game Selector Hub */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold mb-2">
              <Gamepad2 className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              <span>SALA DE MINIVIDEOJUEGOS ARCADE</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-extrabold">3 JUEGOS DISPONIBLES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Elige tu Minijuego</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Ta-Te-Ti, Snake 1v1 y Piedra Papel Tijera están listos para jugar contra la máquina, Benja o en pareja.
            </p>
          </div>

          {/* Sound toggle & quick actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar efectos' : 'Activar efectos'}
              className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                soundEnabled 
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              <span>{soundEnabled ? 'Sonido Activado' : 'Mudo'}</span>
            </button>

            {activeTab === 'tateti' && (
              <button
                onClick={handleResetRound}
                className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar Tablero</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Game Cards Selector: 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          {/* Card 1: Ta-Te-Ti */}
          <button
            type="button"
            onClick={() => setActiveTab('tateti')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              activeTab === 'tateti'
                ? 'bg-gradient-to-br from-violet-900/60 to-purple-950/80 border-violet-500 shadow-lg shadow-violet-950/50 ring-2 ring-violet-400/40'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="p-2.5 rounded-xl bg-violet-600 text-white shadow-md">
                <Crown className="w-5 h-5" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                activeTab === 'tateti' 
                  ? 'bg-violet-400 text-violet-950' 
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {activeTab === 'tateti' ? '● Jugando' : 'Jugar Ta-Te-Ti'}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-base font-black text-white flex items-center gap-1.5">
                <span>Ta-Te-Ti</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                Estrategia 3x3 clásica, Benja frases o 2 jugadores local.
              </p>
            </div>
          </button>

          {/* Card 2: Snake 1v1 */}
          <button
            type="button"
            onClick={() => setActiveTab('snake')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              activeTab === 'snake'
                ? 'bg-gradient-to-br from-emerald-950/80 to-teal-950/90 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-400/40'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md">
                <Swords className="w-5 h-5" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                activeTab === 'snake' 
                  ? 'bg-emerald-400 text-emerald-950' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {activeTab === 'snake' ? '● Jugando' : 'Jugar Snake'}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-base font-black text-white flex items-center gap-1.5">
                <span>Snake 1v1</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                Come manzanas 🍎 para atrapar al rival si eres más grande.
              </p>
            </div>
          </button>

          {/* Card 3: Piedra Papel Tijera */}
          <button
            type="button"
            onClick={() => setActiveTab('rps')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              activeTab === 'rps'
                ? 'bg-gradient-to-br from-rose-950/80 to-pink-950/90 border-rose-500 shadow-lg shadow-rose-950/50 ring-2 ring-rose-400/40'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md">
                <span className="text-lg leading-none">✂️</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                activeTab === 'rps' 
                  ? 'bg-rose-400 text-rose-950' 
                  : 'bg-yellow-400 text-slate-950'
              }`}>
                {activeTab === 'rps' ? '● Jugando' : '¡Nuevo! Jugar'}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-base font-black text-white flex items-center gap-1.5">
                <span>Piedra Papel Tijera</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                Reflejos y mente. Modo Benja, IA, 2P y modo Spock 🦎🖖.
              </p>
            </div>
          </button>

          {/* Card 4: Más Juegos */}
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === 'catalog'
                ? 'bg-slate-800 border-amber-500 shadow-lg ring-2 ring-amber-400/40'
                : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300 uppercase tracking-wider">
                Catálogo
              </span>
            </div>
            <div className="mt-3">
              <div className="text-base font-black text-white">Más Minijuegos</div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                Trivia de Afinidades, Memotest y Conecta 4.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Switcher Quick Notification Banner */}
      {activeTab === 'tateti' && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border border-rose-500/30 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">✂️</span>
            <span>
              <strong>¡Nuevo juego listo!</strong> Juega al clásico <strong>Piedra, Papel o Tijera</strong> (con modo Spock 🖖 y Benja).
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('rps')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Piedra Papel Tijera</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveTab('snake')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Swords className="w-3 h-3" />
              <span>Snake 1v1</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'snake' && (
        <div className="bg-gradient-to-r from-violet-500/10 via-rose-500/10 to-transparent border border-violet-500/30 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">👑</span>
            <span>
              Puedes alternar fácilmente entre <strong>Ta-Te-Ti</strong> y <strong>Piedra Papel Tijera</strong> en cualquier instante.
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('tateti')}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Ir a Ta-Te-Ti</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveTab('rps')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Piedra Papel Tijera</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'rps' && (
        <div className="bg-gradient-to-r from-violet-500/10 via-emerald-500/10 to-transparent border border-rose-500/30 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">🎮</span>
            <span>
              Estás jugando <strong>Piedra, Papel o Tijera</strong>. ¿Quieres jugar a Ta-Te-Ti o Snake 1v1?
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('tateti')}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Ir a Ta-Te-Ti</span>
            </button>
            <button
              onClick={() => setActiveTab('snake')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Snake 1v1</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'rps' ? (
        <RockPaperScissorsGame
          friends={friends}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenFriendDetail={onOpenFriendDetail}
        />
      ) : activeTab === 'snake' ? (
        <Snake1v1Game
          friends={friends}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenFriendDetail={onOpenFriendDetail}
        />
      ) : activeTab === 'tateti' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Game Board & Status */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm">
            
            {/* Mode & Turn Indicator */}
            <div className="w-full flex items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-500">Turno de:</span>
                <div className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-2xs ${
                  isXNext ? 'bg-sky-100 text-sky-800 border border-sky-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  <span className="text-base leading-none">{isXNext ? p1Symbol : p2Symbol}</span>
                  <span>{isXNext ? 'Jugador 1' : mode === 'benja' ? 'Benja' : mode === 'cpu' ? 'Máquina' : 'Jugador 2'}</span>
                </div>
              </div>

              {isAiThinking && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold animate-pulse">
                  <Bot className="w-4 h-4" />
                  <span>Pensando jugada...</span>
                </div>
              )}

              {currentWinner && (
                <div className="flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  <span>
                    {currentWinner.winner === 'draw' 
                      ? '¡Empate!' 
                      : `¡Ganador: ${currentWinner.winner === p1Symbol ? 'Jugador 1' : mode === 'benja' ? 'Benja' : 'Jugador 2'}!`}
                  </span>
                </div>
              )}
            </div>

            {/* Benja Dialog Box if Benja Mode is Active */}
            {mode === 'benja' && (
              <div className="w-full mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-sky-50 to-indigo-50 border border-amber-200 flex items-center gap-3">
                <img 
                  src={benjaFriend?.avatar || '/benja.svg'} 
                  alt="Benja" 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400 shadow-xs bg-black shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800">Benja (Rival Gamer)</span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md font-bold">Modo Chat</span>
                  </div>
                  <p className="text-xs text-slate-600 italic truncate sm:whitespace-normal font-medium mt-0.5">
                    "{benjaQuote}"
                  </p>
                </div>
              </div>
            )}

            {/* 3x3 Tic Tac Toe Grid */}
            <div className="relative p-3 bg-slate-900 rounded-3xl shadow-xl border-4 border-slate-800">
              <div className="grid grid-cols-3 gap-3 w-72 h-72 sm:w-80 sm:h-80">
                {board.map((cell, idx) => {
                  const isWinningCell = currentWinner?.line?.includes(idx);

                  return (
                    <button
                      key={idx}
                      onClick={() => handleCellClick(idx)}
                      disabled={!!cell || !!currentWinner || isAiThinking}
                      className={`relative flex items-center justify-center rounded-2xl font-black text-4xl sm:text-5xl transition-all duration-200 select-none cursor-pointer ${
                        cell
                          ? isWinningCell
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-105 animate-bounce'
                            : 'bg-slate-800 text-white shadow-inner'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 active:scale-95'
                      }`}
                    >
                      {/* Cell Content */}
                      {cell ? (
                        <span className={cell === p1Symbol ? activeTheme.color1 : activeTheme.color2}>
                          {cell}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-600 opacity-0 hover:opacity-100 transition-opacity">
                          {isXNext ? p1Symbol : p2Symbol}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* In-Game Action Bar */}
            <div className="w-full flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Racha actual: <strong>{scores.streak}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetRound}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Reiniciar Tablero
                </button>
                <button
                  onClick={handleResetScores}
                  className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Borrar Marcador
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Settings, Scoreboard & Opponent Selection */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Live Scoreboard */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Marcador en Directo</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">Al mejor de varias</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {/* P1 Score */}
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3">
                  <span className="text-xs font-bold text-sky-900 block truncate">Tú ({p1Symbol})</span>
                  <span className="text-2xl font-black text-sky-600">{scores.p1}</span>
                  <span className="text-[10px] text-sky-700 block mt-0.5">Victorias</span>
                </div>

                {/* Draws */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <span className="text-xs font-bold text-slate-700 block truncate">Empates</span>
                  <span className="text-2xl font-black text-slate-700">{scores.draws}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Tablas</span>
                </div>

                {/* P2 / Rival Score */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                  <span className="text-xs font-bold text-amber-900 block truncate">
                    {mode === 'benja' ? 'Benja' : mode === 'cpu' ? 'Máquina' : 'Jugador 2'} ({p2Symbol})
                  </span>
                  <span className="text-2xl font-black text-amber-600">{scores.p2}</span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">Victorias</span>
                </div>
              </div>
            </div>

            {/* Game Mode Selector */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Swords className="w-4 h-4 text-indigo-600" />
                <span>Modo de Juego</span>
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {/* Benja Mode */}
                <button
                  onClick={() => {
                    setMode('benja');
                    handleResetRound();
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
                  <span className="text-[10px] text-slate-500 leading-tight">Rival con chat y personalidad</span>
                </button>

                {/* AI / CPU Mode */}
                <button
                  onClick={() => {
                    setMode('cpu');
                    handleResetRound();
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
                  <span className="text-[10px] text-slate-500 leading-tight">IA con dificultad ajustable</span>
                </button>

                {/* 2 Players Local */}
                <button
                  onClick={() => {
                    setMode('local');
                    handleResetRound();
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    mode === 'local'
                      ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-800">2 Jugadores</span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">Pase y juegue local</span>
                </button>
              </div>

              {/* CPU Difficulty Slider if in CPU mode */}
              {mode === 'cpu' && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-600 font-semibold">Dificultad IA:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {(['easy', 'medium', 'expert'] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDifficulty(d);
                          handleResetRound();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          difficulty === d 
                            ? 'bg-violet-600 text-white shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Normal' : 'Invencible'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Symbol Customizer */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Smile className="w-4 h-4 text-amber-500" />
                <span>Estilo de Fichas</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(THEMES) as SymbolTheme[]).map((t) => {
                  const item = THEMES[t];
                  const isSelected = theme === t;

                  return (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? 'border-sky-500 bg-sky-50/70 font-bold' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs text-slate-800">{item.name}</span>
                      <span className="text-sm">{item.p1Icon} {item.p2Icon}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Benja Gamer Card */}
            {benjaFriend && (
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-md flex items-center justify-between gap-4">
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
                    <p className="text-[10px] text-amber-400 mt-0.5">⭐ Gamer & Amante del Ta-Te-Ti</p>
                  </div>
                </div>

                {onOpenFriendDetail && (
                  <button
                    onClick={() => onOpenFriendDetail(benjaFriend)}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <span>Ver Perfil</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      ) : (
        /* Catalog of Upcoming Minigames */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-violet-600" />
              <span>Próximos Minivideojuegos del Cuadrado de Juegos</span>
            </h3>
            <span className="text-xs text-slate-500">Ampliación de minijuegos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Piedra, Papel o Tijera (Active - New) */}
            <div 
              onClick={() => setActiveTab('rps')}
              className="bg-white border-2 border-rose-500 rounded-3xl p-5 shadow-md flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform ring-2 ring-rose-300"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 font-bold text-xl flex items-center justify-center">
                    ✂️
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-black uppercase">
                    ¡Nuevo & Jugable!
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900">Piedra, Papel o Tijera</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Duelo de reflejos y mente. Modo vs Benja, IA con 3 niveles, 2 Jugadores local y modo extendido Sheldon Cooper (Lagarto 🦎 y Spock 🖖).
                </p>
              </div>
              <button className="mt-4 w-full py-2 rounded-xl bg-rose-600 text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Jugar Piedra Papel Tijera</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Snake 1v1 (Active) */}
            <div 
              onClick={() => setActiveTab('snake')}
              className="bg-white border-2 border-emerald-500 rounded-3xl p-5 shadow-md flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform ring-2 ring-emerald-300"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 font-bold">
                    <Swords className="w-6 h-6" />
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-black uppercase">
                    ¡Nuevo & Jugable!
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900">Snake 1v1: Duelo de Manzanas</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Come manzanas rojas para crecer y atrapar al rival. Solo puedes atraparlo si tu serpiente es más grande que la otra. ¡Duelos tácticos con Benja o IA!
                </p>
              </div>
              <button className="mt-4 w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Jugar Snake 1v1</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Ta-Te-Ti (Active) */}
            <div 
              onClick={() => setActiveTab('tateti')}
              className="bg-white border-2 border-violet-500 rounded-3xl p-5 shadow-md flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 rounded-2xl bg-violet-100 text-violet-700 font-bold">
                    <Crown className="w-6 h-6" />
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-black uppercase">
                    ¡Jugable Ahora!
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900">Ta-Te-Ti (3 en Raya)</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  El clásico juego de estrategia rápida. Juega contra la IA invicta, reta a Benja con frases o juega en modo 2 jugadores local.
                </p>
              </div>
              <button className="mt-4 w-full py-2 rounded-xl bg-violet-600 text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Jugar Ta-Te-Ti</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Memotest de Amistad */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col justify-between opacity-85">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 font-bold">
                    <Sparkles className="w-6 h-6" />
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                    Próximamente
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-800">Memotest de Amigos</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Encuentra los pares de fotos de los amigos de la comunidad, memes icónicos y comida favorita antes de que termine el tiempo.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <span>En desarrollo para la próxima versión</span>
              </div>
            </div>

            {/* 3. Trivia Express */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col justify-between opacity-85">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 font-bold">
                    <Zap className="w-6 h-6" />
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                    Próximamente
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-800">Trivia Express de Afinidades</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Preguntas rápidas de cultura gamer, fútbol, cine y memes para desafiar a amigos en rondas de 60 segundos.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <span>En desarrollo para la próxima versión</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Matching Friends who like Gaming / Videojuegos */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-violet-600" />
              <span>Amigos con afinidad Gamer & Videojuegos ({
                friends.filter(f => f.traits.some(t => {
                  const norm = t.toLowerCase();
                  return norm.includes('juego') || norm.includes('videojuego') || norm.includes('gamer') || norm.includes('gaming') || norm.includes('corona');
                })).length
              })</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Conéctate para jugar partidas y coordinar torneos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {friends
            .filter(f => f.traits.some(t => {
              const norm = t.toLowerCase();
              return norm.includes('juego') || norm.includes('videojuego') || norm.includes('gamer') || norm.includes('gaming') || norm.includes('corona');
            }))
            .map((friend) => (
              <div
                key={friend.id}
                onClick={() => onOpenFriendDetail && onOpenFriendDetail(friend)}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-violet-300 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-slate-900"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{friend.name}, {friend.age}</p>
                    <p className="text-[11px] text-slate-500">{friend.occupation}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="px-1.5 py-0.2 rounded bg-violet-100 text-violet-800 text-[9px] font-bold">
                        {friend.joinedGroup || 'Squad Gaming'}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg border border-violet-200">
                  Desafiar
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
