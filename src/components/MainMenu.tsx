import { GameMode } from '../types';
import { DECK_PRESETS } from '../data/cards';
import { useState } from 'react';

interface Props {
  onStartGame: (mode: GameMode, deckPreset?: string) => void;
  onShowCollection: () => void;
  onMultiplayer: () => void;
}

export default function MainMenu({ onStartGame, onShowCollection, onMultiplayer }: Props) {
  const [selectedDeck, setSelectedDeck] = useState<keyof typeof DECK_PRESETS>('balanced');
  const [showDeckSelect, setShowDeckSelect] = useState(false);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-bg-dark px-scanlines">
      {/* Background image */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'url(https://image.qwenlm.ai/generated-images/3f617221-41b2-4f54-83b6-4bbe44326db7/_result.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          imageRendering: 'pixelated',
        }}
      />
      
      {/* Pixel stars */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white animate-px-star"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 23) % 60}%`,
              width: '4px',
              height: '4px',
              animationDelay: `${(i * 0.3) % 2}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Title with pixel shadow */}
        <div className="text-center">
          <h1 
            className="text-yellow-400 px-text-glow-gold mb-2"
            style={{ fontSize: '20px', letterSpacing: '2px' }}
          >
            ⚔ КАРТЫ СУДЬБЫ ⚔
          </h1>
          <div className="flex justify-center gap-1 mt-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-yellow-600" />
            ))}
          </div>
          <p className="text-purple-300 mt-3" style={{ fontSize: '8px' }}>
            ПИКСЕЛЬНАЯ КАРТОЧНАЯ БИТВА
          </p>
        </div>

        {/* Pixel art card decoration */}
        <div className="flex gap-3">
          {[
            { emoji: '🗡️', color: 'bg-red-900 border-red-500' },
            { emoji: '🛡️', color: 'bg-blue-900 border-blue-500' },
            { emoji: '🔮', color: 'bg-purple-900 border-purple-500' },
            { emoji: '🏹', color: 'bg-green-900 border-green-500' },
            { emoji: '⚡', color: 'bg-yellow-900 border-yellow-500' },
          ].map((card, i) => (
            <div
              key={i}
              className={`w-14 h-20 ${card.color} border-4 flex items-center justify-center text-2xl animate-px-bounce px-border`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {card.emoji}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4 w-72">
          <PixelButton onClick={() => onStartGame('hotseat', selectedDeck)} color="green">
            🎮 ИГРА ВДВОЁМ
          </PixelButton>
          <PixelButton onClick={() => onStartGame('ai', selectedDeck)} color="blue">
            🤖 ПРОТИВ AI
          </PixelButton>
          <PixelButton onClick={onMultiplayer} color="amber">
            🌐 МУЛЬТИПЛЕЕР
          </PixelButton>
          <PixelButton onClick={() => setShowDeckSelect(!showDeckSelect)} color="amber">
            📋 КОЛОДА: {DECK_PRESETS[selectedDeck].name}
          </PixelButton>
          <PixelButton onClick={onShowCollection} color="purple">
            📚 КОЛЛЕКЦИЯ
          </PixelButton>
        </div>

        {/* Deck selection */}
        {showDeckSelect && (
          <div className="bg-gray-900 border-4 border-amber-500 p-4 w-72">
            <p className="text-amber-400 mb-3" style={{ fontSize: '8px' }}>ВЫБЕРИТЕ КОЛОДУ:</p>
            {Object.entries(DECK_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => { setSelectedDeck(key as keyof typeof DECK_PRESETS); setShowDeckSelect(false); }}
                className={`w-full text-left px-btn py-2 mb-2 ${
                  selectedDeck === key ? 'bg-amber-800 border-amber-400' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                }`}
                style={{ fontSize: '7px' }}
              >
                <div className="text-amber-300">{preset.name}</div>
                <div className="text-gray-400" style={{ fontSize: '6px' }}>{preset.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-4">
          <div className="flex justify-center gap-1 mb-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-gray-700" />
            ))}
          </div>
          <p className="text-gray-500" style={{ fontSize: '6px' }}>
            v1.0 • 30 КАРТ • ВСЕ МЕХАНИКИ
          </p>
        </div>
      </div>
    </div>
  );
}

function PixelButton({ children, onClick, color }: { children: React.ReactNode; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-800 border-green-400 text-green-100 hover:bg-green-700',
    blue: 'bg-blue-800 border-blue-400 text-blue-100 hover:bg-blue-700',
    purple: 'bg-purple-800 border-purple-400 text-purple-100 hover:bg-purple-700',
    amber: 'bg-amber-800 border-amber-400 text-amber-100 hover:bg-amber-700',
  };

  return (
    <button
      onClick={onClick}
      className={`px-btn ${colors[color]} py-4 text-center`}
      style={{ fontSize: '10px', letterSpacing: '1px' }}
    >
      {children}
    </button>
  );
}
