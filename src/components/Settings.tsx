import { useState } from 'react';
import { loadSettings, saveSettings, GameSettings } from '../data/progression';

interface Props {
  onBack: () => void;
}

export default function Settings({ onBack }: Props) {
  const [settings, setSettings] = useState<GameSettings>(loadSettings());

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <div className="min-h-screen px-bg-dark p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b-4 border-amber-600 pb-3">
          <button onClick={onBack} className="px-btn bg-gray-800 border-gray-500 text-gray-300 px-4 py-2" style={{ fontSize: '10px' }}>
            ← НАЗАД
          </button>
          <h1 className="text-amber-400 px-text-glow-gold" style={{ fontSize: '16px' }}>⚙️ НАСТРОЙКИ</h1>
          <div></div>
        </div>

        <div className="bg-gray-900 border-4 border-gray-600 p-6 space-y-6">
          {/* Sound */}
          <div>
            <h3 className="text-amber-400 mb-3" style={{ fontSize: '10px' }}>🔊 ЗВУК</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-gray-300 block mb-1" style={{ fontSize: '8px' }}>
                  Громкость музыки: {Math.round(settings.musicVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.musicVolume * 100}
                  onChange={(e) => updateSetting('musicVolume', parseInt(e.target.value) / 100)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-gray-300 block mb-1" style={{ fontSize: '8px' }}>
                  Громкость эффектов: {Math.round(settings.sfxVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sfxVolume * 100}
                  onChange={(e) => updateSetting('sfxVolume', parseInt(e.target.value) / 100)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Animation */}
          <div>
            <h3 className="text-amber-400 mb-3" style={{ fontSize: '10px' }}>🎬 АНИМАЦИИ</h3>
            
            <div className="flex gap-2">
              {(['slow', 'normal', 'fast'] as const).map(speed => (
                <button
                  key={speed}
                  onClick={() => updateSetting('animationSpeed', speed)}
                  className={`px-btn px-4 py-2 flex-1 ${
                    settings.animationSpeed === speed
                      ? 'bg-blue-700 border-blue-400'
                      : 'bg-gray-800 border-gray-600'
                  }`}
                  style={{ fontSize: '8px' }}
                >
                  {speed === 'slow' ? '🐢 Медленно' : speed === 'normal' ? '🚶 Нормально' : '🏃 Быстро'}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <h3 className="text-amber-400 mb-3" style={{ fontSize: '10px' }}>🎨 ТЕМА</h3>
            
            <div className="flex gap-2">
              <button
                onClick={() => updateSetting('theme', 'stardew')}
                className={`px-btn px-4 py-3 flex-1 ${
                  settings.theme === 'stardew'
                    ? 'bg-amber-700 border-amber-400'
                    : 'bg-gray-800 border-gray-600'
                }`}
                style={{ fontSize: '8px' }}
              >
                🌾 Stardew Valley
              </button>
              <button
                onClick={() => updateSetting('theme', 'dark')}
                className={`px-btn px-4 py-3 flex-1 ${
                  settings.theme === 'dark'
                    ? 'bg-gray-700 border-gray-400'
                    : 'bg-gray-800 border-gray-600'
                }`}
                style={{ fontSize: '8px' }}
              >
                🌙 Тёмная
              </button>
              <button
                onClick={() => updateSetting('theme', 'classic')}
                className={`px-btn px-4 py-3 flex-1 ${
                  settings.theme === 'classic'
                    ? 'bg-green-700 border-green-400'
                    : 'bg-gray-800 border-gray-600'
                }`}
                style={{ fontSize: '8px' }}
              >
                🏰 Классика
              </button>
            </div>
          </div>

          {/* Visual */}
          <div>
            <h3 className="text-amber-400 mb-3" style={{ fontSize: '10px' }}>👁️ ВИЗУАЛЬНЫЕ ЭФФЕКТЫ</h3>
            
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showDamageNumbers}
                  onChange={(e) => updateSetting('showDamageNumbers', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-gray-300" style={{ fontSize: '8px' }}>
                  Показывать числа урона
                </span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showTooltips}
                  onChange={(e) => updateSetting('showTooltips', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-gray-300" style={{ fontSize: '8px' }}>
                  Показывать подсказки при наведении
                </span>
              </label>
            </div>
          </div>

          {/* Reset */}
          <div className="border-t border-gray-700 pt-4">
            <button
              onClick={() => {
                if (confirm('Сбросить все настройки?')) {
                  const defaultSettings: GameSettings = {
                    musicVolume: 0.5,
                    sfxVolume: 0.7,
                    animationSpeed: 'normal',
                    theme: 'stardew',
                    showDamageNumbers: true,
                    showTooltips: true,
                  };
                  setSettings(defaultSettings);
                  saveSettings(defaultSettings);
                }
              }}
              className="px-btn bg-red-800 border-red-400 text-red-100 px-4 py-2 w-full"
              style={{ fontSize: '8px' }}
            >
              🔄 СБРОСИТЬ НАСТРОЙКИ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
