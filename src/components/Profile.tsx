import { useState, useEffect } from 'react';
import { loadStats, loadAchievements, getCurrentRank, getNextRank, RANKS, PlayerStats, Achievement } from '../data/progression';
import { HERO_CLASSES } from '../data/classes';

interface Props {
  onBack: () => void;
}

export default function Profile({ onBack }: Props) {
  const [stats, setStats] = useState<PlayerStats>(loadStats());
  const [achievements, setAchievements] = useState<Achievement[]>(loadAchievements());
  const [tab, setTab] = useState<'stats' | 'achievements' | 'ranks'>('stats');

  const currentRank = getCurrentRank(stats.wins);
  const nextRank = getNextRank(stats.wins);
  const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

  return (
    <div className="min-h-screen px-bg-dark p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b-4 border-amber-600 pb-3">
        <button onClick={onBack} className="px-btn bg-gray-800 border-gray-500 text-gray-300 px-4 py-2" style={{ fontSize: '10px' }}>
          ← НАЗАД
        </button>
        <h1 className="text-amber-400 px-text-glow-gold" style={{ fontSize: '16px' }}>👤 ПРОФИЛЬ</h1>
        <div className="text-gray-400" style={{ fontSize: '8px' }}>
          {currentRank.emoji} {currentRank.name}
        </div>
      </div>

      {/* Rank display */}
      <div className="bg-gray-900 border-4 border-amber-600 p-4 mb-4 text-center">
        <div className="text-4xl mb-2">{currentRank.emoji}</div>
        <h2 className="text-amber-400 mb-1" style={{ fontSize: '12px' }}>{currentRank.name}</h2>
        <p className="text-gray-400 mb-2" style={{ fontSize: '8px' }}>Побед: {stats.wins}</p>
        {nextRank && (
          <div className="mt-3">
            <div className="flex justify-between text-gray-400 mb-1" style={{ fontSize: '7px' }}>
              <span>Прогресс до {nextRank.name}</span>
              <span>{stats.wins}/{nextRank.requiredWins}</span>
            </div>
            <div className="w-full h-3 bg-gray-800 border border-gray-600">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                style={{ width: `${(stats.wins / nextRank.requiredWins) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('stats')}
          className={`px-btn px-4 py-2 flex-1 ${tab === 'stats' ? 'bg-blue-700 border-blue-400' : 'bg-gray-800 border-gray-600'}`}
          style={{ fontSize: '8px' }}
        >
          📊 СТАТИСТИКА
        </button>
        <button
          onClick={() => setTab('achievements')}
          className={`px-btn px-4 py-2 flex-1 ${tab === 'achievements' ? 'bg-purple-700 border-purple-400' : 'bg-gray-800 border-gray-600'}`}
          style={{ fontSize: '8px' }}
        >
          🏆 ДОСТИЖЕНИЯ
        </button>
        <button
          onClick={() => setTab('ranks')}
          className={`px-btn px-4 py-2 flex-1 ${tab === 'ranks' ? 'bg-amber-700 border-amber-400' : 'bg-gray-800 border-gray-600'}`}
          style={{ fontSize: '8px' }}
        >
          👑 РАНГИ
        </button>
      </div>

      {/* Content */}
      {tab === 'stats' && (
        <div className="bg-gray-900 border-4 border-gray-600 p-4">
          <h3 className="text-amber-400 mb-3" style={{ fontSize: '10px' }}>ОБЩАЯ СТАТИСТИКА</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatBox label="Всего игр" value={stats.totalGames} emoji="🎮" />
            <StatBox label="Побед" value={stats.wins} emoji="🏆" />
            <StatBox label="Поражений" value={stats.losses} emoji="💀" />
            <StatBox label="Винрейт" value={`${winRate}%`} emoji="📈" />
            <StatBox label="Нанесено урона" value={stats.totalDamageDealt} emoji="💥" />
            <StatBox label="Получено урона" value={stats.totalDamageTaken} emoji="🛡️" />
            <StatBox label="Карт разыграно" value={stats.cardsPlayed} emoji="🃏" />
            <StatBox label="Существ убито" value={stats.minionsKilled} emoji="⚔️" />
            <StatBox label="Заклинаний" value={stats.spellsCast} emoji="✨" />
            <StatBox label="Способностей" value={stats.heroPowerUsed} emoji="🎯" />
            <StatBox label="Серия побед" value={stats.winStreak} emoji="🔥" />
            <StatBox label="Лучшая серия" value={stats.bestWinStreak} emoji="⭐" />
          </div>

          <h3 className="text-amber-400 mb-3" style={{ fontSize: '10px' }}>СТАТИСТИКА ПО КЛАССАМ</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(HERO_CLASSES).map(([id, cls]) => {
              const classStats = stats.classStats[id as keyof typeof stats.classStats];
              const classWinRate = classStats.wins + classStats.losses > 0 
                ? Math.round((classStats.wins / (classStats.wins + classStats.losses)) * 100)
                : 0;
              return (
                <div key={id} className="bg-gray-800 border border-gray-600 p-2 text-center">
                  <div className="text-xl mb-1">{cls.emoji}</div>
                  <div className="text-white" style={{ fontSize: '7px' }}>{cls.name}</div>
                  <div className="text-gray-400" style={{ fontSize: '6px' }}>
                    {classStats.wins}W / {classStats.losses}L ({classWinRate}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'achievements' && (
        <div className="bg-gray-900 border-4 border-gray-600 p-4">
          <h3 className="text-amber-400 mb-3" style={{ fontSize: '10px' }}>
            ДОСТИЖЕНИЯ ({achievements.filter(a => a.unlocked).length}/{achievements.length})
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {achievements.map(ach => (
              <div
                key={ach.id}
                className={`border-2 p-3 ${
                  ach.unlocked
                    ? 'bg-green-900/30 border-green-500'
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="text-2xl">{ach.emoji}</div>
                  <div className="flex-1">
                    <div className={`font-bold ${ach.unlocked ? 'text-green-400' : 'text-white'}`} style={{ fontSize: '8px' }}>
                      {ach.name}
                    </div>
                    <div className="text-gray-400 mt-1" style={{ fontSize: '6px' }}>
                      {ach.description}
                    </div>
                    {!ach.unlocked && (
                      <div className="mt-2">
                        <div className="flex justify-between text-gray-500 mb-1" style={{ fontSize: '5px' }}>
                          <span>Прогресс</span>
                          <span>{ach.progress}/{ach.requirement}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 border border-gray-600">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${(ach.progress / ach.requirement) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {ach.unlocked && (
                      <div className="text-green-400 mt-1" style={{ fontSize: '6px' }}>✓ Получено!</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'ranks' && (
        <div className="bg-gray-900 border-4 border-gray-600 p-4">
          <h3 className="text-amber-400 mb-3" style={{ fontSize: '10px' }}>СИСТЕМА РАНГОВ</h3>
          
          <div className="space-y-3">
            {RANKS.map(rank => {
              const isCurrent = rank.id === currentRank.id;
              const isUnlocked = stats.wins >= rank.requiredWins;
              return (
                <div
                  key={rank.id}
                  className={`border-2 p-4 flex items-center gap-4 ${
                    isCurrent
                      ? 'bg-amber-900/30 border-amber-500'
                      : isUnlocked
                      ? 'bg-green-900/20 border-green-600'
                      : 'bg-gray-800 border-gray-600'
                  }`}
                >
                  <div className="text-3xl">{rank.emoji}</div>
                  <div className="flex-1">
                    <div className={`font-bold ${isCurrent ? 'text-amber-400' : isUnlocked ? 'text-green-400' : 'text-gray-400'}`} style={{ fontSize: '10px' }}>
                      {rank.name}
                    </div>
                    <div className="text-gray-400 mt-1" style={{ fontSize: '7px' }}>
                      Требуется побед: {rank.requiredWins}
                    </div>
                  </div>
                  {isCurrent && <span className="text-amber-400" style={{ fontSize: '8px' }}>← ТЕКУЩИЙ</span>}
                  {isUnlocked && !isCurrent && <span className="text-green-400" style={{ fontSize: '8px' }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, emoji }: { label: string; value: number | string; emoji: string }) {
  return (
    <div className="bg-gray-800 border border-gray-600 p-2 text-center">
      <div className="text-xl mb-1">{emoji}</div>
      <div className="text-white font-bold" style={{ fontSize: '10px' }}>{value}</div>
      <div className="text-gray-400" style={{ fontSize: '6px' }}>{label}</div>
    </div>
  );
}
