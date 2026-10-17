import { useState } from 'react';
import { CARD_DATABASE } from '../data/cards';
import { CLASS_CARDS, HERO_CLASSES, HeroClass } from '../data/classes';
import { loadDecks, saveDecks } from '../data/progression';
import { CardDef } from '../types';

interface Props {
  onBack: () => void;
}

export default function DeckBuilder({ onBack }: Props) {
  const allCards = [...CARD_DATABASE, ...CLASS_CARDS];
  const [selectedClass, setSelectedClass] = useState<HeroClass | 'neutral'>('neutral');
  const [deck, setDeck] = useState<string[]>([]);
  const [deckName, setDeckName] = useState('Моя колода');
  const [savedDecks, setSavedDecks] = useState<string[][]>(loadDecks());
  const [filter, setFilter] = useState<'all' | 'minion' | 'spell' | 'weapon'>('all');
  const [manaFilter, setManaFilter] = useState<number | null>(null);

  const filteredCards = allCards.filter(card => {
    if (filter !== 'all' && card.type !== filter) return false;
    if (manaFilter !== null && card.cost !== manaFilter) return false;
    if (selectedClass !== 'neutral' && card.class && card.class !== selectedClass) return false;
    return true;
  }).sort((a, b) => a.cost - b.cost);

  const addToDeck = (cardId: string) => {
    const card = allCards.find(c => c.id === cardId);
    if (!card) return;

    const count = deck.filter(id => id === cardId).length;
    const maxCopies = card.rarity === 'legendary' ? 1 : 2;

    if (count >= maxCopies) return;
    if (deck.length >= 30) return;

    setDeck([...deck, cardId]);
  };

  const removeFromDeck = (cardId: string) => {
    const idx = deck.indexOf(cardId);
    if (idx !== -1) {
      const newDeck = [...deck];
      newDeck.splice(idx, 1);
      setDeck(newDeck);
    }
  };

  const saveDeck = () => {
    if (deck.length !== 30) return;
    const newDecks = [...savedDecks, deck];
    setSavedDecks(newDecks);
    saveDecks(newDecks);
    alert('Колода сохранена!');
  };

  const getCardCount = (cardId: string) => deck.filter(id => id === cardId).length;

  return (
    <div className="min-h-screen px-bg-dark p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b-4 border-amber-600 pb-3">
        <button onClick={onBack} className="px-btn bg-gray-800 border-gray-500 text-gray-300 px-4 py-2" style={{ fontSize: '10px' }}>
          ← НАЗАД
        </button>
        <h1 className="text-amber-400 px-text-glow-gold" style={{ fontSize: '16px' }}>🃏 РЕДАКТОР КОЛОД</h1>
        <div className="text-gray-400" style={{ fontSize: '8px' }}>
          {deck.length}/30
        </div>
      </div>

      <div className="flex gap-4">
        {/* Left: Card collection */}
        <div className="flex-1">
          {/* Class filter */}
          <div className="flex gap-1 mb-3 flex-wrap">
            <button
              onClick={() => setSelectedClass('neutral')}
              className={`px-btn px-2 py-1 ${selectedClass === 'neutral' ? 'bg-amber-700 border-amber-400' : 'bg-gray-800 border-gray-600'}`}
              style={{ fontSize: '7px' }}
            >
              Все
            </button>
            {Object.values(HERO_CLASSES).map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`px-btn px-2 py-1 ${selectedClass === cls.id ? 'bg-amber-700 border-amber-400' : 'bg-gray-800 border-gray-600'}`}
                style={{ fontSize: '7px' }}
              >
                {cls.emoji} {cls.name}
              </button>
            ))}
          </div>

          {/* Type/Mana filters */}
          <div className="flex gap-2 mb-3">
            <div className="flex gap-1">
              {(['all', 'minion', 'spell', 'weapon'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-btn px-2 py-1 ${filter === f ? 'bg-blue-700 border-blue-400' : 'bg-gray-800 border-gray-600'}`}
                  style={{ fontSize: '7px' }}
                >
                  {f === 'all' ? 'Все' : f === 'minion' ? '👹' : f === 'spell' ? '✨' : '⚔️'}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 11 }, (_, i) => i).map(mana => (
                <button
                  key={mana}
                  onClick={() => setManaFilter(manaFilter === mana ? null : mana)}
                  className={`px-btn w-6 h-6 ${manaFilter === mana ? 'bg-blue-700 border-blue-400' : 'bg-gray-800 border-gray-600'}`}
                  style={{ fontSize: '7px' }}
                >
                  {mana}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-6 gap-2 max-h-[60vh] overflow-y-auto p-2 bg-gray-900/50 border-2 border-gray-700">
            {filteredCards.map(card => {
              const count = getCardCount(card.id);
              const maxCopies = card.rarity === 'legendary' ? 1 : 2;
              return (
                <button
                  key={card.id}
                  onClick={() => addToDeck(card.id)}
                  disabled={count >= maxCopies || deck.length >= 30}
                  className={`relative p-1 border-2 text-left transition-all ${
                    count > 0 ? 'border-green-500 bg-green-900/30' : 'border-gray-600 bg-gray-800 hover:border-amber-500'
                  } disabled:opacity-50`}
                  style={{ fontSize: '6px' }}
                >
                  <div className="flex items-center gap-1">
                    <span className="bg-blue-700 text-white px-1 rounded" style={{ fontSize: '6px' }}>{card.cost}</span>
                    <span className="text-white truncate" style={{ fontSize: '5px' }}>{card.name}</span>
                  </div>
                  <div className="text-gray-400 mt-0.5" style={{ fontSize: '4px' }}>{card.description}</div>
                  {count > 0 && (
                    <span className="absolute top-0 right-0 bg-green-500 text-black px-1" style={{ fontSize: '6px' }}>
                      {count}/{maxCopies}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Current deck */}
        <div className="w-72">
          <div className="bg-gray-900 border-4 border-amber-600 p-3">
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="w-full bg-gray-800 border-2 border-gray-600 text-white px-2 py-1 mb-3"
              style={{ fontSize: '8px' }}
              placeholder="Название колоды"
            />

            <div className="space-y-1 max-h-[50vh] overflow-y-auto mb-3">
              {deck.length === 0 ? (
                <p className="text-gray-500 text-center py-4" style={{ fontSize: '8px' }}>Добавьте карты</p>
              ) : (
                Array.from(new Set(deck)).map(cardId => {
                  const card = allCards.find(c => c.id === cardId);
                  if (!card) return null;
                  const count = deck.filter(id => id === cardId).length;
                  return (
                    <div key={cardId} className="flex items-center justify-between bg-gray-800 border border-gray-600 px-2 py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-300" style={{ fontSize: '7px' }}>{card.cost}💎</span>
                        <span className="text-white" style={{ fontSize: '6px' }}>{card.name}</span>
                        <span className="text-gray-400" style={{ fontSize: '6px' }}>x{count}</span>
                      </div>
                      <button
                        onClick={() => removeFromDeck(cardId)}
                        className="text-red-400 hover:text-red-300 px-1"
                        style={{ fontSize: '8px' }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mana curve */}
            <div className="border-t border-gray-700 pt-2 mb-3">
              <p className="text-gray-400 mb-1" style={{ fontSize: '7px' }}>КРИВАЯ МАНЫ:</p>
              <div className="flex gap-0.5 items-end h-12">
                {Array.from({ length: 8 }, (_, i) => {
                  const count = deck.filter(id => {
                    const card = allCards.find(c => c.id === id);
                    return card && (i < 7 ? card.cost === i : card.cost >= 7);
                  }).length;
                  const height = Math.min(100, (count / 6) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500"
                        style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                      />
                      <span className="text-gray-500" style={{ fontSize: '5px' }}>{i < 7 ? i : '7+'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={saveDeck}
              disabled={deck.length !== 30}
              className="w-full px-btn bg-green-800 border-green-400 text-green-100 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: '8px' }}
            >
              💾 СОХРАНИТЬ КОЛОДУ
            </button>
          </div>

          {/* Saved decks */}
          {savedDecks.length > 0 && (
            <div className="mt-3 bg-gray-900 border-2 border-gray-600 p-3">
              <p className="text-gray-400 mb-2" style={{ fontSize: '8px' }}>СОХРАНЁННЫЕ КОЛОДЫ:</p>
              {savedDecks.map((savedDeck, i) => (
                <div key={i} className="text-gray-300 py-1 border-b border-gray-700" style={{ fontSize: '7px' }}>
                  Колода {i + 1} ({savedDeck.length} карт)
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
