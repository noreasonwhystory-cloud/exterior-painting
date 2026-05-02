(() => {
  const form = document.getElementById('form');
  const cfg = window.APP_CONFIG;

  function base64url(obj) {
    const json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function randomNonce() {
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const tsubo = Number(data.get('tsubo'));

    if (!name || !tsubo) {
      alert('入力内容を確認してください。');
      return;
    }

    const state = base64url({ name, tsubo, nonce: randomNonce() });
    const redirectUri = `${cfg.API_BASE_URL}/api/callback`;

    const url = new URL('https://access.line.me/oauth2/v2.1/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', cfg.LINE_LOGIN_CHANNEL_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', 'profile openid');
    url.searchParams.set('bot_prompt', 'aggressive');

    location.href = url.toString();
  });
})();
