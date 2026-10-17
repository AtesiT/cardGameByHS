import { useState, useEffect } from 'react';

interface Room {
  id: string;
  hostName: string;
  guestName: string | null;
  isFull: boolean;
  playerCount: number;
}

interface Props {
  ws: WebSocket | null;
  playerName: string;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onBack: () => void;
}

export default function Lobby({ ws, playerName, onCreateRoom, onJoinRoom, onBack }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room_list') {
          setRooms(data.rooms);
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    };

    ws.addEventListener('message', handleMessage);
    
    // Request room list
    ws.send(JSON.stringify({ type: 'get_rooms' }));

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const handleJoin = () => {
    if (joinCode.trim()) {
      onJoinRoom(joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen px-bg-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b-4 border-amber-600 pb-3">
          <button
            onClick={onBack}
            className="px-btn bg-gray-800 border-gray-500 text-gray-300 px-4 py-2 hover:bg-gray-700"
            style={{ fontSize: '10px' }}
          >
            ← НАЗАД
          </button>
          <h1 className="text-amber-400 px-text-glow-gold" style={{ fontSize: '16px' }}>
            🏰 ЛОББИ
          </h1>
          <div className="text-gray-400" style={{ fontSize: '8px' }}>
            👤 {playerName}
          </div>
        </div>

        {/* Create Room Button */}
        <button
          onClick={onCreateRoom}
          className="w-full px-btn bg-green-800 border-green-400 text-green-100 py-4 mb-6 hover:bg-green-700"
          style={{ fontSize: '12px' }}
        >
          ➕ СОЗДАТЬ КОМНАТУ
        </button>

        {/* Join by Code */}
        <div className="mb-6 bg-gray-900 border-4 border-blue-600 p-4">
          <p className="text-blue-400 mb-3" style={{ fontSize: '10px' }}>
            🔑 ПРИСОЕДИНИТЬСЯ ПО КОДУ:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="КОД КОМНАТЫ"
              maxLength={6}
              className="flex-1 px-btn bg-gray-800 border-gray-600 text-white px-4 py-2 text-center"
              style={{ fontSize: '12px', letterSpacing: '2px' }}
            />
            <button
              onClick={handleJoin}
              disabled={!joinCode.trim()}
              className="px-btn bg-blue-800 border-blue-400 text-blue-100 px-6 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: '10px' }}
            >
              ВОЙТИ
            </button>
          </div>
        </div>

        {/* Room List */}
        <div className="bg-gray-900 border-4 border-gray-600 p-4">
          <p className="text-gray-400 mb-3" style={{ fontSize: '10px' }}>
            📋 ДОСТУПНЫЕ КОМНАТЫ ({rooms.length}):
          </p>
          
          {rooms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500" style={{ fontSize: '10px' }}>
                Нет доступных комнат
              </p>
              <p className="text-gray-600 mt-2" style={{ fontSize: '8px' }}>
                Создайте свою комнату или подождите, пока кто-то создаст
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-gray-800 border-2 border-gray-600 p-3 flex items-center justify-between hover:border-amber-500 transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-amber-400" style={{ fontSize: '10px' }}>
                      🎮 {room.hostName}
                    </div>
                    <div className="text-gray-500 mt-1" style={{ fontSize: '8px' }}>
                      Код: <span className="text-blue-400">{room.id}</span>
                      {' • '}
                      Игроков: {room.playerCount}/2
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinRoom(room.id)}
                    disabled={room.isFull}
                    className="px-btn bg-amber-800 border-amber-400 text-amber-100 px-4 py-2 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontSize: '8px' }}
                  >
                    {room.isFull ? 'ПОЛНА' : 'ВОЙТИ'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
