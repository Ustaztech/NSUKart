import "server-only";
import { appUrl } from "@/lib/config";

function safe(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function brandedEmail(subject: string, body: string) {
  const origin = appUrl().replace(/\/$/, "");
  const lines = body.split(/\r?\n/).filter(Boolean);
  const content = lines.map(line => {
    const match = line.match(/^(.*?): (\/(?:[a-z0-9/_-]+))$/i);
    if (match) return `<p style="margin:0 0 16px">${safe(match[1])}: <a style="color:#0c785e" href="${safe(origin + match[2])}">Open NSUKart</a></p>`;
    return `<p style="margin:0 0 16px;line-height:1.65">${safe(line)}</p>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f8f5;font-family:Arial,Helvetica,sans-serif;color:#153c32"><div style="display:none;max-height:0;overflow:hidden">An update from your NSUKart community.</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:36px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden"><tr><td style="background:#084f42;padding:28px;color:#fff"><div style="font-size:28px;font-weight:800;letter-spacing:-1px">NSUK<span style="color:#eac569">art</span></div><div style="font-size:12px;letter-spacing:1.5px;margin-top:6px">YOUR CAMPUS. YOUR MARKETPLACE.</div></td></tr><tr><td style="padding:32px 28px"><h1 style="font-size:24px;line-height:1.3;margin:0 0 24px;color:#104c3e">${safe(subject)}</h1>${content}<a href="${safe(origin)}" style="display:inline-block;background:#0c785e;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:bold;margin-top:10px">Visit NSUKart</a></td></tr><tr><td style="background:#f2f7f3;padding:22px 28px;color:#5b766d;font-size:12px;line-height:1.6">NSUKart — Your Campus. Your Marketplace.<br>This is a transactional update regarding your NSUKart account. Never share your password or one-time codes.</td></tr></table></td></tr></table></body></html>`;
}
