import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, RotateCcw, Volume2, VolumeX, Swords, Crown, User, Bot, 
  Sparkles, Flame, Shield, ChevronRight, Zap, Info, Play, CheckCircle2
} from 'lucide-react';
import { FriendProfile } from '../types';

export type RPSChoice = 'rock' | 'paper' | 'scissors' | 'lizard' | 'spock';
export type RPSGameMode = 'benja' | 'ai' | 'friend' | 'pvp';
export type RPSDifficulty = 'easy' | 'medium' | 'hard';
export type MatchTarget = 1 | 3 | 5;

interface ChoiceConfig {
  id: RPSChoice;
  name: string;
  emoji: string;
  color: string;
  borderColor: string;
  bgLight: string;
  beats: RPSChoice[];
  keyHint: string;
}

const CLASSIC_CHOICES: ChoiceConfig[] = [
  {
    id: 'rock',
    name: 'Piedra',
    emoji: '🪨',
    color: 'from-amber-600 to-stone-700',
    borderColor: 'border-amber-500',
    bgLight: 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
    beats: ['scissors', 'lizard'],
    keyHint: '1'
  },
  {
    id: 'paper',
    name: 'Papel',
    emoji: '📄',
    color: 'from-blue-600 to-indigo-700',
    borderColor: 'border-blue-500',
    bgLight: 'bg-blue-500/15 text-blue-900 dark:text-blue-200',
    beats: ['rock', 'spock'],
    keyHint: '2'
  },
  {
    id: 'scissors',
    name: 'Tijera',
    emoji: '✂️',
    color: 'from-rose-600 to-red-700',
    borderColor: 'border-rose-500',
    bgLight: 'bg-rose-500/15 text-rose-900 dark:text-rose-200',
    beats: ['paper', 'lizard'],
    keyHint: '3'
  }
];

const EXTENDED_CHOICES: ChoiceConfig[] = [
  ...CLASSIC_CHOICES,
  {
    id: 'lizard',
    name: 'Lagarto',
    emoji: '🦎',
    color: 'from-emerald-600 to-teal-700',
    borderColor: 'border-emerald-500',
    bgLight: 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200',
    beats: ['spock', 'paper'],
    keyHint: '4'
  },
  {
    id: 'spock',
    name: 'Spock',
    emoji: '🖖',
    color: 'from-purple-600 to-violet-800',
    borderColor: 'border-purple-500',
    bgLight: 'bg-purple-500/15 text-purple-900 dark:text-purple-200',
    beats: ['scissors', 'rock'],
    keyHint: '5'
  }
];

// Explanations for each interaction
const RULES_EXPLANATIONS: Record<string, string> = {
  'rock-scissors': 'Piedra aplasta Tijera',
  'rock-lizard': 'Piedra aplasta Lagarto',
  'paper-rock': 'Papel envuelve Piedra',
  'paper-spock': 'Papel desautoriza Spock',
  'scissors-paper': 'Tijera corta Papel',
  'scissors-lizard': 'Tijera decapita Lagarto',
  'lizard-spock': 'Lagarto envenena Spock',
  'lizard-paper': 'Lagarto devora Papel',
  'spock-scissors': 'Spock rompe Tijera',
  'spock-rock': 'Spock vaporiza Piedra'
};

const BENJA_REACTIONS = {
  start: [
    '¡A ver qué sacás! Mi mente lee tus intenciones.',
    'Piedra, papel o tijera... no vas a saber ni por dónde vino.',
    'El clásico de las previas y las apuestas. ¡Dale!'
  ],
  win: [
    '¡Punto para mí! Te leí la jugada como un libro abierto.',
    '¡Jaja! La clásica no falla jamás.',
    '¡Qué reflejos tengo! ¿Pensaste que ibas a sorprenderme?',
    'Uno a cero para el Benja masterclass.'
  ],
  loss: [
    '¡Nooo! ¿Cómo sacaste eso justo ahora?',
    'Bueeeno, tuviste suerte de principiante. La próxima no te la perdono.',
    'Pará, ¡esa jugada fue pura casualidad!',
    'Bien jugado... pero el match todavía no termina.'
  ],
  draw: [
    '¡Empate! Pensamos exactamente lo mismo, increíble.',
    'Mente de colmena: empatados en esta.',
    '¡Doble coincidencia! De nuevo, dale.'
  ],
  matchWon: [
    '¡CAMPEÓN BENJA! ¡Te dije que no podías conmigo en este juego!',
    'GG, match ganado. Buen intento, pero la corona se queda acá.'
  ],
  matchLost: [
    '¡No te la puedo creer! Me ganaste el match completo... bien merecido, rey.',
    'Me ganaste la serie... exijo revancha inmediata cuando quieras.'
  ]
};

interface RoundHistory {
  id: number;
  p1Choice: RPSChoice;
  p2Choice: RPSChoice;
  winner: 'p1' | 'p2' | 'draw';
  reason: string;
}

interface RockPaperScissorsGameProps {
  friends?: FriendProfile[];
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onOpenFriendDetail?: (friend: FriendProfile) => void;
}

export const RockPaperScissorsGame: React.FC<RockPaperScissorsGameProps> = ({
  friends = [],
  soundEnabled = true,
  onToggleSound,
  onOpenFriendDetail
}) => {
  // Config state
  const [mode, setMode] = useState<RPSGameMode>('benja');
  const [difficulty, setDifficulty] = useState<RPSDifficulty>('medium');
  const [useExtendedRules, setUseExtendedRules] = useState(false);
  const [matchTarget, setMatchTarget] = useState<MatchTarget>(3);
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');

  // Game state
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [drawCount, setDrawCount] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // Active round stage: 'choose' | 'countdown' | 'revealed' | 'matchOver'
  const [stage, setStage] = useState<'choose' | 'countdown' | 'revealed' | 'matchOver'>('choose');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [p1Choice, setP1Choice] = useState<RPSChoice | null>(null);
  const [p2Choice, setP2Choice] = useState<RPSChoice | null>(null);
  const [lastRoundResult, setLastRoundResult] = useState<{
    winner: 'p1' | 'p2' | 'draw';
    reason: string;
  } | null>(null);

  // Local 2-Player (PVP) support
  const [pvpTurn, setPvpTurn] = useState<1 | 2>(1);
  const [pvpP1StagedChoice, setPvpP1StagedChoice] = useState<RPSChoice | null>(null);

  // Quotes and dialogue
  const [dialogue, setDialogue] = useState<string>(BENJA_REACTIONS.start[0]);
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Opponent details
  const benjaProfile = friends.find(f => f.name.toLowerCase().includes('benja')) || friends[0];
  const selectedFriend = friends.find(f => f.id === selectedFriendId) || benjaProfile;

  // Sound synthesis
  const playSfx = (type: 'tick' | 'reveal' | 'win' | 'loss' | 'draw' | 'matchWin' | 'click') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'tick') {
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'reveal') {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'loss') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'draw') {
        osc.frequency.setValueAtTime(392, now);
        osc.frequency.setValueAtTime(392, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'matchWin') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.5, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'click') {
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch {
      // AudioContext failure gracefully ignored
    }
  };

  const activeChoices = useExtendedRules ? EXTENDED_CHOICES : CLASSIC_CHOICES;

  // AI choice computation
  const computeOpponentChoice = (playerChoice: RPSChoice): RPSChoice => {
    const choicesList = activeChoices.map(c => c.id);

    if (mode === 'ai') {
      if (difficulty === 'easy') {
        // Pure random
        return choicesList[Math.floor(Math.random() * choicesList.length)];
      }

      if (difficulty === 'medium') {
        // 50% intelligent counter, 50% random
        if (Math.random() < 0.5) {
          // find counter
          const counterChoices = activeChoices.filter(c => c.beats.includes(playerChoice));
          if (counterChoices.length > 0) {
            return counterChoices[Math.floor(Math.random() * counterChoices.length)].id;
          }
        }
        return choicesList[Math.floor(Math.random() * choicesList.length)];
      }

      if (difficulty === 'hard') {
        // Psychological prediction based on history
        // Human players tend to switch to what would beat their previous choice, or repeat on win
        if (history.length > 0) {
          const lastRound = history[0];
          let predictedUserMove: RPSChoice = playerChoice;

          if (lastRound.winner === 'p1') {
            // User won last time: 60% chance they repeat or switch to what beat opponent
            predictedUserMove = Math.random() < 0.6 ? lastRound.p1Choice : playerChoice;
          } else if (lastRound.winner === 'p2') {
            // User lost: likely to switch away from what they just played
            const otherChoices = choicesList.filter(c => c !== lastRound.p1Choice);
            predictedUserMove = otherChoices[Math.floor(Math.random() * otherChoices.length)];
          }

          const winningCounters = activeChoices.filter(c => c.beats.includes(predictedUserMove));
          if (winningCounters.length > 0 && Math.random() < 0.75) {
            return winningCounters[Math.floor(Math.random() * winningCounters.length)].id;
          }
        }
        return choicesList[Math.floor(Math.random() * choicesList.length)];
      }
    }

    // Benja mode: Fun, slightly biased towards Rock & Spock, reactive
    if (mode === 'benja') {
      const roll = Math.random();
      if (roll < 0.35) {
        // Benja loves Rock and Lizard
        return useExtendedRules && Math.random() < 0.5 ? 'lizard' : 'rock';
      }
      if (roll < 0.65) {
        // Counter move
        const counters = activeChoices.filter(c => c.beats.includes(playerChoice));
        if (counters.length > 0) {
          return counters[Math.floor(Math.random() * counters.length)].id;
        }
      }
      return choicesList[Math.floor(Math.random() * choicesList.length)];
    }

    // Friend mode
    return choicesList[Math.floor(Math.random() * choicesList.length)];
  };

  // Determine winner between two choices
  const evaluateRound = (c1: RPSChoice, c2: RPSChoice): { winner: 'p1' | 'p2' | 'draw'; reason: string } => {
    if (c1 === c2) {
      return { winner: 'draw', reason: '¡Ambos eligieron la misma opción!' };
    }

    const c1Config = activeChoices.find(c => c.id === c1);
    if (c1Config && c1Config.beats.includes(c2)) {
      const ruleKey = `${c1}-${c2}`;
      const reason = RULES_EXPLANATIONS[ruleKey] || `${c1Config.name} vence a ${c2}`;
      return { winner: 'p1', reason };
    }

    const c2Config = activeChoices.find(c => c.id === c2);
    const ruleKey = `${c2}-${c1}`;
    const reason = RULES_EXPLANATIONS[ruleKey] || `${c2Config?.name || c2} vence a ${c1}`;
    return { winner: 'p2', reason };
  };

  // Handle Player 1 Selection
  const handlePlayerSelect = (choice: RPSChoice) => {
    if (stage !== 'choose') return;
    playSfx('click');

    if (mode === 'pvp') {
      // Local 2 Players mode
      if (pvpTurn === 1) {
        setPvpP1StagedChoice(choice);
        setPvpTurn(2);
        return;
      } else {
        // Player 2 selected
        if (!pvpP1StagedChoice) return;
        executeRound(pvpP1StagedChoice, choice);
        return;
      }
    }

    // Single player modes (vs Benja, vs AI, vs Friend)
    const opponentChoice = computeOpponentChoice(choice);
    executeRound(choice, opponentChoice);
  };

  const executeRound = (userChoice: RPSChoice, oppChoice: RPSChoice) => {
    setP1Choice(userChoice);
    setP2Choice(oppChoice);
    setStage('countdown');
    setCountdownNum(3);

    // Countdown 3... 2... 1...
    playSfx('tick');
    let timer = 3;

    const interval = setInterval(() => {
      timer -= 1;
      if (timer > 0) {
        setCountdownNum(timer);
        playSfx('tick');
      } else {
        clearInterval(interval);
        // Reveal result
        playSfx('reveal');
        const evalResult = evaluateRound(userChoice, oppChoice);
        setLastRoundResult(evalResult);

        // Update scores
        let newP1Score = p1Score;
        let newP2Score = p2Score;
        let newStreak = streak;

        if (evalResult.winner === 'p1') {
          newP1Score += 1;
          setP1Score(newP1Score);
          newStreak += 1;
          setStreak(newStreak);
          if (newStreak > maxStreak) setMaxStreak(newStreak);
          setTimeout(() => playSfx('win'), 200);

          if (mode === 'benja') {
            setDialogue(BENJA_REACTIONS.loss[Math.floor(Math.random() * BENJA_REACTIONS.loss.length)]);
          }
        } else if (evalResult.winner === 'p2') {
          newP2Score += 1;
          setP2Score(newP2Score);
          newStreak = 0;
          setStreak(0);
          setTimeout(() => playSfx('loss'), 200);

          if (mode === 'benja') {
            setDialogue(BENJA_REACTIONS.win[Math.floor(Math.random() * BENJA_REACTIONS.win.length)]);
          }
        } else {
          setDrawCount(d => d + 1);
          setTimeout(() => playSfx('draw'), 200);

          if (mode === 'benja') {
            setDialogue(BENJA_REACTIONS.draw[Math.floor(Math.random() * BENJA_REACTIONS.draw.length)]);
          }
        }

        // Add to history
        setHistory(prev => [
          {
            id: Date.now(),
            p1Choice: userChoice,
            p2Choice: oppChoice,
            winner: evalResult.winner,
            reason: evalResult.reason
          },
          ...prev.slice(0, 14)
        ]);

        // Check match target
        if (newP1Score >= matchTarget || newP2Score >= matchTarget) {
          setTimeout(() => {
            setStage('matchOver');
            playSfx('matchWin');
            if (mode === 'benja') {
              if (newP1Score >= matchTarget) {
                setDialogue(BENJA_REACTIONS.matchLost[Math.floor(Math.random() * BENJA_REACTIONS.matchLost.length)]);
              } else {
                setDialogue(BENJA_REACTIONS.matchWon[Math.floor(Math.random() * BENJA_REACTIONS.matchWon.length)]);
              }
            }
          }, 800);
        } else {
          setStage('revealed');
        }
      }
    }, 450);
  };

  const handleNextRound = () => {
    playSfx('click');
    setP1Choice(null);
    setP2Choice(null);
    setLastRoundResult(null);
    setPvpTurn(1);
    setPvpP1StagedChoice(null);
    setCurrentRound(r => r + 1);
    setStage('choose');
  };

  const handleResetMatch = () => {
    playSfx('click');
    setP1Score(0);
    setP2Score(0);
    setDrawCount(0);
    setCurrentRound(1);
    setP1Choice(null);
    setP2Choice(null);
    setLastRoundResult(null);
    setPvpTurn(1);
    setPvpP1StagedChoice(null);
    setStage('choose');
    setDialogue(BENJA_REACTIONS.start[Math.floor(Math.random() * BENJA_REACTIONS.start.length)]);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage !== 'choose') return;
      // 1, 2, 3, 4, 5
      const keyMap: Record<string, RPSChoice> = {
        '1': 'rock',
        '2': 'paper',
        '3': 'scissors',
        '4': 'lizard',
        '5': 'spock',
        'r': 'rock',
        'p': 'paper',
        't': 'scissors',
        's': 'scissors'
      };

      const choice = keyMap[e.key.toLowerCase()];
      if (choice) {
        if (!useExtendedRules && (choice === 'lizard' || choice === 'spock')) {
          return;
        }
        handlePlayerSelect(choice);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, pvpTurn, pvpP1StagedChoice, useExtendedRules, mode]);

  // Names for displays
  const getP1Name = () => (mode === 'pvp' ? 'Jugador 1' : 'Tú');
  const getP2Name = () => {
    if (mode === 'pvp') return 'Jugador 2';
    if (mode === 'benja') return 'Benja';
    if (mode === 'friend') return selectedFriend?.name || 'Amigo';
    return `IA (${difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Normal' : 'Experto'})`;
  };

  const p1ChoiceConfig = activeChoices.find(c => c.id === p1Choice);
  const p2ChoiceConfig = activeChoices.find(c => c.id === p2Choice);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-xs font-bold mb-2">
              <Swords className="w-3.5 h-3.5 text-yellow-300" />
              <span>PIEDRA, PAPEL O TIJERA ARCADE</span>
              <span className="text-white/60">•</span>
              <span className="text-yellow-200 font-extrabold">
                {matchTarget === 1 ? 'Muerte Súbita' : `Al Mejor de ${matchTarget}`}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <span>Piedra, Papel o Tijera</span>
              <span className="text-xs bg-yellow-400 text-rose-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                100% Interactivo
              </span>
            </h2>
            <p className="text-rose-100 text-xs sm:text-sm mt-1 max-w-xl">
              El duelo definitivo de reflejos y mente. Reta a Benja, pon a prueba la IA o juega en 2 jugadores local.
            </p>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
            <button
              onClick={() => setShowRulesModal(true)}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-yellow-300" />
              <span>Reglas</span>
            </button>

            {onToggleSound && (
              <button
                onClick={onToggleSound}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white transition-all cursor-pointer"
                title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4 text-rose-300" />}
              </button>
            )}

            <button
              onClick={handleResetMatch}
              className="px-3.5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-rose-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Match</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/20 overflow-x-auto">
          <button
            onClick={() => { setMode('benja'); handleResetMatch(); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              mode === 'benja' ? 'bg-white text-rose-950 shadow-md' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-yellow-500" />
            <span>vs Benja (Gamer)</span>
          </button>

          <button
            onClick={() => { setMode('ai'); handleResetMatch(); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              mode === 'ai' ? 'bg-white text-rose-950 shadow-md' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-blue-500" />
            <span>vs Máquina (IA)</span>
          </button>

          <button
            onClick={() => { setMode('pvp'); handleResetMatch(); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              mode === 'pvp' ? 'bg-white text-rose-950 shadow-md' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-500" />
            <span>2 Jugadores (Local)</span>
          </button>

          {friends.length > 1 && (
            <button
              onClick={() => { setMode('friend'); handleResetMatch(); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                mode === 'friend' ? 'bg-white text-rose-950 shadow-md' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>vs Amigo</span>
            </button>
          )}

          {/* Extended rules toggle */}
          <button
            onClick={() => {
              setUseExtendedRules(!useExtendedRules);
              handleResetMatch();
            }}
            className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              useExtendedRules
                ? 'bg-purple-900/60 border-purple-300 text-purple-100 shadow-xs'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white/90'
            }`}
            title="Añade Lagarto 🦎 y Spock 🖖 de The Big Bang Theory"
          >
            <span>🦎🖖 Modo Spock</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
              useExtendedRules ? 'bg-purple-300 text-purple-950' : 'bg-white/20 text-white'
            }`}>
              {useExtendedRules ? 'Activado' : 'Clásico'}
            </span>
          </button>
        </div>
      </div>

      {/* Benja Speech bubble when playing vs Benja */}
      {mode === 'benja' && benjaProfile && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <img
            src={benjaProfile.photo}
            alt={benjaProfile.name}
            className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shadow-sm shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-600" />
                Benja te desafía:
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold uppercase">
                Gamer de la casa
              </span>
            </div>
            <p className="text-sm text-amber-950 font-medium mt-0.5 italic">
              "{dialogue}"
            </p>
          </div>
        </div>
      )}

      {/* Main Game Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Top: Arena Duel Stage */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Match Scorecard Header */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Player 1 Card */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border-2 border-rose-300 flex items-center justify-center text-rose-600 font-black text-lg shadow-xs">
                {mode === 'pvp' ? 'P1' : 'TU'}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {getP1Name()}
                </div>
                <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>{p1Score}</span>
                  <span className="text-xs font-bold text-slate-400">pts</span>
                </div>
              </div>
            </div>

            {/* Target & Match Status Pill */}
            <div className="flex flex-col items-center">
              <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Meta: Primer a {matchTarget}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-semibold">
                Ronda #{currentRound} • Empates: {drawCount}
              </div>
            </div>

            {/* Player 2 Card */}
            <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {getP2Name()}
                </div>
                <div className="text-2xl font-black text-slate-900 flex items-center justify-end gap-2">
                  <span>{p2Score}</span>
                  <span className="text-xs font-bold text-slate-400">pts</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center text-indigo-600 font-black text-lg shadow-xs overflow-hidden">
                {mode === 'benja' && benjaProfile ? (
                  <img src={benjaProfile.photo} alt="Benja" className="w-full h-full object-cover" />
                ) : mode === 'friend' && selectedFriend ? (
                  <img src={selectedFriend.photo} alt={selectedFriend.name} className="w-full h-full object-cover" />
                ) : mode === 'pvp' ? (
                  'P2'
                ) : (
                  <Bot className="w-6 h-6 text-indigo-600" />
                )}
              </div>
            </div>

          </div>

          {/* Dynamic Duel Field Visualizer */}
          <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative min-h-[340px] flex flex-col items-center justify-center overflow-hidden">
            {/* Background lighting */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* STAGE 1: CHOOSE MOVE */}
            {stage === 'choose' && (
              <div className="text-center w-full max-w-lg animate-fade-in">
                {mode === 'pvp' ? (
                  <div className="mb-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase">
                      Turno: {pvpTurn === 1 ? 'Jugador 1 (Elige sin que miren)' : 'Jugador 2 (¡Tu turno!)'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black mt-2 text-white">
                      {pvpTurn === 1 ? 'Jugador 1, haz tu jugada secreta' : 'Jugador 2, haz tu jugada para el duelo'}
                    </h3>
                  </div>
                ) : (
                  <div className="mb-6">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10 text-xs font-bold uppercase tracking-wider">
                      ¡Tu Turno!
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black mt-2 text-white tracking-tight">
                      Elige tu jugada
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                      Usa el teclado (1, 2, 3) o haz clic en tu opción favorita
                    </p>
                  </div>
                )}

                {/* Hand Choice Buttons */}
                <div className={`grid gap-3 sm:gap-4 ${
                  useExtendedRules ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-3'
                }`}>
                  {activeChoices.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handlePlayerSelect(c.id)}
                      className="group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-slate-900 border-2 border-slate-700 hover:border-white hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                    >
                      <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform mb-2">
                        {c.emoji}
                      </span>
                      <span className="text-sm font-black text-white group-hover:text-yellow-400">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold mt-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                        Teclado: {c.keyHint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STAGE 2: COUNTDOWN ANIMATION */}
            {stage === 'countdown' && (
              <div className="text-center flex flex-col items-center justify-center animate-pulse">
                <div className="text-7xl sm:text-8xl font-black text-yellow-400 mb-4 scale-125 transition-all">
                  {countdownNum === 3 ? 'PIEDRA' : countdownNum === 2 ? 'PAPEL' : '¡TIJERA!'}
                </div>
                <div className="flex items-center gap-12 text-6xl sm:text-7xl animate-bounce">
                  <span>✊</span>
                  <span className="text-3xl text-slate-600 font-black">VS</span>
                  <span className="scale-x-[-1] inline-block">✊</span>
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-6">
                  Resolviendo jugadas...
                </p>
              </div>
            )}

            {/* STAGE 3: REVEALED ROUND RESULT */}
            {stage === 'revealed' && p1ChoiceConfig && p2ChoiceConfig && lastRoundResult && (
              <div className="w-full max-w-xl text-center animate-fade-in">
                {/* Result Headline Badge */}
                <div className="mb-5">
                  {lastRoundResult.winner === 'p1' ? (
                    <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-4 h-4" />
                      ¡PUNTO PARA {getP1Name().toUpperCase()}!
                    </span>
                  ) : lastRoundResult.winner === 'p2' ? (
                    <span className="px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-sm font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg">
                      <Flame className="w-4 h-4" />
                      ¡PUNTO PARA {getP2Name().toUpperCase()}!
                    </span>
                  ) : (
                    <span className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg">
                      <Shield className="w-4 h-4" />
                      ¡EMPATE DE JUGADA!
                    </span>
                  )}
                </div>

                {/* Hands Faceoff */}
                <div className="grid grid-cols-11 items-center gap-2 my-4">
                  {/* P1 Hand */}
                  <div className={`col-span-5 p-5 rounded-3xl border-2 flex flex-col items-center justify-center transition-all ${
                    lastRoundResult.winner === 'p1' 
                      ? 'bg-emerald-950/60 border-emerald-500 shadow-lg ring-4 ring-emerald-500/30' 
                      : 'bg-slate-900 border-slate-800'
                  }`}>
                    <span className="text-6xl sm:text-7xl mb-2">{p1ChoiceConfig.emoji}</span>
                    <span className="text-base font-black text-white">{p1ChoiceConfig.name}</span>
                    <span className="text-xs text-slate-400 font-bold mt-0.5">{getP1Name()}</span>
                  </div>

                  {/* VS center icon */}
                  <div className="col-span-1 flex flex-col items-center justify-center text-slate-500 font-black text-sm">
                    VS
                  </div>

                  {/* P2 Hand */}
                  <div className={`col-span-5 p-5 rounded-3xl border-2 flex flex-col items-center justify-center transition-all ${
                    lastRoundResult.winner === 'p2' 
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-lg ring-4 ring-indigo-500/30' 
                      : 'bg-slate-900 border-slate-800'
                  }`}>
                    <span className="text-6xl sm:text-7xl mb-2 scale-x-[-1] inline-block">{p2ChoiceConfig.emoji}</span>
                    <span className="text-base font-black text-white">{p2ChoiceConfig.name}</span>
                    <span className="text-xs text-slate-400 font-bold mt-0.5">{getP2Name()}</span>
                  </div>
                </div>

                {/* Explanation text */}
                <p className="text-sm font-bold text-slate-200 mt-3 bg-slate-900/80 px-4 py-2 rounded-xl inline-block border border-slate-800">
                  {lastRoundResult.reason}
                </p>

                {/* Continue Button */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleNextRound}
                    className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Siguiente Ronda</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 4: MATCH OVER / TROPHY CELEBRATION */}
            {stage === 'matchOver' && (
              <div className="text-center w-full max-w-md animate-fade-in">
                <div className="inline-flex p-4 rounded-full bg-yellow-400/20 border-2 border-yellow-400 mb-4 text-yellow-300 animate-bounce">
                  <Trophy className="w-12 h-12" />
                </div>

                <h3 className="text-3xl sm:text-4xl font-black text-white">
                  {p1Score >= matchTarget ? `¡${getP1Name()} GANA EL MATCH!` : `¡${getP2Name()} GANA EL MATCH!`}
                </h3>

                <p className="text-slate-300 text-sm mt-2">
                  Marcador final: {p1Score} - {p2Score} (en {currentRound} rondas disputadas)
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleResetMatch}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Revancha Inmediata</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Quick Round History Strip */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Historial de Rondas Recientes
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Racha actual: {streak} seguidas (Récord: {maxStreak})
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {history.map((h, idx) => {
                  const p1Conf = activeChoices.find(c => c.id === h.p1Choice);
                  const p2Conf = activeChoices.find(c => c.id === h.p2Choice);
                  return (
                    <div
                      key={h.id || idx}
                      title={h.reason}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 shrink-0 ${
                        h.winner === 'p1'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : h.winner === 'p2'
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-base">{p1Conf?.emoji}</span>
                      <span className="text-[10px] text-slate-400 font-extrabold">vs</span>
                      <span className="text-base">{p2Conf?.emoji}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                        h.winner === 'p1' ? 'bg-emerald-200 text-emerald-950' : h.winner === 'p2' ? 'bg-rose-200 text-rose-950' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {h.winner === 'p1' ? 'Ganaste' : h.winner === 'p2' ? 'Perdiste' : 'Empate'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right / Sidebar: Game Settings & Rules Guide */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Target Selector */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Modalidad de Victoria</span>
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 5].map((target) => (
                <button
                  key={target}
                  onClick={() => {
                    setMatchTarget(target as MatchTarget);
                    handleResetMatch();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    matchTarget === target
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {target === 1 ? '1 Punto' : `A ${target} Puntos`}
                </button>
              ))}
            </div>
          </div>

          {/* AI Difficulty (only when mode === 'ai') */}
          {mode === 'ai' && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-500" />
                <span>Nivel de Inteligencia Artificial</span>
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'easy', label: 'Fácil' },
                  { id: 'medium', label: 'Normal' },
                  { id: 'hard', label: 'Experto' }
                ].map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => {
                      setDifficulty(diff.id as RPSDifficulty);
                      handleResetMatch();
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      difficulty === diff.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {difficulty === 'hard' 
                  ? 'La IA analiza tus patrones de juego pasados para predecir tu próximo movimiento.'
                  : 'Modo equilibrado para partidas casuales.'}
              </p>
            </div>
          )}

          {/* Friend picker (when mode === 'friend') */}
          {mode === 'friend' && friends.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                <span>Elige tu rival de la comunidad</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => {
                      setSelectedFriendId(friend.id);
                      handleResetMatch();
                    }}
                    className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                      (selectedFriendId === friend.id || (!selectedFriendId && friend.id === benjaProfile?.id))
                        ? 'border-purple-500 bg-purple-50/70'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img src={friend.photo} alt={friend.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">{friend.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{friend.bio || friend.occupation}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Rules Matrix Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                {useExtendedRules ? 'Reglas Spock & Lagarto' : 'Reglas Clásicas'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <span>🪨 Piedra</span>
                <span className="text-emerald-400 font-bold">Vence a ✂️ Tijera {useExtendedRules && 'y 🦎'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <span>📄 Papel</span>
                <span className="text-emerald-400 font-bold">Vence a 🪨 Piedra {useExtendedRules && 'y 🖖'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <span>✂️ Tijera</span>
                <span className="text-emerald-400 font-bold">Vence a 📄 Papel {useExtendedRules && 'y 🦎'}</span>
              </div>
              {useExtendedRules && (
                <>
                  <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-between">
                    <span>🦎 Lagarto</span>
                    <span className="text-purple-300 font-bold">Vence a 🖖 Spock y 📄 Papel</span>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-between">
                    <span>🖖 Spock</span>
                    <span className="text-purple-300 font-bold">Vence a ✂️ Tijera y 🪨 Piedra</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-3 italic">
              {useExtendedRules 
                ? 'El Lagarto es envenenado por Spock o decapitado por Tijera. Spock vaporiza la Piedra.'
                : 'Partidas veloces ideales para desempates o apuestas amistosas.'}
            </p>
          </div>

        </div>

      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-100 text-rose-600 font-bold">
                  <Swords className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Reglas de Piedra, Papel o Tijera
                </h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>Objetivo:</strong> Vencer al oponente eligiendo la opción superior según la cadena de victorias.
              </p>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">Interacciones Tradicionales:</div>
                <div>• <strong>Piedra</strong> aplasta a la Tijera.</div>
                <div>• <strong>Tijera</strong> corta el Papel.</div>
                <div>• <strong>Papel</strong> envuelve la Piedra.</div>
              </div>

              <div className="p-3 bg-purple-50 rounded-2xl space-y-1.5 border border-purple-200 text-purple-950">
                <div className="font-bold text-purple-900 mb-1">Modo Extendido (Lagarto & Spock):</div>
                <div>• <strong>Tijera</strong> decapita a Lagarto y corta Papel.</div>
                <div>• <strong>Papel</strong> cubre Piedra y desautoriza a Spock.</div>
                <div>• <strong>Piedra</strong> aplasta Lagarto y aplasta Tijera.</div>
                <div>• <strong>Lagarto</strong> envenena a Spock y devora Papel.</div>
                <div>• <strong>Spock</strong> rompe Tijera y vaporiza Piedra.</div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                En caso de elegir la misma opción, se declara empate y se avanza a la siguiente ronda sin sumar puntos.
              </p>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-rose-600 text-white font-black text-xs cursor-pointer hover:bg-rose-700 transition-colors"
            >
              ¡Entendido, a jugar!
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
