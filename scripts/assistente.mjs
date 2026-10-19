// Configuração e inicialização locais sem imprimir credenciais.
import { readFileSync, existsSync, appendFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { parseEnv } from 'node:util';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pythonEnvFile = resolve(root, '.env.assistente.local');
const nodeEnvFile = resolve(root, '.env.local');
const readEnv = file => existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {};
const action = process.argv[2] ?? 'check';
const validActions = ['prepare', 'check', 'start'];
if (!validActions.includes(action)) {
  console.error('Use: node scripts/assistente.mjs prepare|check|start');
  process.exit(1);
}

if (action === 'prepare') {
  const pythonEnv = readEnv(pythonEnvFile);
  const nodeEnv = readEnv(nodeEnvFile);
  if (pythonEnv.INOVA_ASSISTANT_SECRET && nodeEnv.INOVA_ASSISTANT_SECRET && pythonEnv.INOVA_ASSISTANT_SECRET !== nodeEnv.INOVA_ASSISTANT_SECRET) {
    console.error('Os segredos locais divergem. Nenhum arquivo foi alterado.');
    process.exit(1);
  }
  const secret = pythonEnv.INOVA_ASSISTANT_SECRET || nodeEnv.INOVA_ASSISTANT_SECRET || randomBytes(32).toString('hex');
  function addMissing(file, existing, defaults) {
    const lines = Object.entries(defaults).filter(([key]) => !Object.hasOwn(existing, key)).map(([key, value]) => `${key}=${JSON.stringify(value)}`);
    if (!lines.length) return;
    const content = `\n# Assistente Inova — configuração local; não versionar\n${lines.join('\n')}\n`;
    if (existsSync(file)) appendFileSync(file, content, 'utf8');
    else writeFileSync(file, content, { encoding: 'utf8', mode: 0o600 });
  }
  addMissing(pythonEnvFile, pythonEnv, { OPENAI_API_KEY: '', OPENAI_MODEL: '', INOVA_ASSISTANT_SECRET: secret });
  addMissing(nodeEnvFile, nodeEnv, { INOVA_ASSISTANT_URL: 'http://127.0.0.1:8091', INOVA_ASSISTANT_SECRET: secret, CHATKIT_DOMAIN_KEY: '' });
  console.log('Arquivos locais preparados; entradas existentes preservadas. Nenhum segredo foi exibido.');
}

const pythonEnv = { ...readEnv(pythonEnvFile), ...process.env };
const nodeEnv = { ...readEnv(nodeEnvFile), ...process.env };
const checks = {
  OPENAI_API_KEY: Boolean(pythonEnv.OPENAI_API_KEY?.trim()),
  OPENAI_MODEL: Boolean(pythonEnv.OPENAI_MODEL?.trim()),
  INOVA_ASSISTANT_SECRET: Boolean(pythonEnv.INOVA_ASSISTANT_SECRET?.length >= 32 && pythonEnv.INOVA_ASSISTANT_SECRET === nodeEnv.INOVA_ASSISTANT_SECRET),
  INOVA_ASSISTANT_URL: Boolean(nodeEnv.INOVA_ASSISTANT_URL),
  CHATKIT_DOMAIN_KEY: Boolean(nodeEnv.CHATKIT_DOMAIN_KEY?.trim()),
};
if (action !== 'start') {
  for (const [name, ready] of Object.entries(checks)) console.log(`${name}: ${ready ? 'configurado' : 'pendente'}`);
  process.exit(0);
}
if (!checks.OPENAI_API_KEY || !checks.OPENAI_MODEL || !checks.INOVA_ASSISTANT_SECRET) {
  console.error('Backend não iniciado: preencha as configurações pendentes em .env.assistente.local. Não compartilhe segredos no chat.');
  process.exit(1);
}
const python = process.platform === 'win32'
  ? resolve(root, 'services/assistente/.venv/Scripts/python.exe')
  : resolve(root, 'services/assistente/.venv/bin/python');
const child = spawn(python, ['-m', 'uvicorn', 'app:app', '--app-dir', 'services/assistente', '--host', '127.0.0.1', '--port', '8091', '--workers', '1'], {
  cwd: root, env: pythonEnv, stdio: 'inherit', windowsHide: true,
});
child.on('error', () => { console.error('Não foi possível iniciar o Python. Confira o ambiente virtual em services/assistente/.venv.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
