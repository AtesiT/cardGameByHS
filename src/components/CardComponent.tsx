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

  const rarityColors: Record<string, string> = {
    common: 'border-gray-400',
    rare: 'border-blue-400',
    epic: 'border-purple-400',
    legendary: 'border-amber-400',
  };

  const typeIcons: Record<string, string> = {
    minion: '👹',
    spell: '✨',
    weapon: '⚔️',
  };

  const rarityGem: Record<string, string> = {
    common: 'bg-gray-400',
    rare: 'bg-blue-400',
    epic: 'bg-purple-400',
    legendary: 'bg-amber-400',
  };

  if (small) {
    return (
      <div className="relative group">
        <button
          onClick={onClick}
          disabled={!canPlay}
          className={`relative border-2 rounded transition-all duration-150 flex-shrink-0 ${
            rarityColors[def.rarity]
          } ${
            canPlay
              ? 'hover:scale-110 hover:-translate-y-2 cursor-pointer hover:z-10 animate-card-draw'
              : 'opacity-60 cursor-not-allowed'
          } ${
            isSelected ? 'ring-2 ring-red-400 scale-105 -translate-y-3' : ''
          }`}
          style={{
            width: '60px',
            height: '80px',
            background: `linear-gradient(to bottom, ${getTypeColor(def.type)}, ${getTypeColorDark(def.type)})`,
          }}
        >
        {/* Mana cost */}
        <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 border border-blue-300 rounded-full flex items-center justify-center">
          <span className="text-white font-bold" style={{ fontSize: '8px' }}>{def.cost}</span>
        </div>

        {/* Type icon */}
        <div className="flex items-center justify-center h-8 mt-1">
          <span style={{ fontSize: '16px' }}>{typeIcons[def.type]}</span>
        </div>

        {/* Name */}
        <div className="px-0.5 text-center">
          <span className="text-white leading-tight" style={{ fontSize: '5px' }}>
            {def.name}
          </span>
        </div>

        {/* Stats */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-0.5 pb-0.5">
          {def.type === 'minion' && (
            <>
              <span className="text-yellow-300 font-bold" style={{ fontSize: '8px' }}>{def.attack}⚔</span>
              <span className="text-red-300 font-bold" style={{ fontSize: '8px' }}>{def.health}❤</span>
            </>
          )}
          {def.type === 'weapon' && (
            <>
              <span className="text-yellow-300 font-bold" style={{ fontSize: '8px' }}>{def.weaponAttack}⚔</span>
              <span className="text-green-300 font-bold" style={{ fontSize: '8px' }}>{def.weaponDurability}🛡</span>
            </>
          )}
          {def.type === 'spell' && (
            <div className="w-full text-center">
              <span className="text-purple-200" style={{ fontSize: '5px' }}>Закл.</span>
            </div>
          )}
        </div>

        {/* Rarity gem */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${rarityGem[def.rarity]} opacity-50`} />
        </button>
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 border-2 border-amber-500 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
          <p className="text-amber-400 font-bold mb-1" style={{ fontSize: '8px' }}>{def.name}</p>
          <p className="text-gray-200" style={{ fontSize: '6px' }}>{def.description}</p>
          {def.flavorText && (
            <p className="text-gray-500 italic mt-1" style={{ fontSize: '5px' }}>"{def.flavorText}"</p>
          )}
        </div>
      </div>
    );
  }

  // Full size card (for collection)
  return (
    <div
      className={`relative border-3 rounded-lg overflow-hidden ${rarityColors[def.rarity]}`}
      style={{
        width: '140px',
        minHeight: '200px',
        background: `linear-gradient(to bottom, ${getTypeColor(def.type)}, ${getTypeColorDark(def.type)})`,
      }}
    >
      {/* Mana cost */}
      <div className="absolute top-1 left-1 w-7 h-7 bg-blue-600 border-2 border-blue-300 rounded-full flex items-center justify-center z-10">
        <span className="text-white font-bold" style={{ fontSize: '12px' }}>{def.cost}</span>
      </div>

      {/* Art area */}
      <div className="h-20 flex items-center justify-center bg-black/20 mt-2 mx-2 rounded">
        <span style={{ fontSize: '32px' }}>{typeIcons[def.type]}</span>
      </div>

      {/* Name */}
      <div className="bg-black/40 mx-2 mt-1 px-2 py-0.5 text-center rounded">
        <span className="text-white font-bold" style={{ fontSize: '8px' }}>{def.name}</span>
      </div>

      {/* Description */}
      <div className="px-2 py-1 text-center">
        <p className="text-gray-200 leading-tight" style={{ fontSize: '6px' }}>
          {def.description || (def.type === 'weapon' ? `${def.weaponAttack}/${def.weaponDurability}` : '')}
        </p>
        {def.flavorText && showFull && (
          <p className="text-gray-400 italic mt-1" style={{ fontSize: '5px' }}>"{def.flavorText}"</p>
        )}
      </div>

      {/* Keywords */}
      {def.keywords.length > 0 && (
        <div className="flex flex-wrap gap-0.5 justify-center px-1 pb-1">
          {def.keywords.map(kw => (
            <span key={kw} className="bg-amber-700/80 text-amber-200 px-1 rounded" style={{ fontSize: '5px' }}>
              {getKeywordLabel(kw)}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="absolute bottom-1 left-1 right-1 flex justify-between">
        {def.type === 'minion' && (
          <>
            <span className="text-yellow-300 font-bold bg-black/50 px-1 rounded" style={{ fontSize: '12px' }}>{def.attack}⚔</span>
            <span className="text-red-300 font-bold bg-black/50 px-1 rounded" style={{ fontSize: '12px' }}>{def.health}❤</span>
          </>
        )}
        {def.type === 'weapon' && (
          <>
            <span className="text-yellow-300 font-bold bg-black/50 px-1 rounded" style={{ fontSize: '12px' }}>{def.weaponAttack}⚔</span>
            <span className="text-green-300 font-bold bg-black/50 px-1 rounded" style={{ fontSize: '12px' }}>{def.weaponDurability}🛡</span>
          </>
        )}
      </div>

      {/* Rarity gem */}
      <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${rarityGem[def.rarity]}`} />
    </div>
  );
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'minion': return '#7c3aed';
    case 'spell': return '#1e40af';
    case 'weapon': return '#92400e';
    default: return '#374151';
  }
}

function getTypeColorDark(type: string): string {
  switch (type) {
    case 'minion': return '#4c1d95';
    case 'spell': return '#1e3a5f';
    case 'weapon': return '#451a03';
    default: return '#1f2937';
  }
}

function getKeywordLabel(kw: string): string {
  const labels: Record<string, string> = {
    taunt: 'Провок.',
    charge: 'Рывок',
    divine_shield: 'Щит',
    poisonous: 'Яд',
    battlecry: 'БК',
    deathrattle: 'СХ',
    windfury: 'Ветер',
    lifesteal: 'Кража',
  };
  return labels[kw] || kw;
}
