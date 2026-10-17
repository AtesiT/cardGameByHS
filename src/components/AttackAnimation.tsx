import { useState, useEffect } from 'react';

export interface AttackAnimation {
  id: string;
  attackerId: string;
  targetId: string;
  targetIsHero: boolean;
  attackerPosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
}

export function useAttackAnimation() {
  const [animation, setAnimation] = useState<AttackAnimation | null>(null);

  const startAttack = (attackerId: string, targetId: string, targetIsHero: boolean, attackerPos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
    const id = `attack_${Date.now()}`;
    setAnimation({ id, attackerId, targetId, targetIsHero, attackerPosition: attackerPos, targetPosition: targetPos });
    
    setTimeout(() => {
      setAnimation(null);
    }, 600);
  };

  return { animation, startAttack };
}

export function AttackAnimationDisplay({ animation }: { animation: AttackAnimation | null }) {
  if (!animation) return null;

  const [phase, setPhase] = useState<'moving' | 'hit' | 'returning'>('moving');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('hit'), 200);
    const timer2 = setTimeout(() => setPhase('returning'), 400);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const getTransform = () => {
    if (phase === 'moving') {
      const dx = animation.targetPosition.x - animation.attackerPosition.x;
      const dy = animation.targetPosition.y - animation.attackerPosition.y;
      return `translate(${dx * 0.7}px, ${dy * 0.7}px)`;
    }
    if (phase === 'returning') {
      return `translate(0, 0)`;
    }
    return `translate(0, 0)`;
  };

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${animation.attackerPosition.x}px`,
        top: `${animation.attackerPosition.y}px`,
        transform: getTransform(),
        transition: phase === 'hit' ? 'none' : 'transform 0.2s ease-out',
      }}
    >
      <div className={`text-4xl ${phase === 'hit' ? 'animate-px-shake' : ''}`}>
        ⚔️
      </div>
    </div>
  );
}
