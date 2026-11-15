(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const fields = ['enabled', 'model', 'color', 'thickness', 'intensity', 'speed', 'emojis', 'emojiText', 'direction', 'size', 'emojiSpeed', 'rate', 'background'];
  const storageKey = 'interferencia-settings-v1';
  const overlay = new URLSearchParams(location.search).get('overlay') === '1';
  const canvas = $('effects'), ctx = canvas.getContext('2d'), surface = $('surface');
  let state = {}, lastFrame = 0, lastEmoji = 0;
  if (overlay) { document.body.classList.add('overlay'); document.title = 'Interferência — captura'; }

  const readControls = () => Object.fromEntries(fields.map(id => [id, $(id).type === 'checkbox' ? $(id).checked : $(id).value]));
  function load() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { /* usar valores padrão */ }
    for (const id of fields) if (saved[id] !== undefined) $(id).type === 'checkbox' ? $(id).checked = !!saved[id] : $(id).value = saved[id];
    state = readControls(); renderControls();
  }
  function save() {
    state = readControls(); renderControls();
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch { $('status').textContent = 'Não foi possível salvar os ajustes neste navegador.'; }
  }
  function renderControls() {
    document.querySelectorAll('output[for]').forEach(el => {
      const control = $(el.getAttribute('for'));
      el.value = control.value + (['intensity', 'speed', 'emojiSpeed'].includes(control.id) ? '%' : ['size', 'thickness'].includes(control.id) ? ' px' : '');
    });
    surface.style.backgroundColor = ({ green: '#00b140', black: '#000000', blue: '#0047ff' })[state.background] || '#00b140';
  }
  document.querySelectorAll('input,select').forEach(el => el.addEventListener('input', save));
  document.querySelectorAll('summary input').forEach(el => el.addEventListener('click', e => e.stopPropagation()));
  $('reset').addEventListener('click', () => {
    for (const id of fields) {
      const el = $(id);
      if (el.type === 'checkbox') el.checked = el.defaultChecked;
      else if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = el.defaultValue;
    }
    save();
  });
  $('openOverlay').addEventListener('click', () => {
    save();
    const url = new URL(location.href); url.searchParams.set('overlay', '1');
    const win = window.open(url.href, 'interferencia-captura', 'popup=yes,width=540,height=960');
    $('status').textContent = win ? 'Janela aberta. Selecione “Interferência — captura” no LIVE Studio.' : 'Permita pop-ups para abrir a janela de captura.';
  });
  window.addEventListener('storage', e => { if (e.key === storageKey) load(); });
  load();

  function particle(symbol) {
    const container = $('particles'); if (container.childElementCount >= 60) return;
    const element = document.createElement('span'); element.className = 'particle'; element.textContent = symbol;
    const direction = state.direction, size = Number(state.size), speed = Number(state.emojiSpeed);
    const w = surface.clientWidth, h = surface.clientHeight, vertical = direction === 'up' || direction === 'down';
    const distance = (vertical ? h : w) + size * 2;
    element.style.setProperty('--size', `${size}px`); element.style.setProperty('--duration', `${Math.max(2, 11 - speed * .08)}s`);
    if (vertical) { element.style.left = `${Math.random() * 90 + 2}%`; element.style.top = direction === 'up' ? `${h}px` : `${-size}px`; }
    else { element.style.top = `${Math.random() * 85 + 2}%`; element.style.left = direction === 'left' ? `${w}px` : `${-size}px`; }
    element.style.setProperty('--dx', `${direction === 'left' ? -distance : direction === 'right' ? distance : (Math.random() - .5) * 60}px`);
    element.style.setProperty('--dy', `${direction === 'up' ? -distance : direction === 'down' ? distance : (Math.random() - .5) * 60}px`);
    element.addEventListener('animationend', () => element.remove(), { once: true }); container.appendChild(element);
  }
  function draw(now) {
    requestAnimationFrame(draw);
    if (document.hidden || now - lastFrame < 33) return;
    lastFrame = now;
    const w = surface.clientWidth, h = surface.clientHeight;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.clearRect(0, 0, w, h);
    if (state.enabled && Number(state.intensity) > 0) {
      const strength = Number(state.intensity) / 100, thickness = Number(state.thickness), speed = Number(state.speed);
      ctx.fillStyle = state.color;
      if (state.model === 'crt') {
        ctx.globalAlpha = strength * .38;
        for (let y = 0; y < h; y += Math.max(3, thickness * 2)) ctx.fillRect(0, y, w, Math.max(1, thickness / 2));
      } else {
        const y = (now * speed * .007) % (h + 80) - 40;
        ctx.globalAlpha = strength * .5; ctx.fillRect(0, y, w, thickness * (state.model === 'vhs' ? 3 : 1));
        ctx.globalAlpha = strength * .22;
        for (let i = 0; i < (state.model === 'glitch' ? 12 : 5); i++) ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * w * .25, Math.max(1, thickness / 2));
      }
      ctx.globalAlpha = 1;
    }
    if (state.emojis && now - lastEmoji > 4000 / Number(state.rate)) {
      const list = String(state.emojiText).trim().split(/\s+/).filter(Boolean);
      if (list.length) particle(list[Math.floor(Math.random() * list.length)]);
      lastEmoji = now;
    }
  }
  requestAnimationFrame(draw);
})();
