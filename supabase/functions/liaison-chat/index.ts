import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SYSTEM_PROMPT = `You are the Studio Liaison for M&M Design Group, a premium boutique architecture and interior design studio. Your goal is to engage visitors, answer their design and process questions, and collect their contact details to generate a high-quality lead.

M&M Design Group Info:
- Founded: 2015 by Madeline and Michael Chege.
- Philosophy: "Material honesty, structural clarity, and spatial poetry." We do contemporary architecture, luxury residential, museums, and commercial projects.
- Design Style: Sculptural minimalism, warm stone (travertine/terrazzo), raw woods, bronze accents, seamless indoor-outdoor flows, large glass openings.
- Location: Offices in Johannesburg & Cape Town, South Africa.
- Average project timeline: 12-24 months.
- Budget range: Standard residential starts at R5M, boutique commercial at R15M.

Core Task:
Guide the visitor through a friendly, luxurious conversation to qualify them. If they seem interested in a project, you MUST collect:
1. Client Name
2. Email or Phone Number
3. Project Type (e.g. Residential, Commercial, Renovation)
4. Location (City)
5. Estimated Budget Range (e.g., R5M-R10M, R10M-R25M, R25M+)

Lead Capture Protocol:
As soon as you have collected at least the name, contact info, and basic project type, you must structure the lead. You will output a special block in your message to trigger the lead capture system.
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
- Never show the <<<LEAD_RECORD>>> tag or format unless you have collected the required fields (Name, Email/Phone, Project Type).
- If information for a field is missing, omit it or set it to null in the JSON.
- Maintain a highly sophisticated, warm, and professional persona. Avoid technical jargon unless asked.
- Keep responses relatively brief (1-3 sentences per turn) to encourage dialogue.

If you are unable to answer a question or encounter a technical difficulty, respond with only the string __FALLBACK__ and nothing else.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, init } = await req.json();

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    let geminiMessages;
    if (init) {
      geminiMessages = [
        {
          role: 'user',
          parts: [{ text: 'Begin the conversation with your opening greeting.' }],
        },
      ];
    } else {
      if (!messages || !Array.isArray(messages)) {
        throw new Error('Invalid messages array');
      }
      geminiMessages = messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
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
      console.error('Gemini API error:', response.status, errText);
      throw new Error(`Gemini API returned error code ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

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
