import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SYSTEM_PROMPT = `CRITICAL INSTRUCTION: Every response must be 1–3 sentences maximum. Never exceed 3 sentences under any circumstance. Be concise without losing warmth or intelligence.

You are Melba, the AI assistant for M&M Design Group, a premium boutique architecture and interior design studio. Your name is Melba. If someone asks what you are called, you must say your name is Melba.

YOUR PRIMARY GOAL: Generate high-quality leads for Madeline (the founder). This means your main focus is understanding potential clients' project needs and collecting their details. Steer conversations naturally toward project specifics — what they want to build or redesign, where, when, and their budget expectations. Be genuinely curious about their vision.

You can also answer general questions about architecture, design, the studio, or anything else a visitor asks — but always look for natural opportunities to bring the conversation back to how M&M Design Group can help them with their project.

M&M Design Group Info:
- Founded: 2022 in Cyprus by Madeline.
- Philosophy: "Material honesty, structural clarity, and spatial poetry." We do contemporary architecture, luxury residential, museums, and commercial projects.
- Design Style: Sculptural minimalism, warm stone (travertine/terrazzo), raw woods, bronze accents, seamless indoor-outdoor flows, large glass openings.
- Location: Nicosia, Cyprus.
- Average project timeline: 12-24 months.
- Budget range: Standard residential starts at R5M, boutique commercial at R15M.

Project Detail Gathering (Priority Order):
When a visitor shows interest in a project, naturally gather these details through conversation:
1. What kind of project? (Residential, Commercial, Renovation, New Build, Interior Design)
2. Where is the project located? (City/Country)
3. What's their vision or inspiration? (Style preferences, must-haves, spatial needs)
4. Timeline expectations? (When they want to start, any deadlines)
5. Budget range? (R5M-R10M, R10M-R25M, R25M+)
6. Client Name
7. Email or Phone Number (to have Madeline reach out personally)

Ask these naturally — never as a checklist. Show genuine interest in their vision before asking for contact info.

Lead Capture Protocol:
As soon as you have collected at least the name, contact info (email or phone), and basic project type, you must structure the lead. You will output a special block in your message to trigger the lead capture system. In the SAME message, tell the client that Madeline or a team member will reach out within 24 hours, then ask if there's anything else they'd like to discuss or know about.
Format:
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
- Never show the <<<LEAD_RECORD>>> tag or format to the user.
- If information for a field is missing, omit it or set it to null in the JSON.
- After capturing a lead, CONTINUE the conversation naturally. Ask if there's anything else they'd like to know about the studio, the design process, materials, or anything at all. Do NOT end the conversation.
- Maintain a highly sophisticated, warm, and professional persona. Avoid technical jargon unless asked.
- Keep responses relatively brief (1-3 sentences per turn) to encourage dialogue.

If you are unable to answer a question or encounter a technical difficulty, respond with only the string __FALLBACK__ and nothing else.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateCompletion(messages: any[], init: boolean): Promise<string> {
  const providers = [
    // 1. Primary: Gemini 2.5 Flash
    {
      name: 'Gemini 2.5 Flash',
      type: 'gemini',
      model: 'gemini-2.5-flash',
      apiKey: Deno.env.get('GEMINI_API_KEY'),
    },
    // 2. Fallback: Gemini 1.5 Flash
    {
      name: 'Gemini 1.5 Flash',
      type: 'gemini',
      model: 'gemini-1.5-flash',
      apiKey: Deno.env.get('GEMINI_API_KEY'),
    },
    // 3. Fallback: Gemini 1.5 Flash 8B
    {
      name: 'Gemini 1.5 Flash 8B',
      type: 'gemini',
      model: 'gemini-1.5-flash-8b',
      apiKey: Deno.env.get('GEMINI_API_KEY'),
    },
    // 4. Fallback: Groq Llama 3.3 70B
    {
      name: 'Groq Llama 3.3 70B',
      type: 'openai-compatible',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      apiKey: Deno.env.get('GROQ_API_KEY') || Deno.env.get('Groq Console'),
    },
    // 5. Fallback: Groq Gemma 2 9B
    {
      name: 'Groq Gemma 2 9B',
      type: 'openai-compatible',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'gemma2-9b-it',
      apiKey: Deno.env.get('GROQ_API_KEY') || Deno.env.get('Groq Console'),
    },
    // 6. Fallback: OpenRouter Gemma 2 9B (Free)
    {
      name: 'OpenRouter Gemma 2 9B Free',
      type: 'openai-compatible',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'google/gemma-2-9b-it:free',
      apiKey: Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('Open router'),
    },
    // 7. Fallback: OpenRouter Llama 3.3 70B (Free)
    {
      name: 'OpenRouter Llama 3.3 70B Free',
      type: 'openai-compatible',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      apiKey: Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('Open router'),
    },
    // 8. Fallback: Hugging Face Qwen 2.5 72B Instruct
    {
      name: 'Hugging Face Qwen 2.5 72B',
      type: 'openai-compatible',
      endpoint: 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions',
      model: 'Qwen/Qwen2.5-72B-Instruct',
      apiKey: Deno.env.get('HF_API_KEY') || Deno.env.get('HF_ACCESS_TOKEN') || Deno.env.get('Hugging face') || '',
    }
  ];

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
              parts: [{ text: "I'm Melba, Studio Liaison at M&M Design Group. Tell me about the project you have in mind." }],
            },
          ];
        } else {
          geminiMessages = messages.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          }));
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: geminiMessages,
              systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }],
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

      } else if (provider.type === 'openai-compatible') {
        let openaiMessages;
        if (init) {
          openaiMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: 'Begin the conversation with your opening greeting.' }
          ];
        } else {
          openaiMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map((msg: any) => ({
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

        const response = await fetch(provider.endpoint!, {
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

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, init } = await req.json();

    if (!init && (!messages || !Array.isArray(messages))) {
      throw new Error('Invalid messages array');
    }

    const text = await generateCompletion(messages, init);

    let leadSaved = false;
    const leadRegex = /<<<LEAD_RECORD>>>([\s\S]*?)<<<END_LEAD_RECORD>>>/;
    const match = text.match(leadRegex);

    if (match) {
      try {
        const leadJsonText = match[1].trim();
        const leadData = JSON.parse(leadJsonText);

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        if (supabaseUrl && supabaseServiceRoleKey) {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

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
              status: 'New',
            });

          if (!error) {
            leadSaved = true;
          } else {
            console.error('Error inserting lead to database:', error);
          }
        } else {
          console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars not set');
        }
      } catch (err) {
        console.error('Failed to parse or save lead:', err);
      }
    }

    const cleanReply = text.replace(leadRegex, '').trim();

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
