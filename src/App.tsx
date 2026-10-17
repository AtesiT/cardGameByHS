import { useState, useEffect, useCallback } from 'react';
import { GameState, Screen, GameMode, EmotionType } from './types';
import { createGameState, startGame, playCard, attack, endTurn, useHeroPower, aiTurn } from './engine/GameEngine';
import { audio } from './audio/AudioEngine';
import { DECK_PRESETS } from './data/cards';
import { HeroClass } from './data/classes';
import MainMenu from './components/MainMenu';
import GameBoard from './components/GameBoard';
import Collection from './components/Collection';
import ResultScreen from './components/ResultScreen';
import PassDevice from './components/PassDevice';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import DeckBuilder from './components/DeckBuilder';
import Profile from './components/Profile';
import Settings from './components/Settings';
import { DamageNumberDisplay, useDamageNumbers } from './components/DamageNumbers';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('hotseat');
  const [playerView, setPlayerView] = useState<0 | 1>(0);
  const [emotion, setEmotion] = useState<{ type: EmotionType; player: number } | null>(null);
  const [muted, setMuted] = useState(false);
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [turnBannerText, setTurnBannerText] = useState('');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [targeting, setTargeting] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showPassDevice, setShowPassDevice] = useState(false);
  const { numbers: damageNumbers, addNumber } = useDamageNumbers();
  
  // Multiplayer state
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [playerName] = useState('Игрок_' + Math.random().toString(36).substring(2, 6).toUpperCase());
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    audio.init();
  }, []);

  // WebSocket connection for multiplayer
  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setWs(socket);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return socket;
  }, []);

  const handleMultiplayer = useCallback(() => {
    audio.playClick();
    connectWebSocket();
    setScreen('lobby');
  }, [connectWebSocket]);

  const handleCreateRoom = useCallback(() => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'create_room', playerName }));
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room_created') {
          setRoomId(data.roomId);
          setIsHost(true);
          setScreen('waiting');
          ws.removeEventListener('message', handleMessage);
        }
      } catch (e) {
        console.error('Error:', e);
      }
    };
    
    ws.addEventListener('message', handleMessage);
  }, [ws, playerName]);

  const handleJoinRoom = useCallback((roomIdToJoin: string) => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'join_room', roomId: roomIdToJoin, playerName }));
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'player_joined' || data.type === 'room_created') {
          setRoomId(roomIdToJoin);
          setIsHost(false);
          setScreen('waiting');
          ws.removeEventListener('message', handleMessage);
        } else if (data.type === 'error') {
          alert(data.message);
          ws.removeEventListener('message', handleMessage);
        }
      } catch (e) {
        console.error('Error:', e);
      }
    };
    
    ws.addEventListener('message', handleMessage);
  }, [ws, playerName]);

  const handleStartGameFromWaiting = useCallback(() => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'start_game' }));
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'game_start') {
          setGameState(data.state);
          setPlayerView(isHost ? 0 : 1);
          setGameMode('online');
          setScreen('game');
          startGame(data.state);
          setGameState({ ...data.state });
          ws.removeEventListener('message', handleMessage);
        }
      } catch (e) {
        console.error('Error:', e);
      }
    };
    
    ws.addEventListener('message', handleMessage);
  }, [ws, isHost]);

  const handleLeaveRoom = useCallback(() => {
    if (ws) {
      ws.close();
    }
    setWs(null);
    setRoomId(null);
    setIsHost(false);
    setScreen('menu');
  }, [ws]);

  const startNewGame = useCallback((mode: GameMode, deckPreset?: string, heroClass?: HeroClass) => {
    audio.resume();
    audio.playClick();
    setGameMode(mode);
    
    // Get deck preset cards if specified
    let deck1Preset: string[] | undefined;
    let deck2Preset: string[] | undefined;
    if (deckPreset) {
      const preset = DECK_PRESETS[deckPreset as keyof typeof DECK_PRESETS];
      if (preset) {
        deck1Preset = preset.cards;
        // AI uses random deck
        deck2Preset = undefined;
      }
    }
    
    const state = createGameState('Игрок 1', mode === 'ai' ? 'AI Противник' : 'Игрок 2', deck1Preset, deck2Preset);
    setGameState(state);
    setPlayerView(0);
    setScreen('game');
    startGame(state);
    setGameState({ ...state });
    setShowTurnBanner(true);
    setTurnBannerText(`${state.players[0].name} — Ваш ход!`);
    audio.playTurnStart();
    setTimeout(() => setShowTurnBanner(false), 1500);
  }, []);

  const handlePlayCard = useCallback((instanceId: string) => {
    if (!gameState || animating) return;
    const card = gameState.players[playerView].hand.find(c => c.instanceId === instanceId);
    if (!card) return;

    // If card needs a target, enter targeting mode
    if (card.def.type === 'spell' && card.def.spellTarget && card.def.spellTarget !== 'none') {
      setSelectedCard(instanceId);
      setTargeting(true);
      return;
    }

    // Play without target
    const result = playCard(gameState, playerView, instanceId, null);
    if (result.success) {
      if (card.def.type === 'spell') {
        audio.playCardPlaySpell();
        // Show spell effect
        setShowTurnBanner(true);
        setTurnBannerText(`✨ ${card.def.name}!`);
        setTimeout(() => setShowTurnBanner(false), 800);
      } else {
        audio.playCardPlay();
      }
      setGameState({ ...gameState });
      checkAITurn(gameState);
    }
  }, [gameState, playerView, animating]);

  const handleTargetSelect = useCallback((targetId: string, isHero: boolean, heroPlayerIndex?: number) => {
    if (!gameState || !selectedCard) return;
    const card = gameState.players[playerView].hand.find(c => c.instanceId === selectedCard);
    let targetInstanceId: string;
    
    if (isHero) {
      // If spell can target friendly, allow own hero; otherwise enemy hero
      if (card?.def.spellTarget === 'friendly' || card?.def.spellHeal) {
        targetInstanceId = `hero_${heroPlayerIndex ?? playerView}`;
      } else {
        targetInstanceId = `hero_${playerView === 0 ? 1 : 0}`;
      }
    } else {
      targetInstanceId = targetId;
    }
    
    const result = playCard(gameState, playerView, selectedCard, targetInstanceId);
    if (result.success) {
      audio.playCardPlaySpell();
      setGameState({ ...gameState });
      checkAITurn(gameState);
    }
    setSelectedCard(null);
    setTargeting(false);
  }, [gameState, selectedCard, playerView]);

  const handleAttack = useCallback((attackerId: string, targetId: string, targetIsHero: boolean) => {
    if (!gameState || animating) return;
    const opponentIdx = playerView === 0 ? 1 : 0;
    const result = attack(gameState, playerView, attackerId, targetId, targetIsHero, opponentIdx);
    if (result.success) {
      audio.playAttack();
      setAnimating(true);
      setTimeout(() => {
        audio.playDamage();
        setGameState({ ...gameState });
        setAnimating(false);
        checkGameOver(gameState);
        checkAITurn(gameState);
      }, 400);
    }
  }, [gameState, playerView, animating]);

  const handleEndTurn = useCallback(() => {
    if (!gameState) return;
    if (gameState.phase === 'gameOver') return;
    setAnimating(false); // Reset any stuck animation
    audio.playClick();
    endTurn(gameState);
    
    // If AI turn, add delay before AI acts
    if (gameMode === 'ai' && gameState.currentPlayerIndex === 1) {
      setTimeout(() => {
        const actions = aiTurn(gameState);
        setGameState({ ...gameState });
        // Return control to player after AI finishes
        setTimeout(() => {
          setPlayerView(0);
          setShowTurnBanner(true);
          setTurnBannerText('Ваш ход!');
          audio.playTurnStart();
          setTimeout(() => setShowTurnBanner(false), 1500);
        }, 500);
      }, 1500); // AI waits 1.5 seconds before acting
    }
    const newView = playerView === 0 ? 1 : 0;
    setPlayerView(newView as 0 | 1);
    setGameState({ ...gameState });

    if (gameMode === 'hotseat' && gameState.turnNumber > 1) {
      // Show pass device screen (not on first turn)
      setShowPassDevice(true);
    } else {
      setShowTurnBanner(true);
      setTurnBannerText('Ход противника...');
      audio.playTurnStart();
      setTimeout(() => setShowTurnBanner(false), 1500);
    }

    if (gameMode === 'ai' && newView === 1) {
      setTimeout(() => {
        aiTurn(gameState);
        setGameState({ ...gameState });
        setPlayerView(0);
        setShowTurnBanner(true);
        setTurnBannerText('Ваш ход!');
        audio.playTurnStart();
        setTimeout(() => setShowTurnBanner(false), 1500);
        checkGameOver(gameState);
      }, 1000);
    }
  }, [gameState, playerView, animating, gameMode]);

  const handleHeroPower = useCallback(() => {
    if (!gameState || animating) return;
    const result = useHeroPower(gameState, playerView);
    if (result.success) {
      audio.playHeal();
      setGameState({ ...gameState });
    }
  }, [gameState, playerView, animating]);

  const handleEmotion = useCallback((type: EmotionType) => {
    audio.playEmotion();
    setEmotion({ type, player: playerView });
    setTimeout(() => setEmotion(null), 2000);
  }, [playerView]);

  const handleWeaponAttack = useCallback((targetId: string, targetIsHero: boolean) => {
    if (!gameState || animating) return;
    const opponentIdx = playerView === 0 ? 1 : 0;
    const result = attack(gameState, playerView, 'weapon', targetId, targetIsHero, opponentIdx);
    if (result.success) {
      audio.playAttack();
      setGameState({ ...gameState });
      checkGameOver(gameState);
    }
  }, [gameState, playerView, animating]);

  const checkGameOver = (state: GameState) => {
    if (state.phase === 'gameOver' && state.winner !== null) {
      setTimeout(() => {
        if (state.winner === playerView || (gameMode === 'ai' && state.winner === 0)) {
          audio.playVictory();
        } else {
          audio.playDefeat();
        }
        setScreen('result');
      }, 1000);
    }
  };

  const checkAITurn = (state: GameState) => {
    if (state.phase === 'gameOver') {
      checkGameOver(state);
    }
  };

  const toggleMute = () => {
    const m = audio.toggleMute();
    setMuted(m);
  };

  const cancelTargeting = () => {
    setSelectedCard(null);
    setTargeting(false);
  };

  return (
    <div className="min-h-screen overflow-hidden select-none px-bg-dark" style={{ fontFamily: "'Press Start 2P', monospace" }}>
      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="fixed top-3 right-3 z-50 px-btn bg-gray-900 border-amber-500 text-amber-400 px-3 py-2 hover:bg-gray-800"
        style={{ fontSize: '10px' }}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* Turn Banner */}
      {showTurnBanner && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-black/90 border-4 border-amber-400 px-8 py-4 animate-px-turn-banner">
            <p className="text-amber-400 text-center px-text-glow-gold" style={{ fontSize: '12px' }}>
              {turnBannerText}
            </p>
          </div>
        </div>
      )}

      {/* Emotion popup */}
      {emotion && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-30 animate-px-bounce">
          <div className="bg-white border-4 border-gray-900 px-4 py-2">
            <p style={{ fontSize: '10px' }}>{getEmotionText(emotion.type)}</p>
          </div>
        </div>
      )}

      {screen === 'menu' && (
        <MainMenu
          onStartGame={startNewGame}
          onShowCollection={() => { audio.playClick(); setScreen('collection'); }}
          onMultiplayer={handleMultiplayer}
          onDeckBuilder={() => { audio.playClick(); setScreen('deckbuilder'); }}
          onProfile={() => { audio.playClick(); setScreen('profile'); }}
          onSettings={() => { audio.playClick(); setScreen('settings'); }}
        />
      )}

      {screen === 'lobby' && (
        <Lobby
          ws={ws}
          playerName={playerName}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onBack={() => { 
            if (ws) ws.close();
            setWs(null);
            setScreen('menu'); 
          }}
        />
      )}

      {screen === 'waiting' && roomId && (
        <WaitingRoom
          ws={ws}
          roomId={roomId}
          playerName={playerName}
          onStartGame={handleStartGameFromWaiting}
          onLeave={handleLeaveRoom}
        />
      )}

      {screen === 'game' && gameState && (
        <GameBoard
          state={gameState}
          playerView={playerView}
          gameMode={gameMode}
          selectedCard={selectedCard}
          targeting={targeting}
          animating={animating}
          emotion={emotion}
          onPlayCard={handlePlayCard}
          onAttack={handleAttack}
          onEndTurn={handleEndTurn}
          onHeroPower={handleHeroPower}
          onEmotion={handleEmotion}
          onTargetSelect={handleTargetSelect}
          onWeaponAttack={handleWeaponAttack}
          onCancelTargeting={cancelTargeting}
          onLeave={() => { audio.playClick(); setScreen('menu'); setGameState(null); }}
          onDamageNumber={addNumber}
        />
      )}

      {screen === 'collection' && (
        <Collection onBack={() => { audio.playClick(); setScreen('menu'); }} />
      )}

      {screen === 'result' && gameState && (
        <ResultScreen
          winner={gameState.winner!}
          playerView={playerView}
          gameMode={gameMode}
          onPlayAgain={() => startNewGame(gameMode)}
          onMenu={() => { audio.playClick(); setScreen('menu'); setGameState(null); }}
        />
      )}

      {screen === 'deckbuilder' && (
        <DeckBuilder onBack={() => { audio.playClick(); setScreen('menu'); }} />
      )}

      {screen === 'profile' && (
        <Profile onBack={() => { audio.playClick(); setScreen('menu'); }} />
      )}

      {screen === 'settings' && (
        <Settings onBack={() => { audio.playClick(); setScreen('menu'); }} />
      )}

      {/* Pass device screen for hotseat */}
      {showPassDevice && gameState && (
        <PassDevice
          playerName={gameState.players[playerView].name}
          onReady={() => {
            audio.playTurnStart();
            setShowPassDevice(false);
            setShowTurnBanner(true);
            setTurnBannerText(`${gameState.players[playerView].name} — Ваш ход!`);
            setTimeout(() => setShowTurnBanner(false), 1500);
          }}
        />
      )}

      {/* Damage numbers */}
      <DamageNumberDisplay numbers={damageNumbers} />
    </div>
  );
}

function getEmotionText(type: EmotionType): string {
  const texts: Record<EmotionType, string> = {
    greetings: '👋 Привет!',
    thanks: '🙏 Спасибо!',
    well_played: '👏 Хорошо!',
    oops: '😅 Упс!',
    threat: '😈 Угроза!',
    laughter: '😂 Ха-ха!',
    wow: '😮 Вау!',
    sadness: '😢 Грусть...',
  };
  return texts[type] || '';
}
