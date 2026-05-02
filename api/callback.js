import { calc } from '../lib/calc.js';
import { exchangeToken, decodeIdTokenUserId, pushMessage, formatQuote } from '../lib/line.js';

function decodeState(state) {
  const json = Buffer.from(state, 'base64url').toString('utf8');
  return JSON.parse(json);
}

function redirect(res, url) {
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
}

export default async function handler(req, res) {
  const {
    LINE_LOGIN_CHANNEL_ID,
    LINE_LOGIN_CHANNEL_SECRET,
    MESSAGING_CHANNEL_ACCESS_TOKEN,
    FRONTEND_URL,
    VERCEL_URL,
  } = process.env;

  const frontend = FRONTEND_URL || '/';

  try {
    const { code, state, error } = req.query;

    if (error) {
      return redirect(res, `${frontend}/done.html?status=cancelled`);
    }
    if (!code || !state) {
      return redirect(res, `${frontend}/done.html?status=invalid`);
    }

    const { name, tsubo } = decodeState(state);
    if (!name || !tsubo) {
      return redirect(res, `${frontend}/done.html?status=invalid`);
    }

    const redirectUri = `https://${VERCEL_URL || req.headers.host}/api/callback`;
    const tokenRes = await exchangeToken({
      code,
      redirectUri,
      channelId: LINE_LOGIN_CHANNEL_ID,
      channelSecret: LINE_LOGIN_CHANNEL_SECRET,
    });
    const userId = decodeIdTokenUserId(tokenRes.id_token);

    const quote = calc(Number(tsubo));
    const messages = formatQuote({ name, ...quote });

    await pushMessage({
      accessToken: MESSAGING_CHANNEL_ACCESS_TOKEN,
      userId,
      messages,
    });

    return redirect(res, `${frontend}/done.html?status=ok`);
  } catch (err) {
    console.error('callback error', err);
    return redirect(res, `${frontend}/done.html?status=error`);
  }
}
