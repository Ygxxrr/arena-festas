// Vercel Serverless Function: recebe o formulário da LP de festas e cria o lead no Kommo.
// Variáveis de ambiente (Vercel > Project > Settings > Environment Variables):
//   KOMMO_SUBDOMAIN   = grupoarenacontato
//   KOMMO_TOKEN       = token de longa duração da integração privada do Kommo
//   KOMMO_PIPELINE_ID = (opcional) ID do funil onde o lead deve cair
//   KOMMO_STATUS_ID   = (opcional) ID da etapa inicial dentro do funil

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { KOMMO_SUBDOMAIN, KOMMO_TOKEN, KOMMO_PIPELINE_ID, KOMMO_STATUS_ID } = process.env;
  if (!KOMMO_SUBDOMAIN || !KOMMO_TOKEN) return res.status(500).json({ ok: false, erro: 'Kommo não configurado' });

  const d = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const limpa = (v, max = 200) => String(v ?? '').trim().slice(0, max);
  const nome = limpa(d.nome, 120);
  const telefone = limpa(d.telefone, 20);
  if (!nome || telefone.replace(/\D/g, '').length < 12) return res.status(400).json({ ok: false, erro: 'Dados inválidos' });

  const tipo = limpa(d.tipo);
  const servicos = Array.isArray(d.servicos) ? d.servicos.map(s => limpa(s, 40)).slice(0, 20) : [];
  const utm = d.utm && typeof d.utm === 'object' ? d.utm : {};

  const base = `https://${KOMMO_SUBDOMAIN}.kommo.com/api/v4`;
  const headers = { Authorization: `Bearer ${KOMMO_TOKEN}`, 'Content-Type': 'application/json' };

  const lead = {
    name: `Festa · ${tipo || 'Orçamento'} · ${nome}`,
    _embedded: {
      tags: [{ name: 'LP Festas' }, ...(utm.utm_source ? [{ name: `src:${limpa(utm.utm_source, 40)}` }] : [])],
      contacts: [{
        first_name: nome,
        custom_fields_values: [{ field_code: 'PHONE', values: [{ value: telefone, enum_code: 'MOB' }] }],
      }],
    },
  };
  if (KOMMO_PIPELINE_ID) lead.pipeline_id = Number(KOMMO_PIPELINE_ID);
  if (KOMMO_STATUS_ID) lead.status_id = Number(KOMMO_STATUS_ID);

  try {
    const r = await fetch(`${base}/leads/complex`, { method: 'POST', headers, body: JSON.stringify([lead]) });
    if (!r.ok) {
      console.error('Kommo leads/complex', r.status, await r.text());
      return res.status(502).json({ ok: false });
    }
    const [criado] = await r.json();

    // Detalhes da festa numa nota do lead (não depende de IDs de campos personalizados)
    const nota = [
      'Pedido de orçamento — LP Festas',
      `Tipo de festa: ${tipo}`,
      `Data: ${limpa(d.data, 20)}`,
      `Convidados: ${limpa(d.convidados, 30)}`,
      `Cidade: ${limpa(d.local, 40)}`,
      d.empresa ? `Empresa/estabelecimento: ${limpa(d.empresa)}` : null,
      `Serviços: ${servicos.join(', ') || 'não informado'}`,
      d.outros ? `Outros serviços: ${limpa(d.outros)}` : null,
      Object.keys(utm).length ? `UTM: ${Object.entries(utm).map(([k, v]) => `${limpa(k, 30)}=${limpa(v, 80)}`).join(' | ')}` : null,
      `Página: ${limpa(d.pagina, 300)}`,
    ].filter(Boolean).join('\n');

    await fetch(`${base}/leads/${criado.id}/notes`, {
      method: 'POST', headers,
      body: JSON.stringify([{ note_type: 'common', params: { text: nota } }]),
    }).catch(e => console.error('Kommo nota', e));

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Kommo erro', e);
    return res.status(502).json({ ok: false });
  }
}
