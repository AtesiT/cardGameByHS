import { GameState, Player, CardInstance, BoardMinion, GameAction, CardDef, WeaponState } from '../types';
import { CARD_DATABASE, TOKEN_CARDS, getCardById, getRandomSpell } from '../data/cards';

let instanceCounter = 0;
function nextInstanceId(): string {
  return `inst_${++instanceCounter}_${Date.now()}`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createCardInstance(def: CardDef): CardInstance {
  return { instanceId: nextInstanceId(), cardId: def.id, def };
}

function buildDeck(presetCards?: string[]): CardInstance[] {
  let deck: CardInstance[] = [];
  
  if (presetCards && presetCards.length > 0) {
    // Use preset deck
    for (const cardId of presetCards) {
      const cardDef = getCardById(cardId);
      if (cardDef) {
        deck.push(createCardInstance(cardDef));
      }
    }
  } else {
    // Build a 30-card deck: 2 copies of each common, 1 of rare+
    for (const card of CARD_DATABASE) {
      const copies = card.rarity === 'common' ? 2 : 1;
      for (let i = 0; i < copies; i++) {
        deck.push(createCardInstance(card));
      }
    }
  }
  
  // If deck is more than 30, trim. If less, add duplicates
  while (deck.length > 30) deck.pop();
  while (deck.length < 30) {
    const randomCard = CARD_DATABASE[Math.floor(Math.random() * CARD_DATABASE.length)];
    deck.push(createCardInstance(randomCard));
  }
  return shuffleArray(deck);
}

function createPlayer(name: string, id: string, heroClass: string = 'mage', deckPreset?: string[]): Player {
  return {
    id,
    name,
    heroClass,
    heroHealth: 30,
    maxHeroHealth: 30,
    armor: 0,
    maxMana: 0,
    currentMana: 0,
    deck: buildDeck(deckPreset),
    hand: [],
    board: [],
    fatigue: 0,
    heroPowerUsed: false,
  };
}

export function createGameState(player1Name: string, player2Name: string, hero1Class: string = 'mage', hero2Class: string = 'mage', deck1Preset?: string[], deck2Preset?: string[]): GameState {
  instanceCounter = 0;
  const p1 = createPlayer(player1Name, 'player1', hero1Class, deck1Preset);
  const p2 = createPlayer(player2Name, 'player2', hero2Class, deck2Preset);

  const state: GameState = {
    players: [p1, p2],
    currentPlayerIndex: 0,
    turnNumber: 0,
    phase: 'mulligan',
    winner: null,
    log: [],
  };

  // Draw initial hands (3 cards each)
  for (let i = 0; i < 3; i++) {
    drawCard(state, 0);
    drawCard(state, 1);
  }

  return state;
}

export function drawCard(state: GameState, playerIndex: number): CardInstance | null {
  const player = state.players[playerIndex];
  if (player.deck.length === 0) {
    player.fatigue++;
    // Усталость не может добить героя — здоровье не уходит в минус
    const dmg = Math.min(player.fatigue, Math.max(0, player.heroHealth - 1) + player.armor);
    dealDamageToHero(state, playerIndex, dmg);
    state.log.push(`${player.name}: колода пуста! Усталость наносит ${player.fatigue} урона.`);
    return null;
  }
  const card = player.deck.pop()!;
  if (player.hand.length >= 10) {
    state.log.push(`${player.name}: рука переполнена! ${card.def.name} сгорает.`);
    return null;
  }
  player.hand.push(card);
  return card;
}

export function startTurn(state: GameState): void {
  const idx = state.currentPlayerIndex;
  const player = state.players[idx];

  // Increase mana
  if (player.maxMana < 10) player.maxMana++;
  player.currentMana = player.maxMana;

  // Draw a card
  drawCard(state, idx);

  // Reset attacks - all minions on board can attack now
  for (const minion of player.board) {
    minion.hasAttacked = false;
    minion.attacksThisTurn = 0;
    minion.canAttack = minion.currentAttack > 0;
  }

  player.heroPowerUsed = false;
  state.turnNumber++;
  state.log.push(`--- Ход ${state.turnNumber}: ${player.name} (${player.currentMana} маны) ---`);
}

export function startGame(state: GameState): void {
  state.phase = 'playing';
  startTurn(state);
}

export function playCard(state: GameState, playerIndex: number, instanceId: string, targetInstanceId?: string | null): { success: boolean; error?: string } {
  if (state.phase !== 'playing') return { success: false, error: 'Игра не началась' };
  if (state.currentPlayerIndex !== playerIndex) return { success: false, error: 'Не ваш ход' };

  const player = state.players[playerIndex];
  const opponent = state.players[playerIndex === 0 ? 1 : 0];
  const cardIndex = player.hand.findIndex(c => c.instanceId === instanceId);
  if (cardIndex === -1) return { success: false, error: 'Карта не в руке' };

  const cardInst = player.hand[cardIndex];
  const def = cardInst.def;

  if (def.cost > player.currentMana) return { success: false, error: `Недостаточно маны (нужно ${def.cost})` };

  // Для карт, требующих цель (заклинания и боевые кличи) — цель обязательна
  const needsTarget =
    (def.type === 'spell' && !!def.spellTarget && def.spellTarget !== 'none') ||
    (def.type === 'minion' && def.battlecryDesc === 'heal_target_5');
  if (needsTarget && !targetInstanceId) {
    return { success: false, error: `${def.name}: выберите цель` };
  }

  switch (def.type) {
    case 'minion':
      if (player.board.length >= 7) return { success: false, error: 'Поле переполнено' };
      return playMinion(state, playerIndex, cardIndex, targetInstanceId);
    case 'spell':
      return playSpell(state, playerIndex, cardIndex, targetInstanceId);
    case 'weapon':
      return playWeapon(state, playerIndex, cardIndex);
    default:
      return { success: false, error: 'Неизвестный тип карты' };
  }
}

function playMinion(state: GameState, playerIndex: number, cardIndex: number, targetInstanceId?: string | null): { success: boolean; error?: string } {
  const player = state.players[playerIndex];
  const card = player.hand[cardIndex];
  const def = card.def;

  // Валидация боевого клича ДО списания маны (иначе существо выходит без эффекта)
  if (def.battlecryDesc === 'heal_target_5') {
    const targetMinion = targetInstanceId ? findMinion(state, targetInstanceId) : null;
    if (!targetMinion || getPlayerIndexByMinion(state, targetInstanceId!) !== playerIndex) {
      return { success: false, error: 'Нужна союзная цель для лечения' };
    }
  }

  player.currentMana -= def.cost;
  player.hand.splice(cardIndex, 1);

  const minion: BoardMinion = {
    instanceId: card.instanceId,
    cardId: card.cardId,
    def: def,
    currentAttack: def.attack || 0,
    currentHealth: def.health || 1,
    maxHealth: def.health || 1,
    canAttack: def.keywords.includes('charge'),
    hasAttacked: false,
    attacksThisTurn: 0,
    hasDivineShield: def.keywords.includes('divine_shield'),
    isPoisonous: def.keywords.includes('poisonous'),
    hasTaunt: def.keywords.includes('taunt'),
    hasWindfury: def.keywords.includes('windfury'),
    hasLifesteal: def.keywords.includes('lifesteal'),
    hasCharge: def.keywords.includes('charge'),
    enchantments: [],
  };

  player.board.push(minion);
  state.log.push(`${player.name} разыгрывает ${def.name} (${minion.currentAttack}/${minion.currentHealth})`);

  // Battlecry
  if (def.keywords.includes('battlecry') && def.battlecryDesc) {
    executeBattlecry(state, playerIndex, minion, targetInstanceId);
  }

  checkDeath(state);
  return { success: true };
}

function playSpell(state: GameState, playerIndex: number, cardIndex: number, targetInstanceId?: string | null): { success: boolean; error?: string } {
  const player = state.players[playerIndex];
  const opponentIdx = playerIndex === 0 ? 1 : 0;
  const opponent = state.players[opponentIdx];
  const card = player.hand[cardIndex];
  const def = card.def;
  const targetIsFriendlyHero = targetInstanceId === `hero_${playerIndex}`;

  // ==== Валидация цели ДО списания маны (иначе карта «сгорает» без эффекта) ====
  const needsTarget = !!def.spellTarget && def.spellTarget !== 'none';
  if (needsTarget && !targetInstanceId) {
    return { success: false, error: 'Выберите цель для заклинания' };
  }
  if (targetInstanceId) {
    const tMinion = findMinion(state, targetInstanceId);
    const tHeroIdx = (targetInstanceId === 'hero_0' || targetInstanceId === 'hero_1')
      ? parseInt(targetInstanceId.split('_')[1]) : -1;
    if (!tMinion && tHeroIdx === -1) {
      return { success: false, error: 'Цель не найдена (возможно, уже погибла)' };
    }
    const ownerIdx = tMinion ? getPlayerIndexByMinion(state, targetInstanceId) : tHeroIdx;
    if (def.spellTarget === 'enemy' && ownerIdx === playerIndex) return { success: false, error: 'Цель должна быть вражеской' };
    if (def.spellTarget === 'friendly' && ownerIdx !== playerIndex) return { success: false, error: 'Цель должна быть вашей' };
    if (def.spellHeal && !def.spellDamage && def.spellTarget === 'any' && ownerIdx !== playerIndex) {
      return { success: false, error: 'Лечить можно только свои цели' };
    }
  }

  player.currentMana -= def.cost;
  player.hand.splice(cardIndex, 1);
  state.log.push(`${player.name} разыгрывает заклинание: ${def.name}`);

  // Самоурон (Кровавый ритуал)
  if (def.spellSelfDamage) {
    dealDamageToHero(state, playerIndex, def.spellSelfDamage);
  }

  // AOE урон по существам противника
  if (def.spellAoEDamage) {
    for (const minion of [...opponent.board]) {
      dealDamageToMinion(state, minion, def.spellAoEDamage, opponentIdx);
    }
    // AOE по герою противника (Залп стрел)
    if (def.spellAoEHero) {
      dealDamageToHero(state, opponentIdx, def.spellAoEDamage);
    }
    state.log.push(`${def.name}: ${def.spellAoEDamage} урона всем вражеским существам${def.spellAoEHero ? ' и герою' : ''}`);
  }

  // Урон по конкретной цели (any / enemy)
  if (def.spellDamage && targetInstanceId && (def.spellTarget === 'any' || def.spellTarget === 'enemy')) {
    const targetMinion = findMinion(state, targetInstanceId);
    if (targetMinion) {
      const targetOwner = getPlayerIndexByMinion(state, targetInstanceId);
      dealDamageToMinion(state, targetMinion, def.spellDamage, targetOwner);
      if (def.spellFreeze) {
        targetMinion.canAttack = false;
        state.log.push(`${targetMinion.def.name} заморожен(а)!`);
      }
    } else if (targetInstanceId === 'hero_0' || targetInstanceId === 'hero_1') {
      const targetPlayerIdx = parseInt(targetInstanceId.split('_')[1]);
      dealDamageToHero(state, targetPlayerIdx, def.spellDamage);
    }
  }

  // Случайный урон (Молния) — цель не требуется
  if (def.spellDamage && def.spellTarget === 'none' && !def.spellAoEDamage) {
    if (opponent.board.length > 0) {
      const target = opponent.board[Math.floor(Math.random() * opponent.board.length)];
      dealDamageToMinion(state, target, def.spellDamage, opponentIdx);
      state.log.push(`${def.name} наносит ${def.spellDamage} урона ${target.def.name}`);
    } else {
      dealDamageToHero(state, opponentIdx, def.spellDamage);
      state.log.push(`${def.name} наносит ${def.spellDamage} урона вражескому герою`);
    }
  }

  // Лечение
  if (def.spellHeal) {
    if (def.spellDamage) {
      // Кража жизни: лечим своего героя за нанесённый урон
      player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + def.spellHeal);
      state.log.push(`${player.name} восстанавливает ${def.spellHeal} здоровья`);
    } else if (targetInstanceId && !targetIsFriendlyHero) {
      const targetMinion = findMinion(state, targetInstanceId);
      if (targetMinion) {
        const healed = Math.min(def.spellHeal, targetMinion.maxHealth - targetMinion.currentHealth);
        targetMinion.currentHealth += healed;
        state.log.push(`${targetMinion.def.name} восстанавливает ${healed} здоровья`);
      }
    } else {
      // Лечение своего героя (self_hero или союзный герой)
      const healed = Math.min(def.spellHeal, player.maxHeroHealth - player.heroHealth);
      player.heroHealth += healed;
      state.log.push(`${player.name} восстанавливает ${healed} здоровья`);
    }
  }

  // Взять карты
  if (def.spellDraw) {
    for (let i = 0; i < def.spellDraw; i++) {
      drawCard(state, playerIndex);
    }
    state.log.push(`${player.name} берёт ${def.spellDraw} карт(ы)`);
  }

  // Уничтожение целевое (Казнь)
  if (def.spellDestroy && def.spellTarget === 'enemy' && targetInstanceId) {
    const targetMinion = findMinion(state, targetInstanceId);
    if (targetMinion) {
      targetMinion.currentHealth = 0;
      state.log.push(`${def.name} уничтожает ${targetMinion.def.name}`);
    }
  }

  // Уничтожение всех существ (Апокалипсис)
  if (def.spellDestroyAll) {
    for (const m of state.players[0].board) m.currentHealth = 0;
    for (const m of state.players[1].board) m.currentHealth = 0;
    state.log.push(`${def.name} уничтожает всех существ!`);
  }

  // Бафф целевому существу (+X/+Y)
  if ((def.buffAttack || def.buffHealth) && def.spellTarget === 'friendly' && targetInstanceId) {
    const targetMinion = findMinion(state, targetInstanceId);
    if (targetMinion) {
      targetMinion.currentAttack += def.buffAttack || 0;
      targetMinion.currentHealth += def.buffHealth || 0;
      targetMinion.maxHealth += def.buffHealth || 0;
      state.log.push(`${targetMinion.def.name} получает +${def.buffAttack || 0}/+${def.buffHealth || 0}`);
    }
  }

  // Бафф всем союзным существам (Щитовая стена / Дикий рёв)
  if (def.spellBuffAllFriendly) {
    for (const m of player.board) {
      if (def.spellBuffAttack) { m.currentAttack += def.spellBuffAttack; }
      if (def.spellBuffHealth) { m.currentHealth += def.spellBuffHealth; m.maxHealth += def.spellBuffHealth; }
    }
    state.log.push(`${def.name}: усилены все ваши существа`);
  }

  checkDeath(state);
  return { success: true };
}

function playWeapon(state: GameState, playerIndex: number, cardIndex: number): { success: boolean; error?: string } {
  const player = state.players[playerIndex];
  const card = player.hand[cardIndex];
  const def = card.def;

  player.currentMana -= def.cost;
  player.hand.splice(cardIndex, 1);

  // Destroy old weapon
  if (player.weapon) {
    executeWeaponDeathrattle(state, playerIndex);
  }

  player.weapon = {
    cardId: card.cardId,
    name: def.name,
    attack: def.weaponAttack || 0,
    durability: def.weaponDurability || 0,
    maxDurability: def.weaponDurability || 0,
  };

  state.log.push(`${player.name} экипирует ${def.name} (${player.weapon.attack}/${player.weapon.durability})`);

  // Battlecry
  if (def.keywords.includes('battlecry') && def.battlecryDesc) {
    if (def.battlecryDesc === 'heal_hero_3') {
      player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + 3);
      state.log.push(`${player.name} восстанавливает 3 здоровья`);
    }
  }

  return { success: true };
}

export function attack(state: GameState, playerIndex: number, attackerInstanceId: string, targetInstanceId: string, targetIsHero: boolean, targetPlayerIndex?: number): { success: boolean; error?: string } {
  if (state.phase !== 'playing') return { success: false, error: 'Игра не началась' };
  if (state.currentPlayerIndex !== playerIndex) return { success: false, error: 'Не ваш ход' };

  const player = state.players[playerIndex];
  const opponent = state.players[playerIndex === 0 ? 1 : 0];
  const opponentIdx = playerIndex === 0 ? 1 : 0;

  // Check if attacking with weapon
  if (attackerInstanceId === 'weapon') {
    if (!player.weapon) return { success: false, error: 'Нет оружия' };
    return attackWithWeapon(state, playerIndex, targetInstanceId, targetIsHero);
  }

  const attacker = player.board.find(m => m.instanceId === attackerInstanceId);
  if (!attacker) return { success: false, error: 'Атакующий не найден' };
  if (!attacker.canAttack) return { success: false, error: 'Не может атаковать' };
  if (attacker.hasAttacked && !attacker.hasWindfury) return { success: false, error: 'Уже атаковал' };
  if (attacker.hasWindfury && attacker.attacksThisTurn >= 2) return { success: false, error: 'Уже атаковал дважды' };
  if (attacker.currentAttack <= 0) return { success: false, error: 'Атака равна 0' };

  // Check taunt
  const hasTaunt = opponent.board.some(m => m.hasTaunt && m.currentHealth > 0);
  if (hasTaunt && !targetIsHero) {
    const target = opponent.board.find(m => m.instanceId === targetInstanceId);
    if (target && !target.hasTaunt) return { success: false, error: 'Сначала нужно атаковать существо с Провокацией' };
  }
  if (hasTaunt && targetIsHero) return { success: false, error: 'Нельзя атаковать героя, пока есть Провокация' };

  if (targetIsHero) {
    // Attack hero
    const healthBefore = opponent.heroHealth;
    const armorBefore = opponent.armor;
    dealDamageToHero(state, opponentIdx, attacker.currentAttack);
    const actualDamage = (healthBefore - opponent.heroHealth) + (armorBefore - opponent.armor);
    state.log.push(`${attacker.def.name} атакует героя ${opponent.name}`);

    if (attacker.hasLifesteal && actualDamage > 0) {
      player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + actualDamage);
      state.log.push(`${attacker.def.name} восстанавливает ${actualDamage} здоровья`);
    }
  } else {
    // Attack minion
    const target = opponent.board.find(m => m.instanceId === targetInstanceId);
    if (!target) return { success: false, error: 'Цель не найдена' };

    state.log.push(`${attacker.def.name} (${attacker.currentAttack}/${attacker.currentHealth}) атакует ${target.def.name} (${target.currentAttack}/${target.currentHealth})`);

    // Deal damage
    dealDamageToMinion(state, target, attacker.currentAttack, opponentIdx);
    dealDamageToMinion(state, attacker, target.currentAttack, playerIndex);

    // Poisonous
    if (attacker.isPoisonous && target.currentHealth > 0) {
      target.currentHealth = 0;
    }
    if (target.isPoisonous && attacker.currentHealth > 0) {
      attacker.currentHealth = 0;
    }

    // Lifesteal
    if (attacker.hasLifesteal) {
      const healed = Math.min(attacker.currentAttack, player.maxHeroHealth - player.heroHealth);
      player.heroHealth += healed;
    }
  }

  attacker.hasAttacked = true;
  attacker.attacksThisTurn++;
  if (attacker.hasWindfury && attacker.attacksThisTurn < 2) {
    attacker.hasAttacked = false;
  }

  checkDeath(state);
  return { success: true };
}

function attackWithWeapon(state: GameState, playerIndex: number, targetInstanceId: string, targetIsHero: boolean): { success: boolean; error?: string } {
  const player = state.players[playerIndex];
  const opponent = state.players[playerIndex === 0 ? 1 : 0];
  const opponentIdx = playerIndex === 0 ? 1 : 0;

  if (!player.weapon) return { success: false, error: 'Нет оружия' };

  // Check taunt
  const hasTaunt = opponent.board.some(m => m.hasTaunt && m.currentHealth > 0);
  if (hasTaunt && !targetIsHero) {
    const target = opponent.board.find(m => m.instanceId === targetInstanceId);
    if (target && !target.hasTaunt) return { success: false, error: 'Сначала нужно атаковать существо с Провокацией' };
  }
  if (hasTaunt && targetIsHero) return { success: false, error: 'Нельзя атаковать героя, пока есть Провокация' };

  if (targetIsHero) {
    dealDamageToHero(state, opponentIdx, player.weapon.attack);
    state.log.push(`${player.name} атакует героем оружием ${player.weapon.name}`);
  } else {
    const target = opponent.board.find(m => m.instanceId === targetInstanceId);
    if (!target) return { success: false, error: 'Цель не найдена' };
    dealDamageToMinion(state, target, player.weapon.attack, opponentIdx);
    dealDamageToHero(state, playerIndex, target.currentAttack);
    state.log.push(`${player.weapon.name} атакует ${target.def.name}`);
  }

  player.weapon.durability--;
  if (player.weapon.durability <= 0) {
    executeWeaponDeathrattle(state, playerIndex);
    player.weapon = undefined;
  }

  checkDeath(state);
  return { success: true };
}

export function endTurn(state: GameState): void {
  state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  startTurn(state);
}

export function useHeroPower(state: GameState, playerIndex: number): { success: boolean; error?: string } {
  if (state.currentPlayerIndex !== playerIndex) return { success: false, error: 'Не ваш ход' };
  const player = state.players[playerIndex];
  if (player.heroPowerUsed) return { success: false, error: 'Способность уже использована' };
  if (player.currentMana < 2) return { success: false, error: 'Недостаточно маны' };

  player.currentMana -= 2;
  player.heroPowerUsed = true;

  // Class-specific hero powers
  const opponentIdx = playerIndex === 0 ? 1 : 0;
  executeHeroPower(state, playerIndex, opponentIdx);

  checkDeath(state);
  return { success: true };
}

function executeHeroPower(state: GameState, playerIndex: number, opponentIdx: number): void {
  const player = state.players[playerIndex];
  const opponent = state.players[opponentIdx];

  switch (player.heroClass) {
    case 'warrior':
      // Воин: Получить 2 брони
      gainArmor(state, playerIndex, 2);
      state.log.push(`${player.name} использует Вооружиться (+2 брони)`);
      break;

    case 'mage':
      // Маг: Нанести 1 урон цели (по умолчанию вражескому герою)
      dealDamageToHero(state, opponentIdx, 1);
      state.log.push(`${player.name} использует Огненный взрыв (1 урон)`);
      break;

    case 'priest':
      // Жрец: Восстановить 2 здоровья
      player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + 2);
      state.log.push(`${player.name} использует Малое исцеление (+2 HP)`);
      break;

    case 'hunter':
      // Охотник: Нанести 2 урона вражескому герою
      dealDamageToHero(state, opponentIdx, 2);
      state.log.push(`${player.name} использует Выстрел (2 урона герою)`);
      break;

    case 'rogue':
      // Разбойник: Экипировать кинжал 1/1
      if (player.weapon) {
        state.log.push(`${player.name} заменяет оружие на кинжал`);
      }
      player.weapon = {
        cardId: 'weapon_knife',
        name: 'Кинжал',
        attack: 1,
        durability: 1,
        maxDurability: 1,
      };
      state.log.push(`${player.name} использует Кинжалы (оружие 1/1)`);
      break;

    case 'shaman':
      // Шаман: Призвать случайный тотем
      if (player.board.length < 7) {
        const totems = [
          { name: 'Тотем лечения', attack: 0, health: 2 },
          { name: 'Тотем огня', attack: 1, health: 1 },
          { name: 'Каменный тотем', attack: 0, health: 3, taunt: true },
          { name: 'Тотем гнева', attack: 2, health: 1 },
        ];
        const totem = totems[Math.floor(Math.random() * totems.length)];
        const minion: BoardMinion = {
          instanceId: nextInstanceId(),
          cardId: 'token_totem',
          def: {
            id: 'token_totem',
            name: totem.name,
            type: 'minion',
            cost: 0,
            rarity: 'common',
            description: '',
            flavorText: '',
            keywords: totem.taunt ? ['taunt'] : [],
            attack: totem.attack,
            health: totem.health,
          },
          currentAttack: totem.attack,
          currentHealth: totem.health,
          maxHealth: totem.health,
          canAttack: false,
          hasAttacked: false,
          attacksThisTurn: 0,
          hasDivineShield: false,
          isPoisonous: false,
          hasTaunt: !!totem.taunt,
          hasWindfury: false,
          hasLifesteal: false,
          hasCharge: false,
          enchantments: [],
        };
        player.board.push(minion);
        state.log.push(`${player.name} использует Тотем (призван ${totem.name})`);
      } else {
        state.log.push(`${player.name} использует Тотем, но поле переполнено!`);
      }
      break;

    case 'warlock':
      // Чернокнижник: 2 урона себе, взять карту
      dealDamageToHero(state, playerIndex, 2);
      drawCard(state, playerIndex);
      state.log.push(`${player.name} использует Жизненная сила (2 урона себе, +1 карта)`);
      break;

    case 'paladin':
      // Паладин: Призвать Серебряного новобранца 1/1
      if (player.board.length < 7) {
        const minion: BoardMinion = {
          instanceId: nextInstanceId(),
          cardId: 'token_silver_hand',
          def: {
            id: 'token_silver_hand',
            name: 'Серебряный новобранец',
            type: 'minion',
            cost: 0,
            rarity: 'common',
            description: '',
            flavorText: '',
            keywords: [],
            attack: 1,
            health: 1,
          },
          currentAttack: 1,
          currentHealth: 1,
          maxHealth: 1,
          canAttack: false,
          hasAttacked: false,
          attacksThisTurn: 0,
          hasDivineShield: false,
          isPoisonous: false,
          hasTaunt: false,
          hasWindfury: false,
          hasLifesteal: false,
          hasCharge: false,
          enchantments: [],
        };
        player.board.push(minion);
        state.log.push(`${player.name} использует Воззвание (призван Серебряный новобранец)`);
      } else {
        state.log.push(`${player.name} использует Воззвание, но поле переполнено!`);
      }
      break;

    case 'druid':
      // Друид: +1 атака в этот ход, +1 броня
      gainArmor(state, playerIndex, 1);
      // Временный бафф атаки (упрощённо - просто добавляем атаку)
      state.log.push(`${player.name} использует Метаморфоза (+1 атака, +1 броня)`);
      // Для простоты не реализуем временный бафф, просто даём броню
      break;

    default:
      // По умолчанию: 1 урон врагу, 2 лечения себе
      dealDamageToHero(state, opponentIdx, 1);
      player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + 2);
      state.log.push(`${player.name} использует способность героя`);
  }
}

// ============= HELPER FUNCTIONS =============

function dealDamageToMinion(state: GameState, minion: BoardMinion, damage: number, ownerIndex: number): void {
  if (minion.hasDivineShield && damage > 0) {
    minion.hasDivineShield = false;
    state.log.push(`Божественный щит ${minion.def.name} поглощает урон!`);
    return;
  }
  minion.currentHealth -= damage;
  if (damage > 0) {
    state.log.push(`${minion.def.name} получает ${damage} урона (${minion.currentHealth} HP)`);
  }
}

function dealDamageToHero(state: GameState, playerIndex: number, damage: number): void {
  const player = state.players[playerIndex];
  let remainingDamage = damage;
  
  // First, absorb damage with armor
  if (player.armor > 0) {
    const armorAbsorbed = Math.min(player.armor, remainingDamage);
    player.armor -= armorAbsorbed;
    remainingDamage -= armorAbsorbed;
    if (armorAbsorbed > 0) {
      state.log.push(`${player.name} теряет ${armorAbsorbed} брони`);
    }
  }
  
  // Then, apply remaining damage to health (здоровье не уходит в минус — герой погибает на 0)
  if (remainingDamage > 0) {
    const applied = Math.min(remainingDamage, player.heroHealth);
    player.heroHealth -= applied;
    state.log.push(`${player.name} получает ${applied} урона (${player.heroHealth} HP, ${player.armor} брони)`);
    if (player.heroHealth <= 0) {
      state.log.push(`💀 Герой ${player.name} пал!`);
    }
  }
}

function gainArmor(state: GameState, playerIndex: number, amount: number): void {
  const player = state.players[playerIndex];
  player.armor += amount;
  state.log.push(`${player.name} получает ${amount} брони (всего: ${player.armor})`);
}

function findMinion(state: GameState, instanceId: string): BoardMinion | null {
  for (const player of state.players) {
    const m = player.board.find(m => m.instanceId === instanceId);
    if (m) return m;
  }
  return null;
}

function getPlayerIndexByMinion(state: GameState, instanceId: string): number {
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i].board.some(m => m.instanceId === instanceId)) return i;
  }
  return -1;
}

function executeBattlecry(state: GameState, playerIndex: number, minion: BoardMinion, targetInstanceId?: string | null): void {
  const player = state.players[playerIndex];
  const opponent = state.players[playerIndex === 0 ? 1 : 0];
  const opponentIdx = playerIndex === 0 ? 1 : 0;
  const def = minion.def;

  if (!def.battlecryDesc) return;

  switch (def.battlecryDesc) {
    case 'deal_1_to_own_hero':
      dealDamageToHero(state, playerIndex, 1);
      break;
    case 'buff_all_friendly_1_1':
      for (const m of player.board) {
        if (m.instanceId !== minion.instanceId) {
          m.currentAttack += 1;
          m.currentHealth += 1;
          m.maxHealth += 1;
        }
      }
      state.log.push(`${minion.def.name}: +1/+1 всем вашим существам`);
      break;
    case 'destroy_random_enemy':
      if (opponent.board.length > 0) {
        const target = opponent.board[Math.floor(Math.random() * opponent.board.length)];
        target.currentHealth = 0;
        state.log.push(`${minion.def.name} уничтожает ${target.def.name}!`);
      }
      break;
    case 'destroy_all_minions':
      for (const m of state.players[0].board) {
        if (m.instanceId !== minion.instanceId) m.currentHealth = 0;
      }
      for (const m of state.players[1].board) {
        if (m.instanceId !== minion.instanceId) m.currentHealth = 0;
      }
      state.log.push(`${minion.def.name} уничтожает всех остальных существ!`);
      break;
    case 'buff_per_damaged':
      let damaged = 0;
      for (const p of state.players) {
        for (const m of p.board) {
          if (m.currentHealth < m.maxHealth) damaged++;
        }
      }
      if (state.players[0].heroHealth < state.players[0].maxHeroHealth) damaged++;
      if (state.players[1].heroHealth < state.players[1].maxHeroHealth) damaged++;
      minion.currentAttack += damaged * 2;
      state.log.push(`${minion.def.name}: +${damaged * 2} атаки!`);
      break;
    case 'deal_3_random_enemy':
      if (opponent.board.length > 0) {
        const target = opponent.board[Math.floor(Math.random() * opponent.board.length)];
        dealDamageToMinion(state, target, 3, opponentIdx);
      } else {
        dealDamageToHero(state, opponentIdx, 3);
      }
      break;
    case 'heal_target_5':
      if (targetInstanceId) {
        const target = findMinion(state, targetInstanceId);
        if (target) {
          target.currentHealth = Math.min(target.maxHealth, target.currentHealth + 5);
          state.log.push(`${minion.def.name} лечит ${target.def.name} на 5`);
        }
      }
      break;
    case 'add_random_spell':
      const spell = getRandomSpell();
      const spellInst = createCardInstance(spell);
      if (player.hand.length < 10) {
        player.hand.push(spellInst);
        state.log.push(`${minion.def.name}: ${spell.name} добавлен в руку`);
      }
      break;
    case 'deal_2_to_all_enemies':
      for (const m of opponent.board) {
        dealDamageToMinion(state, m, 2, opponentIdx);
      }
      state.log.push(`${minion.def.name} наносит 2 урона всем вражеским существам`);
      break;
    case 'buff_self_0_1':
      minion.currentHealth += 1;
      minion.maxHealth += 1;
      state.log.push(`${minion.def.name} получает +1 здоровье`);
      break;
    case 'freeze_random_enemy':
      if (opponent.board.length > 0) {
        const target = opponent.board[Math.floor(Math.random() * opponent.board.length)];
        target.canAttack = false;
        state.log.push(`${minion.def.name} замораживает ${target.def.name}`);
      }
      break;
    case 'heal_hero_2':
      player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + 2);
      state.log.push(`${minion.def.name} восстанавливает 2 здоровья герою`);
      break;
    case 'deal_2_random_enemy':
      if (opponent.board.length > 0) {
        const target = opponent.board[Math.floor(Math.random() * opponent.board.length)];
        dealDamageToMinion(state, target, 2, opponentIdx);
        state.log.push(`${minion.def.name} наносит 2 урона ${target.def.name}`);
      } else {
        dealDamageToHero(state, opponentIdx, 2);
        state.log.push(`${minion.def.name} наносит 2 урона вражескому герою`);
      }
      break;
    case 'heal_hero_5':
      player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + 5);
      state.log.push(`${minion.def.name} восстанавливает 5 здоровья герою`);
      break;
    case 'buff_random_friendly_health': {
      const others = player.board.filter(m => m.instanceId !== minion.instanceId);
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)];
        target.currentHealth += 1;
        target.maxHealth += 1;
        state.log.push(`${minion.def.name}: +1 здоровье существу ${target.def.name}`);
      }
      break;
    }
    case 'buff_random_friendly_1_1': {
      const others = player.board.filter(m => m.instanceId !== minion.instanceId);
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)];
        target.currentAttack += 1;
        target.currentHealth += 1;
        target.maxHealth += 1;
        state.log.push(`${minion.def.name}: +1/+1 существу ${target.def.name}`);
      }
      break;
    }
    case 'conditional_buff_attack':
      if (player.heroHealth < 15) {
        minion.currentAttack += 2;
        state.log.push(`${minion.def.name}: ярость! +2 атаки`);
      }
      break;
    case 'deal_1_random_enemy':
      if (opponent.board.length > 0) {
        const target = opponent.board[Math.floor(Math.random() * opponent.board.length)];
        dealDamageToMinion(state, target, 1, opponentIdx);
        state.log.push(`${minion.def.name} наносит 1 урона ${target.def.name}`);
      } else {
        dealDamageToHero(state, opponentIdx, 1);
      }
      break;
    case 'draw_1':
      drawCard(state, playerIndex);
      state.log.push(`${minion.def.name}: ${player.name} берёт карту`);
      break;
    case 'destroy_random_friendly': {
      const others = player.board.filter(m => m.instanceId !== minion.instanceId);
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)];
        target.currentHealth = 0;
        state.log.push(`${minion.def.name} уничтожает союзника ${target.def.name}!`);
      }
      break;
    }
    case 'copy_random_enemy': {
      if (opponent.board.length > 0 && player.board.length < 7) {
        const src2 = opponent.board[Math.floor(Math.random() * opponent.board.length)];
        const copy: BoardMinion = {
          instanceId: nextInstanceId(),
          cardId: src2.cardId,
          def: src2.def,
          currentAttack: src2.currentAttack,
          currentHealth: src2.currentHealth,
          maxHealth: src2.maxHealth,
          canAttack: false,
          hasAttacked: false,
          attacksThisTurn: 0,
          hasDivineShield: src2.hasDivineShield,
          isPoisonous: src2.isPoisonous,
          hasTaunt: src2.hasTaunt,
          hasWindfury: false,
          hasLifesteal: src2.hasLifesteal,
          hasCharge: false,
          enchantments: [],
        };
        player.board.push(copy);
        state.log.push(`${minion.def.name} копирует ${src2.def.name}!`);
      }
      break;
    }
    case 'steal_random_card': {
      if (opponent.hand.length > 0 && player.hand.length < 10) {
        const stolen = opponent.hand.splice(Math.floor(Math.random() * opponent.hand.length), 1)[0];
        player.hand.push(stolen);
        state.log.push(`${minion.def.name} крадёт карту ${stolen.def.name}!`);
      }
      break;
    }
    case 'give_windfury_random': {
      const others = player.board.filter(m => m.instanceId !== minion.instanceId && !m.hasWindfury);
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)];
        target.hasWindfury = true;
        state.log.push(`${minion.def.name}: ${target.def.name} получает Ветер ветра`);
      }
      break;
    }
    case 'give_divine_shield_random': {
      const others = player.board.filter(m => m.instanceId !== minion.instanceId && !m.hasDivineShield);
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)];
        target.hasDivineShield = true;
        state.log.push(`${minion.def.name}: ${target.def.name} получает Божественный щит`);
      }
      break;
    }
    case 'choose_buff':
      minion.currentAttack += 2;
      minion.currentHealth += 2;
      minion.maxHealth += 2;
      state.log.push(`${minion.def.name}: метаморфоза +2/+2`);
      break;
    case 'destroy_all_other_minions':
      for (const m of state.players[0].board) {
        if (m.instanceId !== minion.instanceId) m.currentHealth = 0;
      }
      for (const m of state.players[1].board) {
        if (m.instanceId !== minion.instanceId) m.currentHealth = 0;
      }
      state.log.push(`${minion.def.name} уничтожает всех остальных существ!`);
      break;
  }
}

function executeDeathrattle(state: GameState, minion: BoardMinion, ownerIndex: number): void {
  const player = state.players[ownerIndex];
  const opponent = state.players[ownerIndex === 0 ? 1 : 0];
  const def = minion.def;

  if (!def.deathrattleDesc) return;

  switch (def.deathrattleDesc) {
    case 'summon_two_2_2':
      const tokenDef = TOKEN_CARDS.find(t => t.id === 'token_golem')!;
      for (let i = 0; i < 2; i++) {
        if (player.board.length < 7) {
          const token: BoardMinion = {
            instanceId: nextInstanceId(),
            cardId: tokenDef.id,
            def: tokenDef,
            currentAttack: 2, currentHealth: 2, maxHealth: 2,
            canAttack: false, hasAttacked: false, attacksThisTurn: 0,
            hasDivineShield: false, isPoisonous: false, hasTaunt: false,
            hasWindfury: false, hasLifesteal: false, hasCharge: false,
            enchantments: [],
          };
          player.board.push(token);
        }
      }
      state.log.push(`Смертельный хрип ${def.name}: призваны 2 Голема 2/2`);
      break;
    case 'heal_hero_3':
      player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + 3);
      state.log.push(`Смертельный хрип ${def.name}: +3 здоровья герою`);
      break;
    case 'return_to_hand_buffed':
      if (player.hand.length < 10) {
        const buffedDef = { ...def, attack: (def.attack || 0) + 2, health: (def.health || 0) + 2 };
        const returned = createCardInstance(buffedDef);
        player.hand.push(returned);
        state.log.push(`Смертельный хрип ${def.name}: возвращается в руку с +2/+2`);
      }
      break;
  }
}

function executeWeaponDeathrattle(state: GameState, playerIndex: number): void {
  const player = state.players[playerIndex];
  const opponentIdx = playerIndex === 0 ? 1 : 0;
  if (!player.weapon) return;

  const def = getCardById(player.weapon.cardId);
  if (!def || !def.deathrattleDesc) return;

  if (def.deathrattleDesc === 'deal_3_to_enemy_hero') {
    dealDamageToHero(state, opponentIdx, 3);
  }
}

function checkDeath(state: GameState): void {
  for (let pi = 0; pi < 2; pi++) {
    const player = state.players[pi];
    const dead: BoardMinion[] = [];

    for (const minion of player.board) {
      if (minion.currentHealth <= 0) {
        dead.push(minion);
      }
    }

    for (const minion of dead) {
      if (minion.def.keywords.includes('deathrattle')) {
        executeDeathrattle(state, minion, pi);
      }
      player.board = player.board.filter(m => m.instanceId !== minion.instanceId);
      state.log.push(`${minion.def.name} погибает`);
    }
  }

  // Check hero death (если оба героя погибли одновременно — побеждает активный игрок)
  if (state.winner === null) {
    const p0Dead = state.players[0].heroHealth <= 0;
    const p1Dead = state.players[1].heroHealth <= 0;
    if (p0Dead || p1Dead) {
      if (p0Dead && p1Dead) {
        state.winner = state.currentPlayerIndex === 0 ? 0 : 1;
      } else {
        state.winner = p0Dead ? 1 : 0;
      }
      state.phase = 'gameOver';
      state.log.push(`🏆 ${state.players[state.winner].name} побеждает!`);
    }
  }
}

// ============= AI LOGIC =============
export function aiTurn(state: GameState): GameAction[] {
  const actions: GameAction[] = [];
  const aiIndex = state.currentPlayerIndex;
  const player = state.players[aiIndex];
  const opponent = state.players[0 === aiIndex ? 1 : 0];
  const opponentIdx = 0 === aiIndex ? 1 : 0;

  state.log.push(`🤖 ${player.name} думает...`);

  // Play cards (greedy: play most expensive cards first)
  let played = true;
  while (played) {
    played = false;
    const playable = player.hand
      .filter(c => c.def.cost <= player.currentMana)
      .sort((a, b) => b.def.cost - a.def.cost);

    for (const card of playable) {
      if (card.def.cost > player.currentMana) continue;

      if (card.def.type === 'minion' && player.board.length >= 7) continue;

      let targetId: string | null = null;
      if (card.def.type === 'spell' && card.def.spellTarget === 'any' && card.def.spellDamage) {
        // Target enemy minion with most attack, or enemy hero
        if (opponent.board.length > 0) {
          const best = opponent.board.reduce((a, b) => a.currentAttack > b.currentAttack ? a : b);
          targetId = best.instanceId;
        } else {
          targetId = `hero_${opponentIdx}`;
        }
      } else if (card.def.type === 'spell' && card.def.spellTarget === 'friendly') {
        if (player.board.length > 0) {
          const best = player.board.reduce((a, b) => a.currentAttack > b.currentAttack ? a : b);
          targetId = best.instanceId;
        }
      } else if (card.def.type === 'spell' && card.def.spellTarget === 'enemy') {
        const damaged = opponent.board.filter(m => m.currentHealth < m.maxHealth);
        if (damaged.length > 0) {
          targetId = damaged[0].instanceId;
        } else continue;
      }

      const result = playCard(state, aiIndex, card.instanceId, targetId);
      if (result.success) {
        state.log.push(`🤖 AI разыгрывает ${card.def.name}`);
        actions.push({ type: 'play_card', playerId: player.id, cardInstanceId: card.instanceId, targetInstanceId: targetId });
        played = true;
        break;
      }
    }
  }

  // Attack with minions
  for (const minion of [...player.board]) {
    if (!minion.canAttack || minion.hasAttacked || minion.currentAttack <= 0) continue;

    const hasTaunt = opponent.board.some(m => m.hasTaunt && m.currentHealth > 0);
    let targetId: string;
    let targetIsHero = false;

    if (hasTaunt) {
      const tauntMinions = opponent.board.filter(m => m.hasTaunt && m.currentHealth > 0);
      targetId = tauntMinions[0].instanceId;
    } else if (opponent.board.length > 0 && Math.random() > 0.3) {
      // Trade into minions
      const killable = opponent.board.filter(m => m.currentHealth <= minion.currentAttack);
      if (killable.length > 0) {
        targetId = killable.reduce((a, b) => a.currentAttack > b.currentAttack ? a : b).instanceId;
      } else {
        targetId = opponent.board.reduce((a, b) => a.currentAttack > b.currentAttack ? a : b).instanceId;
      }
    } else {
      targetId = `hero_${opponentIdx}`;
      targetIsHero = true;
    }

    const result = attack(state, aiIndex, minion.instanceId, targetId, targetIsHero, opponentIdx);
    if (result.success) {
      if (targetIsHero) {
        state.log.push(`🤖 AI атакует героя ${minion.def.name}ом`);
      } else {
        const target = opponent.board.find(m => m.instanceId === targetId);
        state.log.push(`🤖 AI атакует ${minion.def.name} → ${target?.def.name || 'цель'}`);
      }
      actions.push({ type: 'attack', playerId: player.id, cardInstanceId: minion.instanceId, targetInstanceId: targetId, targetIsHero } as any);
    }
  }

  // Attack with weapon
  if (player.weapon) {
    const hasTaunt = opponent.board.some(m => m.hasTaunt && m.currentHealth > 0);
    if (!hasTaunt) {
      attack(state, aiIndex, 'weapon', `hero_${opponentIdx}`, true, opponentIdx);
    }
  }

  // Hero power
  if (!player.heroPowerUsed && player.currentMana >= 2) {
    useHeroPower(state, aiIndex);
  }

  // End turn
  actions.push({ type: 'end_turn', playerId: player.id });
  endTurn(state);

  return actions;
}
