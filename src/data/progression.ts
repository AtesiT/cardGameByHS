import { HeroClass } from '../data/classes';

// ============= СИСТЕМА РАНГОВ =============
export type Rank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend';

export interface RankInfo {
  id: Rank;
  name: string;
  emoji: string;
  color: string;
  requiredWins: number;
}

export const RANKS: RankInfo[] = [
  { id: 'bronze', name: 'Бронза', emoji: '🥉', color: '#CD7F32', requiredWins: 0 },
  { id: 'silver', name: 'Серебро', emoji: '🥈', color: '#C0C0C0', requiredWins: 10 },
  { id: 'gold', name: 'Золото', emoji: '🥇', color: '#FFD700', requiredWins: 25 },
  { id: 'platinum', name: 'Платина', emoji: '💎', color: '#E5E4E2', requiredWins: 50 },
  { id: 'diamond', name: 'Алмаз', emoji: '💠', color: '#B9F2FF', requiredWins: 100 },
  { id: 'legend', name: 'Легенда', emoji: '👑', color: '#FF6B6B', requiredWins: 200 },
];

// ============= ДОСТИЖЕНИЯ =============
export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  requirement: number;
  type: 'wins' | 'damage' | 'cards_played' | 'minions_killed' | 'spells_cast' | 'hero_power_used';
  unlocked: boolean;
  progress: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', name: 'Первая победа', description: 'Выиграйте свою первую игру', emoji: '🏆', requirement: 1, type: 'wins', unlocked: false, progress: 0 },
  { id: 'win_10', name: 'Ветеран', description: 'Выиграйте 10 игр', emoji: '⭐', requirement: 10, type: 'wins', unlocked: false, progress: 0 },
  { id: 'win_50', name: 'Мастер', description: 'Выиграйте 50 игр', emoji: '🌟', requirement: 50, type: 'wins', unlocked: false, progress: 0 },
  { id: 'win_100', name: 'Легенда', description: 'Выиграйте 100 игр', emoji: '👑', requirement: 100, type: 'wins', unlocked: false, progress: 0 },
  { id: 'damage_100', name: 'Разрушитель', description: 'Нанесите 100 урона', emoji: '💥', requirement: 100, type: 'damage', unlocked: false, progress: 0 },
  { id: 'damage_500', name: 'Апокалипсис', description: 'Нанесите 500 урона', emoji: '☄️', requirement: 500, type: 'damage', unlocked: false, progress: 0 },
  { id: 'cards_50', name: 'Коллекционер', description: 'Разыграйте 50 карт', emoji: '🃏', requirement: 50, type: 'cards_played', unlocked: false, progress: 0 },
  { id: 'cards_200', name: 'Магистр', description: 'Разыграйте 200 карт', emoji: '📚', requirement: 200, type: 'cards_played', unlocked: false, progress: 0 },
  { id: 'kills_25', name: 'Охотник', description: 'Уничтожьте 25 существ', emoji: '⚔️', requirement: 25, type: 'minions_killed', unlocked: false, progress: 0 },
  { id: 'kills_100', name: 'Истребитель', description: 'Уничтожьте 100 существ', emoji: '💀', requirement: 100, type: 'minions_killed', unlocked: false, progress: 0 },
  { id: 'spells_20', name: 'Заклинатель', description: 'Разыграйте 20 заклинаний', emoji: '✨', requirement: 20, type: 'spells_cast', unlocked: false, progress: 0 },
  { id: 'spells_100', name: 'Архимаг', description: 'Разыграйте 100 заклинаний', emoji: '🔮', requirement: 100, type: 'spells_cast', unlocked: false, progress: 0 },
  { id: 'hero_power_10', name: 'Тактик', description: 'Используйте способность героя 10 раз', emoji: '🎯', requirement: 10, type: 'hero_power_used', unlocked: false, progress: 0 },
  { id: 'hero_power_50', name: 'Стратег', description: 'Используйте способность героя 50 раз', emoji: '🧠', requirement: 50, type: 'hero_power_used', unlocked: false, progress: 0 },
];

// ============= СТАТИСТИКА =============
export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  cardsPlayed: number;
  minionsKilled: number;
  spellsCast: number;
  heroPowerUsed: number;
  favoriteClass: HeroClass | null;
  classStats: Record<HeroClass, { wins: number; losses: number }>;
  winStreak: number;
  bestWinStreak: number;
}

export const DEFAULT_STATS: PlayerStats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  cardsPlayed: 0,
  minionsKilled: 0,
  spellsCast: 0,
  heroPowerUsed: 0,
  favoriteClass: null,
  classStats: {
    warrior: { wins: 0, losses: 0 },
    mage: { wins: 0, losses: 0 },
    priest: { wins: 0, losses: 0 },
    hunter: { wins: 0, losses: 0 },
    rogue: { wins: 0, losses: 0 },
    shaman: { wins: 0, losses: 0 },
    warlock: { wins: 0, losses: 0 },
    paladin: { wins: 0, losses: 0 },
    druid: { wins: 0, losses: 0 },
  },
  winStreak: 0,
  bestWinStreak: 0,
};

// ============= НАСТРОЙКИ =============
export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  animationSpeed: 'slow' | 'normal' | 'fast';
  theme: 'stardew' | 'dark' | 'classic';
  showDamageNumbers: boolean;
  showTooltips: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  animationSpeed: 'normal',
  theme: 'stardew',
  showDamageNumbers: true,
  showTooltips: true,
};

// ============= LOCALSTORAGE HELPERS =============
const STORAGE_KEYS = {
  STATS: 'card_game_stats',
  ACHIEVEMENTS: 'card_game_achievements',
  SETTINGS: 'card_game_settings',
  DECKS: 'card_game_decks',
};

export function loadStats(): PlayerStats {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    return data ? JSON.parse(data) : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats:', e);
  }
}

export function loadAchievements(): Achievement[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return data ? JSON.parse(data) : ACHIEVEMENTS;
  } catch {
    return ACHIEVEMENTS;
  }
}

export function saveAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  } catch (e) {
    console.error('Failed to save achievements:', e);
  }
}

export function loadSettings(): GameSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadDecks(): string[][] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DECKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveDecks(decks: string[][]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  } catch (e) {
    console.error('Failed to save decks:', e);
  }
}

// ============= HELPER FUNCTIONS =============
export function getCurrentRank(wins: number): RankInfo {
  let currentRank = RANKS[0];
  for (const rank of RANKS) {
    if (wins >= rank.requiredWins) {
      currentRank = rank;
    }
  }
  return currentRank;
}

export function getNextRank(wins: number): RankInfo | null {
  for (const rank of RANKS) {
    if (wins < rank.requiredWins) {
      return rank;
    }
  }
  return null;
}

export function updateStatsOnGameEnd(stats: PlayerStats, won: boolean, heroClass: HeroClass): PlayerStats {
  const newStats = { ...stats };
  newStats.totalGames++;
  
  if (won) {
    newStats.wins++;
    newStats.winStreak++;
    if (newStats.winStreak > newStats.bestWinStreak) {
      newStats.bestWinStreak = newStats.winStreak;
    }
  } else {
    newStats.losses++;
    newStats.winStreak = 0;
  }
  
  newStats.classStats[heroClass] = {
    wins: newStats.classStats[heroClass].wins + (won ? 1 : 0),
    losses: newStats.classStats[heroClass].losses + (won ? 0 : 1),
  };
  
  // Update favorite class
  let maxWins = 0;
  let favClass: HeroClass = 'warrior';
  for (const [cls, data] of Object.entries(newStats.classStats)) {
    if (data.wins > maxWins) {
      maxWins = data.wins;
      favClass = cls as HeroClass;
    }
  }
  newStats.favoriteClass = favClass;
  
  return newStats;
}

export function updateAchievements(achievements: Achievement[], statType: string, value: number): Achievement[] {
  return achievements.map(ach => {
    if (ach.type === statType && !ach.unlocked) {
      const newProgress = Math.min(ach.requirement, ach.progress + value);
      return {
        ...ach,
        progress: newProgress,
        unlocked: newProgress >= ach.requirement,
      };
    }
    return ach;
  });
}
