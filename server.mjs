#!/usr/bin/env node
/**
 * Сервер для игры "Карты Судьбы"
 * 
 * Автоматически устанавливает зависимости при первом запуске
 * Использует Vite middleware для раздачи клиентского приложения
 * WebSocket для мультиплеера
 */

import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Получаем порт из аргументов командной строки или используем 8080
const PORT = parseInt(process.argv[2]) || 8080;

// Проверка и установка зависимостей
function checkAndInstall() {
  const deps = ['ws', 'vite'];
  const missing = [];
  
  for (const dep of deps) {
    const depPath = path.join(__dirname, 'node_modules', dep);
    if (!existsSync(depPath)) {
      missing.push(dep);
    }
  }
  
  if (missing.length > 0) {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║   🔧 Первый запуск! Устанавливаю зависимости...          ║');
    console.log('║                                                           ║');
    console.log('║   Это займёт 1-2 минуты. Пожалуйста, подождите...       ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    
    try {
      execSync('npm install --silent', { 
        cwd: __dirname, 
        stdio: 'inherit'
      });
      console.log('');
      console.log('✅ Зависимости установлены! Запускаю сервер...');
      console.log('');
    } catch (error) {
      console.error('❌ Ошибка установки зависимостей!');
      console.error('Попробуйте выполнить вручную: npm install');
      process.exit(1);
    }
  }
}

// Проверяем и устанавливаем зависимости
checkAndInstall();

// Динамически импортируем зависимости после установки
const { WebSocketServer } = await import('ws');
const { createServer: createViteServer } = await import('vite');

// Хранилище комнат
const rooms = new Map();

// Класс игровой комнаты
class GameRoom {
  constructor(id, hostName) {
    this.id = id;
    this.host = null;
    this.guest = null;
    this.hostName = hostName;
    this.guestName = null;
    this.gameState = null;
  }

  addPlayer(ws, playerName) {
    if (!this.host) {
      this.host = ws;
      this.hostName = playerName;
      ws.playerIndex = 0;
      ws.roomId = this.id;
      ws.playerName = playerName;
    } else if (!this.guest) {
      this.guest = ws;
      this.guestName = playerName;
      ws.playerIndex = 1;
      ws.roomId = this.id;
      ws.playerName = playerName;
    } else {
      return false;
    }
    return true;
  }

  isFull() {
    return this.host && this.guest;
  }

  broadcast(message, excludeWs = null) {
    const msg = JSON.stringify(message);
    if (this.host && this.host !== excludeWs && this.host.readyState === 1) {
      this.host.send(msg);
    }
    if (this.guest && this.guest !== excludeWs && this.guest.readyState === 1) {
      this.guest.send(msg);
    }
  }

  sendTo(playerIndex, message) {
    const ws = playerIndex === 0 ? this.host : this.guest;
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  }
}

// Полноценный игровой движок с поддержкой всех механик
class GameEngine {
  constructor() {
    this.instanceCounter = 0;
  }

  nextInstanceId() {
    return `inst_${++this.instanceCounter}_${Date.now()}`;
  }

  createCardInstance(def) {
    return { instanceId: this.nextInstanceId(), cardId: def.id, def };
  }

  shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Полная база карт
  getCardDatabase() {
    return [
      // Миньоны (15)
      { id: 'm01', name: 'Огненный имп', type: 'minion', cost: 1, rarity: 'common', attack: 3, health: 2, keywords: ['battlecry'], battlecryDesc: 'deal_1_to_own_hero', description: 'БК: 1 урон вашему герою' },
      { id: 'm02', name: 'Серебряный рыцарь', type: 'minion', cost: 3, rarity: 'rare', attack: 2, health: 2, keywords: ['divine_shield', 'charge'], description: 'Щит. Рывок.' },
      { id: 'm03', name: 'Вождь племени', type: 'minion', cost: 5, rarity: 'epic', attack: 4, health: 4, keywords: ['battlecry'], battlecryDesc: 'buff_all_friendly_1_1', description: 'БК: +1/+1 вашим' },
      { id: 'm04', name: 'Ледяной страж', type: 'minion', cost: 4, rarity: 'common', attack: 3, health: 5, keywords: ['taunt'], description: 'Провокация' },
      { id: 'm05', name: 'Тёмный убийца', type: 'minion', cost: 3, rarity: 'rare', attack: 1, health: 1, keywords: ['poisonous', 'battlecry'], battlecryDesc: 'destroy_random_enemy', description: 'Яд. БК: уничтожить' },
      { id: 'm06', name: 'Древний голем', type: 'minion', cost: 7, rarity: 'epic', attack: 6, health: 6, keywords: ['deathrattle'], deathrattleDesc: 'summon_two_2_2', description: 'СХ: 2 Голема 2/2' },
      { id: 'm07', name: 'Лесной дух', type: 'minion', cost: 2, rarity: 'common', attack: 2, health: 3, keywords: ['deathrattle', 'lifesteal'], deathrattleDesc: 'heal_hero_3', description: 'СХ: +3 HP герою' },
      { id: 'm08', name: 'Берсерк крови', type: 'minion', cost: 4, rarity: 'common', attack: 3, health: 3, keywords: ['battlecry'], battlecryDesc: 'buff_per_damaged', description: 'БК: +2 за каждого раненого' },
      { id: 'm09', name: 'Пустотный червь', type: 'minion', cost: 9, rarity: 'legendary', attack: 8, health: 8, keywords: ['battlecry'], battlecryDesc: 'destroy_all_other_minions', description: 'БК: уничтожить всех остальных' },
      { id: 'm10', name: 'Ветровая танцовщица', type: 'minion', cost: 1, rarity: 'common', attack: 1, health: 1, keywords: ['windfury', 'charge'], description: 'Ветер. Рывок.' },
      { id: 'm11', name: 'Жрица света', type: 'minion', cost: 4, rarity: 'rare', attack: 3, health: 5, keywords: ['battlecry'], battlecryDesc: 'heal_target_5', description: 'БК: +5 HP цели' },
      { id: 'm12', name: 'Огненный элементаль', type: 'minion', cost: 5, rarity: 'rare', attack: 5, health: 4, keywords: ['battlecry'], battlecryDesc: 'deal_3_random_enemy', description: 'БК: 3 урона случайному' },
      { id: 'm13', name: 'Щитоносец', type: 'minion', cost: 1, rarity: 'common', attack: 0, health: 4, keywords: ['taunt'], description: 'Провокация' },
      { id: 'm14', name: 'Дракончик-подмастерье', type: 'minion', cost: 2, rarity: 'common', attack: 3, health: 2, keywords: ['battlecry'], battlecryDesc: 'add_random_spell', description: 'БК: случайное заклинание' },
      { id: 'm15', name: 'Феникс', type: 'minion', cost: 6, rarity: 'legendary', attack: 4, health: 4, keywords: ['deathrattle'], deathrattleDesc: 'return_to_hand_buffed', description: 'СХ: в руку +2/+2' },
      
      // Заклинания (10)
      { id: 's01', name: 'Огненный шар', type: 'spell', cost: 4, rarity: 'common', keywords: [], spellTarget: 'any', spellDamage: 6, description: '6 урона цели' },
      { id: 's02', name: 'Ледяная стрела', type: 'spell', cost: 2, rarity: 'common', keywords: [], spellTarget: 'any', spellDamage: 3, description: '3 урона цели' },
      { id: 's03', name: 'Исцеление', type: 'spell', cost: 2, rarity: 'common', keywords: [], spellTarget: 'any', spellHeal: 6, description: '+6 HP' },
      { id: 's04', name: 'Молния', type: 'spell', cost: 1, rarity: 'common', keywords: [], spellTarget: 'none', spellDamage: 3, description: '3 урона случайному врагу' },
      { id: 's05', name: 'Священный огонь', type: 'spell', cost: 5, rarity: 'rare', keywords: [], spellTarget: 'none', spellAoEDamage: 4, description: '4 урона всем врагам' },
      { id: 's06', name: 'Мудрость древних', type: 'spell', cost: 3, rarity: 'rare', keywords: [], spellTarget: 'none', spellDraw: 2, description: 'Взять 2 карты' },
      { id: 's07', name: 'Похищение жизни', type: 'spell', cost: 3, rarity: 'rare', keywords: [], spellTarget: 'any', spellDamage: 3, spellHeal: 3, description: '3 урона + 3 HP' },
      { id: 's08', name: 'Казнь', type: 'spell', cost: 2, rarity: 'rare', keywords: [], spellTarget: 'enemy', spellDestroy: true, description: 'Убить раненого' },
      { id: 's09', name: 'Благословение силы', type: 'spell', cost: 1, rarity: 'common', keywords: [], spellTarget: 'friendly', buffAttack: 2, buffHealth: 2, description: '+2/+2 существу' },
      { id: 's10', name: 'Апокалипсис', type: 'spell', cost: 8, rarity: 'epic', keywords: [], spellTarget: 'none', spellDestroy: true, description: 'Уничтожить всех' },
      
      // Оружия (5)
      { id: 'w01', name: 'Меч новобранца', type: 'weapon', cost: 1, rarity: 'common', keywords: [], weaponAttack: 2, weaponDurability: 2, description: '2/2' },
      { id: 'w02', name: 'Боевой топор', type: 'weapon', cost: 3, rarity: 'common', keywords: [], weaponAttack: 3, weaponDurability: 2, description: '3/2' },
      { id: 'w03', name: 'Клинок теней', type: 'weapon', cost: 3, rarity: 'rare', keywords: [], weaponAttack: 2, weaponDurability: 3, description: '2/3' },
      { id: 'w04', name: 'Молот правосудия', type: 'weapon', cost: 4, rarity: 'rare', keywords: ['battlecry'], weaponAttack: 4, weaponDurability: 2, description: 'БК: +3 HP' },
      { id: 'w05', name: 'Клинок хаоса', type: 'weapon', cost: 5, rarity: 'epic', keywords: ['deathrattle'], deathrattleDesc: 'deal_3_to_enemy_hero', weaponAttack: 5, weaponDurability: 2, description: 'СХ: 3 урона герою' },
    ];
  }

  getCardById(id) {
    return this.getCardDatabase().find(c => c.id === id);
  }

  getRandomSpell() {
    const spells = this.getCardDatabase().filter(c => c.type === 'spell');
    return spells[Math.floor(Math.random() * spells.length)];
  }

  buildDeck() {
    const deck = [];
    const cards = this.getCardDatabase();
    for (const card of cards) {
      const copies = card.rarity === 'common' ? 2 : 1;
      for (let i = 0; i < copies; i++) {
        deck.push(this.createCardInstance(card));
      }
    }
    while (deck.length > 30) deck.pop();
    while (deck.length < 30) {
      const randomCard = cards[Math.floor(Math.random() * cards.length)];
      deck.push(this.createCardInstance(randomCard));
    }
    return this.shuffleArray(deck);
  }

  createPlayer(name, id) {
    return {
      id,
      name,
      heroHealth: 30,
      maxHeroHealth: 30,
      armor: 0,
      maxMana: 0,
      currentMana: 0,
      deck: this.buildDeck(),
      hand: [],
      board: [],
      weapon: null,
      fatigue: 0,
      heroPowerUsed: false,
    };
  }

  createGameState(player1Name, player2Name) {
    this.instanceCounter = 0;
    const state = {
      players: [
        this.createPlayer(player1Name, 'player1'),
        this.createPlayer(player2Name, 'player2'),
      ],
      currentPlayerIndex: 0,
      turnNumber: 0,
      phase: 'playing',
      winner: null,
      log: [],
    };

    for (let i = 0; i < 3; i++) {
      this.drawCard(state, 0);
      this.drawCard(state, 1);
    }

    this.startTurn(state);
    return state;
  }

  drawCard(state, playerIndex) {
    const player = state.players[playerIndex];
    if (player.deck.length === 0) {
      player.fatigue++;
      this.dealDamageToHero(state, playerIndex, player.fatigue);
      return null;
    }
    const card = player.deck.pop();
    if (player.hand.length < 10) {
      player.hand.push(card);
    }
    return card;
  }

  startTurn(state) {
    const player = state.players[state.currentPlayerIndex];
    if (player.maxMana < 10) player.maxMana++;
    player.currentMana = player.maxMana;
    this.drawCard(state, state.currentPlayerIndex);

    for (const minion of player.board) {
      minion.hasAttacked = false;
      minion.attacksThisTurn = 0;
      minion.canAttack = minion.currentAttack > 0;
    }

    player.heroPowerUsed = false;
    state.turnNumber++;
  }

  dealDamageToMinion(state, minion, damage, ownerIndex) {
    if (minion.hasDivineShield && damage > 0) {
      minion.hasDivineShield = false;
      return;
    }
    minion.currentHealth -= damage;
  }

  dealDamageToHero(state, playerIndex, damage) {
    const player = state.players[playerIndex];
    let remainingDamage = damage;
    
    if (player.armor > 0) {
      const armorAbsorbed = Math.min(player.armor, remainingDamage);
      player.armor -= armorAbsorbed;
      remainingDamage -= armorAbsorbed;
    }
    
    if (remainingDamage > 0) {
      player.heroHealth -= remainingDamage;
    }
  }

  playCard(state, playerIndex, instanceId, targetInstanceId) {
    if (state.currentPlayerIndex !== playerIndex) return { success: false };

    const player = state.players[playerIndex];
    const opponent = state.players[playerIndex === 0 ? 1 : 0];
    const opponentIdx = playerIndex === 0 ? 1 : 0;
    const cardIndex = player.hand.findIndex(c => c.instanceId === instanceId);
    if (cardIndex === -1) return { success: false };

    const card = player.hand[cardIndex];
    const def = card.def;

    if (def.cost > player.currentMana) return { success: false };

    player.currentMana -= def.cost;
    player.hand.splice(cardIndex, 1);

    if (def.type === 'minion') {
      if (player.board.length >= 7) return { success: false };
      
      const minion = {
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
      };
      
      player.board.push(minion);
      
      // Execute battlecry
      if (def.keywords.includes('battlecry') && def.battlecryDesc) {
        this.executeBattlecry(state, playerIndex, minion, targetInstanceId);
      }
    } else if (def.type === 'spell') {
      this.executeSpell(state, playerIndex, def, targetInstanceId);
    } else if (def.type === 'weapon') {
      if (player.weapon) {
        this.executeWeaponDeathrattle(state, playerIndex);
      }
      player.weapon = {
        cardId: card.cardId,
        name: def.name,
        attack: def.weaponAttack || 0,
        durability: def.weaponDurability || 0,
        maxDurability: def.weaponDurability || 0,
      };
    }

    this.checkDeath(state);
    return { success: true };
  }

  executeBattlecry(state, playerIndex, minion, targetInstanceId) {
    const player = state.players[playerIndex];
    const opponent = state.players[playerIndex === 0 ? 1 : 0];
    const opponentIdx = playerIndex === 0 ? 1 : 0;
    const def = minion.def;

    switch (def.battlecryDesc) {
      case 'deal_1_to_own_hero':
        this.dealDamageToHero(state, playerIndex, 1);
        break;
      case 'buff_all_friendly_1_1':
        for (const m of player.board) {
          if (m.instanceId !== minion.instanceId) {
            m.currentAttack += 1;
            m.currentHealth += 1;
            m.maxHealth += 1;
          }
        }
        break;
      case 'destroy_random_enemy':
        if (opponent.board.length > 0) {
          const target = opponent.board[Math.floor(Math.random() * opponent.board.length)];
          target.currentHealth = 0;
        }
        break;
      case 'destroy_all_other_minions':
        for (const m of state.players[0].board) {
          if (m.instanceId !== minion.instanceId) m.currentHealth = 0;
        }
        for (const m of state.players[1].board) {
          if (m.instanceId !== minion.instanceId) m.currentHealth = 0;
        }
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
        break;
      case 'deal_3_random_enemy':
        if (opponent.board.length > 0) {
          const target = opponent.board[Math.floor(Math.random() * opponent.board.length)];
          this.dealDamageToMinion(state, target, 3, opponentIdx);
        } else {
          this.dealDamageToHero(state, opponentIdx, 3);
        }
        break;
      case 'heal_target_5':
        if (targetInstanceId) {
          const target = this.findMinion(state, targetInstanceId);
          if (target) {
            target.currentHealth = Math.min(target.maxHealth, target.currentHealth + 5);
          }
        }
        break;
      case 'add_random_spell':
        const spell = this.getRandomSpell();
        const spellInst = this.createCardInstance(spell);
        if (player.hand.length < 10) {
          player.hand.push(spellInst);
        }
        break;
    }
  }

  executeSpell(state, playerIndex, def, targetInstanceId) {
    const player = state.players[playerIndex];
    const opponent = state.players[playerIndex === 0 ? 1 : 0];
    const opponentIdx = playerIndex === 0 ? 1 : 0;

    // AOE damage
    if (def.spellAoEDamage) {
      for (const minion of opponent.board) {
        this.dealDamageToMinion(state, minion, def.spellAoEDamage, opponentIdx);
      }
    }

    // Single target damage
    if (def.spellDamage && def.spellTarget !== 'none') {
      if (targetInstanceId) {
        const targetMinion = this.findMinion(state, targetInstanceId);
        if (targetMinion) {
          const targetOwner = this.getPlayerIndexByMinion(state, targetInstanceId);
          this.dealDamageToMinion(state, targetMinion, def.spellDamage, targetOwner);
        } else if (targetInstanceId === 'hero_0' || targetInstanceId === 'hero_1') {
          const targetPlayerIdx = parseInt(targetInstanceId.split('_')[1]);
          this.dealDamageToHero(state, targetPlayerIdx, def.spellDamage);
        }
      }
    }

    // Random damage
    if (def.spellDamage && def.spellTarget === 'none' && !def.spellAoEDamage) {
      if (opponent.board.length > 0) {
        const target = opponent.board[Math.floor(Math.random() * opponent.board.length)];
        this.dealDamageToMinion(state, target, def.spellDamage, opponentIdx);
      } else {
        this.dealDamageToHero(state, opponentIdx, def.spellDamage);
      }
    }

    // Heal
    if (def.spellHeal) {
      if (targetInstanceId) {
        const targetMinion = this.findMinion(state, targetInstanceId);
        if (targetMinion) {
          targetMinion.currentHealth = Math.min(targetMinion.maxHealth, targetMinion.currentHealth + def.spellHeal);
        } else if (targetInstanceId === `hero_${playerIndex}`) {
          player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + def.spellHeal);
        }
      }
    }

    // Draw cards
    if (def.spellDraw) {
      for (let i = 0; i < def.spellDraw; i++) {
        this.drawCard(state, playerIndex);
      }
    }

    // Destroy targeted
    if (def.spellDestroy && def.spellTarget === 'enemy' && targetInstanceId) {
      const targetMinion = this.findMinion(state, targetInstanceId);
      if (targetMinion) {
        targetMinion.currentHealth = 0;
      }
    }

    // AOE destroy
    if (def.spellDestroy && def.spellTarget === 'none') {
      for (const m of state.players[0].board) m.currentHealth = 0;
      for (const m of state.players[1].board) m.currentHealth = 0;
    }

    // Buff
    if (def.buffAttack && def.buffHealth && def.spellTarget === 'friendly' && targetInstanceId) {
      const targetMinion = this.findMinion(state, targetInstanceId);
      if (targetMinion) {
        targetMinion.currentAttack += def.buffAttack;
        targetMinion.currentHealth += def.buffHealth;
        targetMinion.maxHealth += def.buffHealth;
      }
    }
  }

  findMinion(state, instanceId) {
    for (const player of state.players) {
      const m = player.board.find(m => m.instanceId === instanceId);
      if (m) return m;
    }
    return null;
  }

  getPlayerIndexByMinion(state, instanceId) {
    for (let i = 0; i < state.players.length; i++) {
      if (state.players[i].board.some(m => m.instanceId === instanceId)) return i;
    }
    return -1;
  }

  attack(state, playerIndex, attackerId, targetId, targetIsHero) {
    if (state.currentPlayerIndex !== playerIndex) return { success: false };

    const player = state.players[playerIndex];
    const opponent = state.players[playerIndex === 0 ? 1 : 0];
    const opponentIdx = playerIndex === 0 ? 1 : 0;

    // Weapon attack
    if (attackerId === 'weapon') {
      if (!player.weapon) return { success: false };
      
      if (targetIsHero) {
        this.dealDamageToHero(state, opponentIdx, player.weapon.attack);
      } else {
        const target = opponent.board.find(m => m.instanceId === targetId);
        if (!target) return { success: false };
        this.dealDamageToMinion(state, target, player.weapon.attack, opponentIdx);
        this.dealDamageToHero(state, playerIndex, target.currentAttack);
      }
      
      player.weapon.durability--;
      if (player.weapon.durability <= 0) {
        this.executeWeaponDeathrattle(state, playerIndex);
        player.weapon = null;
      }
      
      this.checkDeath(state);
      return { success: true };
    }

    const attacker = player.board.find(m => m.instanceId === attackerId);
    if (!attacker || !attacker.canAttack || attacker.hasAttacked) return { success: false };
    if (attacker.currentAttack <= 0) return { success: false };

    // Check taunt
    const hasTaunt = opponent.board.some(m => m.hasTaunt && m.currentHealth > 0);
    if (hasTaunt && !targetIsHero) {
      const target = opponent.board.find(m => m.instanceId === targetId);
      if (target && !target.hasTaunt) return { success: false };
    }
    if (hasTaunt && targetIsHero) return { success: false };

    if (targetIsHero) {
      this.dealDamageToHero(state, opponentIdx, attacker.currentAttack);
      if (attacker.hasLifesteal) {
        player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + attacker.currentAttack);
      }
    } else {
      const target = opponent.board.find(m => m.instanceId === targetId);
      if (!target) return { success: false };

      this.dealDamageToMinion(state, target, attacker.currentAttack, opponentIdx);
      this.dealDamageToMinion(state, attacker, target.currentAttack, playerIndex);

      if (attacker.isPoisonous && target.currentHealth > 0) {
        target.currentHealth = 0;
      }
      if (target.isPoisonous && attacker.currentHealth > 0) {
        attacker.currentHealth = 0;
      }

      if (attacker.hasLifesteal) {
        player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + attacker.currentAttack);
      }
    }

    attacker.hasAttacked = true;
    attacker.attacksThisTurn++;
    if (attacker.hasWindfury && attacker.attacksThisTurn < 2) {
      attacker.hasAttacked = false;
    }

    this.checkDeath(state);
    return { success: true };
  }

  executeDeathrattle(state, minion, ownerIndex) {
    const player = state.players[ownerIndex];
    const def = minion.def;

    if (!def.deathrattleDesc) return;

    switch (def.deathrattleDesc) {
      case 'summon_two_2_2':
        for (let i = 0; i < 2; i++) {
          if (player.board.length < 7) {
            player.board.push({
              instanceId: this.nextInstanceId(),
              cardId: 'token_golem',
              def: { id: 'token_golem', name: 'Голем', type: 'minion', cost: 0, rarity: 'common', attack: 2, health: 2, keywords: [] },
              currentAttack: 2,
              currentHealth: 2,
              maxHealth: 2,
              canAttack: false,
              hasAttacked: false,
              attacksThisTurn: 0,
              hasDivineShield: false,
              isPoisonous: false,
              hasTaunt: false,
              hasWindfury: false,
              hasLifesteal: false,
              hasCharge: false,
            });
          }
        }
        break;
      case 'heal_hero_3':
        player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + 3);
        break;
      case 'return_to_hand_buffed':
        if (player.hand.length < 10) {
          const buffedDef = { ...def, attack: (def.attack || 0) + 2, health: (def.health || 0) + 2 };
          player.hand.push(this.createCardInstance(buffedDef));
        }
        break;
    }
  }

  executeWeaponDeathrattle(state, playerIndex) {
    const player = state.players[playerIndex];
    const opponentIdx = playerIndex === 0 ? 1 : 0;
    if (!player.weapon) return;

    const def = this.getCardById(player.weapon.cardId);
    if (!def || !def.deathrattleDesc) return;

    if (def.deathrattleDesc === 'deal_3_to_enemy_hero') {
      this.dealDamageToHero(state, opponentIdx, 3);
    }
  }

  endTurn(state) {
    state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
    this.startTurn(state);
  }

  checkDeath(state) {
    for (let pi = 0; pi < 2; pi++) {
      const player = state.players[pi];
      const dead = [];

      for (const minion of player.board) {
        if (minion.currentHealth <= 0) {
          dead.push(minion);
        }
      }

      for (const minion of dead) {
        if (minion.def.keywords.includes('deathrattle')) {
          this.executeDeathrattle(state, minion, pi);
        }
        player.board = player.board.filter(m => m.instanceId !== minion.instanceId);
      }
    }

    // Check hero death
    for (let pi = 0; pi < 2; pi++) {
      if (state.players[pi].heroHealth <= 0 && state.winner === null) {
        state.winner = pi === 0 ? 1 : 0;
        state.phase = 'gameOver';
      }
    }
  }
}

const gameEngine = new GameEngine();

function getRoomList() {
  const list = [];
  rooms.forEach((room, id) => {
    list.push({
      id,
      hostName: room.hostName,
      guestName: room.guestName,
      isFull: room.isFull(),
      playerCount: room.host ? (room.guest ? 2 : 1) : 0,
    });
  });
  return list;
}

function broadcastRoomList(wss) {
  const roomList = getRoomList();
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'room_list', rooms: roomList }));
    }
  });
}

// Запуск сервера
async function startServer() {
  // Create Vite dev server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Create HTTP server
  const httpServer = createServer((req, res) => {
    vite.middlewares(req, res, (err) => {
      if (err) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
  });

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    console.log('✅ Новое подключение');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleMessage(ws, data, wss);
      } catch (e) {
        console.error('Ошибка парсинга сообщения:', e);
      }
    });

    ws.on('close', () => {
      console.log('❌ Подключение закрыто');
      const roomId = ws.roomId;
      if (roomId) {
        const room = rooms.get(roomId);
        if (room) {
          room.broadcast({ type: 'player_disconnected' });
          rooms.delete(roomId);
          broadcastRoomList(wss);
        }
      }
    });
  });

  function handleMessage(ws, data, wss) {
    switch (data.type) {
      case 'create_room':
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new GameRoom(roomId, data.playerName);
        room.addPlayer(ws, data.playerName);
        rooms.set(roomId, room);
        ws.send(JSON.stringify({ type: 'room_created', roomId }));
        broadcastRoomList(wss);
        break;

      case 'get_rooms':
        ws.send(JSON.stringify({ type: 'room_list', rooms: getRoomList() }));
        break;

      case 'join_room':
        const joinRoom = rooms.get(data.roomId);
        if (!joinRoom) {
          ws.send(JSON.stringify({ type: 'error', message: 'Комната не найдена' }));
          return;
        }
        if (joinRoom.isFull()) {
          ws.send(JSON.stringify({ type: 'error', message: 'Комната заполнена' }));
          return;
        }
        joinRoom.addPlayer(ws, data.playerName);
        // Отправляем гостю подтверждение подключения
        ws.send(JSON.stringify({ 
          type: 'room_joined', 
          roomId: data.roomId,
          hostName: joinRoom.hostName,
          playerIndex: ws.playerIndex
        }));
        // Уведомляем хоста о подключении гостя
        joinRoom.broadcast({ type: 'player_joined', playerName: data.playerName }, ws);
        broadcastRoomList(wss);
        break;

      case 'start_game':
        const gameRoom = rooms.get(ws.roomId);
        if (gameRoom && gameRoom.isFull()) {
          gameRoom.gameState = gameEngine.createGameState(gameRoom.hostName, gameRoom.guestName);
          gameRoom.broadcast({ type: 'game_start', state: gameRoom.gameState });
        }
        break;

      case 'play_card':
        const playRoom = rooms.get(ws.roomId);
        if (playRoom && playRoom.gameState) {
          const result = gameEngine.playCard(playRoom.gameState, ws.playerIndex, data.instanceId);
          if (result.success) {
            playRoom.broadcast({ type: 'state_update', state: playRoom.gameState });
          }
        }
        break;

      case 'attack':
        const attackRoom = rooms.get(ws.roomId);
        if (attackRoom && attackRoom.gameState) {
          const result = gameEngine.attack(attackRoom.gameState, ws.playerIndex, data.attackerId, data.targetId, data.targetIsHero);
          if (result.success) {
            attackRoom.broadcast({ type: 'state_update', state: attackRoom.gameState });
          }
        }
        break;

      case 'end_turn':
        const turnRoom = rooms.get(ws.roomId);
        if (turnRoom && turnRoom.gameState) {
          gameEngine.endTurn(turnRoom.gameState);
          turnRoom.broadcast({ type: 'state_update', state: turnRoom.gameState });
        }
        break;

      case 'hero_power':
        const heroPowerRoom = rooms.get(ws.roomId);
        if (heroPowerRoom && heroPowerRoom.gameState) {
          // Simple hero power: 1 damage to enemy hero, heal 2
          const player = heroPowerRoom.gameState.players[ws.playerIndex];
          const opponent = heroPowerRoom.gameState.players[ws.playerIndex === 0 ? 1 : 0];
          if (!player.heroPowerUsed && player.currentMana >= 2) {
            player.currentMana -= 2;
            player.heroPowerUsed = true;
            opponent.heroHealth -= 1;
            player.heroHealth = Math.min(player.maxHeroHealth, player.heroHealth + 2);
            heroPowerRoom.broadcast({ type: 'state_update', state: heroPowerRoom.gameState });
          }
        }
        break;
    }
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIp = iface.address;
          break;
        }
      }
    }

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚔  КАРТЫ СУДЬБЫ - Сервер запущен!  ⚔                  ║
║                                                           ║
║   Локальный адрес: http://localhost:${PORT}               ║
║   Сетевой адрес:   http://${localIp}:${PORT}              ║
║                                                           ║
║   Откройте в браузере и поделитесь адресом с другом!     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);
