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
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { storyText, ctaProduct, ctaTrigger, ctaBenefit } = body;

  const systemPrompt = `You are a social media content writer for The Secret (Rhonda Byrne's brand). You create Instagram carousel slides from real manifestation testimonials.

Your job is to transform raw story text into structured carousel slide copy that fits The Secret's brand voice: warm, inspiring, story-driven, and gently educational about the Law of Attraction.

SLIDE STRUCTURE RULES:
- Slide 1 (hook/cover): A bold teaser — short, punchy contrast or intriguing statement. Uses mixed bold headline + plain body. This is the cover that stops the scroll. Often formatted like "He went from [X] to [Y]" or "Meet [Name] from [Place]."
- Middle slides (2–N-2): Narrative build. Short, punchy sentences. One idea per slide. Use bold for the "chapter heading" of each slide (e.g. "First he decided to start small." or "Then came his payoff."). Body text expands on that beat.
- Second-to-last slide: The lesson/reflection. Summarises what the story teaches about the Law of Attraction.
- Last slide: CTA — uses the product/trigger/benefit provided.

IMPORTANT FORMATTING:
- Each slide has an optional boldLine (the bold headline, sentence-case, ends with a period) and a bodyText (normal weight, the paragraph).
- Keep slides concise. Most body text is 2–5 short sentences max.
- The hook slide (slide 1) may have NO boldLine and just a large cover statement in the bodyText, OR a boldLine with minimal bodyText.
- The CTA slide should say: "If you want to [BENEFIT]... Comment \"[TRIGGER]\" below and receive immediate access to the '[PRODUCT]'."
- Number of slides: between 5 and 9, whatever serves the story best.

Respond ONLY with a valid JSON array of slide objects. No preamble, no markdown fences. Each object:
{
  "type": "hook|intro|story1|story2|story3|lesson|cta|extra",
  "boldLine": "The
