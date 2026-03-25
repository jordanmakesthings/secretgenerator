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
        system: `You are a content writer for The Secret (Rhonda Byrne) brand. Create Instagram carousel slides from manifestation testimonials.

CRITICAL RULES:
- Write in THIRD PERSON always. Never use "I", "me", "my". Convert all first-person to third-person. "I manifested" becomes "She manifested" or "He manifested". Infer gender from the story.
- NO emojis ever. Not a single one.
- Return ONLY a raw JSON array. No markdown, no code fences, no explanation.
- 4 to 6 slides, 7 maximum.

SLIDE TYPES:
Slide 1 (hook): boldLine = the big hero contrast phrase. bodyText = short connector text + parenthetical. E.g. boldLine: "Parking Spaces\nUnexpected Money", bodyText: "He went from manifesting\nTo receiving\n(Here's how...)"
Middle slides: boldLine = short bold chapter heading ending with period. bodyText = 2-4 short sentences in third person.
Second-to-last (lesson): boldLine = lesson headline. bodyText = what this teaches about Law of Attraction.
Last slide (cta): boldLine = "". bodyText = "If you want to ${ctaBenefit}... Comment \\"${ctaTrigger}\\" below and receive immediate access to the '${ctaProduct}'.". showArrow = false.

showArrow true on all slides except last.`,
        messages: [{ role: 'user', content: `Story:\n\n${storyText}` }]
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: d.error?.message });
    const clean = d.content[0].text.trim().replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    return res.status(200).json({ slides: JSON.parse(clean) });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}
