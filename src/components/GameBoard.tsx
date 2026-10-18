import { GameState, GameMode, EmotionType, BoardMinion } from '../types';
import CardComponent from './CardComponent';
import MinionComponent from './MinionComponent';
import GameLog from './GameLog';
import { useState, useRef, useEffect } from 'react';

const HERO_SPRITES = {
  player: 'https://image.qwenlm.ai/generated-images/d182c55a-9290-47d4-9d20-ff81b67b10a0/_result.png',
};

const TABLE_BACKGROUND = 'https://image.qwenlm.ai/generated-images/ff110d45-b812-4a2d-8dcc-3fa86d58bfad/_result.png';

interface Props {
  state: GameState;
  playerView: 0 | 1;
  gameMode: GameMode;
  selectedCard: string | null;
  targeting: boolean;
  animating: boolean;
  emotion: { type: EmotionType; player: number } | null;
  onPlayCard: (instanceId: string) => void;
  onAttack: (attackerId: string, targetId: string, targetIsHero: boolean) => void;
  onEndTurn: () => void;
  onHeroPower: () => void;
  onEmotion: (type: EmotionType) => void;
  onTargetSelect: (targetId: string, isHero: boolean, heroPlayerIndex?: number) => void;
  onWeaponAttack: (targetId: string, targetIsHero: boolean) => void;
  onCancelTargeting: () => void;
  onLeave: () => void;
  onDamageNumber?: (value: number, x: number, y: number, isHeal?: boolean) => void;
}

export default function GameBoard({
  state, playerView, gameMode, selectedCard, targeting, animating, emotion,
  onPlayCard, onAttack, onEndTurn, onHeroPower, onEmotion, onTargetSelect,
  onWeaponAttack, onCancelTargeting, onLeave, onDamageNumber
}: Props) {
  const [attackerId, setAttackerId] = useState<string | null>(null);
  const [showEmotions, setShowEmotions] = useState(false);
  const [heroHit, setHeroHit] = useState<number | null>(null);
  const [actionDisplay, setActionDisplay] = useState<string | null>(null);
  const prevHealthRef = useRef<[number, number]>([state.players[0].heroHealth, state.players[1].heroHealth]);
  const prevStateRef = useRef(state);

  const myPlayer = state.players[playerView];
  const opponentPlayer = state.players[playerView === 0 ? 1 : 0];
  const opponentIdx = playerView === 0 ? 1 : 0;
  const isMyTurn = state.currentPlayerIndex === playerView;

  // Log is now handled by GameLog component

  // Detect hero damage for animation
  useEffect(() => {
    for (let i = 0; i < 2; i++) {
      const diff = state.players[i].heroHealth - prevHealthRef.current[i];
      if (diff < 0 && onDamageNumber) {
        setHeroHit(i);
        const y = i === playerView ? window.innerHeight - 120 : 80;
        onDamageNumber(Math.abs(diff), window.innerWidth / 2, y, false);
        setTimeout(() => setHeroHit(null), 400);
      }
      if (diff > 0 && onDamageNumber) {
        const y = i === playerView ? window.innerHeight - 120 : 80;
        onDamageNumber(diff, window.innerWidth / 2, y, true);
      }
    }
    prevHealthRef.current = [state.players[0].heroHealth, state.players[1].heroHealth];
  }, [state.players[0].heroHealth, state.players[1].heroHealth]);

  // Detect actions (card plays, attacks) for AI and opponent visualization
  useEffect(() => {
    const prev = prevStateRef.current;
    
    // Check for new minions on board
    for (let i = 0; i < 2; i++) {
      const prevMinions = new Set(prev.players[i].board.map(m => m.instanceId));
      const newMinions = state.players[i].board.filter(m => !prevMinions.has(m.instanceId));
      
      if (newMinions.length > 0 && i !== playerView) {
        const minion = newMinions[0];
        setActionDisplay(`${state.players[i].name} разыгрывает ${minion.def.name}!`);
        setTimeout(() => setActionDisplay(null), 1500);
      }
    }

    // Check for attacks (minion health decreased)
    for (let i = 0; i < 2; i++) {
      for (const minion of state.players[i].board) {
        const prevMinion = prev.players[i].board.find(m => m.instanceId === minion.instanceId);
        if (prevMinion && minion.currentHealth < prevMinion.currentHealth) {
          const damage = prevMinion.currentHealth - minion.currentHealth;
          setActionDisplay(`${minion.def.name} получает ${damage} урона!`);
          setTimeout(() => setActionDisplay(null), 1200);
        }
      }
    }

    // Check for hand size decrease (card played)
    for (let i = 0; i < 2; i++) {
      if (state.players[i].hand.length < prev.players[i].hand.length && i !== playerView) {
        const manaDiff = prev.players[i].currentMana - state.players[i].currentMana;
        if (manaDiff > 0) {
          setActionDisplay(`${state.players[i].name} тратит ${manaDiff} маны`);
          setTimeout(() => setActionDisplay(null), 1000);
        }
      }
    }

    prevStateRef.current = state;
  }, [state]);

  const handleMinionClick = (minion: BoardMinion, ownerIdx: number) => {
    if (targeting && selectedCard) {
      const card = state.players[playerView].hand.find(c => c.instanceId === selectedCard);
      if (ownerIdx === opponentIdx || card?.def.spellTarget === 'friendly') {
        onTargetSelect(minion.instanceId, false);
      }
      return;
    }
    if (attackerId) {
      if (ownerIdx === opponentIdx) {
        onAttack(attackerId, minion.instanceId, false);
        setAttackerId(null);
      }
      return;
    }
    if (ownerIdx === playerView && isMyTurn && minion.canAttack && !minion.hasAttacked) {
      setAttackerId(minion.instanceId);
    }
  };

  const handleHeroClick = (playerIdx: number) => {
    if (targeting && selectedCard) {
      onTargetSelect(`hero_${playerIdx}`, true, playerIdx);
      return;
    }
    if (attackerId && playerIdx === opponentIdx) {
      onAttack(attackerId, `hero_${opponentIdx}`, true);
      setAttackerId(null);
    }
  };

  const emotions: EmotionType[] = ['greetings', 'thanks', 'well_played', 'oops', 'threat', 'laughter', 'wow', 'sadness'];
  const emotionEmojis: Record<EmotionType, string> = {
    greetings: '👋', thanks: '🙏', well_played: '👏', oops: '😅',
    threat: '😈', laughter: '😂', wow: '😮', sadness: '😢',
  };

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden px-scanlines"
      style={{
        backgroundImage: `url(${TABLE_BACKGROUND})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={() => {
        // Cancel selection when clicking on background
        if (targeting || attackerId) {
          onCancelTargeting();
          setAttackerId(null);
        }
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Turn indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-2 z-20 ${isMyTurn ? 'bg-green-500' : 'bg-red-500'}`} />

      {/* Turn label */}
      <div className={`absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1 z-20 border-2 ${
        isMyTurn ? 'bg-green-900 border-green-400' : 'bg-red-900 border-red-400'
      }`}>
        <span className={`${isMyTurn ? 'text-green-300' : 'text-red-300'}`} style={{ fontSize: '7px' }}>
          {isMyTurn ? '⚡ ВАШ ХОД' : '⏳ ХОД ПРОТИВНИКА'}
        </span>
      </div>

      {/* Targeting overlay */}
      {targeting && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-red-900 border-2 border-red-400 px-4 py-2">
          <span className="text-red-200" style={{ fontSize: '8px' }}>🎯 ВЫБЕРИТЕ ЦЕЛЬ (ESC — ОТМЕНА)</span>
        </div>
      )}

      {/* Attacker selected */}
      {attackerId && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-yellow-900 border-2 border-yellow-400 px-4 py-2">
          <span className="text-yellow-200" style={{ fontSize: '8px' }}>⚔ ВЫБЕРИТЕ ЦЕЛЬ АТАКИ</span>
        </div>
      )}

      {/* Action display - shows what opponent/AI is doing */}
      {actionDisplay && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-black/90 border-4 border-purple-500 px-6 py-3 animate-px-slide-in">
          <span className="text-purple-200" style={{ fontSize: '10px' }}>⚡ {actionDisplay}</span>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Opponent area */}
        <div className="flex-shrink-0 p-3">
          <div className="flex items-center justify-between">
            {/* Opponent hero */}
            <HeroPortrait
              player={opponentPlayer}
              isOpponent={true}
              isTargetable={targeting || !!attackerId}
              onClick={() => handleHeroClick(opponentIdx)}
              emotion={emotion?.player === opponentIdx ? emotion?.type : null}
              isHit={heroHit === opponentIdx}
            />

            <div className="flex items-center gap-3">
              {/* Opponent weapon */}
              {opponentPlayer.weapon && (
                <div className="relative group">
                  <div className="bg-gray-900 border-2 border-amber-600 px-2 py-1">
                    <div className="text-amber-400" style={{ fontSize: '7px' }}>⚔ {opponentPlayer.weapon.name}</div>
                    <div className="text-white" style={{ fontSize: '7px' }}>{opponentPlayer.weapon.attack}/{opponentPlayer.weapon.durability}</div>
                  </div>
                  <div className="px-tooltip absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48">
                    <p className="text-amber-400 font-bold" style={{ fontSize: '7px' }}>{opponentPlayer.weapon.name}</p>
                    <p className="text-gray-300" style={{ fontSize: '6px' }}>Оружие противника</p>
                  </div>
                </div>
              )}

              {/* Opponent mana */}
              <ManaDisplay current={opponentPlayer.currentMana} max={opponentPlayer.maxMana} />

              {/* Opponent deck */}
              <DeckDisplay count={opponentPlayer.deck.length} handCount={opponentPlayer.hand.length} isOpponent />
            </div>
          </div>

          {/* Opponent hand (face down) - only show count, not cards */}
          <div className="flex justify-center items-center gap-2 mt-2">
            <div className="text-gray-400" style={{ fontSize: '8px' }}>
              Карт в руке: {opponentPlayer.hand.length}
            </div>
          </div>
        </div>

        {/* Battlefield */}
        <div className="flex-1 flex flex-col justify-center gap-2 px-4">
          {/* Opponent board */}
          <div className="flex justify-center gap-2 min-h-[100px] items-center px-bg-felt border-4 border-red-900/50 p-3">
            {opponentPlayer.board.length === 0 ? (
              <span className="text-red-800/60" style={{ fontSize: '8px' }}>— ПОЛЕ ПРОТИВНИКА —</span>
            ) : (
              opponentPlayer.board.map(minion => (
                <MinionComponent
                  key={minion.instanceId}
                  minion={minion}
                  isOpponent={true}
                  isTargetable={targeting || !!attackerId}
                  isSelected={false}
                  onClick={() => handleMinionClick(minion, opponentIdx)}
                />
              ))
            )}
          </div>

          {/* Divider - pixel line */}
          <div className="flex items-center justify-center gap-2 py-1">
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
            <span className="text-amber-500" style={{ fontSize: '12px' }}>⚔</span>
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
          </div>

          {/* My board */}
          <div className="flex justify-center gap-2 min-h-[100px] items-center px-bg-felt border-4 border-blue-900/50 p-3">
            {myPlayer.board.length === 0 ? (
              <span className="text-blue-800/60" style={{ fontSize: '8px' }}>— ВАШЕ ПОЛЕ —</span>
            ) : (
              myPlayer.board.map(minion => (
                <MinionComponent
                  key={minion.instanceId}
                  minion={minion}
                  isOpponent={false}
                  isTargetable={targeting}
                  isSelected={attackerId === minion.instanceId}
                  canAttack={isMyTurn && minion.canAttack && !minion.hasAttacked && minion.currentAttack > 0}
                  onClick={() => handleMinionClick(minion, playerView)}
                />
              ))
            )}
          </div>
        </div>

        {/* My area */}
        <div className="flex-shrink-0 p-3">
          {/* My hand */}
          <div className="flex justify-center gap-1 mb-3 flex-wrap">
            {myPlayer.hand.map(card => (
              <CardComponent
                key={card.instanceId}
                card={card}
                canPlay={isMyTurn && card.def.cost <= myPlayer.currentMana && !animating}
                isSelected={selectedCard === card.instanceId}
                onClick={() => {
                  if (selectedCard === card.instanceId) onCancelTargeting();
                  else onPlayCard(card.instanceId);
                }}
                small
              />
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between">
            <HeroPortrait
              player={myPlayer}
              isOpponent={false}
              isTargetable={targeting}
              onClick={() => handleHeroClick(playerView)}
              emotion={emotion?.player === playerView ? emotion?.type : null}
              isHit={heroHit === playerView}
            />

            <div className="flex items-center gap-3">
              {/* Weapon */}
              {myPlayer.weapon && (
                <div className="relative group">
                  <button
                    onClick={() => isMyTurn && setAttackerId('weapon')}
                    className={`bg-gray-900 border-2 px-2 py-1 ${
                      attackerId === 'weapon' ? 'border-red-400 scale-110' : 'border-amber-600 hover:border-amber-400'
                    }`}
                  >
                    <div className="text-amber-400" style={{ fontSize: '7px' }}>⚔ {myPlayer.weapon.name}</div>
                    <div className="text-white" style={{ fontSize: '7px' }}>{myPlayer.weapon.attack}/{myPlayer.weapon.durability}</div>
                  </button>
                  <div className="px-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48">
                    <p className="text-amber-400 font-bold" style={{ fontSize: '7px' }}>{myPlayer.weapon.name}</p>
                    <p className="text-gray-300" style={{ fontSize: '6px' }}>Ваш герой атакует этим оружием</p>
                  </div>
                </div>
              )}

              {/* Mana */}
              <ManaDisplay current={myPlayer.currentMana} max={myPlayer.maxMana} />

              {/* Deck */}
              <DeckDisplay count={myPlayer.deck.length} handCount={myPlayer.hand.length} />

              {/* Controls */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setShowEmotions(false); onEndTurn(); }}
                  disabled={!isMyTurn}
                  className={`px-btn py-3 px-4 ${
                    isMyTurn
                      ? 'bg-red-800 border-red-400 text-red-100 hover:bg-red-700'
                      : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
                  }`}
                  style={{ fontSize: '8px' }}
                >
                  {isMyTurn ? '⏭ КОНЕЦ ХОДА' : '⏳ ЖДИТЕ'}
                </button>
                <div className="flex gap-1">
                  {/* Hero power */}
                  <div className="relative group">
                    <button
                      onClick={onHeroPower}
                      disabled={!isMyTurn || myPlayer.heroPowerUsed || myPlayer.currentMana < 2}
                      className={`px-btn px-2 py-1 ${
                        isMyTurn && !myPlayer.heroPowerUsed && myPlayer.currentMana >= 2
                          ? 'bg-blue-800 border-blue-400 text-blue-200 hover:bg-blue-700'
                          : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
                      }`}
                      style={{ fontSize: '7px' }}
                    >
                      ✨ 2💎
                    </button>
                    <div className="px-tooltip absolute bottom-full right-0 mb-2 w-48">
                      <p className="text-blue-400 font-bold" style={{ fontSize: '7px' }}>СПОСОБНОСТЬ ГЕРОЯ</p>
                      <p className="text-gray-300" style={{ fontSize: '6px' }}>1 урон врагу + 2 HP вам</p>
                      <p className="text-gray-500" style={{ fontSize: '5px' }}>2 маны • 1 раз за ход</p>
                    </div>
                  </div>
                  {/* Emotions */}
                  <button
                    onClick={() => setShowEmotions(!showEmotions)}
                    className="px-btn px-2 py-1 bg-purple-800 border-purple-400 text-purple-200 hover:bg-purple-700"
                    style={{ fontSize: '7px' }}
                  >💬</button>
                  {/* Leave */}
                  <button
                    onClick={onLeave}
                    className="px-btn px-2 py-1 bg-gray-800 border-gray-500 text-gray-300 hover:bg-gray-700"
                    style={{ fontSize: '7px' }}
                  >✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emotion picker */}
      {showEmotions && (
        <div className="absolute bottom-44 left-1/2 -translate-x-1/2 bg-gray-900 border-4 border-purple-500 p-3 flex gap-2 z-40">
          {emotions.map(e => (
            <button
              key={e}
              onClick={() => { onEmotion(e); setShowEmotions(false); }}
              className="text-2xl hover:scale-125 transition-transform px-btn bg-gray-800 border-gray-600 p-1"
            >
              {emotionEmojis[e]}
            </button>
          ))}
        </div>
      )}

      {/* Game log - always visible on the right */}
      <GameLog log={state.log} />

      <KeyboardHandler onEscape={() => { onCancelTargeting(); setAttackerId(null); }} />
    </div>
  );
}

// ============= SUB-COMPONENTS =============

function getHeroEmoji(heroClass: string): string {
  const emojis: Record<string, string> = {
    warrior: '⚔️',
    mage: '🔮',
    priest: '✨',
    hunter: '🏹',
    rogue: '🗡️',
    shaman: '⚡',
    warlock: '😈',
    paladin: '🛡️',
    druid: '🌿',
  };
  return emojis[heroClass] || '👤';
}

function HeroPortrait({ player, isOpponent, isTargetable, onClick, emotion, isHit }: {
  player: any; isOpponent: boolean; isTargetable: boolean; onClick: () => void; emotion: EmotionType | null; isHit?: boolean;
}) {
  const healthPercent = Math.max(0, (player.heroHealth / player.maxHeroHealth) * 100);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`relative border-4 flex flex-col items-center justify-center overflow-hidden ${
          isHit ? 'animate-px-shake' : ''
        } ${
          isTargetable
            ? 'border-red-400 bg-red-900/50 cursor-crosshair animate-px-blink'
            : isOpponent ? 'border-red-700 bg-gray-900' : 'border-blue-700 bg-gray-900'
        }`}
        style={{ width: '72px', height: '72px', imageRendering: 'pixelated' }}
      >
        {/* Hero sprite */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${HERO_SPRITES.player})`,
            backgroundPosition: isOpponent ? 'right center' : 'left center',
            backgroundSize: '200% 100%',
            imageRendering: 'pixelated',
          }}
        />
        {/* Overlay for opponent */}
        {isOpponent && <div className="absolute inset-0 bg-red-900/30" />}
        
        {/* HP and Armor display */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-0.5 text-center flex justify-center gap-1">
          <span className={`font-bold ${healthPercent > 60 ? 'text-green-400' : healthPercent > 30 ? 'text-yellow-400' : 'text-red-400'}`} style={{ fontSize: '10px' }}>
            {player.heroHealth}❤
          </span>
          {player.armor > 0 && (
            <span className="font-bold text-gray-300" style={{ fontSize: '10px' }}>
              {player.armor}🛡
            </span>
          )}
        </div>
      </button>

      {/* Pixel HP bar */}
      <div className="w-[72px] h-2 bg-gray-800 border border-gray-600 mt-1 flex">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 ${
              i < Math.ceil(healthPercent / 10)
                ? healthPercent > 60 ? 'bg-green-500' : healthPercent > 30 ? 'bg-yellow-500' : 'bg-red-500'
                : 'bg-gray-700'
            }`}
            style={{ borderRight: i < 9 ? '1px solid rgba(0,0,0,0.3)' : 'none' }}
          />
        ))}
      </div>

      {/* Name and Class */}
      <div className="text-center mt-0.5">
        <span className="text-gray-400" style={{ fontSize: '5px' }}>
          {getHeroEmoji(player.heroClass)} {player.name}
        </span>
      </div>

      {/* Emotion */}
      {emotion && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-800 px-2 py-1 animate-px-bounce">
          <span style={{ fontSize: '12px' }}>
            {emotion === 'greetings' ? '👋' : emotion === 'thanks' ? '🙏' : emotion === 'threat' ? '😈' : '😮'}
          </span>
        </div>
      )}
    </div>
  );
}

function ManaDisplay({ current, max }: { current: number; max: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-0.5 flex-wrap max-w-[64px] justify-center">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 ${i < current ? 'bg-blue-500 border border-blue-300' : 'bg-gray-700 border border-gray-600'}`}
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
        ))}
      </div>
      <span className="text-blue-300" style={{ fontSize: '7px' }}>{current}/{max}</span>
    </div>
  );
}

function DeckDisplay({ count, handCount, isOpponent }: { count: number; handCount?: number; isOpponent?: boolean }) {
  return (
    <div className="relative group">
      <div className="relative w-12 h-16 bg-blue-900 border-2 border-blue-500 flex items-center justify-center">
        {/* Stack effect */}
        <div className="absolute inset-0 bg-blue-800 border border-blue-600 translate-x-0.5 translate-y-0.5 -z-10" />
        <div className="absolute inset-0 bg-blue-700 border border-blue-500 translate-x-1 translate-y-1 -z-20" />
        <span className="text-blue-200 font-bold relative z-10" style={{ fontSize: '10px' }}>{count}</span>
      </div>
      <div className="px-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40">
        <p className="text-blue-400 font-bold" style={{ fontSize: '7px' }}>КОЛОДА: {count}</p>
        {handCount !== undefined && (
          <p className="text-gray-400" style={{ fontSize: '6px' }}>Рука: {handCount}</p>
        )}
      </div>
    </div>
  );
}

function KeyboardHandler({ onEscape }: { onEscape: () => void }) {
  if (typeof window !== 'undefined') {
    window.onkeydown = (e) => { if (e.key === 'Escape') onEscape(); };
  }
  return null;
}
