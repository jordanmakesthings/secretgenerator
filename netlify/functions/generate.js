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
- Slide 1 (hook/cover): A bold teaser. Often "He went from [X] to [Y]" or "Meet [Name] from [Place]."
- Middle slides: Narrative build. One idea per slide. Bold chapter heading + body text.
- Second-to-last slide: The lesson/reflection about the Law of Attraction.
- Last slide: CTA using the product/trigger/benefit provided.

IMPORTANT:
- boldLine is optional (leave empty string if none). bodyText is required.
- Keep body text to 2-5 short sentences.
- CTA slide: "If you want to [BENEFIT]... Comment [TRIGGER] below and receive immediate access to the [PRODUCT]."
- 5 to 9 slides total.
- showArrow is true on all slides EXCEPT the last one.

Respond ONLY with a raw JSON array. No markdown, no code fences, no explanation. Example:
[{"type":"hook","boldLine":"He went from broke to thriving.","bodyText":"This is his story.","showArrow":true}]`;

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
        messages: [
          {
            role: "user",
            content: `Story text:\n\n${storyText}\n\nCTA product: ${ctaProduct}\nCTA trigger word: ${ctaTrigger}\nCTA benefit: ${ctaBenefit}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || "Anthropic API error" }),
      };
    }

    if (!data.content || !data.content[0] || !data.content[0].text) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Unexpected response from AI: " + JSON.stringify(data) }),
      };
    }

    const raw = data.content[0].text.trim();
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let slides;
    try {
      slides = JSON.parse(clean);
    } catch (parseErr) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Could not parse AI response: " + raw.substring(0, 200) }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slides }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
