import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Props {
  type: 'fire' | 'ice' | 'lightning' | 'heal' | 'death' | 'buff';
  x: number;
  y: number;
  active: boolean;
}

const PARTICLE_COLORS = {
  fire: ['#ff4500', '#ff6347', '#ffa500', '#ffff00'],
  ice: ['#00bfff', '#1e90ff', '#87ceeb', '#ffffff'],
  lightning: ['#ffff00', '#ffd700', '#ffffff', '#fffacd'],
  heal: ['#00ff00', '#32cd32', '#90ee90', '#98fb98'],
  death: ['#8b0000', '#a52a2a', '#800080', '#4b0082'],
  buff: ['#ffd700', '#ffec8b', '#fff8dc', '#ffffe0'],
};

export default function SpellParticles({ type, x, y, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = PARTICLE_COLORS[type];

    // Create particles
    const particleCount = type === 'death' ? 30 : 20;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 3;
      particlesRef.current.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      particlesRef.current.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // gravity
        particle.life -= 0.02;

        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.fillRect(
          particle.x - particle.size / 2,
          particle.y - particle.size / 2,
          particle.size,
          particle.size
        );
      });

      if (particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particlesRef.current = [];
    };
  }, [active, type]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="fixed pointer-events-none z-50"
      style={{
        left: x - 100,
        top: y - 100,
      }}
    />
  );
}
