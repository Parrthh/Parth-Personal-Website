// Contact form handler: validates the submission and emails it to you through SES.
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({});
const FROM = process.env.FROM_ADDRESS;
const TO = process.env.TO_ADDRESS;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const reply = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(body),
});

export function validate(data) {
  const clean = (v) => (typeof v === "string" ? v.trim() : "");
  const name = clean(data.name).replace(/[\r\n]+/g, " ");
  const email = clean(data.email);
  const message = clean(data.message);

  // Bots fill the hidden "company" field or submit instantly. Pretend success so they move on.
  if (clean(data.company)) return { spam: true };
  const elapsed = Number(data.elapsed);
  if (Number.isFinite(elapsed) && elapsed < 2500) return { spam: true };

  if (!name || name.length > 100) return { error: "Please enter your name." };
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "Please enter a valid email address." };
  if (message.length < 10) return { error: "Your message is a little short. Add a few more words?" };
  if (message.length > 5000) return { error: "Please keep your message under 5,000 characters." };
  return { name, email, message };
}

export const handler = async (event) => {
  let data;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body || "";
    data = JSON.parse(raw);
  } catch {
    return reply(400, { ok: false, error: "Invalid request." });
  }

  const result = validate(data ?? {});
  if (result.spam) return reply(200, { ok: true });
  if (result.error) return reply(400, { ok: false, error: result.error });

  const { name, email, message } = result;
  const sourceIp = event.requestContext?.http?.sourceIp ?? "unknown";

  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: `Portfolio Contact <${FROM}>`,
        Destination: { ToAddresses: [TO] },
        ReplyToAddresses: [email],
        Content: {
          Simple: {
            Subject: { Data: `New message from ${name} via parthkharkar.com`, Charset: "UTF-8" },
            Body: {
              Text: {
                Data: `Name: ${name}\nEmail: ${email}\n\n${message}\n\n---\nSent from the contact form (IP ${sourceIp}). Hit Reply to answer ${name} directly.`,
                Charset: "UTF-8",
              },
            },
          },
        },
      }),
    );
  } catch (err) {
    console.error("SES send failed", err);
    return reply(502, { ok: false, error: "" });
  }

  return reply(200, { ok: true });
};
