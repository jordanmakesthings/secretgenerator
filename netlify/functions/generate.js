exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set in environment variables." }),
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) }; }

  const { storyText, ctaProduct, ctaTrigger, ctaBenefit } = body;

  const systemPrompt = `You are a social media content writer for The Secret (Rhonda Byrne's brand). You create Instagram carousel slides from real manifestation testimonials.

SLIDE STRUCTURE (4 to 6 slides, 7 maximum):

SLIDE 1 — Hook/Cover (type: "hook"):
This must follow a specific visual format with TWO types of text:
- boldLine: The hero contrast phrases — the big impactful words. Use a newline to separate two hero phrases. Example: "Having less than $100\nTo $20K in a single day" or "Parking Spaces\nUnexpected Money"
- bodyText: The connector phrases that go between the hero words, plus a parenthetical at the end. Use newlines to separate. Example: "They went from\nTo\n(Here's how)" or "He went from manifesting\nTo receiving\n(Here's how...)"
The visual renders as: connector line → BIG HERO → connector line → BIG HERO → (parenthetical) → arrow

MIDDLE SLIDES (type: "story1", "story2" etc):
- boldLine: Short bold chapter heading sentence ending with period. E.g. "Then came his payoff."
- bodyText: 2-4 short sentences expanding on that beat.

SECOND TO LAST SLIDE (type: "lesson"):
- boldLine: The lesson headline
- bodyText: What this teaches about the Law of Attraction

LAST SLIDE (type: "cta"):
- boldLine: ""
- bodyText: "If you want to [BENEFIT]... Comment \\"[TRIGGER]\\" below and receive immediate access to the '[PRODUCT]'."
- showArrow: false

showArrow: true on all slides except the last.

Respond ONLY with a raw JSON array, no markdown, no fences.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: `Story text:\n\n${storyText}\n\nCTA product: ${ctaProduct}\nCTA trigger word: ${ctaTrigger}\nCTA benefit: ${ctaBenefit}`,
        }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: data.error?.message || "Anthropic API error" }) };
    }

    if (!data.content || !data.content[0] || !data.content[0].text) {
      return { statusCode: 500, body: JSON.stringify({ error: "Unexpected AI response: " + JSON.stringify(data) }) };
    }

    const raw = data.content[0].text.trim();
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let slides;
    try { slides = JSON.parse(clean); }
    catch (e) { return { statusCode: 500, body: JSON.stringify({ error: "Could not parse AI response: " + raw.substring(0, 200) }) }; }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slides }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
