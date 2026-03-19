import { NextRequest, NextResponse } from "next/server";
import { chatWithGroq } from "@/lib/ai/groq";
import { MODELS } from "@/lib/ai/models";
import { db } from "@/lib/db/db";
import { coursesTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip = getRequestIP(req);
    const { limited, resetIn } = checkRateLimit(`course:${ip}`, AI_RATE_LIMIT);
    if (limited) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${resetIn} seconds.` },
        { status: 429 }
      );
    }

    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic, milestoneData, roadmapId, milestoneIndex } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const systemPrompt = `
You are an expert Educator and Technical Writer. 
Your task is to generate a comprehensive, personalized course module for a specific topic.

Output Format:
You MUST respond with a valid JSON object ONLY. No conversational text.
{
  "title": "Course Module Title",
  "description": "Deep dive into the topic.",
  "sections": [
    {
      "heading": "Section Heading",
      "content": "Detailed text content/explanation for this section. Use markdown for formatting.",
      "keyTakeaways": ["Point 1", "Point 2"],
      "videoSearchQuery": "Specific YouTube search query for this section"
    }
  ],
  "studyResources": [
    {
      "name": "Resource Name",
      "type": "Article/Documentation/Book",
      "link": "https://..."
    }
  ],
  "quiz": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }
  ]
}
`;

    const userPrompt = `
TOPIC: ${topic}
${milestoneData ? `CONTEXT FROM ROADMAP: ${JSON.stringify(milestoneData)}` : ""}

Generate a detailed course module for "${topic}". 
Ensure the content is actionable, in-depth, and specifically tailored to the context provided.
For each section, provide a "videoSearchQuery" that would yield the best high-quality educational videos on YouTube.
`;

    const responseData = await chatWithGroq([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], {
      model: MODELS.PRIMARY,
      response_format: { type: "json_object" },
      max_tokens: 4096
    });

    if (!responseData?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from AI provider");
    }

    const aiOutput = JSON.parse(responseData.choices[0].message.content);

    // Save to Database
    const inserted = await db.insert(coursesTable).values({
      userEmail: userEmail,
      roadmapId: roadmapId || null,
      milestoneId: milestoneIndex !== undefined ? milestoneIndex : null,
      title: aiOutput.title,
      content: JSON.stringify(aiOutput)
    }).returning();

    return NextResponse.json({
      ...aiOutput,
      courseId: inserted[0].id
    });

  } catch (error: unknown) {
    console.error("Course Generation Error:", error);
    const err = error as { message?: string; response?: { data?: any } };
    return NextResponse.json({
      error: err.message || "Failed to generate course",
      details: err.response?.data || err.message
    }, { status: 500 });
  }
}
