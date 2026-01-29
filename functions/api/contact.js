export async function onRequestPost({ request, env }) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let data = {};
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      for (const [k, v] of form.entries()) data[k] = String(v);
    } else {
      return json({ ok: false, message: "Unsupported content type." }, 400);
    }

    // Honeypot (spam trap)
    const hp = (data.company || "").trim();
    if (hp) return json({ ok: true, message: "Sent." }, 200);

    // Fields from your form
    const name = (data.name || "").trim();
    const email = (data.email || "").trim();
    const phone = (data.phone || "").trim();
    const service = (data.service || "").trim();
    const message = (data.message || "").trim();

    // Basic validation
    if (!name || !email || !message) {
      return json({ ok: false, message: "Please fill all required fields." }, 400);
    }
    if (!isValidEmail(email)) {
      return json({ ok: false, message: "Please enter a valid email." }, 400);
    }

    // Basic abuse guards (server-side)
if (message.length < 10) {
  return json({ ok: false, message: "Message is too short. Please add more details." }, 400);
}
if (message.length > 2000) {
  return json({ ok: false, message: "Message is too long. Please shorten it." }, 400);
}
if (name.length > 100) {
  return json({ ok: false, message: "Name is too long." }, 400);
}
if (phone && phone.length > 30) {
  return json({ ok: false, message: "Phone number is invalid." }, 400);
}


    // Env vars required
    const RESEND_API_KEY = env.RESEND_API_KEY;
    const CONTACT_TO = env.CONTACT_TO;
    const CONTACT_FROM = env.CONTACT_FROM;

    if (!RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) {
      return json({ ok: false, message: "Server is not configured for email." }, 500);
    }

    const payload = {
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      reply_to: email,
      subject: `[Website] New message from ${name}`,
      text:
        `New website contact message:\n\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone || "(none)"}\n` +
        `Service: ${service || "(none)"}\n\n` +
        `Message:\n${message}\n`
    };

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!resendResp.ok) {
      const errText = await resendResp.text();
      // Log privately, don't leak provider response to users in production UX
      console.error("Resend error:", errText);
      return json({ ok: false, message: "Failed to send. Please try again." }, 502);
    }

    return json({ ok: true, message: "Message sent successfully." }, 200);
  } catch (err) {
    console.error("Contact handler error:", err);
    return json({ ok: false, message: "Unexpected error occurred." }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}