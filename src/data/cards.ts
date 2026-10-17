import { CardDef } from '../types';

export const CARD_DATABASE: CardDef[] = [
  // ============= СУЩЕСТВА (15) =============
  {
    id: 'm01', name: 'Огненный имп', type: 'minion', cost: 1, rarity: 'common',
    attack: 3, health: 2,
    description: 'Боевой клич: Наносит 1 урон вашему герою.',
    flavorText: 'Маленький, но очень горячий.',
    keywords: ['battlecry'],
    battlecryDesc: 'deal_1_to_own_hero',
  },
  {
    id: 'm02', name: 'Серебряный рыцарь', type: 'minion', cost: 3, rarity: 'rare',
    attack: 2, health: 2,
    description: 'Божественный щит. Рывок.',
    flavorText: 'Его доспех блестит ярче солнца.',
    keywords: ['divine_shield', 'charge'],
  },
  {
    id: 'm03', name: 'Вождь племени', type: 'minion', cost: 5, rarity: 'epic',
    attack: 4, health: 4,
    description: 'Боевой клич: +1/+1 всем вашим существам.',
    flavorText: 'Ведёт за собой тех, кто идёт за ним.',
    keywords: ['battlecry'],
    battlecryDesc: 'buff_all_friendly_1_1',
    buffAttack: 1, buffHealth: 1, buffAllFriendly: true,
  },
  {
    id: 'm04', name: 'Ледяной страж', type: 'minion', cost: 4, rarity: 'common',
    attack: 3, health: 5,
    description: 'Провокация.',
    flavorText: 'Холодный как камень, крепкий как лёд.',
    keywords: ['taunt'],
  },
  {
    id: 'm05', name: 'Тёмный убийца', type: 'minion', cost: 3, rarity: 'rare',
    attack: 1, health: 1,
    description: 'Яд. Боевой клич: Уничтожить случайное вражеское существо.',
    flavorText: 'Один удар — одна жизнь.',
    keywords: ['poisonous', 'battlecry'],
    battlecryDesc: 'destroy_random_enemy',
  },
  {
    id: 'm06', name: 'Древний голем', type: 'minion', cost: 7, rarity: 'epic',
    attack: 6, health: 6,
    description: 'Смертельный хрип: Призвать двух 2/2 Големов.',
    flavorText: 'Камень помнит всё.',
    keywords: ['deathrattle'],
    deathrattleDesc: 'summon_two_2_2',
  },
  {
    id: 'm07', name: 'Лесной дух', type: 'minion', cost: 2, rarity: 'common',
    attack: 2, health: 3,
    description: 'Смертельный хрип: Восстановить 3 здоровья вашему герою.',
    flavorText: 'Лес всегда защищает своих.',
    keywords: ['deathrattle', 'lifesteal'],
    deathrattleDesc: 'heal_hero_3',
  },
  {
    id: 'm08', name: 'Берсерк крови', type: 'minion', cost: 4, rarity: 'common',
    attack: 3, health: 3,
    description: 'Боевой клич: Получить +2 атаку за каждое повреждённое существо.',
    flavorText: 'Чем больше крови — тем сильнее ярость.',
    keywords: ['battlecry'],
    battlecryDesc: 'buff_per_damaged',
  },
  {
    id: 'm09', name: 'Пустотный червь', type: 'minion', cost: 9, rarity: 'legendary',
    attack: 8, health: 8,
    description: 'Боевой клич: Уничтожить всех остальных существ.',
    flavorText: 'Он приходит, когда мир забывает о страхе.',
    keywords: ['battlecry'],
    battlecryDesc: 'destroy_all_minions',
  },
  {
    id: 'm10', name: 'Ветровая танцовщица', type: 'minion', cost: 1, rarity: 'common',
    attack: 1, health: 1,
    description: 'Ветер ветра. Рывок.',
    flavorText: 'Быстрее мысли, легче пера.',
    keywords: ['windfury', 'charge'],
  },
  {
    id: 'm11', name: 'Жрица света', type: 'minion', cost: 4, rarity: 'rare',
    attack: 3, health: 5,
    description: 'Боевой клич: Восстановить 5 здоровья целевому существу.',
    flavorText: 'Свет исцеляет тех, кто верит.',
    keywords: ['battlecry'],
    battlecryDesc: 'heal_target_5',
  },
  {
    id: 'm12', name: 'Огненный элементаль', type: 'minion', cost: 5, rarity: 'rare',
    attack: 5, health: 4,
    description: 'Боевой клич: Нанести 3 урона случайному врагу.',
    flavorText: 'Рождён из пламени, питается хаосом.',
    keywords: ['battlecry'],
    battlecryDesc: 'deal_3_random_enemy',
  },
  {
    id: 'm13', name: 'Щитоносец', type: 'minion', cost: 1, rarity: 'common',
    attack: 0, health: 4,
    description: 'Провокация.',
    flavorText: 'За ним не пройдут.',
    keywords: ['taunt'],
  },
  {
    id: 'm14', name: 'Дракончик-подмастерье', type: 'minion', cost: 2, rarity: 'common',
    attack: 3, health: 2,
    description: 'Боевой клич: Добавить случайное заклинание в руку.',
    flavorText: 'Ещё молод, но уже огнедышащ.',
    keywords: ['battlecry'],
    battlecryDesc: 'add_random_spell',
  },
  {
    id: 'm15', name: 'Феникс', type: 'minion', cost: 6, rarity: 'legendary',
    attack: 4, health: 4,
    description: 'Смертельный хрип: Вернуться в руку с +2/+2.',
    flavorText: 'Из пепла — сильнее прежнего.',
    keywords: ['deathrattle'],
    deathrattleDesc: 'return_to_hand_buffed',
  },

  // ============= ЗАКЛИНАНИЯ (10) =============
  {
    id: 's01', name: 'Огненный шар', type: 'spell', cost: 4, rarity: 'common',
    description: 'Нанести 6 урона цели.',
    flavorText: 'Классика, проверенная веками.',
    keywords: [],
    spellTarget: 'any',
    spellDamage: 6,
  },
  {
    id: 's02', name: 'Ледяная стрела', type: 'spell', cost: 2, rarity: 'common',
    description: 'Нанести 3 урона цели.',
    flavorText: 'Холодна как сердце зимы.',
    keywords: [],
    spellTarget: 'any',
    spellDamage: 3,
  },
  {
    id: 's03', name: 'Исцеление', type: 'spell', cost: 2, rarity: 'common',
    description: 'Восстановить 6 здоровья.',
    flavorText: 'Иногда лучшее оружие — милосердие.',
    keywords: [],
    spellTarget: 'any',
    spellHeal: 6,
  },
  {
    id: 's04', name: 'Молния', type: 'spell', cost: 1, rarity: 'common',
    description: 'Нанести 3 урона случайному врагу.',
    flavorText: 'Небеса говорят громко.',
    keywords: [],
    spellTarget: 'none',
    spellDamage: 3,
  },
  {
    id: 's05', name: 'Священный огонь', type: 'spell', cost: 5, rarity: 'rare',
    description: 'Нанести 4 урона всем вражеским существам.',
    flavorText: 'Очищающее пламя праведности.',
    keywords: [],
    spellTarget: 'none',
    spellAoEDamage: 4,
  },
  {
    id: 's06', name: 'Мудрость древних', type: 'spell', cost: 3, rarity: 'rare',
    description: 'Добрать 2 карты.',
    flavorText: 'Знание — сила, но мудрость — контроль.',
    keywords: [],
    spellTarget: 'none',
    spellDraw: 2,
  },
  {
    id: 's07', name: 'Похищение жизни', type: 'spell', cost: 3, rarity: 'rare',
    description: 'Нанести 3 урона. Восстановить 3 здоровья вашему герою.',
    flavorText: 'То, что забирает — то и даёт.',
    keywords: [],
    spellTarget: 'any',
    spellDamage: 3,
    spellHeal: 3,
  },
  {
    id: 's08', name: 'Казнь', type: 'spell', cost: 2, rarity: 'rare',
    description: 'Уничтожить повреждённое вражеское существо.',
    flavorText: 'Добивай раненых.',
    keywords: [],
    spellTarget: 'enemy',
    spellDestroy: true,
  },
  {
    id: 's09', name: 'Благословение силы', type: 'spell', cost: 1, rarity: 'common',
    description: 'Дать существу +2/+2.',
    flavorText: 'Сила праведных несокрушима.',
    keywords: [],
    spellTarget: 'friendly',
    buffAttack: 2, buffHealth: 2,
  },
  {
    id: 's10', name: 'Апокалипсис', type: 'spell', cost: 8, rarity: 'epic',
    description: 'Уничтожить ВСЕХ существ.',
    flavorText: 'Когда всё заканчивается — начинается заново.',
    keywords: [],
    spellTarget: 'none',
    spellDestroy: true,
  },

  // ============= ОРУЖИЯ (5) =============
  {
    id: 'w01', name: 'Меч новобранца', type: 'weapon', cost: 1, rarity: 'common',
    description: 'Герой может атаковать этим оружием.',
    flavorText: 'Прост, но надёжен.',
    keywords: [],
    weaponAttack: 2, weaponDurability: 2,
  },
  {
    id: 'w02', name: 'Боевой топор', type: 'weapon', cost: 3, rarity: 'common',
    description: 'Герой может атаковать этим оружием.',
    flavorText: 'Тяжёлый и беспощадный.',
    keywords: [],
    weaponAttack: 3, weaponDurability: 2,
  },
  {
    id: 'w03', name: 'Клинок теней', type: 'weapon', cost: 3, rarity: 'rare',
    description: 'Герой атакует этим оружием. Прочное лезвие.',
    flavorText: 'Режет не только плоть, но и душу.',
    keywords: [],
    weaponAttack: 2, weaponDurability: 3,
  },
  {
    id: 'w04', name: 'Молот правосудия', type: 'weapon', cost: 4, rarity: 'rare',
    description: 'Боевой клич: Восстановить 3 здоровья.',
    flavorText: 'Вершит суд и карает грешников.',
    keywords: ['battlecry'],
    weaponAttack: 4, weaponDurability: 2,
  },
  {
    id: 'w05', name: 'Клинок хаоса', type: 'weapon', cost: 5, rarity: 'epic',
    description: 'Смертельный хрип: Нанести 3 урона вражескому герою.',
    flavorText: 'Разрушает всё, к чему прикасается — включая владельца.',
    keywords: ['deathrattle'],
    weaponAttack: 5, weaponDurability: 2,
    deathrattleDesc: 'deal_3_to_enemy_hero',
  },
];

// Токены (не в колоде, призываются эффектами)
export const TOKEN_CARDS: CardDef[] = [
  {
    id: 'token_golem', name: 'Голем', type: 'minion', cost: 0, rarity: 'common',
    attack: 2, health: 2,
    description: '', flavorText: '', keywords: [],
  },
  {
    id: 'token_imp', name: 'Бес', type: 'minion', cost: 0, rarity: 'common',
    attack: 1, health: 1,
    description: '', flavorText: '', keywords: [],
  },
];

export function getCardById(id: string): CardDef | undefined {
  return CARD_DATABASE.find(c => c.id === id);
}

export function getRandomSpell(): CardDef {
  const spells = CARD_DATABASE.filter(c => c.type === 'spell');
  return spells[Math.floor(Math.random() * spells.length)];
}
