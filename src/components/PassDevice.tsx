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
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center px-scanlines">
      <div className="text-center">
        <div className="text-5xl mb-6 animate-px-bounce">🔄</div>
        <h2 className="text-amber-400 mb-4 px-text-glow-gold" style={{ fontSize: '14px' }}>
          ПЕРЕДАЙТЕ УСТРОЙСТВО
        </h2>
        <p className="text-gray-300 mb-8" style={{ fontSize: '10px' }}>
          СЕЙЧАС ХОД: <span className="text-amber-300">{playerName}</span>
        </p>
        
        {countdown > 0 ? (
          <div className="text-amber-400 animate-px-blink" style={{ fontSize: '32px' }}>
            {countdown}
          </div>
        ) : (
          <button
            onClick={onReady}
            className="px-btn bg-green-800 border-green-400 text-green-100 px-8 py-4 hover:bg-green-700 animate-px-bounce"
            style={{ fontSize: '12px' }}
          >
            👁 Я ГОТОВ!
          </button>
        )}

        <p className="text-gray-600 mt-6" style={{ fontSize: '7px' }}>
          УБЕДИТЕСЬ, ЧТО ПРОТИВНИК НЕ ВИДИТ ЭКРАН
        </p>
      </div>
    </div>
  );
}
