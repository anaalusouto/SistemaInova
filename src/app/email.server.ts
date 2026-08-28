// Envio de e-mail via API HTTP da Resend (sem SDK — evita dependência nova).
// Chamado só a partir de server functions (usuarios.server.ts). Falha de envio
// nunca deve travar a operação principal (aprovação/solicitação) — os callers
// tratam isso como "melhor esforço" e só logam o erro.
const FROM = 'Sistema Inova <onboarding@resend.dev>';

async function sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY não configurada — e-mail não enviado:', subject);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    console.error('[email] falha ao enviar:', res.status, await res.text().catch(() => ''));
  }
}

const wrap = (title: string, body: string) => `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto">
    <h2 style="color:#0F172A;font-size:18px">${title}</h2>
    <div style="color:#334155;font-size:14px;line-height:1.6">${body}</div>
    <p style="color:#94A3B8;font-size:12px;margin-top:24px">Sistema Inova · Gestão de Projetos</p>
  </div>`;

export async function notificarNovaSolicitacao(adminEmails: string[], autorNome: string, projetoNome: string, resumo: string): Promise<void> {
  await sendEmail(
    adminEmails,
    `Nova solicitação de ${autorNome} aguardando aprovação`,
    wrap(
      'Nova solicitação para aprovar',
      `<p><strong>${autorNome}</strong> enviou uma solicitação no projeto <strong>${projetoNome}</strong>:</p>
       <p style="background:#F8FAFC;border-radius:8px;padding:10px 14px">${resumo}</p>
       <p>Entre no Sistema Inova para aprovar ou recusar.</p>`,
    ),
  );
}

export async function notificarSolicitacaoDecidida(
  autorEmail: string, aprovado: boolean, projetoNome: string, resumo: string, revisadoPor: string,
): Promise<void> {
  await sendEmail(
    autorEmail,
    aprovado ? `Sua solicitação em ${projetoNome} foi aprovada` : `Sua solicitação em ${projetoNome} foi recusada`,
    wrap(
      aprovado ? 'Solicitação aprovada' : 'Solicitação recusada',
      `<p>Sua solicitação no projeto <strong>${projetoNome}</strong> foi <strong>${aprovado ? 'aprovada' : 'recusada'}</strong> por ${revisadoPor}:</p>
       <p style="background:#F8FAFC;border-radius:8px;padding:10px 14px">${resumo}</p>`,
    ),
  );
}
