import { CardInstance } from '../types';

interface Props {
  card: CardInstance;
  canPlay?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  small?: boolean;
  showFull?: boolean;
}

export default function CardComponent({ card, canPlay = false, isSelected = false, onClick, small = false, showFull = false }: Props) {
  const def = card.def;

  const rarityBorder: Record<string, string> = {
    common: 'px-card-common',
    rare: 'px-card-rare',
    epic: 'px-card-epic',
    legendary: 'px-card-legendary',
  };

  const typeBg: Record<string, string> = {
    minion: 'bg-purple-900',
    spell: 'bg-blue-900',
    weapon: 'bg-amber-900',
  };

  const typeIcons: Record<string, string> = {
    minion: '👹',
    spell: '✨',
    weapon: '⚔️',
  };

  const rarityGemColor: Record<string, string> = {
    common: 'bg-gray-400',
    rare: 'bg-blue-400',
    epic: 'bg-purple-400',
    legendary: 'bg-yellow-400',
  };

  if (small) {
    return (
      <div className="relative group">
        <button
          onClick={onClick}
          disabled={!canPlay}
          className={`relative px-card ${rarityBorder[def.rarity]} ${typeBg[def.type]} transition-all ${
            canPlay
              ? 'hover:-translate-y-3 hover:scale-105 cursor-pointer hover:z-20 animate-px-card-play'
              : 'opacity-50 cursor-not-allowed grayscale'
          } ${isSelected ? 'ring-4 ring-red-500 -translate-y-4 scale-110' : ''}`}
          style={{ width: '64px', height: '88px' }}
        >
          {/* Mana crystal - top left */}
          <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-700 border-2 border-blue-300 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}>
            <span className="text-white font-bold" style={{ fontSize: '8px' }}>{def.cost}</span>
          </div>

          {/* Type icon - center */}
          <div className="flex items-center justify-center h-10 mt-2">
            <span style={{ fontSize: '20px', imageRendering: 'pixelated' }}>{typeIcons[def.type]}</span>
          </div>

          {/* Name */}
          <div className="px-1 text-center bg-black/40 py-0.5 mx-1">
            <span className="text-white leading-tight block" style={{ fontSize: '5px' }}>
              {def.name}
            </span>
          </div>

          {/* Stats */}
          <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-between">
            {def.type === 'minion' && (
              <>
                <span className="bg-yellow-700 border border-yellow-400 px-1 text-yellow-200 font-bold" style={{ fontSize: '8px' }}>{def.attack}⚔</span>
                <span className="bg-red-700 border border-red-400 px-1 text-red-200 font-bold" style={{ fontSize: '8px' }}>{def.health}❤</span>
              </>
            )}
            {def.type === 'weapon' && (
              <>
                <span className="bg-yellow-700 border border-yellow-400 px-1 text-yellow-200 font-bold" style={{ fontSize: '8px' }}>{def.weaponAttack}⚔</span>
                <span className="bg-green-700 border border-green-400 px-1 text-green-200 font-bold" style={{ fontSize: '8px' }}>{def.weaponDurability}🛡</span>
              </>
            )}
            {def.type === 'spell' && (
              <div className="w-full text-center">
                <span className="bg-purple-700 border border-purple-400 px-1 text-purple-200" style={{ fontSize: '5px' }}>ЗАКЛ.</span>
              </div>
            )}
          </div>

          {/* Rarity gem - bottom center */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 ${rarityGemColor[def.rarity]}`} style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
        </button>

        {/* Pixel tooltip */}
        <div className="px-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52">
          <p className="text-yellow-400 font-bold mb-1" style={{ fontSize: '8px' }}>{def.name}</p>
          <p className="text-gray-200 mb-1" style={{ fontSize: '6px' }}>{def.description}</p>
          {def.flavorText && (
            <p className="text-gray-500 italic" style={{ fontSize: '5px' }}>"{def.flavorText}"</p>
          )}
          <div className="flex gap-2 mt-1 border-t border-gray-700 pt-1">
            <span className="text-blue-300" style={{ fontSize: '5px' }}>💎 {def.cost}</span>
            <span className="text-gray-400" style={{ fontSize: '5px' }}>| {getRarityName(def.rarity)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Full size card (for collection)
  return (
    <div
      className={`relative px-card ${rarityBorder[def.rarity]} ${typeBg[def.type]} overflow-hidden`}
      style={{ width: '150px', minHeight: '220px' }}
    >
      {/* Mana crystal */}
      <div className="absolute top-2 left-2 w-8 h-8 bg-blue-700 border-2 border-blue-300 flex items-center justify-center z-10" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}>
        <span className="text-white font-bold" style={{ fontSize: '12px' }}>{def.cost}</span>
      </div>

      {/* Art area */}
      <div className="h-24 flex items-center justify-center bg-black/30 mt-3 mx-2 border-2 border-black/50">
        <span style={{ fontSize: '40px', imageRendering: 'pixelated' }}>{typeIcons[def.type]}</span>
      </div>

      {/* Name plate */}
      <div className="bg-black/60 mx-2 mt-1 px-2 py-1 text-center border border-gray-700">
        <span className="text-white font-bold" style={{ fontSize: '8px' }}>{def.name}</span>
      </div>

      {/* Description */}
      <div className="px-2 py-2 text-center bg-black/20 mx-2 mt-1 border border-gray-800">
        <p className="text-gray-200 leading-tight" style={{ fontSize: '6px' }}>
          {def.description || (def.type === 'weapon' ? `${def.weaponAttack}/${def.weaponDurability}` : '')}
        </p>
        {def.flavorText && showFull && (
          <p className="text-gray-500 italic mt-1" style={{ fontSize: '5px' }}>"{def.flavorText}"</p>
        )}
      </div>

      {/* Keywords */}
      {def.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center px-2 pb-1 mt-1">
          {def.keywords.map(kw => (
            <span key={kw} className="bg-amber-800 border border-amber-500 text-amber-200 px-1" style={{ fontSize: '5px' }}>
              {getKeywordLabel(kw)}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="absolute bottom-1 left-1 right-1 flex justify-between">
        {def.type === 'minion' && (
          <>
            <span className="bg-yellow-700 border-2 border-yellow-400 px-1 text-yellow-200 font-bold" style={{ fontSize: '12px' }}>{def.attack}⚔</span>
            <span className="bg-red-700 border-2 border-red-400 px-1 text-red-200 font-bold" style={{ fontSize: '12px' }}>{def.health}❤</span>
          </>
        )}
        {def.type === 'weapon' && (
          <>
            <span className="bg-yellow-700 border-2 border-yellow-400 px-1 text-yellow-200 font-bold" style={{ fontSize: '12px' }}>{def.weaponAttack}⚔</span>
            <span className="bg-green-700 border-2 border-green-400 px-1 text-green-200 font-bold" style={{ fontSize: '12px' }}>{def.weaponDurability}🛡</span>
          </>
        )}
      </div>

      {/* Rarity gem */}
      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 ${rarityGemColor[def.rarity]}`} style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
    </div>
  );
}

function getKeywordLabel(kw: string): string {
  const labels: Record<string, string> = {
    taunt: 'ПРОВОК',
    charge: 'РЫВОК',
    divine_shield: 'ЩИТ',
    poisonous: 'ЯД',
    battlecry: 'БОЕВОЙ КЛИЧ',
    deathrattle: 'СМЕРТ.ХРИП',
    windfury: 'ВИХРЬ',
    lifesteal: 'КРАЖА ЖИЗНИ',
  };
  return labels[kw] || kw;
}

function getRarityName(r: string): string {
  switch (r) {
    case 'common': return 'Обычная';
    case 'rare': return 'Редкая';
    case 'epic': return 'Эпическая';
    case 'legendary': return 'Легендарная';
    default: return r;
  }
}
