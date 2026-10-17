import { useState, useEffect } from 'react';

export interface DamageNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  isHeal?: boolean;
}

export function useDamageNumbers() {
  const [numbers, setNumbers] = useState<DamageNumber[]>([]);

  const addNumber = (value: number, x: number, y: number, isHeal = false) => {
    const id = `dmg_${Date.now()}_${Math.random()}`;
    setNumbers(prev => [...prev, { id, value, x, y, isHeal }]);
    
    setTimeout(() => {
      setNumbers(prev => prev.filter(n => n.id !== id));
    }, 1000);
  };

  return { numbers, addNumber };
}

export function DamageNumberDisplay({ numbers }: { numbers: DamageNumber[] }) {
  return (
    <>
      {numbers.map(num => (
        <div
          key={num.id}
          className={`fixed pointer-events-none z-50 animate-px-float-up font-bold ${
            num.isHeal ? 'text-green-400' : 'text-red-400'
          }`}
          style={{
            left: `${num.x}px`,
            top: `${num.y}px`,
            fontSize: '20px',
            textShadow: '4px 4px 0px rgba(0,0,0,0.9)',
            fontFamily: "'Press Start 2P', monospace",
          }}
        >
          {num.isHeal ? '+' : '-'}{num.value}
        </div>
      ))}
    </>
  );
}
