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
        system: `You write Instagram carousel slides for The Secret brand. STRICT RULES:
1. THIRD PERSON ONLY. Never use I/me/my. "I manifested" becomes "She manifested".
2. NO emojis. Ever.
3. Return ONLY a raw JSON array. No markdown, no explanation.
4. 4 to 6 slides, 7 max.

SLIDE 1 must be type "hook". boldLine = ONLY the two contrast phrases separated by newline. Example: "Parking Spaces\nUnexpected Money" or "Debt\nComplete Financial Freedom". Never a sentence, never a topic summary. Just the two short contrast nouns/phrases.
bodyText = the connector lines + parenthetical, each on new line. Example: "She went from manifesting\nTo receiving\n(Here's how...)"

MIDDLE SLIDES: boldLine = one bold sentence ending in period. bodyText = 2-4 short third-person sentences.

SECOND TO LAST (type "lesson"): boldLine = lesson headline. bodyText = what this teaches about Law of Attraction, third person.

LAST SLIDE (type "cta"): boldLine = "". bodyText = "If you want to ${ctaBenefit}... Comment \\"${ctaTrigger}\\" below and receive immediate access to the '${ctaProduct}'.". showArrow = false.

showArrow = true on all slides except last.`,
        messages: [{ role: 'user', content: `Story:\n\n${storyText}` }]
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: d.error?.message });
    const clean = d.content[0].text.trim().replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    return res.status(200).json({ slides: JSON.parse(clean) });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}
