// ============= CARD TYPES =============
export type CardType = 'minion' | 'spell' | 'weapon';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Keyword = 'taunt' | 'charge' | 'divine_shield' | 'poisonous' | 'battlecry' | 'deathrattle' | 'windfury' | 'lifesteal';
export type SpellTarget = 'any' | 'minion' | 'enemy' | 'friendly' | 'none' | 'all_enemies' | 'all_minions' | 'self_hero';

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  rarity: Rarity;
  description: string;
  flavorText: string;
  keywords: Keyword[];
  attack?: number;
  health?: number;
  spellTarget?: SpellTarget;
  spellDamage?: number;
  spellHeal?: number;
  spellDraw?: number;
  spellAoEDamage?: number;
  spellAoEHero?: boolean;
  spellDestroy?: boolean;
  spellFreeze?: boolean;
  spellSelfDamage?: number;
  spellBuffAllFriendly?: boolean;
  spellBuffHealth?: number;
  spellBuffAttack?: number;
  spellRequiresUntapped?: boolean;
  weaponAttack?: number;
  weaponDurability?: number;
  battlecryDesc?: string;
  deathrattleDesc?: string;
  staticDesc?: string;
  buffAttack?: number;
  buffHealth?: number;
  buffAllFriendly?: boolean;
  class?: string;
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
  def: CardDef;
}

export interface BoardMinion {
  instanceId: string;
  cardId: string;
  def: CardDef;
  currentAttack: number;
  currentHealth: number;
  maxHealth: number;
  canAttack: boolean;
  hasAttacked: boolean;
  attacksThisTurn: number;
  hasDivineShield: boolean;
  isPoisonous: boolean;
  hasTaunt: boolean;
  hasWindfury: boolean;
  hasLifesteal: boolean;
  hasCharge: boolean;
  enchantments: Enchantment[];
}

export interface Enchantment {
  source: string;
  attackBuff: number;
  healthBuff: number;
}

export interface WeaponState {
  cardId: string;
  name: string;
  attack: number;
  durability: number;
  maxDurability: number;
}

export interface Player {
  id: string;
  name: string;
  heroClass: string; // Класс героя (warrior, mage, priest, etc.)
  heroHealth: number;
  maxHeroHealth: number;
  armor: number; // Броня (поглощает урон до здоровья)
  maxMana: number;
  currentMana: number;
  deck: CardInstance[];
  hand: CardInstance[];
  board: BoardMinion[];
  weapon?: WeaponState;
  fatigue: number;
  heroPowerUsed: boolean;
}

export interface GameState {
  players: [Player, Player];
  currentPlayerIndex: 0 | 1;
  turnNumber: number;
  phase: 'mulligan' | 'playing' | 'gameOver';
  winner: number | null;
  log: string[];
}

export interface GameAction {
  type: 'play_card' | 'attack' | 'end_turn' | 'hero_power' | 'mulligan';
  playerId: string;
  cardInstanceId?: string;
  targetInstanceId?: string | null;
  targetPosition?: 'board' | 'hero';
  targetPlayerIndex?: number;
  mulliganCards?: string[];
}

// ============= NETWORK TYPES =============
export type EmotionType = 'greetings' | 'thanks' | 'well_played' | 'oops' | 'threat' | 'laughter' | 'wow' | 'sadness';

// ============= UI TYPES =============
export type Screen = 'menu' | 'lobby' | 'waiting' | 'game' | 'collection' | 'result' | 'deckbuilder' | 'profile' | 'settings';
export type GameMode = 'hotseat' | 'ai' | 'online';
