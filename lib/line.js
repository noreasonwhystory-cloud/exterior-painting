const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

export async function exchangeToken({ code, redirectUri, channelId, channelSecret }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: channelId,
    client_secret: channelSecret,
  });
  const res = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`token exchange failed: ${res.status} ${errText}`);
  }
  return res.json();
}

export function decodeIdTokenUserId(idToken) {
  const [, payload] = idToken.split('.');
  const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  return json.sub;
}

export async function pushMessage({ accessToken, userId, messages }) {
  const res = await fetch(LINE_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`push message failed: ${res.status} ${errText}`);
  }
  return res.json();
}

export function formatQuote({
  name, tsubo, m2,
  siliconLow, siliconHigh, fluorineLow, fluorineHigh,
  riskMessage, issues,
}) {
  const yen = (n) => `${(n / 10000).toLocaleString('ja-JP')}万円`;
  const range = (lo, hi) => `${yen(lo)}〜${yen(hi)}`;

  const issueLines = (issues && issues.length > 0)
    ? '要対応箇所:\n' + issues.map((i) => `・${i.label}`).join('\n')
    : '要対応箇所: 現状大きな劣化なし';

  const text =
    `【外壁塗装 概算見積もり】\n` +
    `お名前: ${name}様\n` +
    `延床面積: ${tsubo}坪 (外壁塗装面積 約${m2}㎡)\n\n` +
    `▼ シリコン塗料 (耐用 10〜15年)\n` +
    `   約 ${range(siliconLow, siliconHigh)}\n\n` +
    `▼ フッ素塗料 (耐用 15〜20年)\n` +
    `   約 ${range(fluorineLow, fluorineHigh)}\n\n` +
    `━━━━━━━━━━━━\n` +
    `【診断結果】\n` +
    `${riskMessage}\n\n` +
    `${issueLines}\n` +
    `━━━━━━━━━━━━\n\n` +
    `▶ 正式見積もりは現地調査が必要。\n` +
    `ご希望の調査日時をこのトークに返信ください。\n` +
    `例) 5/10(土) 午前 / 5/12(月) 14時頃`;

  return [{ type: 'text', text }];
}
