# Развитие проекта

## Ближайшие улучшения

### Геймплей
- [ ] Система классов героев (Воин, Маг, Жрец...)
- [ ] Больше карт (100+)
- [ ] Система колодостроения
- [ ] Ранговая система
- [ ] Система достижений

### Сеть
- [ ] Полноценный P2P через PeerJS
- [ ] WebSocket сервер для лобби
- [ ] Система рейтинга
- [ ] Наблюдатели (spectators)

### Визуал
- [ ] Настоящая пиксельная графика (спрайты)
- [ ] Анимации частиц для заклинаний
- [ ] Анимированные портреты героев
- [ ] Темы оформления

### Звук
- [ ] Фоновая музыка для каждого класса
- [ ] Уникальные звуки для каждой карты
- [ ] Голосовые линии героев

### AI
- [ ] Улучшенный AI с MCTS
- [ ] Разные уровни сложности
- [ ] AI адаптируется к стилю игрока

## Технические улучшения

### Производительность
- [ ] Виртуализация списка карт
- [ ] Lazy loading
- [ ] Service Worker для оффлайн
- [ ] PWA manifest

### Код
- [ ] Unit тесты для GameEngine
- [ ] E2E тесты
- [ ] CI/CD pipeline
- [ ] Code coverage

### Инфраструктура
- [ ] Docker контейнер
- [ ] Развёртывание на Vercel/Netlify
- [ ] Analytics
- [ ] Crash reporting

## Как добавить новую карту

1. Добавить определение в `src/data/cards.ts`:
```typescript
{
  id: 'm16',
  name: 'Название',
  type: 'minion', // 'minion' | 'spell' | 'weapon'
  cost: 3,
  rarity: 'common', // 'common' | 'rare' | 'epic' | 'legendary'
  attack: 3,
  health: 3,
  description: 'Описание эффекта',
  flavorText: 'Флейвор-текст',
  keywords: ['taunt'], // массив ключевых слов
  battlecryDesc: 'effect_name', // если есть battlecry
}
```

2. Если нужен новый эффект — добавить обработку в `GameEngine.ts`:
   - В `executeBattlecry()` для боевых кличей
   - В `executeDeathrattle()` для смертельных хрипов
   - В `playSpell()` для заклинаний

3. Добавить эмодзи в `MinionComponent.tsx` → `getMinionEmoji()`

## Как добавить новое ключевое слово

1. Добавить в тип `Keyword` в `types.ts`
2. Добавить обработку в `GameEngine.ts`
3. Добавить отображение в `MinionComponent.tsx`
4. Добавить label в `CardComponent.tsx` → `getKeywordLabel()`
