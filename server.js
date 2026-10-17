// Entry point: проверяет зависимости и запускает сервер
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function checkAndInstall() {
  const deps = ['ws', 'vite'];
  const missing = [];
  
  for (const dep of deps) {
    const depPath = path.join(__dirname, 'node_modules', dep);
    if (!existsSync(depPath)) {
      missing.push(dep);
    }
  }
  
  if (missing.length > 0) {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║   🔧 Первый запуск! Устанавливаю зависимости...          ║');
    console.log('║                                                           ║');
    console.log('║   Это займёт 1-2 минуты. Пожалуйста, подождите...       ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    
    try {
      execSync('npm install --silent', { 
        cwd: __dirname, 
        stdio: 'inherit'
      });
      console.log('');
      console.log('✅ Зависимости установлены! Запускаю сервер...');
      console.log('');
    } catch (error) {
      console.error('❌ Ошибка установки зависимостей!');
      console.error('Попробуйте выполнить вручную: npm install');
      process.exit(1);
    }
  }
}

// Проверяем и устанавливаем зависимости
checkAndInstall();

// Динамически импортируем сервер после установки зависимостей
const { default: startServer } = await import('./server-main.js');
startServer();
