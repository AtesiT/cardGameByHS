import { GameMode } from '../types';

interface Props {
  winner: number;
  playerView: 0 | 1;
  gameMode: GameMode;
  onPlayAgain: () => void;
  onMenu: () => void;
}

export default function ResultScreen({ winner, playerView, gameMode, onPlayAgain, onMenu }: Props) {
  const isVictory = winner === playerView || (gameMode === 'ai' && winner === 0);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${
      isVictory
        ? 'bg-gradient-to-b from-amber-900 via-yellow-900 to-gray-900'
        : 'bg-gradient-to-b from-red-950 via-gray-900 to-black'
    }`}>
      {/* Particles */}
      {isVictory && Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-amber-400 rounded-full animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random() * 2}s`,
          }}
        />
      ))}

      <div className="relative z-10 text-center">
        {/* Result icon */}
        <div className="text-6xl mb-4 animate-bounce">
          {isVictory ? '🏆' : '💀'}
        </div>

        {/* Result text */}
        <h1
          className={`mb-4 ${isVictory ? 'text-amber-400' : 'text-red-400'}`}
          style={{ fontSize: '20px', textShadow: `0 0 20px ${isVictory ? 'rgba(251,191,36,0.5)' : 'rgba(239,68,68,0.5)'}` }}
        >
          {isVictory ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
        </h1>

        <p className="text-gray-300 mb-8" style={{ fontSize: '10px' }}>
          {isVictory
            ? 'Противник повержен! Слава герою!'
            : 'Ваш герой пал в бою...'}
        </p>

        {/* Stats */}
        <div className="bg-black/50 border-2 border-gray-600 p-4 mb-6 rounded-lg">
          <p className="text-gray-400" style={{ fontSize: '8px' }}>
            {gameMode === 'ai' ? 'Режим: Против AI' : 'Режим: Локальная игра'}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={onPlayAgain}
            className="bg-gradient-to-b from-green-600 to-green-800 border-2 border-green-400 text-green-100 px-6 py-3 hover:from-green-500 hover:to-green-700 transition-all hover:scale-105"
            style={{ fontSize: '10px' }}
          >
            🔄 ИГРАТЬ СНОВА
          </button>
          <button
            onClick={onMenu}
            className="bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-500 text-gray-300 px-6 py-3 hover:from-gray-600 hover:to-gray-800 transition-all hover:scale-105"
            style={{ fontSize: '10px' }}
          >
            🏠 В МЕНЮ
          </button>
        </div>
      </div>
    </div>
  );
}
