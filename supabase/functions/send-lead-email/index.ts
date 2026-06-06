const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

const STUDIO_EMAIL = 'lewiskariuki04@gmail.com';
const FROM_EMAIL = 'Melba at M&M Design <melba@mmdesigngroup.site>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendEmail(to: string, subject: string, html: string) {
  const maxAttempts = 3;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
      });

      if (res.ok) {
        return;
      }

      const err = await res.text();
      if ((res.status === 429 || res.status >= 500) && attempts < maxAttempts) {
        const delay = attempts * 1500;
        console.warn(`Resend failed with status ${res.status} (attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms... Error:`, err);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error(`Resend error: ${err} (status ${res.status})`);
      }
    } catch (err: any) {
      if (attempts >= maxAttempts) {
        throw err;
      }
      const delay = attempts * 1500;
      console.warn(`Fetch error on attempt ${attempts}/${maxAttempts}. Retrying in ${delay}ms... Error:`, err.message || err);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// ─── Lead emails ────────────────────────────────────────────────────────────
function buildLeadAdminEmail(lead: any): { subject: string; html: string } {
  return {
    subject: `New Lead: ${lead.client_name || 'Unknown'} — ${lead.project_type || 'Inquiry'}`,
    html: `
      <h2 style="color:#1a1a1a">New Project Inquiry (Chatbot Lead)</h2>
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
      <p style="font-size:12px;color:#999;margin-top:24px">Submitted via M&M Design Group chatbot</p>
    `,
  };
}

function buildLeadClientEmail(lead: any): { subject: string; html: string } {
  return {
    subject: 'We received your inquiry — M&M Design Group',
    html: `
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
            Nicosia, Cyprus
          </p>
        </div>
        <p style="font-size:11px;color:#bbb;margin-top:32px">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    `,
  };
}

// ─── Contact inquiry emails ─────────────────────────────────────────────────
function buildContactAdminEmail(inquiry: any): { subject: string; html: string } {
  return {
    subject: `New Contact Report: ${inquiry.name || 'Unknown'} — ${inquiry.project_type || 'General'}`,
    html: `
      <h2 style="color:#1a1a1a">New Contact Form Submission</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:6px 12px;color:#666">Name</td><td style="padding:6px 12px"><strong>${inquiry.name || '—'}</strong></td></tr>
        <tr><td style="padding:6px 12px;color:#666">Email</td><td style="padding:6px 12px">${inquiry.email || '—'}</td></tr>
        <tr><td style="padding:6px 12px;color:#666">Project Type</td><td style="padding:6px 12px">${inquiry.project_type || '—'}</td></tr>
        <tr><td style="padding:6px 12px;color:#666">Message</td><td style="padding:6px 12px">${inquiry.message || '—'}</td></tr>
      </table>
      <p style="font-size:12px;color:#999;margin-top:24px">Submitted via M&M Design Group contact form</p>
    `,
  };
}

function buildContactClientEmail(inquiry: any): { subject: string; html: string } {
  return {
    subject: 'We received your message — M&M Design Group',
    html: `
      <div style="font-family:Georgia,serif;max-width:580px;margin:0 auto;padding:40px 24px;color:#1a1a1a;background:#ffffff">
        <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9a8a6a;margin-bottom:40px">M&M Design Group</p>
        <h1 style="font-size:26px;font-weight:400;line-height:1.4;margin-bottom:24px">
          Thank you, ${inquiry.name?.split(' ')[0] || 'there'}.
        </h1>
        <p style="font-size:15px;line-height:1.9;color:#444;margin-bottom:16px">
          We've received your message and appreciate you reaching out to us.
        </p>
        <p style="font-size:15px;line-height:1.9;color:#444;margin-bottom:16px">
          A member of our team will review your inquiry and get back to you within <strong>48 hours</strong>.
        </p>
        <p style="font-size:15px;line-height:1.9;color:#444;margin-bottom:40px">
          In the meantime, feel free to explore our portfolio at <a href="https://mmdesigngroup.site" style="color:#9a8a6a;text-decoration:none">mmdesigngroup.site</a>.
        </p>
        <div style="border-top:1px solid #e8e2d9;padding-top:32px;margin-top:8px">
          <p style="font-size:13px;color:#888;line-height:1.8;margin:0">
            Warm regards,<br/>
            <strong style="color:#1a1a1a">The M&M Design Group Team</strong><br/>
            Nicosia, Cyprus
          </p>
        </div>
        <p style="font-size:11px;color:#bbb;margin-top:32px">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    `,
  };
}

// ─── Main handler ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    const record = payload.record;
    const tableName = payload.table || 'leads'; // default to leads for backward compat

    if (!record) throw new Error('No record in payload');

    if (tableName === 'contact_inquiries') {
      // ── Contact form submission ──
      const adminEmail = buildContactAdminEmail(record);
      await sendEmail(STUDIO_EMAIL, adminEmail.subject, adminEmail.html);

      if (record.email) {
        const clientEmail = buildContactClientEmail(record);
        await sendEmail(record.email, clientEmail.subject, clientEmail.html);
      }
    } else {
      // ── Chatbot lead (default) ──
      const adminEmail = buildLeadAdminEmail(record);
      await sendEmail(STUDIO_EMAIL, adminEmail.subject, adminEmail.html);

      if (record.email) {
        const clientEmail = buildLeadClientEmail(record);
        await sendEmail(record.email, clientEmail.subject, clientEmail.html);
      }
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
