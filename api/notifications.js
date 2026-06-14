const { Resend } = require("resend");

function getClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function shell(shortAddress) {
  return `
    <div style="background:#080810;color:#e8e8f0;font-family:Inter,Arial,sans-serif;padding:32px">
      <div style="max-width:620px;margin:0 auto;border:1px solid #1a1a2e;background:#0f0f1a;padding:24px">
        <h1 style="font-family:monospace;margin:0 0 16px">GhostVault alert</h1>
        <p style="color:#888780;line-height:1.6">Vault ${shortAddress} has changed state. Open GhostProtocol to review the current stage and required action.</p>
      </div>
    </div>
  `;
}

async function sendEmail({ to, subject, html }) {
  const resend = getClient();
  if (!resend) {
    console.log("[notifications] RESEND_API_KEY missing; skipped:", subject);
    return { skipped: true };
  }

  return resend.emails.send({
    from: "GhostProtocol <alerts@ghostprotocol.local>",
    to,
    subject,
    html
  });
}

async function sendTriggerAlert(vaultOwner, recipients = []) {
  if (recipients.length === 0) {
    console.log("[notifications] Trigger alert:", vaultOwner);
    return { skipped: true };
  }

  return sendEmail({
    to: recipients,
    subject: `GhostVault check-in missed - ${vaultOwner.slice(0, 10)}`,
    html: shell(vaultOwner)
  });
}

async function sendStageAlert(vaultOwner, stage, recipients = []) {
  if (recipients.length === 0) {
    console.log("[notifications] Stage alert:", vaultOwner, stage);
    return { skipped: true };
  }

  return sendEmail({
    to: recipients,
    subject: `GhostVault stage ${stage} reached`,
    html: shell(vaultOwner)
  });
}

async function sendCheckInReminder(vaultOwner, email, daysRemaining) {
  return sendEmail({
    to: [email],
    subject: `GhostVault: ${daysRemaining} days until trigger`,
    html: shell(vaultOwner)
  });
}

async function sendWelcome(email, vaultOwner) {
  return sendEmail({
    to: [email],
    subject: "Your GhostVault is live",
    html: shell(vaultOwner)
  });
}

module.exports = {
  sendTriggerAlert,
  sendStageAlert,
  sendCheckInReminder,
  sendWelcome
};
