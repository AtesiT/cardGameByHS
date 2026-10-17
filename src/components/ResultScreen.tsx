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
    <div className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-scanlines ${
      isVictory ? 'px-bg-dark' : 'px-bg-dark'
    }`}>
      {/* Background */}
      <div className={`absolute inset-0 ${isVictory ? 'bg-amber-950/60' : 'bg-red-950/60'}`} />

      {/* Pixel particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className={`absolute animate-px-star ${isVictory ? 'bg-yellow-400' : 'bg-red-500'}`}
            style={{
              left: `${(i * 31) % 100}%`,
              top: `${(i * 19) % 100}%`,
              width: '4px',
              height: '4px',
              animationDelay: `${(i * 0.2) % 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-4">
        {/* Trophy/Skull - pixel art */}
        <div className="mb-6">
          <div className={`inline-block text-6xl ${isVictory ? 'animate-px-bounce' : ''}`}>
            {isVictory ? '🏆' : '💀'}
          </div>
        </div>

        {/* Result text */}
        <h1
          className={`mb-4 ${isVictory ? 'text-yellow-400 px-text-glow-gold' : 'text-red-400'}`}
          style={{ fontSize: '20px', letterSpacing: '2px' }}
        >
          {isVictory ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
        </h1>

        <p className="text-gray-300 mb-8" style={{ fontSize: '10px' }}>
          {isVictory ? 'ПРОТИВНИК ПОВЕРЖЕН!' : 'ГЕРОЙ ПАЛ В БОЮ...'}
        </p>

        {/* Stats */}
        <div className="bg-gray-900 border-4 border-gray-600 p-4 mb-8 inline-block">
          <p className="text-gray-400" style={{ fontSize: '8px' }}>
            {gameMode === 'ai' ? 'РЕЖИМ: ПРОТИВ AI' : 'РЕЖИМ: ЛОКАЛЬНАЯ ИГРА'}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={onPlayAgain}
            className="px-btn bg-green-800 border-green-400 text-green-100 px-8 py-4 hover:bg-green-700"
            style={{ fontSize: '10px', letterSpacing: '1px' }}
          >
            🔄 ИГРАТЬ СНОВА
          </button>
          <button
            onClick={onMenu}
            className="px-btn bg-gray-800 border-gray-500 text-gray-300 px-8 py-4 hover:bg-gray-700"
            style={{ fontSize: '10px', letterSpacing: '1px' }}
          >
            🏠 В МЕНЮ
          </button>
        </div>
      </div>
    </div>
  );
}
