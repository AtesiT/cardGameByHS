import { CardDef } from '../types';

// ============= КЛАССЫ ГЕРОЕВ =============
export type HeroClass = 'warrior' | 'mage' | 'priest' | 'hunter' | 'rogue' | 'shaman' | 'warlock' | 'paladin' | 'druid';

export interface HeroClassDef {
  id: HeroClass;
  name: string;
  emoji: string;
  color: string;
  heroPowerName: string;
  heroPowerDesc: string;
  heroPowerCost: number;
  heroPowerEffect: string;
}

export const HERO_CLASSES: Record<HeroClass, HeroClassDef> = {
  warrior: {
    id: 'warrior', name: 'Воин', emoji: '⚔️', color: '#8B4513',
    heroPowerName: 'Вооружиться', heroPowerDesc: 'Получить 2 брони',
    heroPowerCost: 2, heroPowerEffect: 'gain_armor_2',
  },
  mage: {
    id: 'mage', name: 'Маг', emoji: '🔮', color: '#4169E1',
    heroPowerName: 'Огненный взрыв', heroPowerDesc: 'Нанести 1 урон цели',
    heroPowerCost: 2, heroPowerEffect: 'deal_1_any',
  },
  priest: {
    id: 'priest', name: 'Жрец', emoji: '✨', color: '#FFD700',
    heroPowerName: 'Малое исцеление', heroPowerDesc: 'Восстановить 2 здоровья',
    heroPowerCost: 2, heroPowerEffect: 'heal_2',
  },
  hunter: {
    id: 'hunter', name: 'Охотник', emoji: '🏹', color: '#228B22',
    heroPowerName: 'Выстрел', heroPowerDesc: 'Нанести 2 урона вражескому герою',
    heroPowerCost: 2, heroPowerEffect: 'deal_2_enemy_hero',
  },
  rogue: {
    id: 'rogue', name: 'Разбойник', emoji: '🗡️', color: '#800080',
    heroPowerName: 'Кинжалы', heroPowerDesc: 'Экипировать кинжал 1/1',
    heroPowerCost: 2, heroPowerEffect: 'equip_weapon_1_1',
  },
  shaman: {
    id: 'shaman', name: 'Шаман', emoji: '⚡', color: '#006994',
    heroPowerName: 'Тотем', heroPowerDesc: 'Призвать случайный тотем',
    heroPowerCost: 2, heroPowerEffect: 'summon_random_totem',
  },
  warlock: {
    id: 'warlock', name: 'Чернокнижник', emoji: '😈', color: '#800020',
    heroPowerName: 'Жизненная сила', heroPowerDesc: '2 урона себе, взять карту',
    heroPowerCost: 2, heroPowerEffect: 'self_damage_2_draw_1',
  },
  paladin: {
    id: 'paladin', name: 'Паладин', emoji: '🛡️', color: '#DAA520',
    heroPowerName: 'Воззвание', heroPowerDesc: 'Призвать Серебряного новобранца 1/1',
    heroPowerCost: 2, heroPowerEffect: 'summon_silver_hand',
  },
  druid: {
    id: 'druid', name: 'Друид', emoji: '🌿', color: '#006400',
    heroPowerName: 'Метаморфоза', heroPowerDesc: '+1 атака в этот ход, +1 броня',
    heroPowerCost: 2, heroPowerEffect: 'buff_attack_armor',
  },
};

// ============= КЛАССОВЫЕ КАРТЫ =============
export const CLASS_CARDS: CardDef[] = [
  // ВОИН (Warrior)
  {
    id: 'war01', name: 'Командир отряда', type: 'minion', cost: 3, rarity: 'common',
    attack: 3, health: 3, class: 'warrior',
    description: 'Боевой клич: Дать +1/+1 другому союзному существу.',
    flavorText: 'Ведёт за собой в бой.',
    keywords: ['battlecry'], battlecryDesc: 'buff_random_friendly_1_1',
  },
  {
    id: 'war02', name: 'Щитовая стена', type: 'spell', cost: 3, rarity: 'common',
    description: 'Дать всем союзным существам +2 здоровья.',
    flavorText: 'Никто не пройдёт!',
    keywords: [], spellTarget: 'none', spellBuffAllFriendly: true, spellBuffHealth: 2,
  },
  {
    id: 'war03', name: 'Берсерк', type: 'minion', cost: 5, rarity: 'rare',
    attack: 5, health: 5, class: 'warrior',
    description: 'Рывок. Боевой клич: Получить +2 атаки если у вас менее 15 HP.',
    flavorText: 'Ярость — его союзник.',
    keywords: ['charge', 'battlecry'], battlecryDesc: 'conditional_buff_attack',
  },

  // МАГ (Mage)
  {
    id: 'mag01', name: 'Ученик мага', type: 'minion', cost: 2, rarity: 'common',
    attack: 2, health: 2, class: 'mage',
    description: 'Боевой клич: Добавить случайное заклинание в руку.',
    flavorText: 'Всегда учится новому.',
    keywords: ['battlecry'], battlecryDesc: 'add_random_spell',
  },
  {
    id: 'mag02', name: 'Ледяное копьё', type: 'spell', cost: 3, rarity: 'common',
    description: 'Нанести 4 урона. Заморозить цель.',
    flavorText: 'Пронзает насквозь.',
    keywords: [], spellTarget: 'any', spellDamage: 4, spellFreeze: true,
  },
  {
    id: 'mag03', name: 'Архимаг', type: 'minion', cost: 7, rarity: 'epic',
    attack: 5, health: 7, class: 'mage',
    description: 'Боевой клич: Нанести 3 урона всем вражеским существам.',
    flavorText: 'Его сила не знает границ.',
    keywords: ['battlecry'], battlecryDesc: 'deal_3_to_all_enemies',
  },

  // ЖРЕЦ (Priest)
  {
    id: 'pri01', name: 'Новичок храма', type: 'minion', cost: 1, rarity: 'common',
    attack: 1, health: 3, class: 'priest',
    description: 'Боевой клич: Восстановить 2 здоровья вашему герою.',
    flavorText: 'Вера — его сила.',
    keywords: ['battlecry'], battlecryDesc: 'heal_hero_2',
  },
  {
    id: 'pri02', name: 'Святое слово', type: 'spell', cost: 5, rarity: 'rare',
    description: 'Восстановить 8 здоровья.',
    flavorText: 'Исцеляет даже безнадёжных.',
    keywords: [], spellTarget: 'any', spellHeal: 8,
  },
  {
    id: 'pri03', name: 'Верховный жрец', type: 'minion', cost: 6, rarity: 'epic',
    attack: 4, health: 6, class: 'priest',
    description: 'Боевой клич: Скопировать случайное существо противника.',
    flavorText: 'Мудрость веков.',
    keywords: ['battlecry'], battlecryDesc: 'copy_random_enemy',
  },

  // ОХОТНИК (Hunter)
  {
    id: 'hun01', name: 'Верный пёс', type: 'minion', cost: 1, rarity: 'common',
    attack: 2, health: 1, class: 'hunter',
    description: 'Рывок.',
    flavorText: 'Верный друг охотника.',
    keywords: ['charge'],
  },
  {
    id: 'hun02', name: 'Залп стрел', type: 'spell', cost: 2, rarity: 'common',
    description: 'Нанести 1 урон всем врагам.',
    flavorText: 'Туча стрел затмевает небо.',
    keywords: [], spellTarget: 'none', spellAoEDamage: 1, spellAoEHero: true,
  },
  {
    id: 'hun03', name: 'Медведь-страж', type: 'minion', cost: 4, rarity: 'rare',
    attack: 3, health: 5, class: 'hunter',
    description: 'Провокация.',
    flavorText: 'Лучший защитник леса.',
    keywords: ['taunt'],
  },

  // РАЗБОЙНИК (Rogue)
  {
    id: 'rog01', name: 'Карманник', type: 'minion', cost: 2, rarity: 'common',
    attack: 2, health: 2, class: 'rogue',
    description: 'Боевой клич: Украсть случайную карту из руки противника.',
    flavorText: 'Ловкие пальцы.',
    keywords: ['battlecry'], battlecryDesc: 'steal_random_card',
  },
  {
    id: 'rog02', name: 'Удар в спину', type: 'spell', cost: 0, rarity: 'common',
    description: 'Нанести 2 урона неатаковавшему существу.',
    flavorText: 'Быстро и бесшумно.',
    keywords: [], spellTarget: 'enemy', spellDamage: 2, spellRequiresUntapped: true,
  },
  {
    id: 'rog03', name: 'Мастер клинков', type: 'minion', cost: 5, rarity: 'rare',
    attack: 4, health: 4, class: 'rogue',
    description: 'Ветер ветра.',
    flavorText: 'Четыре удара — четыре трупа.',
    keywords: ['windfury'],
  },

  // ШАМАН (Shaman)
  {
    id: 'sha01', name: 'Тотем огня', type: 'minion', cost: 2, rarity: 'common',
    attack: 2, health: 3, class: 'shaman',
    description: 'Боевой клич: Нанести 1 урон случайному врагу.',
    flavorText: 'Пламя слушается шамана.',
    keywords: ['battlecry'], battlecryDesc: 'deal_1_random_enemy',
  },
  {
    id: 'sha02', name: 'Молния предков', type: 'spell', cost: 3, rarity: 'common',
    description: 'Нанести 4 урона. Перегрузка: (1).',
    flavorText: 'Гнев духов.',
    keywords: [], spellTarget: 'any', spellDamage: 4,
  },
  {
    id: 'sha03', name: 'Дух ветра', type: 'minion', cost: 3, rarity: 'rare',
    attack: 3, health: 3, class: 'shaman',
    description: 'Боевой клич: Дать Ветер ветра случайному союзному существу.',
    flavorText: 'Быстрее ветра.',
    keywords: ['battlecry'], battlecryDesc: 'give_windfury_random',
  },

  // ЧЕРНОКНИЖНИК (Warlock)
  {
    id: 'wrl01', name: 'Бес-служитель', type: 'minion', cost: 1, rarity: 'common',
    attack: 1, health: 1, class: 'warlock',
    description: 'Боевой клич: Взять карту.',
    flavorText: 'Маленький, но полезный.',
    keywords: ['battlecry'], battlecryDesc: 'draw_1',
  },
  {
    id: 'wrl02', name: 'Демон бездны', type: 'minion', cost: 6, rarity: 'rare',
    attack: 6, health: 6, class: 'warlock',
    description: 'Боевой клич: Уничтожить случайное ваше существо.',
    flavorText: 'Требует жертв.',
    keywords: ['battlecry'], battlecryDesc: 'destroy_random_friendly',
  },
  {
    id: 'wrl03', name: 'Кровавый ритуал', type: 'spell', cost: 2, rarity: 'common',
    description: 'Взять 2 карты. Получить 2 урона.',
    flavorText: 'Знание требует крови.',
    keywords: [], spellTarget: 'none', spellDraw: 2, spellSelfDamage: 2,
  },

  // ПАЛАДИН (Paladin)
  {
    id: 'pal01', name: 'Защитник света', type: 'minion', cost: 2, rarity: 'common',
    attack: 2, health: 2, class: 'paladin',
    description: 'Божественный щит.',
    flavorText: 'Свет защищает праведных.',
    keywords: ['divine_shield'],
  },
  {
    id: 'pal02', name: 'Благословение королей', type: 'spell', cost: 6, rarity: 'rare',
    description: 'Дать существу +4/+4.',
    flavorText: 'Сила королей течёт в тебе.',
    keywords: [], spellTarget: 'friendly', buffAttack: 4, buffHealth: 4,
  },
  {
    id: 'pal03', name: 'Рыцарь серебряной длани', type: 'minion', cost: 4, rarity: 'rare',
    attack: 4, health: 4, class: 'paladin',
    description: 'Боевой клич: Дать Божественный щит случайному союзному существу.',
    flavorText: 'Свет с нами!',
    keywords: ['battlecry'], battlecryDesc: 'give_divine_shield_random',
  },

  // ДРУИД (Druid)
  {
    id: 'dru01', name: 'Друид-оборотень', type: 'minion', cost: 3, rarity: 'common',
    attack: 2, health: 2, class: 'druid',
    description: 'Боевой клич: Выбрать — +2 атаки или +2 здоровья.',
    flavorText: 'Природа в его крови.',
    keywords: ['battlecry'], battlecryDesc: 'choose_buff',
  },
  {
    id: 'dru02', name: 'Дикий рёв', type: 'spell', cost: 3, rarity: 'common',
    description: 'Дать всем союзным существам +2 атаки в этот ход.',
    flavorText: 'Рёв леса!',
    keywords: [], spellTarget: 'none', spellBuffAllFriendly: true, spellBuffAttack: 2,
  },
  {
    id: 'dru03', name: 'Древень', type: 'minion', cost: 7, rarity: 'epic',
    attack: 5, health: 8, class: 'druid',
    description: 'Провокация. Боевой клич: Восстановить 5 здоровья.',
    flavorText: 'Старейший защитник леса.',
    keywords: ['taunt', 'battlecry'], battlecryDesc: 'heal_hero_5',
  },
];


