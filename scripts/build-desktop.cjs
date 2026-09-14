const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const iconPath = path.resolve(__dirname, '..', 'build', 'icon.ico');
if (!fs.existsSync(iconPath)) {
  console.error(`Missing ${iconPath}. Place the supplied PizzaHub JPG in the workspace so it can be converted to build/icon.ico.`);
  process.exit(1);
}

const npmCommand = process.platform === 'win32' ? 'npm' : 'npm';
const result = spawnSync(npmCommand, ['--prefix', 'frontend', 'run', 'build'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, VITE_API_URL: 'http://127.0.0.1:3000/api' },
});

process.exit(result.status ?? 1);
