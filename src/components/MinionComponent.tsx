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

// Sprite positions for each minion (row, col in 4x4 grid)
const SPRITE_POSITIONS: Record<string, [number, number]> = {
  m01: [0, 0], m02: [0, 1], m03: [0, 2], m04: [0, 3],
  m05: [1, 0], m06: [1, 1], m07: [1, 2], m08: [1, 3],
  m09: [2, 0], m10: [2, 1], m11: [2, 2], m12: [2, 3],
  m13: [3, 0], m14: [3, 1], m15: [3, 2],
  token_golem: [3, 3], token_imp: [3, 3],
};

const SPRITE_URL = 'https://image.qwenlm.ai/generated-images/561bf98a-9a5b-4cf7-b17f-138c53d1c004/_result.png';

export default function MinionComponent({ minion, isOpponent, isTargetable, isSelected, canAttack = false, onClick }: Props) {
  const isDamaged = minion.currentHealth < minion.maxHealth;
  const isBuffed = minion.currentAttack > (minion.def.attack || 0);
  const [justPlayed, setJustPlayed] = useState(true);
  const [shaking, setShaking] = useState(false);
  const prevHealthRef = useRef(minion.currentHealth);

  useEffect(() => {
    const timer = setTimeout(() => setJustPlayed(false), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minion.currentHealth < prevHealthRef.current) {
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
    }
    prevHealthRef.current = minion.currentHealth;
  }, [minion.currentHealth]);

  // Get sprite background position
  const pos = SPRITE_POSITIONS[minion.cardId] || [0, 0];
  const spriteSize = 128; // Each sprite is 128x128 in the 512x512 image
  const bgX = -(pos[1] * spriteSize);
  const bgY = -(pos[0] * spriteSize);

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`relative transition-all ${
          justPlayed ? 'animate-px-card-play' : ''
        } ${shaking ? 'animate-px-shake' : ''} ${
          minion.hasTaunt ? 'px-taunt' : ''
        } ${minion.hasDivineShield ? 'px-divine-shield' : ''} ${
          isTargetable && isOpponent
            ? 'border-4 border-red-500 cursor-crosshair hover:bg-red-900/30'
            : isSelected
            ? 'border-4 border-yellow-400 bg-yellow-900/40 scale-110'
            : canAttack
            ? 'border-4 border-green-400 hover:border-green-300 hover:scale-105 cursor-pointer'
            : 'border-4 ' + (isOpponent ? 'border-red-900 bg-red-950/50' : 'border-blue-900 bg-blue-950/50')
        }`}
        style={{
          width: '72px',
          height: '88px',
          imageRendering: 'pixelated',
        }}
      >
        {/* Sprite */}
        <div
          className="absolute inset-1"
          style={{
            backgroundImage: `url(${SPRITE_URL})`,
            backgroundPosition: `${bgX}px ${bgY}px`,
            backgroundSize: '512px 512px',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
          }}
        />

        {/* Dark overlay for opponent minions */}
        {isOpponent && (
          <div className="absolute inset-1 bg-red-900/20 pointer-events-none" />
        )}

        {/* Stats - attack bottom-left, health bottom-right */}
        <div className="absolute bottom-0 left-0">
          <span className={`bg-black/80 border border-yellow-500 px-0.5 font-bold ${isBuffed ? 'text-green-300' : 'text-yellow-300'}`} style={{ fontSize: '10px' }}>
            {minion.currentAttack}⚔
          </span>
        </div>
        <div className="absolute bottom-0 right-0">
          <span className={`bg-black/80 border px-0.5 font-bold ${isDamaged ? 'border-red-500 text-red-300' : 'border-red-400 text-white'}`} style={{ fontSize: '10px' }}>
            {minion.currentHealth}❤
          </span>
        </div>

        {/* Keyword badges - top */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {minion.hasTaunt && <span className="bg-gray-600 border border-gray-400 text-white px-0.5" style={{ fontSize: '5px' }}>🛡</span>}
          {minion.hasWindfury && <span className="bg-blue-600 border border-blue-400 text-white px-0.5" style={{ fontSize: '5px' }}>💨</span>}
          {minion.isPoisonous && <span className="bg-green-800 border border-green-400 text-white px-0.5" style={{ fontSize: '5px' }}>☠</span>}
          {minion.hasLifesteal && <span className="bg-red-800 border border-red-400 text-white px-0.5" style={{ fontSize: '5px' }}>💉</span>}
        </div>

        {/* Can attack indicator - green pixel dot */}
        {canAttack && !isOpponent && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-400 animate-px-blink" />
        )}
      </button>

      {/* Pixel tooltip */}
      <div className="px-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52">
        <p className="text-yellow-400 font-bold mb-1" style={{ fontSize: '8px' }}>{minion.def.name}</p>
        <p className="text-gray-200 mb-1" style={{ fontSize: '6px' }}>{minion.def.description}</p>
        {minion.def.flavorText && (
          <p className="text-gray-500 italic" style={{ fontSize: '5px' }}>"{minion.def.flavorText}"</p>
        )}
        <div className="flex gap-2 mt-1 border-t border-gray-700 pt-1">
          <span className="text-yellow-300" style={{ fontSize: '6px' }}>⚔ {minion.currentAttack}/{minion.def.attack}</span>
          <span className="text-red-300" style={{ fontSize: '6px' }}>❤ {minion.currentHealth}/{minion.maxHealth}</span>
        </div>
      </div>
    </div>
  );
}
