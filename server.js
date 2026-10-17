const WebSocket = require('ws');
const path = require('path');
const http = require('http');
const fs = require('fs');

const PORT = 8080;

// Game state storage
const rooms = new Map();
const players = new Map();

class GameRoom {
  constructor(id, hostName) {
    this.id = id;
    this.host = null;
    this.guest = null;
    this.hostName = hostName;
    this.guestName = null;
    this.gameState = null;
    this.hostReady = false;
    this.guestReady = false;
  }

  addPlayer(ws, playerName) {
    if (!this.host) {
      this.host = ws;
      this.hostName = playerName;
      ws.playerIndex = 0;
      ws.roomId = this.id;
    } else if (!this.guest) {
      this.guest = ws;
      this.guestName = playerName;
      ws.playerIndex = 1;
      ws.roomId = this.id;
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
    if (this.host && this.host !== excludeWs && this.host.readyState === WebSocket.OPEN) {
      this.host.send(msg);
    }
    if (this.guest && this.guest !== excludeWs && this.guest.readyState === WebSocket.OPEN) {
      this.guest.send(msg);
    }
  }

  sendTo(playerIndex, message) {
    const ws = playerIndex === 0 ? this.host : this.guest;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

// Simple game engine (server-side)
class ServerGameEngine {
  constructor() {
    this.instanceCounter = 0;
  }

  nextInstanceId() {
    return `inst_${++this.instanceCounter}_${Date.now()}`;
  }

  createCardInstance(def) {
    return { instanceId: this.nextInstanceId(), cardId: def.id, def };
  }

  buildDeck() {
    const CARD_DATABASE = this.getCardDatabase();
    const deck = [];
    for (const card of CARD_DATABASE) {
      const copies = card.rarity === 'common' ? 2 : 1;
      for (let i = 0; i < copies; i++) {
        deck.push(this.createCardInstance(card));
      }
    }
    while (deck.length > 30) deck.pop();
    while (deck.length < 30) {
      const randomCard = CARD_DATABASE[Math.floor(Math.random() * CARD_DATABASE.length)];
      deck.push(this.createCardInstance(randomCard));
    }
    return this.shuffleArray(deck);
  }

  shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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
    const p1 = this.createPlayer(player1Name, 'player1');
    const p2 = this.createPlayer(player2Name, 'player2');

    const state = {
      players: [p1, p2],
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
      player.heroHealth -= player.fatigue;
      return null;
    }
    const card = player.deck.pop();
    if (player.hand.length >= 10) {
      return null;
    }
    player.hand.push(card);
    return card;
  }

  startTurn(state) {
    const idx = state.currentPlayerIndex;
    const player = state.players[idx];

    if (player.maxMana < 10) player.maxMana++;
    player.currentMana = player.maxMana;

    this.drawCard(state, idx);

    for (const minion of player.board) {
      minion.hasAttacked = false;
      minion.attacksThisTurn = 0;
      minion.canAttack = minion.currentAttack > 0;
    }

    player.heroPowerUsed = false;
    state.turnNumber++;
  }

  playCard(state, playerIndex, instanceId, targetInstanceId) {
    if (state.phase !== 'playing') return { success: false };
    if (state.currentPlayerIndex !== playerIndex) return { success: false };

    const player = state.players[playerIndex];
    const cardIndex = player.hand.findIndex(c => c.instanceId === instanceId);
    if (cardIndex === -1) return { success: false };

    const cardInst = player.hand[cardIndex];
    const def = cardInst.def;

    if (def.cost > player.currentMana) return { success: false };

    player.currentMana -= def.cost;
    player.hand.splice(cardIndex, 1);

    if (def.type === 'minion') {
      if (player.board.length >= 7) return { success: false };
      const minion = {
        instanceId: cardInst.instanceId,
        cardId: cardInst.cardId,
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
    }

    this.checkDeath(state);
    return { success: true };
  }

  attack(state, playerIndex, attackerInstanceId, targetInstanceId, targetIsHero) {
    if (state.currentPlayerIndex !== playerIndex) return { success: false };

    const player = state.players[playerIndex];
    const opponent = state.players[playerIndex === 0 ? 1 : 0];

    const attacker = player.board.find(m => m.instanceId === attackerInstanceId);
    if (!attacker || !attacker.canAttack || attacker.hasAttacked) return { success: false };

    if (targetIsHero) {
      opponent.heroHealth -= attacker.currentAttack;
    } else {
      const target = opponent.board.find(m => m.instanceId === targetInstanceId);
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
    for (let pi = 0; pi < 2; pi++) {
      const player = state.players[pi];
      player.board = player.board.filter(m => m.currentHealth > 0);
    }

    for (let pi = 0; pi < 2; pi++) {
      if (state.players[pi].heroHealth <= 0 && state.winner === null) {
        state.winner = pi === 0 ? 1 : 0;
        state.phase = 'gameOver';
      }
    }
  }

  getCardDatabase() {
    return [
      { id: 'm01', name: 'Огненный имп', type: 'minion', cost: 1, rarity: 'common', attack: 3, health: 2, description: 'Боевой клич: 1 урон вашему герою', flavorText: 'Маленький, но горячий', keywords: ['battlecry'] },
      { id: 'm02', name: 'Серебряный рыцарь', type: 'minion', cost: 3, rarity: 'rare', attack: 2, health: 2, description: 'Божественный щит. Рывок.', flavorText: 'Сияет как солнце', keywords: ['divine_shield', 'charge'] },
      { id: 'm03', name: 'Ледяной страж', type: 'minion', cost: 4, rarity: 'common', attack: 3, health: 5, description: 'Провокация', flavorText: 'Крепкий как лёд', keywords: ['taunt'] },
      { id: 's01', name: 'Огненный шар', type: 'spell', cost: 4, rarity: 'common', description: '6 урона цели', flavorText: 'Классика', keywords: [], spellTarget: 'any', spellDamage: 6 },
      { id: 's02', name: 'Исцеление', type: 'spell', cost: 2, rarity: 'common', description: '+6 HP', flavorText: 'Свет исцеляет', keywords: [], spellTarget: 'any', spellHeal: 6 },
      { id: 'w01', name: 'Меч новобранца', type: 'weapon', cost: 1, rarity: 'common', description: 'Оружие 2/2', flavorText: 'Простой меч', keywords: [], weaponAttack: 2, weaponDurability: 2 },
    ];
  }
}

const gameEngine = new ServerGameEngine();

function getRoomList() {
  const list = [];
  rooms.forEach((room, id) => {
    list.push({
      id: id,
      hostName: room.hostName,
      guestName: room.guestName,
      isFull: room.isFull(),
      playerCount: room.host ? (room.guest ? 2 : 1) : 0
    });
  });
  return list;
}

function broadcastRoomList() {
  const roomList = getRoomList();
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'room_list', rooms: roomList }));
    }
  });
}

// HTTP server for static files
const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './dist/index.html';
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpg'; break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Connection closed');
    const roomId = ws.roomId;
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.broadcast({ type: 'player_disconnected' });
        rooms.delete(roomId);
        broadcastRoomList();
      }
    }
  });
});

function handleMessage(ws, data) {
  switch (data.type) {
    case 'create_room':
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const room = new GameRoom(roomId, data.playerName);
      room.addPlayer(ws, data.playerName);
      rooms.set(roomId, room);
      ws.roomId = roomId;
      ws.playerName = data.playerName;
      ws.send(JSON.stringify({ type: 'room_created', roomId, rooms: getRoomList() }));
      broadcastRoomList();
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
      ws.roomId = data.roomId;
      ws.playerName = data.playerName;
      joinRoom.broadcast({ type: 'player_joined', playerName: data.playerName });
      broadcastRoomList();
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
        const result = gameEngine.playCard(playRoom.gameState, ws.playerIndex, data.instanceId, data.targetId);
        if (result.success) {
          playRoom.broadcast({ type: 'state_update', state: playRoom.gameState, action: { type: 'play_card', cardId: data.instanceId } });
        }
      }
      break;

    case 'attack':
      const attackRoom = rooms.get(ws.roomId);
      if (attackRoom && attackRoom.gameState) {
        const result = gameEngine.attack(attackRoom.gameState, ws.playerIndex, data.attackerId, data.targetId, data.targetIsHero);
        if (result.success) {
          attackRoom.broadcast({ type: 'state_update', state: attackRoom.gameState, action: { type: 'attack', attackerId: data.attackerId, targetId: data.targetId } });
        }
      }
      break;

    case 'end_turn':
      const turnRoom = rooms.get(ws.roomId);
      if (turnRoom && turnRoom.gameState) {
        gameEngine.endTurn(turnRoom.gameState);
        turnRoom.broadcast({ type: 'state_update', state: turnRoom.gameState, action: { type: 'end_turn' } });
      }
      break;
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚔  КАРТЫ СУДЬБЫ - Сервер запущен!  ⚔                  ║
║                                                           ║
║   Локальный адрес: http://localhost:${PORT}                  ║
║   Сетевой адрес:   http://<YOUR_IP>:${PORT}                  ║
║                                                           ║
║   Откройте в браузере и поделитесь адресом с другом!     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
