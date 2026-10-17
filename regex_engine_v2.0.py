"""
Пользовательский движок регулярных выражений - Версия 2.0 (ФИНАЛЬНАЯ)
Исправления:
- Добавлена мемоизация для защиты от ReDoS
- Исправлена проблема с пустыми совпадениями
- Оптимизирована производительность
- Добавлена защита от бесконечных циклов
"""

class RegexError(Exception):
    """Исключение для ошибок в регулярном выражении"""
    pass


class RegexEngine:
    """Движок регулярных выражений с мемоизацией и защитой от ReDoS"""
    
    def __init__(self, pattern: str):
        self.pattern = pattern
        self.pos = 0
        self.parsed = self._parse()
        self._cache = {}  # Кэш для мемоизации
    
    def _parse(self):
        """Парсит паттерн в AST"""
        if self.pos >= len(self.pattern):
            return ('empty',)
        return self._parse_alternation()
    
    def _parse_alternation(self):
        """Парсит альтернативы (|)"""
        left = self._parse_concat()
        if self.pos < len(self.pattern) and self.pattern[self.pos] == '|':
            self.pos += 1
            right = self._parse_alternation()
            return ('alternation', left, right)
        return left
    
    def _parse_concat(self):
        """Парсит конкатенацию"""
        nodes = []
        while self.pos < len(self.pattern) and self.pattern[self.pos] not in '|)':
            nodes.append(self._parse_quantifier())
        
        if len(nodes) == 0:
            return ('empty',)
        elif len(nodes) == 1:
            return nodes[0]
        else:
            return ('concat', nodes)
    
    def _parse_quantifier(self):
        """Парсит квантификаторы"""
        node = self._parse_atom()
        
        if self.pos < len(self.pattern):
            char = self.pattern[self.pos]
            
            if char == '*':
                self.pos += 1
                lazy = self._check_lazy()
                return ('star', node, lazy)
            elif char == '+':
                self.pos += 1
                lazy = self._check_lazy()
                return ('plus', node, lazy)
            elif char == '?':
                self.pos += 1
                lazy = self._check_lazy()
                return ('question', node, lazy)
        
        return node
    
    def _check_lazy(self) -> bool:
        """Проверяет ленивый модификатор"""
        if self.pos < len(self.pattern) and self.pattern[self.pos] == '?':
            self.pos += 1
            return True
        return False
    
    def _parse_atom(self):
        """Парсит атомы"""
        if self.pos >= len(self.pattern):
            raise RegexError("Неожиданный конец паттерна")
        
        char = self.pattern[self.pos]
        
        if char == '\\':
            self.pos += 1
            if self.pos >= len(self.pattern):
                raise RegexError("Незавершенная escape-последовательность")
            escaped = self.pattern[self.pos]
            self.pos += 1
            return ('literal', escaped)
        
        elif char == '.':
            self.pos += 1
            return ('dot',)
        
        elif char == '[':
            return self._parse_char_class()
        
        elif char == '(':
            self.pos += 1
            group = self._parse_alternation()
            if self.pos >= len(self.pattern) or self.pattern[self.pos] != ')':
                raise RegexError("Незакрытая группа")
            self.pos += 1
            return ('group', group)
        
        elif char in '*+?':
            raise RegexError(f"Квантификатор без операнда: {char}")
        
        elif char == '|':
            return ('empty',)
        
        elif char == ')':
            raise RegexError("Неожиданная закрывающая скобка")
        
        else:
            self.pos += 1
            return ('literal', char)
    
    def _parse_char_class(self):
        """Парсит классы символов []"""
        self.pos += 1
        
        negate = False
        if self.pos < len(self.pattern) and self.pattern[self.pos] == '^':
            negate = True
            self.pos += 1
        
        chars = set()
        while self.pos < len(self.pattern) and self.pattern[self.pos] != ']':
            if self.pattern[self.pos] == '\\':
                self.pos += 1
                if self.pos >= len(self.pattern):
                    raise RegexError("Незавершенная escape-последовательность в классе")
                chars.add(self.pattern[self.pos])
                self.pos += 1
            else:
                chars.add(self.pattern[self.pos])
                self.pos += 1
        
        if self.pos >= len(self.pattern):
            raise RegexError("Незакрытый класс символов")
        
        self.pos += 1
        return ('char_class', frozenset(chars), negate)
    
    def match(self, text: str) -> bool:
        """Проверяет совпадение паттерна с текстом"""
        self._cache.clear()  # Очищаем кэш для каждого нового текста
        
        for start_pos in range(len(text) + 1):
            if self._match_from(self.parsed, text, start_pos):
                return True
        return False
    
    def _match_from(self, node, text: str, pos: int) -> bool:
        """Пытается сопоставить узел начиная с позиции pos"""
        for _ in self._match_generator(node, text, pos):
            return True
        return False
    
    def _match_generator(self, node, text: str, pos: int):
        """
        Генератор с мемоизацией для всех возможных позиций после сопоставления узла.
        """
        # Создаем ключ для кэша
        cache_key = (id(node), pos)
        
        # Проверяем кэш
        if cache_key in self._cache:
            yield from self._cache[cache_key]
            return
        
        # Сохраняем результаты в список для кэширования
        results = []
        
        node_type = node[0]
        
        if node_type == 'empty':
            results.append(pos)
            yield pos
        
        elif node_type == 'literal':
            if pos < len(text) and text[pos] == node[1]:
                results.append(pos + 1)
                yield pos + 1
        
        elif node_type == 'dot':
            if pos < len(text):
                results.append(pos + 1)
                yield pos + 1
        
        elif node_type == 'char_class':
            if pos < len(text):
                char = text[pos]
                in_class = char in node[1]
                matches = (not in_class) if node[2] else in_class
                if matches:
                    results.append(pos + 1)
                    yield pos + 1
        
        elif node_type == 'concat':
            for result in self._match_concat(node[1], text, pos, 0):
                results.append(result)
                yield result
        
        elif node_type == 'alternation':
            for result in self._match_generator(node[1], text, pos):
                results.append(result)
                yield result
            for result in self._match_generator(node[2], text, pos):
                results.append(result)
                yield result
        
        elif node_type == 'group':
            for result in self._match_generator(node[1], text, pos):
                results.append(result)
                yield result
        
        elif node_type == 'star':
            for result in self._match_quantifier_gen(node[1], text, pos, 0, float('inf'), node[2]):
                results.append(result)
                yield result
        
        elif node_type == 'plus':
            for result in self._match_quantifier_gen(node[1], text, pos, 1, float('inf'), node[2]):
                results.append(result)
                yield result
        
        elif node_type == 'question':
            for result in self._match_quantifier_gen(node[1], text, pos, 0, 1, node[2]):
                results.append(result)
                yield result
        
        # Кэшируем результаты
        self._cache[cache_key] = results
    
    def _match_concat(self, nodes, text: str, pos: int, index: int):
        """Сопоставляет конкатенацию с бэктрекингом"""
        if index >= len(nodes):
            yield pos
            return
        
        for next_pos in self._match_generator(nodes[index], text, pos):
            yield from self._match_concat(nodes, text, next_pos, index + 1)
    
    def _match_quantifier_gen(self, node, text: str, pos: int, min_count: int, max_count: int, lazy: bool):
        """Генератор для квантификаторов с защитой от бесконечных циклов"""
        if lazy:
            yield from self._match_lazy_gen(node, text, pos, min_count, max_count)
        else:
            yield from self._match_greedy_gen(node, text, pos, min_count, max_count)
    
    def _match_greedy_gen(self, node, text: str, pos: int, min_count: int, max_count: int):
        """Жадный генератор с защитой от бесконечных циклов"""
        positions = [pos]
        current_pos = pos
        count = 0
        
        while count < max_count:
            found = False
            for next_pos in self._match_generator(node, text, current_pos):
                if next_pos == current_pos:
                    # Пустое совпадение - останавливаемся
                    break
                current_pos = next_pos
                positions.append(current_pos)
                count += 1
                found = True
                break
            if not found:
                break
        
        # Выдаем позиции от самой дальней к самой ближней
        for i in range(len(positions) - 1, -1, -1):
            actual_count = i
            if actual_count >= min_count:
                yield positions[i]
    
    def _match_lazy_gen(self, node, text: str, pos: int, min_count: int, max_count: int):
        """Ленивый генератор с защитой от бесконечных циклов"""
        current_pos = pos
        count = 0
        
        while True:
            if count >= min_count:
                yield current_pos
            
            if count >= max_count:
                break
            
            found = False
            for next_pos in self._match_generator(node, text, current_pos):
                if next_pos == current_pos:
                    # Пустое совпадение - останавливаемся
                    break
                current_pos = next_pos
                count += 1
                found = True
                break
            if not found:
                break


def regex_match(pattern: str, text: str) -> bool:
    """Публичный интерфейс для сопоставления"""
    engine = RegexEngine(pattern)
    return engine.match(text)


# Простые тесты
if __name__ == "__main__":
    print("Тестирование движка v2.0...")
    
    tests = [
        ("a", "a", True),
        ("a", "b", False),
        (".", "a", True),
        ("a*", "", True),
        ("a*", "aaa", True),
        ("a+", "a", True),
        ("a+", "", False),
        ("a?", "", True),
        ("a?", "a", True),
        ("[abc]", "b", True),
        ("[^abc]", "d", True),
        ("a*a", "aaa", True),
        ("a*b", "aab", True),
    ]
    
    passed = 0
    for pattern, text, expected in tests:
        try:
            result = regex_match(pattern, text)
            status = "✓" if result == expected else "✗"
            if result == expected:
                passed += 1
            print(f"{status} Pattern: {pattern:10} Text: {text:10} Expected: {expected:5} Got: {result}")
        except Exception as e:
            print(f"✗ Pattern: {pattern:10} Text: {text:10} ERROR: {e}")
    
    print(f"\nПройдено: {passed}/{len(tests)}")
