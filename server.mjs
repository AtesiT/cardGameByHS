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

// Простой игровой движок
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

  getCardDatabase() {
    return [
      { id: 'm01', name: 'Огненный имп', type: 'minion', cost: 1, rarity: 'common', attack: 3, health: 2, keywords: [] },
      { id: 'm02', name: 'Серебряный рыцарь', type: 'minion', cost: 3, rarity: 'rare', attack: 2, health: 2, keywords: ['charge'] },
      { id: 'm03', name: 'Ледяной страж', type: 'minion', cost: 4, rarity: 'common', attack: 3, health: 5, keywords: ['taunt'] },
      { id: 's01', name: 'Огненный шар', type: 'spell', cost: 4, rarity: 'common', keywords: [] },
      { id: 'w01', name: 'Меч новобранца', type: 'weapon', cost: 1, rarity: 'common', weaponAttack: 2, weaponDurability: 2, keywords: [] },
    ];
  }

  buildDeck() {
    const deck = [];
    const cards = this.getCardDatabase();
    while (deck.length < 30) {
      const card = cards[Math.floor(Math.random() * cards.length)];
      deck.push(this.createCardInstance(card));
    }
    return this.shuffleArray(deck);
  }

  createPlayer(name, id) {
    return {
      id,
      name,
      heroHealth: 30,
      maxHeroHealth: 30,
      maxMana: 0,
      currentMana: 0,
      deck: this.buildDeck(),
      hand: [],
      board: [],
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

    // Draw initial hands
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
      player.heroHealth -= player.fatigue;
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
      minion.canAttack = true;
    }

    player.heroPowerUsed = false;
    state.turnNumber++;
  }

  playCard(state, playerIndex, instanceId) {
    if (state.currentPlayerIndex !== playerIndex) return { success: false };

    const player = state.players[playerIndex];
    const cardIndex = player.hand.findIndex(c => c.instanceId === instanceId);
    if (cardIndex === -1) return { success: false };

    const card = player.hand[cardIndex];
    if (card.def.cost > player.currentMana) return { success: false };

    player.currentMana -= card.def.cost;
    player.hand.splice(cardIndex, 1);

    if (card.def.type === 'minion' && player.board.length < 7) {
      player.board.push({
        instanceId: card.instanceId,
        cardId: card.cardId,
        def: card.def,
        currentAttack: card.def.attack || 0,
        currentHealth: card.def.health || 1,
        maxHealth: card.def.health || 1,
        canAttack: false,
        hasAttacked: false,
      });
    }

    return { success: true };
  }

  attack(state, playerIndex, attackerId, targetId, targetIsHero) {
    if (state.currentPlayerIndex !== playerIndex) return { success: false };

    const player = state.players[playerIndex];
    const opponent = state.players[playerIndex === 0 ? 1 : 0];
    const attacker = player.board.find(m => m.instanceId === attackerId);

    if (!attacker || !attacker.canAttack || attacker.hasAttacked) return { success: false };

    if (targetIsHero) {
      opponent.heroHealth -= attacker.currentAttack;
    } else {
      const target = opponent.board.find(m => m.instanceId === targetId);
      if (!target) return { success: false };
      target.currentHealth -= attacker.currentAttack;
      attacker.currentHealth -= target.currentAttack;
    }

    attacker.hasAttacked = true;
    this.checkDeath(state);
    return { success: true };
  }

  endTurn(state) {
    state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
    this.startTurn(state);
  }

  checkDeath(state) {
    for (let i = 0; i < 2; i++) {
      state.players[i].board = state.players[i].board.filter(m => m.currentHealth > 0);
      if (state.players[i].heroHealth <= 0 && !state.winner) {
        state.winner = i === 0 ? 1 : 0;
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
