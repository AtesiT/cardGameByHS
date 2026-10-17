import { BoardMinion } from '../types';
import { useState, useEffect, useRef } from 'react';

interface Props {
  minion: BoardMinion;
  isOpponent: boolean;
  isTargetable: boolean;
  isSelected: boolean;
  canAttack?: boolean;
  onClick: () => void;
}

export default function MinionComponent({ minion, isOpponent, isTargetable, isSelected, canAttack = false, onClick }: Props) {
  const isDamaged = minion.currentHealth < minion.maxHealth;
  const isBuffed = minion.currentAttack > minion.def.attack!;
  const [justPlayed, setJustPlayed] = useState(true);
  const [shaking, setShaking] = useState(false);
  const prevHealthRef = useRef(minion.currentHealth);

  useEffect(() => {
    const timer = setTimeout(() => setJustPlayed(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minion.currentHealth < prevHealthRef.current) {
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
    }
    prevHealthRef.current = minion.currentHealth;
  }, [minion.currentHealth]);

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`relative border-2 rounded-lg transition-all duration-150 flex flex-col items-center justify-center ${
          justPlayed ? 'animate-card-play' : ''
        } ${
          shaking ? 'animate-shake' : ''
        } ${
          isTargetable && isOpponent
            ? 'border-red-400 hover:bg-red-900/30 cursor-crosshair hover:animate-pulse'
            : isSelected
            ? 'border-yellow-400 bg-yellow-900/30 scale-110 ring-2 ring-yellow-300 shadow-lg shadow-yellow-400/40'
            : canAttack
            ? 'border-green-400 hover:border-green-300 hover:scale-105 cursor-pointer hover:shadow-lg hover:shadow-green-400/30'
            : 'border-gray-500'
        } ${minion.hasDivineShield ? 'ring-2 ring-yellow-200 shadow-lg shadow-yellow-200/30' : ''}`}
        style={{
          width: '64px',
          height: '80px',
          background: `linear-gradient(to bottom, ${isOpponent ? '#7f1d1d' : '#1e3a5f'}, ${isOpponent ? '#450a0a' : '#0c1e3f'})`,
        }}
      >
      {/* Divine Shield glow */}
      {minion.hasDivineShield && (
        <div className="absolute inset-0 border-2 border-yellow-300 rounded-lg animate-pulse opacity-60" />
      )}

      {/* Taunt indicator */}
      {minion.hasTaunt && (
        <div className="absolute inset-0 border-2 border-gray-300 rounded-lg opacity-50" style={{ borderWidth: '3px' }} />
      )}

      {/* Poisonous indicator */}
      {minion.isPoisonous && (
        <div className="absolute top-0 right-0 text-xs">☠️</div>
      )}

      {/* Card art */}
      <span style={{ fontSize: '20px' }}>
        {getMinionEmoji(minion.cardId)}
      </span>

      {/* Name */}
      <span className="text-white text-center leading-tight mt-0.5 px-0.5" style={{ fontSize: '5px' }}>
        {minion.def.name}
      </span>

      {/* Stats */}
      <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-between">
        <span className={`font-bold px-0.5 rounded ${isBuffed ? 'text-green-300' : 'text-yellow-300'}`} style={{ fontSize: '10px' }}>
          {minion.currentAttack}⚔
        </span>
        <span className={`font-bold px-0.5 rounded ${isDamaged ? 'text-red-300' : 'text-white'}`} style={{ fontSize: '10px' }}>
          {minion.currentHealth}❤
        </span>
      </div>

      {/* Keyword badges */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-0.5">
        {minion.hasTaunt && <span className="bg-gray-400 text-black rounded px-0.5" style={{ fontSize: '5px' }}>🛡</span>}
        {minion.hasWindfury && <span className="bg-blue-400 text-black rounded px-0.5" style={{ fontSize: '5px' }}>💨</span>}
        {minion.hasLifesteal && <span className="bg-red-400 text-black rounded px-0.5" style={{ fontSize: '5px' }}>💉</span>}
      </div>

      {/* Can attack indicator */}
      {canAttack && !isOpponent && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      )}
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 border-2 border-amber-500 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
        <p className="text-amber-400 font-bold mb-1" style={{ fontSize: '8px' }}>{minion.def.name}</p>
        <p className="text-gray-200" style={{ fontSize: '6px' }}>{minion.def.description}</p>
        {minion.def.flavorText && (
          <p className="text-gray-500 italic mt-1" style={{ fontSize: '5px' }}>"{minion.def.flavorText}"</p>
        )}
        <div className="flex gap-2 mt-1 text-xs">
          <span className="text-yellow-300">⚔ {minion.currentAttack}</span>
          <span className="text-red-300">❤ {minion.currentHealth}/{minion.maxHealth}</span>
        </div>
      </div>
    </div>
  );
}

function getMinionEmoji(cardId: string): string {
  const emojis: Record<string, string> = {
    m01: '😈', m02: '🛡️', m03: '👑', m04: '🧊', m05: '🗡️',
    m06: '🗿', m07: '🌿', m08: '🩸', m09: '🐉', m10: '💃',
    m11: '✨', m12: '🔥', m13: '🛡️', m14: '🐲', m15: '🦅',
    token_golem: '🤖', token_imp: '👿',
  };
  return emojis[cardId] || '👹';
}
