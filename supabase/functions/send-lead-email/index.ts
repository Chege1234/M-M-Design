const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

const STUDIO_EMAIL = 'lewiskariuki04@gmail.com';
const FROM_EMAIL = 'Melba at M&M Design <melba@mmdesigngroup.site>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    const lead = payload.record;

    if (!lead) throw new Error('No record in payload');

    await sendEmail(
      STUDIO_EMAIL,
      `New Lead: ${lead.client_name || 'Unknown'} — ${lead.project_type || 'Inquiry'}`,
      `
        <h2 style="color:#1a1a1a">New Project Inquiry</h2>
        <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:6px 12px;color:#666">Name</td><td style="padding:6px 12px"><strong>${lead.client_name || '—'}</strong></td></tr>
          <tr><td style="padding:6px 12px;color:#666">Email</td><td style="padding:6px 12px">${lead.email || '—'}</td></tr>
          <tr><td style="padding:6px 12px;color:#666">Phone</td><td style="padding:6px 12px">${lead.phone || '—'}</td></tr>
          <tr><td style="padding:6px 12px;color:#666">Project Type</td><td style="padding:6px 12px">${lead.project_type || '—'}</td></tr>
          <tr><td style="padding:6px 12px;color:#666">Location</td><td style="padding:6px 12px">${lead.location || '—'}</td></tr>
          <tr><td style="padding:6px 12px;color:#666">Budget</td><td style="padding:6px 12px">${lead.budget_range || '—'}</td></tr>
          <tr><td style="padding:6px 12px;color:#666">Timeline</td><td style="padding:6px 12px">${lead.timeline || '—'}</td></tr>
          <tr><td style="padding:6px 12px;color:#666">Notes</td><td style="padding:6px 12px">${lead.notes || '—'}</td></tr>
        </table>
        <p style="font-size:12px;color:#999;margin-top:24px">Submitted via M&M Design Group website</p>
      `
    );

    if (lead.email) {
      await sendEmail(
        lead.email,
        'We received your inquiry — M&M Design Group',
        `
          <div style="font-family:Georgia,serif;max-width:580px;margin:0 auto;padding:40px 24px;color:#1a1a1a;background:#ffffff">
            
            <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9a8a6a;margin-bottom:40px">M&M Design Group</p>

            <h1 style="font-size:26px;font-weight:400;line-height:1.4;margin-bottom:24px">
              Thank you, ${lead.client_name?.split(' ')[0] || 'there'}.
            </h1>

            <p style="font-size:15px;line-height:1.9;color:#444;margin-bottom:16px">
              We've received your project inquiry and we're glad you reached out.
            </p>

            <p style="font-size:15px;line-height:1.9;color:#444;margin-bottom:16px">
              A member of our team will review your details and be in touch within <strong>24 hours</strong> to learn more about your vision and how we can bring it to life.
            </p>

            <p style="font-size:15px;line-height:1.9;color:#444;margin-bottom:40px">
              In the meantime, feel free to explore our work at <a href="https://mmdesigngroup.site" style="color:#9a8a6a;text-decoration:none">mmdesigngroup.site</a>.
            </p>

            <div style="border-top:1px solid #e8e2d9;padding-top:32px;margin-top:8px">
              <p style="font-size:13px;color:#888;line-height:1.8;margin:0">
                Warm regards,<br/>
                <strong style="color:#1a1a1a">The M&M Design Group Team</strong><br/>
                Johannesburg, South Africa
              </p>
            </div>

            <p style="font-size:11px;color:#bbb;margin-top:32px">This is an automated message. Please do not reply directly to this email.</p>

          </div>
        `
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('send-lead-email error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
