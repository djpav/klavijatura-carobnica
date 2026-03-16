(function(){
  /* ── THEMES ── */
  const THEMES = {
    animals: ['🐶','🐱','🐻','🦊','🐸','🐮','🐷','🦁','🐯','🐨','🦄','🦋','🐝','🐙','🦀','🦉','🦜','🐬','🦈','🐳','🐧','🦒','🦓','🐘','🦔','🦩','🐢','🦎','🦖','🐊'],
    food:    ['🍎','🍊','🍋','🍇','🍓','🍒','🍉','🌽','🥕','🍦','🍕','🎂','🍩','🍭','🧁','🌮','🍔','🍟','🥑','🍌','🥝','🫐','🍑','🥦','🧇','🥞','🍿','🥨'],
    space:   ['🚀','🌟','⭐','🌙','☀️','🌈','🪐','🌍','🌕','☄️','🔭','🛸','💫','✨','🌠','🌌','🪄','💎','🔮','🌊','⚡','🌀','🎆','🎇'],
    faces:   ['😀','😎','🤩','🥳','😍','🤪','😂','🤣','😜','🥰','😇','🤓','🤠','👻','🥹','🤖','👽','🎭','🫶','🥸','😊','🤯','🤗','🙃'],
  };
  const ALL = [...THEMES.animals, ...THEMES.food, ...THEMES.space, ...THEMES.faces];
  THEMES.all = ALL;

  const MILESTONES = {
    10:'🎉 10 karaktera!', 25:'⭐ Super! 25!',
    50:'🚀 Bravo! 50!', 100:'👑 100 – Šampion!',
    200:'🏆 200 – Legenda!'
  };
  const COLORS = ['#c77dff','#ff6bb5','#ffe066','#48dbfb','#6bcb77','#ff9f43','#ff6b6b','#4d96ff','#a8ff78','#ff8c42'];

  /* ── SPELL MODE ── */
  const SPELL_SR = {
    A:'a', B:'be', C:'ce', D:'de', E:'e', F:'ef', G:'ge', H:'ha',
    I:'i', J:'je', K:'ka', L:'el', M:'em', N:'en', O:'o', P:'pe',
    Q:'ku', R:'er', S:'es', T:'te', U:'u', V:'ve', W:'duplo ve',
    X:'iks', Y:'ipsilon', Z:'ze',
    '0':'nula', '1':'jedan', '2':'dva', '3':'tri', '4':'četiri',
    '5':'pet', '6':'šest', '7':'sedam', '8':'osam', '9':'devet'
  };
  let spellMode = false;
  let speechTimer = null;
  let srVoice = null;
  let hasSrVoice = false;

  /* Phonetic English approximations that sound like Serbian pronunciation */
  const SPELL_PHONETIC = {
    A:'ah', B:'beh', C:'tseh', D:'deh', E:'eh', F:'eff', G:'geh', H:'hah',
    I:'ee', J:'yeh', K:'kah', L:'ell', M:'emm', N:'enn', O:'oh', P:'peh',
    Q:'koo', R:'air', S:'ess', T:'teh', U:'oo', V:'veh', W:'doo-ploh veh',
    X:'eeks', Y:'ee-psee-lon', Z:'zeh',
    '0':'noo-lah', '1':'yeh-dahn', '2':'dvah', '3':'tree', '4':'cheh-tee-ree',
    '5':'peht', '6':'shehst', '7':'seh-dahm', '8':'oh-sahm', '9':'deh-veht'
  };

  /* Try to find a Serbian/Croatian/Bosnian voice */
  function findSrVoice(){
    if(typeof speechSynthesis === 'undefined') { return null; }
    const voices = speechSynthesis.getVoices();
    const prefLangs = ['sr-RS','sr','hr-HR','hr','bs-BS','bs','sr-Latn','sr-Latn-RS'];
    for(const lang of prefLangs){
      const v = voices.find(v => v.lang === lang || v.lang.startsWith(lang + '-'));
      if(v) { return v; }
    }
    const kw = ['serbian','srpski','croatian','hrvatski','bosnian','bosanski'];
    for(const v of voices){
      const name = v.name.toLowerCase();
      if(kw.some(k => name.includes(k))) { return v; }
    }
    return null;
  }

  function initVoices(){
    srVoice = findSrVoice();
    hasSrVoice = !!srVoice;
  }
  if(typeof speechSynthesis !== 'undefined'){
    speechSynthesis.addEventListener('voiceschanged', initVoices);
    initVoices();
  }

  function speakSr(key, text){
    if(typeof speechSynthesis === 'undefined') { return; }
    try {
      clearTimeout(speechTimer);
      speechSynthesis.cancel();
      speechTimer = setTimeout(()=>{
        const u = new SpeechSynthesisUtterance(
          hasSrVoice ? text : (SPELL_PHONETIC[key] || text)
        );
        if(hasSrVoice){
          u.voice = srVoice;
          u.lang = srVoice.lang;
        }
        u.rate = 0.85;
        u.pitch = 1.1;
        u.volume = 1;
        speechSynthesis.speak(u);
      }, 150);
    } catch { /* Speech not available */ }
  }

  /* ── AUDIO ── */
  let ctx = null;
  function getCtx(){
    if(!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    if(ctx.state === 'suspended') { ctx.resume(); }
    return ctx;
  }
  const NOTES = [261.6,293.7,329.6,349.2,392,440,493.9,523.3,587.3,659.3,698.5,784];
  let noteIdx = 0;
  function playPop(comboVal){
    if(activeAudioNodes >= MAX_AUDIO_NODES) { return; }
    try {
      const ac = getCtx();
      const freq = NOTES[noteIdx % NOTES.length] * (1 + Math.min(comboVal-1,9)*0.03);
      noteIdx++;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const t = ac.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.06);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(ac.destination);
      activeAudioNodes++;
      osc.start(t);
      osc.stop(t + 0.3);
      osc.onended = () => { activeAudioNodes--; };
    } catch { /* Web Audio not available */ }
  }
  function playMilestone(){
    try {
      const ac = getCtx();
      [523.3,659.3,784,1046.5].forEach((f,i)=>{
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const t = ac.currentTime + i*0.13;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(t);
        osc.stop(t + 0.38);
      });
    } catch { /* Web Audio not available */ }
  }

  /* ── STATE ── */
  let count = 0, combo = 1, lastTime = 0, active = false, theme = 'all';
  const stage = document.getElementById('stage');
  const scoreEl = document.getElementById('score-pill');
  const comboEl = document.getElementById('combo-pill');
  const overlay = document.getElementById('overlay');

  /* ── STARS ── */
  const sf = document.getElementById('starfield');
  for(let i = 0; i < 120; i++){
    const s = document.createElement('div');
    s.className = 'star';
    const sz = 1 + Math.random() * 2.5;
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${sz}px;height:${sz}px;--d:${2+Math.random()*5}s;--dd:${(Math.random()*6).toFixed(1)}s;opacity:${.05+Math.random()*.4}`;
    sf.appendChild(s);
  }

  /* ── START ── */
  function start(){
    overlay.classList.add('hidden');
    stage.focus();
    active = true;
  }
  document.getElementById('start-btn').addEventListener('click', start);
  overlay.addEventListener('click', start);

  /* ── SPELL TOGGLE ── */
  const spellBtn = document.getElementById('spell-toggle');
  spellBtn.addEventListener('click', e=>{
    e.stopPropagation();
    spellMode = !spellMode;
    spellBtn.classList.toggle('active', spellMode);
  });

  /* ── THEME BUTTONS ── */
  document.querySelectorAll('.theme-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const { theme: selected } = btn.dataset;
      setTheme(selected);
    });
  });

  /* ── BLOCK KEY EVENTS ── */
  ['keydown','keyup'].forEach(ev=>{
    document.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); }, true);
  });

  const MAX_BUBBLES = 60;
  let activeAudioNodes = 0;
  const MAX_AUDIO_NODES = 12;

  /* ── SPAWN ── */
  function spawn(x, y, label, spellText){
    if(stage.querySelectorAll('.bubble').length >= MAX_BUBBLES) { return; }

    const now = Date.now();
    if(now - lastTime < 60) { combo = Math.min(combo + 1, 20); }
    else { combo = 1; }
    lastTime = now;

    count++;
    scoreEl.textContent = `⭐ ${count}`;
    comboEl.textContent  = `🔥 x${combo}`;

    const pool = THEMES[theme];
    const emoji = pool[Math.floor(Math.random() * pool.length)];
    const col   = COLORS[Math.floor(Math.random() * COLORS.length)];
    const es    = 36 + Math.floor(Math.random() * 40) + Math.min(combo * 2, 20);
    const rot0  = `${Math.random() * 30 - 15}deg`;
    const rot1  = `${Math.random() * 30 - 15}deg`;
    const vy    = `${-(80 + Math.random() * 120 + combo * 4)}px`;
    const dur   = 3 + Math.random() * 1.2;

    const bx = Math.max(20, Math.min(x - 50, stage.clientWidth  - 110));
    const by = Math.max(80, Math.min(y - 60, stage.clientHeight - 160));

    /* ripple */
    const rip = document.createElement('div');
    rip.className = 'ripple';
    rip.style.cssText = `left:${x}px;top:${y}px;width:80px;height:80px;border-color:${col};opacity:.55;animation-duration:.65s`;
    stage.appendChild(rip);
    setTimeout(()=>rip.remove(), 750);

    /* bubble */
    const b = document.createElement('div');
    b.className = 'bubble';
    b.style.cssText = `left:${bx}px;top:${by}px;--es:${es}px;--ks:${Math.round(es*.38)}px;--rot0:${rot0};--rot1:${rot1};--vy:${vy};--dur:${dur}s`;

    const ec = document.createElement('span');
    ec.className = 'b-emoji';
    ec.textContent = emoji;

    const kc = document.createElement('span');
    kc.className = 'b-key';
    kc.style.cssText = `color:${col};border-color:${col};background:${col}18`;
    kc.textContent = label;

    b.appendChild(ec);
    b.appendChild(kc);

    if(spellText){
      const sc = document.createElement('span');
      sc.className = 'b-spell';
      sc.style.cssText = `--ss:${Math.round(es*.32)}px`;
      sc.textContent = spellText;
      b.appendChild(sc);
      speakSr(label, spellText);
    }

    stage.appendChild(b);
    setTimeout(()=>b.remove(), Math.round(dur*1000)+200);

    playPop(combo);

    /* milestone */
    if(MILESTONES[count]){
      const m = document.createElement('div');
      m.className = 'milestone';
      m.textContent = MILESTONES[count];
      stage.appendChild(m);
      setTimeout(()=>m.remove(), 2700);
      playMilestone();
    }

    /* combo burst */
    if(combo > 1 && combo % 5 === 0){
      const cb = document.createElement('div');
      cb.className = 'combo-burst';
      cb.textContent = `COMBO x${combo}! 🔥`;
      stage.appendChild(cb);
      setTimeout(()=>cb.remove(), 1300);
    }
  }

  /* ── KEYBOARD ── */
  function isLetterOrDigit(e){
    return (e.key && e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key));
  }
  document.addEventListener('keydown', e=>{
    if(!active) { return; }
    if(!isLetterOrDigit(e)) { return; }
    const x = Math.random() * (stage.clientWidth  - 140) + 70;
    const y = Math.random() * (stage.clientHeight - 220) + 110;
    const upper = e.key.toUpperCase();
    const spell = spellMode ? (SPELL_SR[upper] || null) : null;
    spawn(x, y, upper, spell);
  }, true);

  /* ── MOUSE ── */
  stage.addEventListener('click', e=>{
    if(!active) { return; }
    if(e.target.closest('.theme-btn')) { return; }
    const r = stage.getBoundingClientRect();
    spawn(e.clientX - r.left, e.clientY - r.top, '★');
  });

  /* ── SWIPE TO CHANGE THEME ── */
  const THEME_ORDER = ['all','animals','food','space','faces'];
  const THEME_LABELS = { all:'🌈 Sve', animals:'🐾 Životinje', food:'🍕 Hrana', space:'🚀 Svemir', faces:'😀 Smajliji' };
  const toast = document.getElementById('theme-toast');
  let toastTimer = null;

  function setTheme(name){
    theme = name;
    document.querySelectorAll('.theme-btn').forEach(b=>{
      b.classList.toggle('active', b.dataset.theme === name);
    });
    toast.textContent = THEME_LABELS[name];
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>toast.classList.remove('show'), 1400);
  }

  function nextTheme(dir){
    const idx = THEME_ORDER.indexOf(theme);
    const next = THEME_ORDER[(idx + dir + THEME_ORDER.length) % THEME_ORDER.length];
    setTheme(next);
  }

  let touchStartX = 0, touchStartY = 0, touchStartTime = 0, isSwiping = false;

  stage.addEventListener('touchstart', e=>{
    const t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
    isSwiping = false;
  }, { passive: true });

  stage.addEventListener('touchmove', e=>{
    const t = e.changedTouches[0];
    const dx = Math.abs(t.clientX - touchStartX);
    const dy = Math.abs(t.clientY - touchStartY);
    if(dx > 10 && dx > dy) { isSwiping = true; }
  }, { passive: true });

  stage.addEventListener('touchend', e=>{
    if(!active) { return; }
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    const isSwipe = isSwiping && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500;

    if(isSwipe){
      e.preventDefault();
      nextTheme(dx < 0 ? 1 : -1);
      return;
    }

    if(e.target.closest('.theme-btn')) { return; }
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    Array.from(e.changedTouches).forEach(touch=>{
      spawn(touch.clientX - r.left, touch.clientY - r.top, '★');
    });
  }, { passive: false });

})();
