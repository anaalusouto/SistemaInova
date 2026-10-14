const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
new Function('exports', ts.transpileModule(fs.readFileSync('src/app/lib/focoMenu.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(mod.exports);
const { ativarFocoMenu } = mod.exports;

test('menu móvel recebe foco, mantém Tab dentro, fecha com Escape e devolve foco ao acionador', () => {
  const listeners = new Map();
  const documento = { activeElement: null, addEventListener: (nome, fn) => listeners.set(nome, fn), removeEventListener: nome => listeners.delete(nome) };
  const controle = (nome, visivel = true) => ({ nome, visivel, isConnected: true,
    getClientRects: () => visivel ? [{}] : [], focus() { documento.activeElement = this; } });
  const acionador = controle('Abrir menu'), primeiro = controle('Visão Geral'), oculto = controle('Oculto', false), ultimo = controle('Sair');
  documento.activeElement = acionador;
  const menu = { ownerDocument: documento, querySelectorAll: () => [primeiro, oculto, ultimo], contains: el => [primeiro, oculto, ultimo].includes(el) };
  let fechamentos = 0;
  const estiloOriginal = global.getComputedStyle;
  global.getComputedStyle = el => ({ visibility: el.visivel ? 'visible' : 'hidden' });
  try {
    const limpar = ativarFocoMenu(menu, () => fechamentos++);
    assert.equal(documento.activeElement, primeiro);
    function tecla(key, shiftKey = false) {
      const evento = { key, shiftKey, prevenido: false, interrompido: false,
        preventDefault() { this.prevenido = true; }, stopPropagation() { this.interrompido = true; } };
      listeners.get('keydown')(evento); return evento;
    }
    assert.equal(tecla('Tab', true).prevenido, true); assert.equal(documento.activeElement, ultimo);
    assert.equal(tecla('Tab').prevenido, true); assert.equal(documento.activeElement, primeiro);
    assert.equal(tecla('Tab').prevenido, false, 'Tab intermediário segue a navegação normal');
    documento.activeElement = acionador;
    tecla('Tab'); assert.equal(documento.activeElement, primeiro, 'Foco externo retorna ao menu aberto');
    const escape = tecla('Escape'); assert.equal(fechamentos, 1); assert.equal(escape.interrompido, true);
    limpar(); assert.equal(listeners.size, 0); assert.equal(documento.activeElement, acionador);
  } finally { global.getComputedStyle = estiloOriginal; }
});
