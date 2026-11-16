import { validarMatrizPrototipo, FUNCOES_MATRIZ } from './catalog/matrizPrototipo';
import { validarRespostaCaderno, type ValoresCaderno } from './cadernoCria';
import type { AlteracaoIntercambio, DocumentoIntercambio } from './intercambioMarkdown';

const objeto=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
const mesmasChaves=(v:unknown, nomes:string[])=>objeto(v)&&Object.keys(v).length===nomes.length&&nomes.every(n=>Object.hasOwn(v,n));
const textoNulo=(v:unknown)=>v===null||typeof v==='string';
const numeroNulo=(v:unknown)=>v===null||typeof v==='number'&&Number.isFinite(v)&&v>=0;

/** Valida dados antes da prévia e novamente no servidor antes da transação. */
export function validarAlteracoesIntercambio(documento:DocumentoIntercambio, alteracoes:AlteracaoIntercambio[]):void {
  for(const a of alteracoes){
    try {
      if(a.conflito) throw new Error('O registro foi alterado na plataforma após a exportação.');
      const [tipo,id,...resto]=a.chave.split(':');
      if(tipo==='matriz'&&a.secao==='matriz'){
        const nome=FUNCOES_MATRIZ.find(f=>f.id===id)?.nome;
        if(!nome||resto.length||!mesmasChaves(a.proposto,['atuacao','experiencia','criticidade','interesse','observacoes','externo'])) throw new Error('Campos da Matriz inválidos.');
        const p=a.proposto as Record<string,unknown>;
        validarMatrizPrototipo({organizacaoId:documento.organizacaoId,diagnosticoId:documento.diagnosticoId,funcaoId:id,nomeFuncao:nome,atuacao:p.atuacao as string|null,experiencia:p.experiencia as string|null,criticidade:p.criticidade as string|null,interesse:p.interesse as string|null,observacoes:p.observacoes as string|null,externo:p.externo as string|null});
      }else if(tipo==='caderno'){
        if(resto.length!==1||!mesmasChaves(a.proposto,['valor','selecoes','relato','fonte','respondentes']))throw new Error('Campos da resposta inválidos.');
        validarRespostaCaderno(id,resto[0],a.proposto as unknown as ValoresCaderno);
      }else if(tipo==='categoria'&&a.secao==='cesta'){
        if(resto.length||!mesmasChaves(a.proposto,['nome'])||typeof (a.proposto as Record<string,unknown>).nome!=='string'||!(a.proposto as {nome:string}).nome.trim()||(a.proposto as {nome:string}).nome.length>120)throw new Error('Nome de categoria inválido.');
      }else if(tipo==='novo_produto'&&a.secao==='cesta'){
        if(resto.length||!objeto(a.proposto)||!objeto(a.proposto.dados)||!Array.isArray(a.proposto.perguntas))throw new Error('Produto novo inválido.');
        const novo=a.proposto;
        const produto={...a,chave:'produto:00000000-0000-4000-8000-000000000000',proposto:novo.dados as AlteracaoIntercambio['proposto']};
        validarAlteracoesIntercambio(documento,[produto]);
        const perguntas=novo.perguntas as unknown as {codigo:string;resposta:ValoresCaderno}[];
        const situacao=perguntas.find(q=>q.codigo==='PR_SITUACAO')?.resposta?.valor;
        const operacao=perguntas.find(q=>q.codigo==='PR_OPERACAO')?.resposta?.valor;
        for(const q of perguntas){
          if(!mesmasChaves(q.resposta,['valor','selecoes','relato','fonte','respondentes'])||!Array.isArray(q.resposta.selecoes))throw new Error(`Campos inválidos em ${q.codigo}.`);
          const preenchida=q.resposta.valor!==null||q.resposta.selecoes.length>0||Boolean(q.resposta.relato||q.resposta.fonte||q.resposta.respondentes);
          if(preenchida&&/^(CP|C\d)/.test(q.codigo)&&situacao!=='Funcionamento')throw new Error(`${q.codigo}: perfil e avaliação exigem situação Funcionamento.`);
          if(preenchida&&/^IM/.test(q.codigo)&&(situacao!=='Implantação'||!operacao))throw new Error(`${q.codigo}: informe uma operação em implantação.`);
          validarRespostaCaderno(q.codigo,/^IM/.test(q.codigo)?operacao||'OP00':'00000000-0000-4000-8000-000000000000',q.resposta);
        }
      }else if(tipo==='produto'&&a.secao==='cesta'){
        if(resto.length||!mesmasChaves(a.proposto,['nome','cadeia','categoriaId','unidadeMedida','safra','canaisComerciais','etapasEconomicas']))throw new Error('Campos do produto inválidos.');
        const p=a.proposto as Record<string,unknown>;
        if(typeof p.nome!=='string'||!p.nome.trim()||p.nome.length>500||!textoNulo(p.cadeia)||typeof p.cadeia==='string'&&p.cadeia.length>500||!textoNulo(p.categoriaId)||!textoNulo(p.unidadeMedida)||JSON.stringify(p).length>100000)throw new Error('Dados básicos do produto inválidos.');
        if(!objeto(p.safra)||!['nao_informada','ano_inteiro','sazonal'].includes(String(p.safra.estado))||!Array.isArray(p.safra.intervalos)||p.safra.estado!=='sazonal'&&p.safra.intervalos.length>0||p.safra.intervalos.some(i=>!objeto(i)||!Number.isInteger(i.inicio)||!Number.isInteger(i.fim)||Number(i.inicio)<1||Number(i.inicio)>12||Number(i.fim)<1||Number(i.fim)>12))throw new Error('Safra inválida.');
        if(!Array.isArray(p.canaisComerciais)||!Array.isArray(p.etapasEconomicas))throw new Error('Canais ou etapas inválidos.');
        for(const c of p.canaisComerciais){
          if(!objeto(c)||!['canal','periodoReferencia','unidade','modelo','baseRepasse'].every(k=>typeof c[k]==='string')||!['','compra_revenda','venda_repasse','beneficiamento_servico'].includes(String(c.modelo))||![null,'valor','percentual'].includes(c.tipoRepasse as null|string)||!['valorCompra','valorVenda','repasse','parcelaOrganizacao'].every(k=>numeroNulo(c[k]))||!Array.isArray(c.custos)||c.custos.some(k=>!objeto(k)||typeof k.nome!=='string'||!numeroNulo(k.valor)))throw new Error('Canal comercial inválido.');
          if(c.tipoRepasse==='percentual'&&(!(c.baseRepasse as string).trim()||typeof c.repasse==='number'&&c.repasse>100))throw new Error('Informe a base e um percentual de repasse entre 0 e 100.');
          if([c.valorCompra,c.valorVenda,c.repasse,c.parcelaOrganizacao,...c.custos.map(k=>(k as Record<string,unknown>).valor)].some(v=>v!==null)&&!String(c.unidade||p.unidadeMedida||'').trim())throw new Error('Informe a unidade para os valores do canal.');
        }
        for(const e of p.etapasEconomicas){
          if(!objeto(e)||!['etapa','executor','pagador','recebedor','unidade','natureza'].every(k=>typeof e[k]==='string')||!['','custo','pagamento_produto','receita_servico','repasse'].includes(String(e.natureza))||!numeroNulo(e.valor)||e.valor!==null&&!String(e.unidade).trim())throw new Error('Etapa econômica inválida.');
        }
      }else throw new Error('Tipo de registro incompatível com a seção.');
    } catch(e) { throw new Error(`${a.titulo}: ${e instanceof Error?e.message:'registro inválido'}`); }
  }
}
