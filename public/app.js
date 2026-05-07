(() => {
  const cfg = window.APP_CONFIG;

  const STEPS = ['tsubo', 'chalking', 'crack', 'caulking', 'peeling', 'leak', 'name'];
  const DET_KEYS = ['chalking', 'crack', 'caulking', 'peeling', 'leak'];

  const LEVELS = [
    { value: 'safe',   label: 'セーフ', desc: '症状なし' },
    { value: 'mild',   label: '軽微',   desc: 'ところどころ' },
    { value: 'medium', label: '中度',   desc: '目立つ劣化' },
    { value: 'severe', label: '重度',   desc: '広範囲・深刻' },
  ];

  const state = {
    step: 0,
    tsubo: null,
    det: { chalking: null, crack: null, caulking: null, peeling: null, leak: null },
    name: '',
  };

  // 劣化カードを各ステップに描画
  document.querySelectorAll('.grid-cards').forEach((grid) => {
    const key = grid.dataset.key;
    LEVELS.forEach((lv) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card card-det';
      btn.dataset.value = lv.value;
      btn.dataset.level = lv.value;
      btn.innerHTML =
        `<div class="img" style="background-image:url('img/deterioration/${key}_${lv.value}.png')"></div>` +
        `<div class="level">${lv.label}</div>` +
        `<div class="desc">${lv.desc}</div>`;
      btn.addEventListener('click', () => selectDet(key, lv.value));
      grid.appendChild(btn);
    });
  });

  // 坪数カード
  document.querySelectorAll('.card-tsubo').forEach((btn) => {
    btn.addEventListener('click', () => selectTsubo(Number(btn.dataset.value)));
  });

  // 戻るボタン
  document.getElementById('back-btn').addEventListener('click', back);

  // 氏名入力 + submit
  const nameInput = document.getElementById('name-input');
  const submitBtn = document.getElementById('submit-btn');
  nameInput.addEventListener('input', () => {
    state.name = nameInput.value.trim();
    submitBtn.disabled = !state.name;
  });
  submitBtn.addEventListener('click', submit);

  function selectTsubo(value) {
    state.tsubo = value;
    highlightSelected('tsubo', String(value));
    next();
  }

  function selectDet(key, value) {
    state.det[key] = value;
    highlightSelected(key, value);
    next();
  }

  function highlightSelected(stepKey, value) {
    const section = document.querySelector(`.step[data-step="${stepKey}"]`);
    if (!section) return;
    section.querySelectorAll('.card').forEach((c) => {
      c.classList.toggle('selected', c.dataset.value === value);
    });
  }

  function next() {
    if (state.step < STEPS.length - 1) {
      state.step++;
      render();
    }
  }

  function back() {
    if (state.step > 0) {
      state.step--;
      render();
    }
  }

  function render() {
    document.querySelectorAll('.step').forEach((s, i) => {
      s.classList.toggle('active', i === state.step);
    });
    document.getElementById('progress-current').textContent = state.step + 1;
    document.getElementById('progress-total').textContent = STEPS.length;
    document.getElementById('progress-fill').style.width =
      `${((state.step + 1) / STEPS.length) * 100}%`;
    document.getElementById('back-btn').hidden = state.step === 0;
    if (STEPS[state.step] === 'name') nameInput.focus();
  }

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

  function submit() {
    if (!state.name || !state.tsubo) {
      alert('入力内容を確認してください。');
      return;
    }
    // 未選択項目はsafe扱い
    const det = {};
    for (const k of DET_KEYS) det[k] = state.det[k] || 'safe';

    const payload = {
      name: state.name,
      tsubo: state.tsubo,
      det,
      nonce: randomNonce(),
    };
    const stateStr = base64url(payload);
    const redirectUri = `${cfg.API_BASE_URL}/api/callback`;

    const url = new URL('https://access.line.me/oauth2/v2.1/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', cfg.LINE_LOGIN_CHANNEL_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', stateStr);
    url.searchParams.set('scope', 'profile openid');
    url.searchParams.set('bot_prompt', 'aggressive');

    location.href = url.toString();
  }

  render();
})();
