import { useState, useEffect } from 'react';

interface Props {
  ws: WebSocket | null;
  roomId: string;
  playerName: string;
  onStartGame: () => void;
  onLeave: () => void;
}

export default function WaitingRoom({ ws, roomId, playerName, onStartGame, onLeave }: Props) {
  const [guestName, setGuestName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'player_joined') {
          setGuestName(data.playerName);
        } else if (data.type === 'player_disconnected') {
          setGuestName(null);
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen px-bg-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b-4 border-amber-600 pb-3">
          <button
            onClick={onLeave}
            className="px-btn bg-gray-800 border-gray-500 text-gray-300 px-4 py-2 hover:bg-gray-700"
            style={{ fontSize: '10px' }}
          >
            ← ВЫЙТИ
          </button>
          <h1 className="text-amber-400 px-text-glow-gold" style={{ fontSize: '16px' }}>
            ⏳ ОЖИДАНИЕ
          </h1>
          <div className="text-gray-400" style={{ fontSize: '8px' }}>
            👤 {playerName}
          </div>
        </div>

        {/* Room Code */}
        <div className="bg-gray-900 border-4 border-amber-500 p-6 mb-6 text-center">
          <p className="text-amber-400 mb-4" style={{ fontSize: '10px' }}>
            КОД КОМНАТЫ:
          </p>
          <div className="bg-black border-2 border-amber-600 py-4 px-6 mb-4">
            <span className="text-amber-300 px-text-glow-gold" style={{ fontSize: '24px', letterSpacing: '4px' }}>
              {roomId}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-btn bg-amber-800 border-amber-400 text-amber-100 px-6 py-2 hover:bg-amber-700"
            style={{ fontSize: '10px' }}
          >
            {copied ? '✓ СКОПИРОВАНО' : '📋 КОПИРОВАТЬ КОД'}
          </button>
          <p className="text-gray-500 mt-4" style={{ fontSize: '8px' }}>
            Отправьте этот код другу для подключения
          </p>
        </div>

        {/* Players */}
        <div className="bg-gray-900 border-4 border-gray-600 p-6 mb-6">
          <p className="text-gray-400 mb-4" style={{ fontSize: '10px' }}>
            ИГРОКИ:
          </p>
          
          <div className="space-y-3">
            {/* Host */}
            <div className="bg-gray-800 border-2 border-green-500 p-3 flex items-center justify-between">
              <div>
                <div className="text-green-400" style={{ fontSize: '10px' }}>
                  👑 {playerName}
                </div>
                <div className="text-gray-500 mt-1" style={{ fontSize: '8px' }}>
                  Хост
                </div>
              </div>
              <div className="text-green-400" style={{ fontSize: '10px' }}>
                ✓ ГОТОВ
              </div>
            </div>

            {/* Guest */}
            <div className={`bg-gray-800 border-2 p-3 flex items-center justify-between ${
              guestName ? 'border-blue-500' : 'border-gray-600 border-dashed'
            }`}>
              <div>
                <div className={`${guestName ? 'text-blue-400' : 'text-gray-500'}`} style={{ fontSize: '10px' }}>
                  {guestName ? `🎮 ${guestName}` : '⏳ Ожидание игрока...'}
                </div>
                <div className="text-gray-500 mt-1" style={{ fontSize: '8px' }}>
                  {guestName ? 'Игрок 2' : 'Поделитесь кодом комнаты'}
                </div>
              </div>
              {guestName && (
                <div className="text-blue-400" style={{ fontSize: '10px' }}>
                  ✓ ГОТОВ
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={onStartGame}
          disabled={!guestName}
          className="w-full px-btn bg-green-800 border-green-400 text-green-100 py-4 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:border-gray-600 disabled:text-gray-500"
          style={{ fontSize: '12px' }}
        >
          {guestName ? '🎮 НАЧАТЬ ИГРУ' : '⏳ ОЖИДАНИЕ ИГРОКА...'}
        </button>

        {/* Instructions */}
        <div className="mt-6 bg-gray-900/50 border-2 border-gray-700 p-4">
          <p className="text-gray-400 mb-2" style={{ fontSize: '8px' }}>
            💡 КАК ПОДКЛЮЧИТЬСЯ:
          </p>
          <ol className="text-gray-500 space-y-1" style={{ fontSize: '7px' }}>
            <li>1. Друг открывает игру на своём компьютере</li>
            <li>2. Нажимает "МУЛЬТИПЛЕЕР"</li>
            <li>3. Вводит код комнаты: <span className="text-amber-400">{roomId}</span></li>
            <li>4. Нажимает "ВОЙТИ"</li>
            <li>5. Игра начнётся автоматически!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
