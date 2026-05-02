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

export function formatQuote({ name, tsubo, m2, silicon, fluorine }) {
  const yen = (n) => `${(n / 10000).toLocaleString('ja-JP')}万円`;
  return [
    {
      type: 'text',
      text:
        `【外壁塗装 概算見積もり】\n` +
        `お名前: ${name}様\n` +
        `延床面積: ${tsubo}坪 (外壁塗装面積 約${m2}㎡)\n\n` +
        `▼ シリコン塗料 (耐用 10〜15年)\n` +
        `   約 ${yen(silicon)}\n\n` +
        `▼ フッ素塗料 (耐用 15〜20年)\n` +
        `   約 ${yen(fluorine)}\n\n` +
        `※あくまで概算。劣化状況で変動。\n` +
        `※詳細は現地調査必要。`,
    },
  ];
}
