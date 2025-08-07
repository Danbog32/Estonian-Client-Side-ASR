import { NextRequest, NextResponse } from "next/server";

// Configuration from wake_translation_server.py
const API_BASE = process.env.HF_TRANSLATE_API_BASE!;
const API_KEY = process.env.HF_TRANSLATE_API_KEY!;
const MODEL = process.env.HF_TRANSLATE_MODEL!;

interface TranslationRequest {
  text: string;
  session_id?: string;
  is_partial?: boolean;
}

interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// In-memory session storage for translation context
const sessionContext = new Map<string, string[]>();

// Clean up old sessions (keep only last 100 messages per session)
function cleanupSession(sessionId: string) {
  const context = sessionContext.get(sessionId) || [];
  if (context.length > 100) {
    sessionContext.set(sessionId, context.slice(-50)); // Keep last 50 messages
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslationRequest = await request.json();
    const { text, session_id = "default", is_partial = false } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    // Get or create session context
    if (!sessionContext.has(session_id)) {
      sessionContext.set(session_id, []);
    }

    const context = sessionContext.get(session_id)!;

    // Add current text to context
    context.push(text);
    cleanupSession(session_id);

    // Debug logging
    console.log(
      `🔤 Translation request - Session: ${session_id} ${is_partial ? "(partial)" : "(complete)"}`
    );
    console.log(`📝 Original text: "${text}"`);
    console.log(`🔢 Context length: ${context.length}`);

    // Enhanced prompt with strict instructions to prevent hallucinations
    const systemPrompt = `You are a professional Estonian to English translator. Follow these rules strictly:

1. ONLY translate Estonian text to English
2. If the text is not Estonian or is unclear, respond with "UNTRANSLATABLE"
3. If the text is too fragmented to translate meaningfully, respond with "FRAGMENT"
4. Do NOT add explanations, interpretations, or additional content
5. Do NOT repeat the original text if you cannot translate it
6. Maintain the original meaning and tone exactly
7. For partial sentences, translate what is clear and mark uncertainty with [...]

Quality check: The input should contain Estonian language characteristics.`;

    const userPrompt = `Translate this Estonian text to English. If it's not Estonian or unclear, respond with "UNTRANSLATABLE".

Estonian: ${text}

English:`;

    const llmPayload = {
      model: MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens: 300, // Reduced to prevent over-generation
      temperature: 0.1, // Lower temperature for more consistent results
      top_p: 0.8,
      frequency_penalty: 0.2, // Reduce repetition
      presence_penalty: 0.1,
    };

    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(llmPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM API Error:", response.status, errorText);

      if (response.status === 503) {
        return NextResponse.json(
          {
            error:
              "Translation service is starting up. Please wait about 1 minute and try again.",
            status: "starting_up",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: "Translation service unavailable" },
        { status: 502 }
      );
    }

    const llmResponse: LLMResponse = await response.json();
    const translation = llmResponse.choices?.[0]?.message?.content?.trim();

    // Debug logging for translation response
    console.log(`✅ Translation response received`);
    console.log(`🌐 Translated text: "${translation}"`);

    if (!translation) {
      console.log(`❌ No translation received from LLM`);
      return NextResponse.json(
        { error: "No translation received" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      original_text: text,
      translated_text: translation,
      session_id,
      status: "success",
      is_partial,
    });
  } catch (error) {
    console.error("Translation API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Test connection to LLM API
    const testPayload = {
      model: MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello" },
      ],
      max_tokens: 10,
      temperature: 0.0,
    };

    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      return NextResponse.json({
        status: "healthy",
        message: "Translation service is ready",
      });
    } else {
      return NextResponse.json(
        {
          status: "unhealthy",
          message: "Translation service is not responding",
          http_status: response.status,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", message: "Translation service error" },
      { status: 503 }
    );
  }
}

// Reset session endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id parameter is required" },
        { status: 400 }
      );
    }

    sessionContext.delete(sessionId);

    return NextResponse.json({
      message: `Session ${sessionId} reset successfully`,
      session_id: sessionId,
    });
  } catch (error) {
    console.error("Session reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset session" },
      { status: 500 }
    );
  }
}
