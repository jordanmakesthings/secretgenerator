export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'No API key' });
  const { storyText, ctaProduct, ctaTrigger, ctaBenefit } = req.body;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: `You are a content writer for The Secret brand. Create Instagram carousel slides from manifestation testimonials. Return ONLY a raw JSON array, no markdown. Rules: 4-6 slides max 7. boldLine optional, bodyText required. Slide 1 = hook. Last slide = CTA saying "If you want to ${ctaBenefit}... Comment ${ctaTrigger} below for the ${ctaProduct}." showArrow true except last slide.`,
        messages: [{ role: 'user', content: `Story:\n\n${storyText}` }]
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: d.error?.message });
    const clean = d.content[0].text.trim().replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    return res.status(200).json({ slides: JSON.parse(clean) });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}
