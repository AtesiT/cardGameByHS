import { useState, useEffect } from 'react';

interface Props {
  playerName: string;
  onReady: () => void;
}

export default function PassDevice({ playerName, onReady }: Props) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">🔄</div>
        <h2 className="text-amber-400 mb-4" style={{ fontSize: '14px' }}>
          Передайте устройство
        </h2>
        <p className="text-gray-300 mb-6" style={{ fontSize: '10px' }}>
          Сейчас ход: <span className="text-amber-300">{playerName}</span>
        </p>
        
        {countdown > 0 ? (
          <div className="text-amber-400 text-4xl animate-pulse" style={{ fontSize: '32px' }}>
            {countdown}
          </div>
        ) : (
          <button
            onClick={onReady}
            className="bg-gradient-to-b from-green-600 to-green-800 border-2 border-green-400 text-green-100 px-8 py-4 hover:from-green-500 hover:to-green-700 transition-all hover:scale-105 animate-pulse"
            style={{ fontSize: '12px' }}
          >
            👁️ Я готов! Показать руку
          </button>
        )}

        <p className="text-gray-600 mt-4" style={{ fontSize: '7px' }}>
          Убедитесь, что противник не видит экран
        </p>
      </div>
    </div>
  );
}
