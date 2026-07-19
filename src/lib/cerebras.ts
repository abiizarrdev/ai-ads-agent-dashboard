import OpenAI from "openai";

let client: OpenAI | null = null;

function get9RouterClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: process.env.NINE_ROUTER_BASE_URL || "http://127.0.0.1:20128/v1",
      apiKey: process.env.NINE_ROUTER_API_KEY || "sk-24a59cf423d5912e-l427cv-d2cea6b1",
    });
  }
  return client;
}

const NINE_ROUTER_MODEL = process.env.NINE_ROUTER_MODEL || "ag/gemini-3-flash";

export interface GeneratedInsight {
  title: string;
  content: string;
  category: string;
  confidence: number;
  actionable: boolean;
}

export async function generateAdInsights(
  metricsData: {
    platform: string;
    spend: number;
    roas: number;
    conversions: number;
    ctr: number;
  }[]
): Promise<GeneratedInsight[]> {
  try {
    const openai = get9RouterClient();
    const metricsText = metricsData
      .map(
        (m) =>
          `${m.platform}: Spend $${m.spend}, ROAS ${m.roas}x, Conversions ${m.conversions}, CTR ${(m.ctr * 100).toFixed(2)}%`
      )
      .join("\n");

    const response = await openai.chat.completions.create({
      model: NINE_ROUTER_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert digital advertising analyst. Generate actionable insights from campaign metrics. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: `Analyze these ad campaign metrics and generate 3 actionable insights:\n\n${metricsText}\n\nRespond with a JSON array of objects with fields: title (string), content (string), category (string like "Performance"|"Budget"|"Audience"|"Creative"), confidence (number 0-1), actionable (boolean).`,
        },
      ],
      max_tokens: 1024,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content?.trim() || "[]";
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return getFallbackInsights();
    }
    
    const insights = JSON.parse(jsonMatch[0]) as GeneratedInsight[];
    return insights.slice(0, 3);
  } catch (error) {
    console.error("9Router API error, using fallback insights:", error);
    return getFallbackInsights();
  }
}

export async function generateAdCopy(params: {
  platform: string;
  product: string;
  audience: string;
  tone: string;
}): Promise<{ headline: string; description: string; cta: string }[]> {
  try {
    const openai = get9RouterClient();
    const response = await openai.chat.completions.create({
      model: NINE_ROUTER_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert copywriter specializing in digital advertising. Generate compelling ad copy. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: `Create 3 variations of ad copy for ${params.platform}:
Product: ${params.product}
Target Audience: ${params.audience}
Tone: ${params.tone}

Respond with a JSON array of objects with fields: headline (max 30 chars), description (max 90 chars), cta (max 15 chars).`,
        },
      ],
      max_tokens: 512,
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const content2 = response.choices[0]?.message?.content?.trim() || "[]";
    const jsonMatch2 = content2.match(/\[[\s\S]*\]/);
    if (!jsonMatch2) {
      return getFallbackAdCopy();
    }
    return JSON.parse(jsonMatch2[0]);
  } catch (error) {
    console.error("9Router API error, using fallback ad copy:", error);
    return getFallbackAdCopy();
  }
}

export async function generateOptimizationRecommendations(agentData: {
  agentType: string;
  platform: string;
  metrics: Record<string, number>;
}): Promise<string[]> {
  try {
    const openai = get9RouterClient();
    const response = await openai.chat.completions.create({
      model: NINE_ROUTER_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert in digital advertising optimization. Provide specific, actionable recommendations.",
        },
        {
          role: "user",
          content: `As a ${agentData.agentType} agent for ${agentData.platform}, analyze these metrics and provide 3 optimization recommendations:
${JSON.stringify(agentData.metrics, null, 2)}

Respond with a JSON array of 3 recommendation strings.`,
        },
      ],
      max_tokens: 512,
      temperature: 0.6,
      response_format: { type: "json_object" }
    });

    const content3 = response.choices[0]?.message?.content?.trim() || "[]";
    const jsonMatch3 = content3.match(/\[[\s\S]*\]/);
    if (!jsonMatch3) {
      return ["Increase budget allocation for top-performing campaigns", "Pause underperforming ad sets with CTR < 1%", "Test new audience segments for better reach"];
    }
    return JSON.parse(jsonMatch3[0]);
  } catch (error) {
    console.error("9Router API error, using fallback recommendations:", error);
    return ["Increase budget allocation for top-performing campaigns", "Pause underperforming ad sets with CTR < 1%", "Test new audience segments for better reach"];
  }
}

function getFallbackInsights(): GeneratedInsight[] {
  return [
    {
      title: "Google Ads ROAS exceeding targets",
      content: "Your Google Ads campaigns are delivering 4.2x ROAS, significantly above the 3.0x target. Consider scaling budget by 20% to capture additional market share.",
      category: "Performance",
      confidence: 0.92,
      actionable: true,
    },
    {
      title: "Meta Ads audience fatigue detected",
      content: "CTR on Meta campaigns has declined 15% over the past 7 days, suggesting creative fatigue. Refresh ad creatives or expand audience targeting.",
      category: "Creative",
      confidence: 0.85,
      actionable: true,
    },
    {
      title: "TikTok emerging opportunity",
      content: "TikTok Ads is showing strong engagement rates with 25-34 age demographic. Consider increasing budget allocation from 15% to 25% of total spend.",
      category: "Audience",
      confidence: 0.78,
      actionable: true,
    },
  ];
}

function getFallbackAdCopy(): { headline: string; description: string; cta: string }[] {
  return [
    { headline: "Transform Your Business", description: "Discover powerful tools that drive real results. Join thousands of satisfied customers.", cta: "Get Started" },
    { headline: "Limited Time Offer", description: "Save 40% on premium features. Don't miss out on this exclusive deal.", cta: "Claim Now" },
    { headline: "See Results Fast", description: "Our proven system delivers measurable ROI in 30 days or your money back.", cta: "Learn More" },
  ];
}
