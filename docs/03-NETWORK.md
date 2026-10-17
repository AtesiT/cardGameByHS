# Сетевой протокол (проект)

## Текущая реализация

В текущей версии игра работает в двух режимах:
1. **Hot-seat** — два игрока на одном устройстве
2. **AI** — одиночная игра против бота

## Планируемый P2P протокол (для будущего расширения)

### Технология: PeerJS (WebRTC)

#### Создание комнаты:
```
Host → PeerJS Server: register peer with ID = room_code
Host → UI: show room code
```

#### Подключение:
```
Guest → PeerJS Server: connect to peer with ID = room_code
Guest → Host: { type: 'join', name: 'Player2' }
Host → Guest: { type: 'room_state', players: [...] }
```

#### Игровой процесс:
```
Client → Host: { type: 'action', action: { type: 'play_card', cardId: '...', targetId: '...' } }
Host: validate action
Host → Both: { type: 'state_update', state: {...} }
```

#### Сообщения:

##### Клиент → Хост:
| Тип | Описание | Payload |
|-----|----------|---------|
| `join` | Присоединение | `{ name: string }` |
| `ready` | Готовность | `{}` |
| `action` | Игровое действие | `{ type: string, cardId?: string, targetId?: string }` |
| `emotion` | Эмоция | `{ emotion: string }` |
| `sync_request` | Запрос синхронизации | `{}` |

##### Хост → Клиент:
| Тип | Описание | Payload |
|-----|----------|---------|
| `welcome` | Подтверждение подключения | `{ yourId: string, roomId: string }` |
| `player_joined` | Игрок зашёл | `{ name: string }` |
| `game_start` | Игра началась | `{ initialState: GameState }` |
| `state_update` | Обновление | `{ state: GameState }` |
| `error` | Ошибка | `{ message: string }` |
| `emotion` | Эмоция | `{ emotion: string, from: string }` |
| `game_over` | Конец игры | `{ winner: number }` |

#### Обработка обрыва:
1. Потеря соединения → таймер 10 секунд
2. Попытка переподключения
3. Если не удалось → засчитать поражение
4. Уведомить второго игрока

#### Защита от читерства:
- Хост валидирует ВСЕ действия
- Клиент не знает карты противника
- Невозможно отправить действие вне своего хода
- Сервер (хост) — единственный источник истины
