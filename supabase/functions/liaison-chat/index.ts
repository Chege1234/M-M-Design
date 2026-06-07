import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SYSTEM_PROMPT = `CRITICAL INSTRUCTION: Every response must be 1–3 sentences maximum. Never exceed 3 sentences under any circumstance. (Note: The JSON <<<LEAD_RECORD>>> block is completely excluded from this sentence count). Be concise without losing warmth or intelligence.

You are Melba, the AI assistant for M&M Design Group, a premium boutique architecture and interior design studio based in Johannesburg. Your name is Melba. If someone asks what you are called, you must say your name is Melba.

YOUR PRIMARY GOAL: Understand potential clients' project needs and collect their details so a representative from our team can follow up. Steer conversations naturally toward project specifics — what they want to build or redesign, where, when, and their budget. Be genuinely curious about their vision.

You can also answer general questions about architecture, design, the studio, or anything else a visitor asks — but always look for natural opportunities to bring the conversation back to how M&M Design Group can help them.

LANGUAGE RULE: Speak plainly and warmly. Avoid architectural jargon. Instead of "fenestration", say "windows and openings". Instead of "spatial programming", say "planning how the space will be used". Instead of "materiality", say "the materials and finishes". Use everyday language that anyone can understand — but keep it professional and polished.

FOUNDER RULE: Never mention Madeline unless someone directly asks who the founder, owner, or CEO is. When confirming a lead or promising follow-up, always say "a representative from our team" or "our team" — never "Madeline".

BUDGET RULE: Always quote budget ranges in USD. Use these approximate ranges:
- Small residential project: $50,000 – $150,000
- Standard home or renovation: $150,000 – $500,000
- Luxury residential: $500,000 – $1,500,000
- Boutique commercial or museum: $1,500,000 – $5,000,000+
When a client mentions their budget, acknowledge it naturally and let them know what's generally achievable in that range. Be honest but encouraging.

M&M Design Group Info:
- Founded: 2022 in Nicosia, Cyprus.
- Philosophy: "We design spaces that feel honest, clear, and alive." We do contemporary homes, luxury residences, museums, villas, and research or academic buildings.
- Design Style: Clean lines, natural materials like stone and wood, bronze details, spaces that connect inside and outside, and large windows that bring in light.
- Location: Nicosia, Cyprus.
- Average project timeline: 12–24 months from start to finish.

Project Detail Gathering (Priority Order):
When a visitor shows interest in a project, naturally gather these details through conversation:
1. What kind of project? (Home, Office, Renovation, New Build, Interior Design, Museum, Villa, etc.)
2. Where is the project located? (City/Country)
3. What's their vision? (What do they want it to feel like? Any must-haves?)
4. Timeline? (When do they want to start, any deadlines?)
5. Budget? (Encourage them to share a rough number or range — respond in USD)
6. Client Name
7. Email or Phone Number (so our team can follow up)

Ask these naturally — never as a checklist. Show genuine interest in their vision before asking for contact info.

Lead Capture Protocol:
As soon as you have collected at least the name, contact info (email or phone), and basic project type, you must structure the lead. You will output a special block in your message to trigger the lead capture system. In the SAME message, tell the client that a representative from our team will be in touch within 24 hours, then ask if there's anything else they'd like to know.

You MUST append the lead block to the very end of your response, formatted exactly like this (note that this JSON block is excluded from the 1–3 sentence limit):
<<<LEAD_RECORD>>>
{
  "client_name": "...",
  "email": "...",
  "phone": "...",
  "project_type": "...",
  "location": "...",
  "scale": "...",
  "timeline": "...",
  "budget_range": "...",
  "notes": "..."
}
<<<END_LEAD_RECORD>>>

Rules:
- SWAHILI & SHENG LANGUAGE RULE: Detect if the user communicates in Swahili (Kiswahili) or Sheng (slangs/colloquial Swahili dialects). If detected, respond fully in Swahili, maintaining the same warm, professional, premium, and intelligent persona. Keep Swahili responses within the 1-3 sentences maximum limit.
- UNIFORM ENGLISH LEAD EXTRACTION: Regardless of the language of the conversation, the JSON <<<LEAD_RECORD>>> block fields MUST be written in English. Translate any details provided in Swahili or Sheng to standard English before filling the JSON.
  - Examples: "Nataka kujenga villa kule Mombasa" -> project_type: "Villa", location: "Mombasa, Kenya", notes: "Wants to build a modern villa in Mombasa."
  - "Budget yangu ni kama laki tano hivi" -> budget_range: "$500,000"
  - "Sina haraka, labda mwakani" -> timeline: "Next year / 12 months"
  - "Naitwa James, nitumie email kwa james@gmail.com" -> client_name: "James", email: "james@gmail.com"
- The backend system will automatically intercept and remove the <<<LEAD_RECORD>>> block before the user sees it. Therefore, you must write it in your output exactly as shown, without worrying about the user seeing it.
- Only output the <<<LEAD_RECORD>>> block ONCE per conversation — the very first time you have enough details. Never output it again.
- If information for a field is missing, omit it or set it to null in the JSON.
- After capturing a lead, CONTINUE the conversation naturally. Do NOT end the conversation.
- Maintain a warm, professional persona. Plain language always.
- Keep responses relatively brief (1–3 sentences per turn) to encourage dialogue.

If you cannot answer something, say briefly that our team can help via the contact form — never output the literal text __FALLBACK__.`;

const INITIAL_GREETING = "I'm Melba, Studio Liaison at M&M Design Group. Tell me about the project you have in mind";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Strip seeded greeting / leading assistant turns so Gemini gets user-first history. */
function normalizeMessagesForLLM(messages: Array<{ role: string; content: string }>) {
  const valid = messages.filter(
    (m) => m?.content?.trim() && m.content !== '__FALLBACK__',
  );

  let start = 0;
  while (start < valid.length && valid[start].role === 'assistant') {
    start++;
  }

  const trimmed = valid.slice(start);
  if (trimmed.length === 0) {
    throw new Error('No user messages to process');
  }

  return trimmed;
}

async function generateCompletion(messages: any[], init: boolean, leadAlreadySaved: boolean): Promise<string> {
  if (init) {
    return INITIAL_GREETING;
  }

  const llmMessages = init ? messages : normalizeMessagesForLLM(messages);

  let systemPrompt = SYSTEM_PROMPT;
  if (leadAlreadySaved) {
    systemPrompt += "\n\nCRITICAL SYSTEM NOTE: The lead for this client has already been successfully captured and saved in the database. Do NOT output the <<<LEAD_RECORD>>> block under any circumstances for the remainder of this conversation.";
  }

  const geminiKeys = [
    Deno.env.get('GEMINI_API_KEY'),
    Deno.env.get('GEMINI_API_KEY_2'),
    Deno.env.get('GEMINI_API_KEY_3'),
    Deno.env.get('GEMINI_API_KEY_4'),
    Deno.env.get('GEMINI_API_KEY_5'),
  ].filter(Boolean);

  const providers: any[] = [];

  // Add Gemini models for each configured key
  geminiKeys.forEach((key, index) => {
    const keyNum = index + 1;
    providers.push(
      {
        name: `Gemini 2.5 Flash (Key ${keyNum})`,
        type: 'gemini',
        model: 'gemini-2.5-flash',
        apiKey: key,
      },
      {
        name: `Gemini 2.5 Flash Lite (Key ${keyNum})`,
        type: 'gemini',
        model: 'gemini-2.5-flash-lite',
        apiKey: key,
      },
      {
        name: `Gemini 2.0 Flash (Key ${keyNum})`,
        type: 'gemini',
        model: 'gemini-2.0-flash',
        apiKey: key,
      }
    );
  });

  // Fallback providers (only used if all Gemini keys are depleted/rate-limited)
  providers.push(
    {
      name: 'Groq Llama 3.3 70B',
      type: 'openai-compatible',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      apiKey: Deno.env.get('GROQ_API_KEY'),
    },
    {
      name: 'Groq Gemma 2 9B',
      type: 'openai-compatible',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'gemma2-9b-it',
      apiKey: Deno.env.get('GROQ_API_KEY'),
    },
    {
      name: 'OpenRouter Gemma 2 9B Free',
      type: 'openai-compatible',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'google/gemma-2-9b-it:free',
      apiKey: Deno.env.get('OPENROUTER_API_KEY'),
    },
    {
      name: 'OpenRouter Llama 3.3 70B Free',
      type: 'openai-compatible',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      apiKey: Deno.env.get('OPENROUTER_API_KEY'),
    },
    {
      name: 'Hugging Face Qwen 2.5 72B',
      type: 'openai-compatible',
      endpoint: 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions',
      model: 'Qwen/Qwen2.5-72B-Instruct',
      apiKey: Deno.env.get('HF_API_KEY') || Deno.env.get('HF_ACCESS_TOKEN') || Deno.env.get('Hugging face') || '',
    }
  );

  for (const provider of providers) {
    // If provider requires apiKey and it's not present, skip it (except Hugging Face which can be called without a key)
    if (!provider.apiKey && provider.name !== 'Hugging Face Qwen 2.5 72B') {
      console.log(`Skipping ${provider.name} because API key is not configured.`);
      continue;
    }

    try {
      console.log(`Attempting generation with ${provider.name}...`);
      let text = '';

      if (provider.type === 'gemini') {
        let geminiMessages;
        if (init) {
          geminiMessages = [
            {
              role: 'user',
              parts: [{ text: "I'm Melba, Studio Liaison at M&M Design Group. Tell me about the project you have in mind" }],
            },
          ];
        } else {
          geminiMessages = llmMessages.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          }));
        }

        const response = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: geminiMessages,
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Google API returned HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text && data.candidates?.[0]?.finishReason) {
          throw new Error(`Gemini empty response (finishReason: ${data.candidates[0].finishReason})`);
        }

      } else if (provider.type === 'openai-compatible') {
        let openaiMessages;
        if (init) {
          openaiMessages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: "I'm Melba, Studio Liaison at M&M Design Group. Tell me about the project you have in mind" }
          ];
        } else {
          openaiMessages = [
            { role: 'system', content: systemPrompt },
            ...llmMessages.map((msg: any) => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content,
            }))
          ];
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (provider.apiKey) {
          headers['Authorization'] = `Bearer ${provider.apiKey}`;
        }
        if (provider.name.includes('OpenRouter')) {
          headers['HTTP-Referer'] = 'https://maddie-design.website';
          headers['X-Title'] = 'M&M Design Group';
        }

        const response = await fetchWithTimeout(provider.endpoint!, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: provider.model,
            messages: openaiMessages,
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`${provider.name} API returned HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        text = data.choices?.[0]?.message?.content || '';
      }

      text = text.trim();
      if (!text || text === '__FALLBACK__') {
        throw new Error(`Model returned empty or fallback response: "${text}"`);
      }

      console.log(`Successfully generated response using ${provider.name}.`);
      return text;

    } catch (err: any) {
      console.warn(`Failed with ${provider.name}:`, err.message || err);
    }
  }

  throw new Error('All model providers in fallback chain failed.');
}

const PROVIDER_TIMEOUT_MS = 20_000;

async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit,
): Promise<Response> {
  return await fetch(input, {
    ...init,
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, init, leadAlreadySaved } = await req.json();

    if (!init && (!messages || !Array.isArray(messages) || messages.length === 0)) {
      throw new Error('Invalid or empty messages array');
    }

    const text = await generateCompletion(messages, init, leadAlreadySaved);

    let leadSaved = false;
    // Primary regex: tolerant of whitespace/newlines around delimiters
    const leadRegex = /<<<\s*LEAD_RECORD\s*>>>([\s\S]*?)<<<\s*END_LEAD_RECORD\s*>>>/;
    // Also use this for the final cleanup (strip both strict and loose variants)
    const leadCleanRegex = /<<<\s*LEAD_RECORD\s*>>>[\s\S]*?<<<\s*END_LEAD_RECORD\s*>>>/g;

    let leadJsonText: string | null = null;

    if (!leadAlreadySaved) {
      // Attempt 1: Primary regex extraction
      const match = text.match(leadRegex);
      if (match) {
        leadJsonText = match[1].trim();
        console.log('Lead block found via primary regex.');
      } else {
        // Attempt 2: Fallback — look for a JSON object containing "client_name"
        // This catches cases where the LLM omits or mangles the delimiters
        const jsonFallbackRegex = /\{[^{}]*"client_name"\s*:\s*"[^"]*"[^{}]*\}/s;
        const fallbackMatch = text.match(jsonFallbackRegex);
        if (fallbackMatch) {
          leadJsonText = fallbackMatch[0].trim();
          console.log('Lead block found via fallback JSON extraction (no delimiters).');
        } else {
          console.log('No lead block detected in AI response (neither regex nor fallback matched).');
        }
      }
    }

    if (leadJsonText) {
      try {
        // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
        leadJsonText = leadJsonText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```$/i, '').trim();

        const leadData = JSON.parse(leadJsonText);
        console.log('Lead data parsed successfully:', JSON.stringify(leadData));

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        if (supabaseUrl && supabaseServiceRoleKey) {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

          let existingQuery = supabaseAdmin.from('leads').select('id');
          if (leadData.email) {
            existingQuery = existingQuery.eq('email', leadData.email);
          } else if (leadData.phone) {
            existingQuery = existingQuery.eq('phone', leadData.phone);
          } else {
            existingQuery = existingQuery.eq('client_name', leadData.client_name ?? '').limit(1);
          }
          const { data: existing, error: lookupError } = await existingQuery.limit(1);
          if (lookupError) console.error('Error checking for existing lead:', lookupError);
          if (existing && existing.length > 0) {
            console.log('Duplicate lead detected — skipping insert.');
            leadSaved = true;
          } else {
            const { error } = await supabaseAdmin
              .from('leads')
              .insert({
                client_name: leadData.client_name,
                email: leadData.email,
                phone: leadData.phone,
                project_type: leadData.project_type,
                location: leadData.location,
                scale: leadData.scale,
                timeline: leadData.timeline,
                budget_range: leadData.budget_range,
                notes: leadData.notes,
                status: 'Ongoing', // Fixed: was 'New', which violates leads_status_check constraint (only 'Ongoing' or 'Completed' allowed)
              });

            if (!error) {
              leadSaved = true;
              console.log('Lead saved successfully to database.');
            } else {
              console.error('Error inserting lead to database:', error);
            }
          }
        } else {
          console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars not set');
        }
      } catch (err) {
        console.error('Failed to parse or save lead:', err);
      }
    }

    const cleanReply = text.replace(leadCleanRegex, '').trim();

    return new Response(
      JSON.stringify({
        reply: cleanReply,
        leadSaved,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error: any) {
    console.error('Edge Function handler error:', error);
    return new Response(
      JSON.stringify({
        reply: '__FALLBACK__',
        leadSaved: false,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
