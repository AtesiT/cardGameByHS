import { GameState, GameMode, EmotionType, BoardMinion, CardInstance } from '../types';
import CardComponent from './CardComponent';
import MinionComponent from './MinionComponent';
import { useState, useRef, useEffect } from 'react';

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
  const [showLog, setShowLog] = useState(false);
  const [heroHit, setHeroHit] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const prevHealthRef = useRef<[number, number]>([state.players[0].heroHealth, state.players[1].heroHealth]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state.log]);

  // Detect hero damage for animation
  useEffect(() => {
    for (let i = 0; i < 2; i++) {
      const diff = state.players[i].heroHealth - prevHealthRef.current[i];
      if (diff < 0 && onDamageNumber) {
        setHeroHit(i);
        const x = window.innerWidth / 2 + (i === playerView ? 0 : 0);
        const y = i === playerView ? window.innerHeight - 120 : 80;
        onDamageNumber(Math.abs(diff), x, y, false);
        setTimeout(() => setHeroHit(null), 400);
      }
      if (diff > 0 && onDamageNumber) {
        const x = window.innerWidth / 2;
        const y = i === playerView ? window.innerHeight - 120 : 80;
        onDamageNumber(diff, x, y, true);
      }
    }
    prevHealthRef.current = [state.players[0].heroHealth, state.players[1].heroHealth];
  }, [state.players[0].heroHealth, state.players[1].heroHealth]);

  const myPlayer = state.players[playerView];
  const opponentPlayer = state.players[playerView === 0 ? 1 : 0];
  const opponentIdx = playerView === 0 ? 1 : 0;
  const isMyTurn = state.currentPlayerIndex === playerView;

  const handleMinionClick = (minion: BoardMinion, ownerIdx: number) => {
    if (targeting && selectedCard) {
      // Selecting target for spell
      if (ownerIdx === opponentIdx || (state.players[playerView].hand.find(c => c.instanceId === selectedCard)?.def.spellTarget === 'friendly')) {
        onTargetSelect(minion.instanceId, false);
      }
      return;
    }

    if (attackerId) {
      // Attacking this minion
      if (ownerIdx === opponentIdx) {
        onAttack(attackerId, minion.instanceId, false);
        setAttackerId(null);
      }
      return;
    }

    // Select my minion to attack with
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-950 via-green-900 to-emerald-950 relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px)'
      }} />

      {/* Turn indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isMyTurn ? 'bg-gradient-to-r from-green-400 via-green-300 to-green-400 animate-glow-pulse' : 'bg-red-400'} transition-colors duration-300`} />
      
      {/* Turn label */}
      <div className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full ${
        isMyTurn ? 'bg-green-900/80 border border-green-400' : 'bg-red-900/80 border border-red-400'
      }`}>
        <span className={`${isMyTurn ? 'text-green-300' : 'text-red-300'}`} style={{ fontSize: '7px' }}>
          {isMyTurn ? '⚡ ВАШ ХОД' : '⏳ ХОД ПРОТИВНИКА'}
        </span>
      </div>

      {/* Targeting overlay */}
      {targeting && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/90 border-2 border-red-400 px-4 py-2 rounded pointer-events-auto shadow-lg shadow-red-500/30">
            <span className="text-red-200" style={{ fontSize: '8px' }}>🎯 Выберите цель (ESC — отмена)</span>
          </div>
        </div>
      )}

      {/* Attacker selected overlay */}
      {attackerId && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-amber-900/80 border-2 border-amber-400 px-3 py-1">
          <span className="text-amber-200" style={{ fontSize: '8px' }}>Выберите цель для атаки</span>
        </div>
      )}

      {/* Opponent area */}
      <div className="flex-shrink-0 p-2">
        {/* Opponent hero */}
        <div className="flex items-center justify-between mb-2">
          <HeroPortrait
            player={opponentPlayer}
            isOpponent={true}
            isTargetable={targeting || !!attackerId}
            onClick={() => handleHeroClick(opponentIdx)}
            emotion={emotion?.player === opponentIdx ? emotion?.type : null}
            isHit={heroHit === opponentIdx}
          />
          <div className="flex items-center gap-2">
            {/* Opponent weapon */}
            {opponentPlayer.weapon && (
              <div className="relative group">
                <div className="bg-gray-800 border-2 border-amber-600 px-2 py-1 text-center">
                  <div className="text-amber-400" style={{ fontSize: '8px' }}>⚔️ {opponentPlayer.weapon.name}</div>
                  <div className="text-white" style={{ fontSize: '7px' }}>{opponentPlayer.weapon.attack}/{opponentPlayer.weapon.durability}</div>
                </div>
                {/* Weapon tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-900 border-2 border-amber-500 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                  <p className="text-amber-400 font-bold mb-1" style={{ fontSize: '8px' }}>{opponentPlayer.weapon.name}</p>
                  <p className="text-gray-200" style={{ fontSize: '6px' }}>Оружие противника. Герой противника может атаковать этим оружием.</p>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-yellow-300">⚔ {opponentPlayer.weapon.attack}</span>
                    <span className="text-green-300">🛡 {opponentPlayer.weapon.durability}</span>
                  </div>
                </div>
              </div>
            )}
            {/* Opponent mana */}
            <div className="relative group">
              <ManaCrystal current={opponentPlayer.currentMana} max={opponentPlayer.maxMana} />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-gray-900 border-2 border-blue-500 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                <p className="text-blue-400 font-bold" style={{ fontSize: '7px' }}>Мана: {opponentPlayer.currentMana}/{opponentPlayer.maxMana}</p>
              </div>
            </div>
            {/* Opponent deck */}
            <div className="relative group">
              <div className="bg-blue-900 border-2 border-blue-400 w-10 h-14 flex items-center justify-center">
                <span className="text-blue-200" style={{ fontSize: '8px' }}>{opponentPlayer.deck.length}</span>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-gray-900 border-2 border-blue-500 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                <p className="text-blue-400 font-bold" style={{ fontSize: '7px' }}>Колода: {opponentPlayer.deck.length} карт</p>
                <p className="text-gray-400" style={{ fontSize: '6px' }}>Рука: {opponentPlayer.hand.length} карт</p>
              </div>
            </div>
          </div>
        </div>

        {/* Opponent hand (face down) */}
        <div className="flex justify-center gap-1 mb-2">
          {opponentPlayer.hand.map((_, i) => (
            <div key={i} className="w-8 h-11 bg-gradient-to-b from-blue-700 to-blue-900 border border-blue-400 rounded-sm" />
          ))}
        </div>
      </div>

      {/* Battlefield */}
      <div className="flex-1 flex flex-col justify-center gap-1 px-2 sm:px-4 relative z-10">
        {/* Opponent board */}
        <div className="flex justify-center gap-1.5 sm:gap-2 min-h-[90px] items-center bg-gradient-to-b from-red-950/30 to-black/30 rounded-xl border border-red-900/50 p-2 shadow-inner">
          {opponentPlayer.board.length === 0 ? (
            <span className="text-red-800/50" style={{ fontSize: '8px' }}>— Поле противника —</span>
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

        {/* Divider with gems */}
        <div className="flex items-center justify-center gap-2 py-1">
          <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />
          <span className="text-amber-500" style={{ fontSize: '10px' }}>⚔️</span>
          <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />
        </div>

        {/* My board */}
        <div className="flex justify-center gap-1.5 sm:gap-2 min-h-[90px] items-center bg-gradient-to-t from-blue-950/30 to-black/30 rounded-xl border border-blue-900/50 p-2 shadow-inner">
          {myPlayer.board.length === 0 ? (
            <span className="text-blue-800/50" style={{ fontSize: '8px' }}>— Ваше поле —</span>
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
      <div className="flex-shrink-0 p-2">
        {/* My hand */}
        <div className="flex justify-center gap-1 mb-2 flex-wrap">
          {myPlayer.hand.map(card => (
            <CardComponent
              key={card.instanceId}
              card={card}
              canPlay={isMyTurn && card.def.cost <= myPlayer.currentMana && !animating}
              isSelected={selectedCard === card.instanceId}
              onClick={() => {
                if (selectedCard === card.instanceId) {
                  onCancelTargeting();
                } else {
                  onPlayCard(card.instanceId);
                }
              }}
              small
            />
          ))}
        </div>

        {/* Bottom bar: hero + controls */}
        <div className="flex items-center justify-between">
          <HeroPortrait
            player={myPlayer}
            isOpponent={false}
            isTargetable={targeting}
            onClick={() => handleHeroClick(playerView)}
            emotion={emotion?.player === playerView ? emotion?.type : null}
            isHit={heroHit === playerView}
          />

          <div className="flex items-center gap-2">
            {/* Weapon */}
            {myPlayer.weapon && (
              <div className="relative group">
                <button
                  onClick={() => {
                    if (isMyTurn) {
                      setAttackerId('weapon');
                    }
                  }}
                  className={`bg-gray-800 border-2 px-2 py-1 text-center transition-all ${
                    attackerId === 'weapon' ? 'border-red-400 scale-110' : 'border-amber-600 hover:border-amber-400'
                  }`}
                >
                  <div className="text-amber-400" style={{ fontSize: '8px' }}>⚔️ {myPlayer.weapon.name}</div>
                  <div className="text-white" style={{ fontSize: '7px' }}>{myPlayer.weapon.attack}/{myPlayer.weapon.durability}</div>
                </button>
                {/* Weapon tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 border-2 border-amber-500 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                  <p className="text-amber-400 font-bold mb-1" style={{ fontSize: '8px' }}>{myPlayer.weapon.name}</p>
                  <p className="text-gray-200" style={{ fontSize: '6px' }}>Ваш герой может атаковать этим оружием. При атаке герой получает урон от защищающегося существа.</p>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-yellow-300">⚔ {myPlayer.weapon.attack}</span>
                    <span className="text-green-300">🛡 {myPlayer.weapon.durability}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mana */}
            <div className="relative group">
              <ManaCrystal current={myPlayer.currentMana} max={myPlayer.maxMana} />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-gray-900 border-2 border-blue-500 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                <p className="text-blue-400 font-bold" style={{ fontSize: '7px' }}>Мана: {myPlayer.currentMana}/{myPlayer.maxMana}</p>
              </div>
            </div>

            {/* Deck */}
            <div className="relative group">
              <div className="bg-blue-900 border-2 border-blue-400 w-10 h-14 flex items-center justify-center">
                <span className="text-blue-200" style={{ fontSize: '8px' }}>{myPlayer.deck.length}</span>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-gray-900 border-2 border-blue-500 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                <p className="text-blue-400 font-bold" style={{ fontSize: '7px' }}>Колода: {myPlayer.deck.length} карт</p>
                <p className="text-gray-400" style={{ fontSize: '6px' }}>Рука: {myPlayer.hand.length} карт</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-1 relative z-40">
              <button
                onClick={() => { setShowEmotions(false); onEndTurn(); }}
                disabled={!isMyTurn}
                className={`px-3 py-2 border-2 text-center transition-all ${
                  isMyTurn
                    ? 'bg-gradient-to-b from-red-600 to-red-800 border-red-400 hover:from-red-500 hover:to-red-700 text-white active:scale-95 cursor-pointer'
                    : 'bg-gray-700 border-gray-500 text-gray-400 cursor-not-allowed'
                }`}
                style={{ fontSize: '8px' }}
              >
                {isMyTurn ? '⏭ КОНЕЦ ХОДА' : '⏳ ХОД ПРОТИВНИКА'}
              </button>
              <div className="flex gap-1">
                <div className="relative group">
                  <button
                    onClick={onHeroPower}
                    disabled={!isMyTurn || myPlayer.heroPowerUsed || myPlayer.currentMana < 2}
                    className={`px-2 py-1 border-2 transition-all ${
                      isMyTurn && !myPlayer.heroPowerUsed && myPlayer.currentMana >= 2
                        ? 'bg-blue-800 border-blue-400 hover:bg-blue-700 text-blue-200'
                        : 'bg-gray-700 border-gray-500 text-gray-500 cursor-not-allowed'
                    }`}
                    style={{ fontSize: '7px' }}
                  >
                    ✨ 2💎
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 border-2 border-blue-500 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    <p className="text-blue-400 font-bold mb-1" style={{ fontSize: '8px' }}>Способность героя</p>
                    <p className="text-gray-200" style={{ fontSize: '6px' }}>Нанести 1 урон вражескому герою и восстановить 2 здоровья вашему герою.</p>
                    <p className="text-gray-400 mt-1" style={{ fontSize: '5px' }}>Стоимость: 2 маны • 1 раз за ход</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmotions(!showEmotions)}
                  className="px-2 py-1 border-2 bg-purple-800 border-purple-400 hover:bg-purple-700 text-purple-200 transition-all"
                  style={{ fontSize: '7px' }}
                >
                  💬
                </button>
                <button
                  onClick={() => setShowLog(!showLog)}
                  className="px-2 py-1 border-2 bg-gray-800 border-gray-500 hover:bg-gray-700 text-gray-300 transition-all"
                  style={{ fontSize: '7px' }}
                >
                  📜
                </button>
                <button
                  onClick={onLeave}
                  className="px-2 py-1 border-2 bg-gray-700 border-gray-500 hover:bg-gray-600 text-gray-300 transition-all"
                  style={{ fontSize: '7px' }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Emotion picker */}
        {showEmotions && (
          <div className="absolute bottom-40 left-1/2 -translate-x-1/2 bg-gray-900 border-2 border-purple-400 p-2 flex gap-2 z-30 rounded-lg shadow-lg">
            {emotions.map(e => (
              <button
                key={e}
                onClick={() => { onEmotion(e); setShowEmotions(false); }}
                className="text-xl hover:scale-125 transition-transform"
                title={e}
              >
                {emotionEmojis[e]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Game Log */}
      {showLog && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 max-h-64 bg-gray-900/95 border-2 border-amber-600 rounded-lg z-30 overflow-hidden">
          <div className="flex justify-between items-center px-3 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-amber-400" style={{ fontSize: '8px' }}>📜 Журнал боя</span>
            <button onClick={() => setShowLog(false)} className="text-gray-400 hover:text-white" style={{ fontSize: '10px' }}>✕</button>
          </div>
          <div ref={logRef} className="p-2 overflow-y-auto max-h-52">
            {state.log.slice(-30).map((entry, i) => (
              <p key={i} className={`mb-0.5 ${entry.startsWith('---') ? 'text-amber-400 font-bold' : 'text-gray-300'}`} style={{ fontSize: '6px' }}>
                {entry}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard handler for ESC */}
      <KeyboardHandler onEscape={() => { onCancelTargeting(); setAttackerId(null); setShowLog(false); }} />
    </div>
  );
}

// ============= SUB-COMPONENTS =============

function HeroPortrait({ player, isOpponent, isTargetable, onClick, emotion, isHit }: {
  player: any; isOpponent: boolean; isTargetable: boolean; onClick: () => void; emotion: EmotionType | null; isHit?: boolean;
}) {
  const healthPercent = (player.heroHealth / player.maxHeroHealth) * 100;
  const healthColor = healthPercent > 60 ? 'text-green-400' : healthPercent > 30 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`w-16 h-16 border-3 rounded-lg flex flex-col items-center justify-center transition-all ${
          isHit ? 'animate-hero-hit' : ''
        } ${
          isTargetable
            ? 'border-red-400 bg-red-900/50 hover:bg-red-800/50 cursor-crosshair animate-pulse'
            : 'border-amber-600 bg-gray-800'
        }`}
      >
        <span className="text-2xl">{isOpponent ? '🧙' : '🦸'}</span>
        <span className={`${healthColor} font-bold`} style={{ fontSize: '10px' }}>
          {player.heroHealth}❤️
        </span>
      </button>
      {/* Health bar */}
      <div className="w-16 h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden border border-gray-600">
        <div
          className={`h-full transition-all duration-300 ${
            healthPercent > 60 ? 'bg-green-500' : healthPercent > 30 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.max(0, healthPercent)}%` }}
        />
      </div>
      {emotion && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce text-lg">
          {emotion === 'greetings' ? '👋' : emotion === 'thanks' ? '🙏' : emotion === 'threat' ? '😈' : '😮'}
        </div>
      )}
      <div className="text-center mt-0.5">
        <span className="text-gray-300" style={{ fontSize: '6px' }}>{player.name}</span>
      </div>
    </div>
  );
}

function ManaCrystal({ current, max }: { current: number; max: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-0.5 flex-wrap max-w-[60px] justify-center">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border ${
              i < current ? 'bg-blue-400 border-blue-300' : 'bg-gray-700 border-gray-500'
            }`}
          />
        ))}
      </div>
      <span className="text-blue-300 mt-0.5" style={{ fontSize: '8px' }}>{current}/{max}</span>
    </div>
  );
}

function KeyboardHandler({ onEscape }: { onEscape: () => void }) {
  if (typeof window !== 'undefined') {
    window.onkeydown = (e) => {
      if (e.key === 'Escape') onEscape();
    };
  }
  return null;
}
