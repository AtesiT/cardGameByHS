import { GameMode } from '../types';

interface Props {
  onStartGame: (mode: GameMode) => void;
  onShowCollection: () => void;
}

export default function MainMenu({ onStartGame, onShowCollection }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-900 to-gray-900">
        {/* Stars */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}
        {/* Pixel art castle silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center">
          <div className="flex gap-0">
            {[40, 60, 80, 60, 100, 60, 80, 60, 40].map((h, i) => (
              <div key={i} className="bg-gray-800 border-t-2 border-x-2 border-gray-600" style={{ width: '40px', height: `${h}px` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-amber-400 mb-2" style={{ fontSize: '24px', textShadow: '3px 3px 0px #92400e, 0 0 20px rgba(251,191,36,0.3)' }}>
            ⚔️ КАРТЫ СУДЬБЫ ⚔️
          </h1>
          <p className="text-purple-300" style={{ fontSize: '8px' }}>
            Пиксельная карточная битва
          </p>
        </div>

        {/* Pixel art card decoration */}
        <div className="flex gap-4 mb-4">
          {['🗡️', '🛡️', '🔮', '🏹', '⚡'].map((emoji, i) => (
            <div
              key={i}
              className="w-12 h-16 bg-gradient-to-b from-amber-700 to-amber-900 border-2 border-amber-400 flex items-center justify-center text-2xl animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              {emoji}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-64">
          <MenuButton onClick={() => onStartGame('hotseat')} color="green">
            🎮 ИГРА ВДВОЁМ
          </MenuButton>
          <MenuButton onClick={() => onStartGame('ai')} color="blue">
            🤖 ПРОТИВ AI
          </MenuButton>
          <MenuButton onClick={onShowCollection} color="purple">
            📚 КОЛЛЕКЦИЯ
          </MenuButton>
        </div>

        {/* Footer */}
        <p className="text-gray-500 mt-8" style={{ fontSize: '6px' }}>
          v1.0 • 30 карт • Все механики Hearthstone
        </p>
      </div>
    </div>
  );
}

function MenuButton({ children, onClick, color }: { children: React.ReactNode; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    green: 'from-green-700 to-green-900 border-green-400 hover:from-green-600 hover:to-green-800 text-green-100',
    blue: 'from-blue-700 to-blue-900 border-blue-400 hover:from-blue-600 hover:to-blue-800 text-blue-100',
    purple: 'from-purple-700 to-purple-900 border-purple-400 hover:from-purple-600 hover:to-purple-800 text-purple-100',
  };

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-b ${colors[color]} border-2 px-4 py-3 text-center transition-all duration-150 hover:scale-105 active:scale-95`}
      style={{ fontSize: '10px' }}
    >
      {children}
    </button>
  );
}
