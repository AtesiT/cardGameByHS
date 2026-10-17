"""
Тестовый стенд для движка регулярных выражений
25 тест-кейсов covering: базовые совпадения, группы, квантификаторы, классы символов,
граничные случаи, ловушки производительности, некорректные паттерны
"""

from regex_engine import regex_match, RegexError

def run_tests():
    """Запускает все тесты"""
    tests = [
        # === БАЗОВЫЕ СОВПАДЕНИЯ (1-5) ===
        {
            "id": 1,
            "name": "Базовый литерал",
            "pattern": "a",
            "text": "a",
            "expected": True,
            "category": "basic"
        },
        {
            "id": 2,
            "name": "Литерал не совпадает",
            "pattern": "a",
            "text": "b",
            "expected": False,
            "category": "basic"
        },
        {
            "id": 3,
            "name": "Точка - любой символ",
            "pattern": ".",
            "text": "x",
            "expected": True,
            "category": "basic"
        },
        {
            "id": 4,
            "name": "Точка на пустой строке",
            "pattern": ".",
            "text": "",
            "expected": False,
            "category": "basic"
        },
        {
            "id": 5,
            "name": "Конкатенация литералов",
            "pattern": "abc",
            "text": "abc",
            "expected": True,
            "category": "basic"
        },
        
        # === КВАНТИФИКАТОРЫ (6-12) ===
        {
            "id": 6,
            "name": "Звездочка - ноль совпадений",
            "pattern": "a*",
            "text": "",
            "expected": True,
            "category": "quantifiers"
        },
        {
            "id": 7,
            "name": "Звездочка - много совпадений",
            "pattern": "a*",
            "text": "aaaaa",
            "expected": True,
            "category": "quantifiers"
        },
        {
            "id": 8,
            "name": "Плюс - минимум одно",
            "pattern": "a+",
            "text": "a",
            "expected": True,
            "category": "quantifiers"
        },
        {
            "id": 9,
            "name": "Плюс - ноль не работает",
            "pattern": "a+",
            "text": "",
            "expected": False,
            "category": "quantifiers"
        },
        {
            "id": 10,
            "name": "Вопрос - опциональный",
            "pattern": "a?",
            "text": "",
            "expected": True,
            "category": "quantifiers"
        },
        {
            "id": 11,
            "name": "Вопрос - одно совпадение",
            "pattern": "a?",
            "text": "a",
            "expected": True,
            "category": "quantifiers"
        },
        {
            "id": 12,
            "name": "Ленивый квантификатор",
            "pattern": "a*?",
            "text": "aaa",
            "expected": True,
            "category": "quantifiers"
        },
        
        # === КЛАССЫ СИМВОЛОВ (13-16) ===
        {
            "id": 13,
            "name": "Класс символов - совпадение",
            "pattern": "[abc]",
            "text": "b",
            "expected": True,
            "category": "char_class"
        },
        {
            "id": 14,
            "name": "Класс символов - не совпадение",
            "pattern": "[abc]",
            "text": "d",
            "expected": False,
            "category": "char_class"
        },
        {
            "id": 15,
            "name": "Негация класса",
            "pattern": "[^abc]",
            "text": "d",
            "expected": True,
            "category": "char_class"
        },
        {
            "id": 16,
            "name": "Негация класса - не работает",
            "pattern": "[^abc]",
            "text": "a",
            "expected": False,
            "category": "char_class"
        },
        
        # === ГРУППЫ (17-19) ===
        {
            "id": 17,
            "name": "Простая группа",
            "pattern": "(ab)+",
            "text": "abab",
            "expected": True,
            "category": "groups"
        },
        {
            "id": 18,
            "name": "Вложенные группы",
            "pattern": "((ab)+c)+",
            "text": "abcabc",
            "expected": True,
            "category": "groups"
        },
        {
            "id": 19,
            "name": "Альтернатива в группе",
            "pattern": "(a|b)+",
            "text": "abba",
            "expected": True,
            "category": "groups"
        },
        
        # === ЭКРАНИРОВАНИЕ (20-21) ===
        {
            "id": 20,
            "name": "Экранированный литерал",
            "pattern": "\\.",
            "text": ".",
            "expected": True,
            "category": "escape"
        },
        {
            "id": 21,
            "name": "Экранированная точка не работает как точка",
            "pattern": "\\.",
            "text": "a",
            "expected": False,
            "category": "escape"
        },
        
        # === ГРАНИЧНЫЕ СЛУЧАИ (22-23) ===
        {
            "id": 22,
            "name": "Пустой паттерн",
            "pattern": "",
            "text": "anything",
            "expected": True,
            "category": "edge"
        },
        {
            "id": 23,
            "name": "Пустая строка с пустым паттерном",
            "pattern": "",
            "text": "",
            "expected": True,
            "category": "edge"
        },
        
        # === ЛОВУШКИ ПРОИЗВОДИТЕЛЬНОСТИ (24-25) ===
        {
            "id": 24,
            "name": "Катастрофический бэктрекинг (ReDoS)",
            "pattern": "(a+)+b",
            "text": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaac",
            "expected": False,
            "category": "performance",
            "timeout": 1.0  # Должно завершиться за 1 секунду
        },
        {
            "id": 25,
            "name": "Вложенные квантификаторы",
            "pattern": "(a*)*b",
            "text": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaac",
            "expected": False,
            "category": "performance",
            "timeout": 1.0
        },
    ]
    
    # Дополнительные тесты для некорректных паттернов
    error_tests = [
        {
            "id": 26,
            "name": "Незакрытая группа",
            "pattern": "(abc",
            "text": "abc",
            "should_raise": True,
            "category": "errors"
        },
        {
            "id": 27,
            "name": "Незакрытый класс символов",
            "pattern": "[abc",
            "text": "a",
            "should_raise": True,
            "category": "errors"
        },
        {
            "id": 28,
            "name": "Незавершенная escape-последовательность",
            "pattern": "abc\\",
            "text": "abc",
            "should_raise": True,
            "category": "errors"
        },
        {
            "id": 29,
            "name": "Неожиданный символ *",
            "pattern": "*abc",
            "text": "abc",
            "should_raise": True,
            "category": "errors"
        },
        {
            "id": 30,
            "name": "Неожиданный символ |",
            "pattern": "|abc",
            "text": "abc",
            "should_raise": True,
            "category": "errors"
        },
    ]
    
    all_tests = tests + error_tests
    
    passed = 0
    failed = 0
    errors = 0
    
    print("=" * 80)
    print("ТЕСТОВЫЙ СТЕНД ДЛЯ ДВИЖКА РЕГУЛЯРНЫХ ВЫРАЖЕНИЙ")
    print("=" * 80)
    print()
    
    for test in all_tests:
        test_id = test["id"]
        name = test["name"]
        pattern = test["pattern"]
        text = test["text"]
        category = test["category"]
        
        print(f"[Тест {test_id:2d}] {name}")
        print(f"  Категория: {category}")
        print(f"  Паттерн: '{pattern}'")
        print(f"  Текст: '{text}'")
        
        try:
            if "should_raise" in test and test["should_raise"]:
                # Ожидаем исключение
                try:
                    result = regex_match(pattern, text)
                    print(f"  ❌ ОШИБКА: Ожидалось исключение, но получено: {result}")
                    failed += 1
                except RegexError as e:
                    print(f"  ✅ УСПЕХ: Получено ожидаемое исключение: {e}")
                    passed += 1
                except Exception as e:
                    print(f"  ❌ ОШИБКА: Получено неожиданное исключение: {type(e).__name__}: {e}")
                    errors += 1
            else:
                # Ожидаем результат
                expected = test["expected"]
                timeout = test.get("timeout", None)
                
                if timeout:
                    import signal
                    
                    def timeout_handler(signum, frame):
                        raise TimeoutError("Тест превысил лимит времени")
                    
                    signal.signal(signal.SIGALRM, timeout_handler)
                    signal.alarm(int(timeout))
                    
                    try:
                        result = regex_match(pattern, text)
                        signal.alarm(0)  # Отменяем таймер
                        
                        if result == expected:
                            print(f"  ✅ УСПЕХ: Результат={result}, Ожидалось={expected}")
                            passed += 1
                        else:
                            print(f"  ❌ ОШИБКА: Результат={result}, Ожидалось={expected}")
                            failed += 1
                    except TimeoutError as e:
                        print(f"  ⚠️  TIMEOUT: {e}")
                        failed += 1
                    finally:
                        signal.alarm(0)
                else:
                    result = regex_match(pattern, text)
                    
                    if result == expected:
                        print(f"  ✅ УСПЕХ: Результат={result}, Ожидалось={expected}")
                        passed += 1
                    else:
                        print(f"  ❌ ОШИБКА: Результат={result}, Ожидалось={expected}")
                        failed += 1
        
        except Exception as e:
            print(f"  💥 КРИТИЧЕСКАЯ ОШИБКА: {type(e).__name__}: {e}")
            errors += 1
        
        print()
    
    print("=" * 80)
    print("ИТОГИ ТЕСТИРОВАНИЯ")
    print("=" * 80)
    print(f"✅ Пройдено: {passed}")
    print(f"❌ Провалено: {failed}")
    print(f"💥 Ошибок: {errors}")
    print(f"📊 Всего тестов: {len(all_tests)}")
    print(f"📈 Процент успеха: {(passed / len(all_tests) * 100):.1f}%")
    print("=" * 80)
    
    return passed, failed, errors


if __name__ == "__main__":
    run_tests()
