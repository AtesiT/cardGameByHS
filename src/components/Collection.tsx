import { useState } from 'react';
import { CARD_DATABASE } from '../data/cards';
import { CardDef, CardType, Rarity } from '../types';
import CardComponent from './CardComponent';

interface Props {
  onBack: () => void;
}

export default function Collection({ onBack }: Props) {
  const [filter, setFilter] = useState<'all' | CardType>('all');
  const [rarityFilter, setRarityFilter] = useState<'all' | Rarity>('all');
  const [selectedCard, setSelectedCard] = useState<CardDef | null>(null);

  const filteredCards = CARD_DATABASE.filter(card => {
    if (filter !== 'all' && card.type !== filter) return false;
    if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false;
    return true;
  }).sort((a, b) => a.cost - b.cost);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-indigo-950 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="bg-gray-800 border-2 border-gray-500 text-gray-300 px-3 py-2 hover:bg-gray-700 transition-colors"
          style={{ fontSize: '10px' }}
        >
          ← НАЗАД
        </button>
        <h1 className="text-amber-400" style={{ fontSize: '16px' }}>📚 Коллекция карт</h1>
        <div className="text-gray-400" style={{ fontSize: '8px' }}>
          {filteredCards.length} / {CARD_DATABASE.length}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        <div className="flex gap-1">
          {(['all', 'minion', 'spell', 'weapon'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 border-2 transition-all ${
                filter === f ? 'bg-amber-700 border-amber-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
              }`}
              style={{ fontSize: '8px' }}
            >
              {f === 'all' ? 'Все' : f === 'minion' ? '👹 Существа' : f === 'spell' ? '✨ Закл.' : '⚔️ Оружие'}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`px-2 py-1 border-2 transition-all ${
                rarityFilter === r ? 'bg-purple-700 border-purple-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
              }`}
              style={{ fontSize: '8px' }}
            >
              {r === 'all' ? 'Все' : r === 'common' ? '⚪ Обыч.' : r === 'rare' ? '🔵 Редк.' : r === 'epic' ? '🟣 Эпич.' : '🟡 Леген.'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="flex flex-wrap gap-3 justify-center">
        {filteredCards.map(card => (
          <div key={card.id} onClick={() => setSelectedCard(card)} className="cursor-pointer hover:scale-105 transition-transform">
            <CardComponent
              card={{ instanceId: card.id, cardId: card.id, def: card }}
              showFull={selectedCard?.id === card.id}
            />
          </div>
        ))}
      </div>

      {/* Card detail */}
      {selectedCard && (
        <div className="fixed bottom-4 left-4 right-4 bg-gray-900/95 border-2 border-amber-500 p-3 max-w-md mx-auto rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-amber-400" style={{ fontSize: '10px' }}>{selectedCard.name}</h3>
              <p className="text-gray-300 mt-1" style={{ fontSize: '8px' }}>{selectedCard.description}</p>
              {selectedCard.flavorText && (
                <p className="text-gray-500 italic mt-1" style={{ fontSize: '7px' }}>"{selectedCard.flavorText}"</p>
              )}
            </div>
            <button onClick={() => setSelectedCard(null)} className="text-gray-400 hover:text-white" style={{ fontSize: '10px' }}>✕</button>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-blue-300" style={{ fontSize: '7px' }}>Мана: {selectedCard.cost}</span>
            <span className="text-gray-400" style={{ fontSize: '7px' }}>|</span>
            <span className="text-gray-300" style={{ fontSize: '7px' }}>Редкость: {getRarityName(selectedCard.rarity)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function getRarityName(r: Rarity): string {
  switch (r) {
    case 'common': return 'Обычная';
    case 'rare': return 'Редкая';
    case 'epic': return 'Эпическая';
    case 'legendary': return 'Легендарная';
  }
}
