// barrierefreiheit.js — eigenes Accessibility-Widget, kein Elementor/Ally noetig
// speichert Einstellungen in localStorage, laeuft auf jeder reinen HTML-Seite
(function(){

  var LS_KEY = 'px-a11y-settings';

  var defaults = {
    textSchritt: 0,      // 0-4
    zeileSchritt: 0,      // 0-3
    linksAusrichten: false,
    lesbareSchrift: false,
    kontrast: 0,          // 0=normal 1=dunkel 2=hell-stark
    graustufen: false,
    bilderAus: false,
    animationenAus: false,
    linksHervorheben: false,
    lesemaske: false,
    umrissfokus: false,
    struktur: false,
    versteckt: false
  };

  var state = ladeState();

  function ladeState(){
    try{
      var raw = localStorage.getItem(LS_KEY);
      if(!raw) return Object.assign({}, defaults);
      var parsed = JSON.parse(raw);
      return Object.assign({}, defaults, parsed);
    }catch(e){ return Object.assign({}, defaults); }
  }

  function speichern(){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}
  }

  // ---------- Styles ----------
  var css = ''
  + '.pxa-btn{position:fixed;bottom:20px;left:20px;width:52px;height:52px;border-radius:50%;background:#384E33;border:none;cursor:pointer;z-index:99997;box-shadow:0 4px 16px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;transition:transform .2s}'
  + '.pxa-btn:hover{transform:scale(1.06)}'
  + '.pxa-btn svg{width:26px;height:26px;stroke:#fff;fill:none;stroke-width:1.6}'
  + '.pxa-panel{position:fixed;bottom:84px;left:20px;width:min(360px,calc(100vw - 40px));max-height:min(680px,calc(100vh - 120px));background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.28);z-index:99998;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}'
  + '.pxa-panel.pxa-offen{display:flex}'
  + '.pxa-head{background:#384E33;color:#fff;padding:16px 18px;display:flex;align-items:center;gap:10px}'
  + '.pxa-head svg{width:20px;height:20px;stroke:#fff;fill:none;stroke-width:1.6;flex-shrink:0}'
  + '.pxa-head h2{font-size:16px;font-weight:600;margin:0;flex:1}'
  + '.pxa-head-btns{display:flex;align-items:center;gap:4px}'
  + '.pxa-icon-btn{width:30px;height:30px;border:none;background:transparent;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;opacity:.85}'
  + '.pxa-icon-btn:hover{background:rgba(255,255,255,.15);opacity:1}'
  + '.pxa-icon-btn svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.6}'
  + '.pxa-body{overflow-y:auto;padding:16px 18px 22px}'
  + '.pxa-sektion{margin-bottom:18px}'
  + '.pxa-sektion:last-child{margin-bottom:0}'
  + '.pxa-sektion-h{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#535B54;margin:0 0 10px}'
  + '.pxa-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
  + '.pxa-opt{background:#F7F5F0;border:1px solid #D5CBBF;border-radius:10px;padding:12px 10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;text-align:center;gap:7px;transition:background .15s,border-color .15s}'
  + '.pxa-opt:hover{background:#F2ECE4}'
  + '.pxa-opt.pxa-an{background:#EFF5F7;border-color:#384E33}'
  + '.pxa-opt-icon{width:34px;height:34px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}'
  + '.pxa-opt.pxa-an .pxa-opt-icon{background:#384E33}'
  + '.pxa-opt-icon svg{width:17px;height:17px;stroke:#384E33;fill:none;stroke-width:1.6}'
  + '.pxa-opt.pxa-an .pxa-opt-icon svg{stroke:#fff}'
  + '.pxa-opt-txt{font-size:12.5px;color:#212522;font-weight:500;line-height:1.25}'
  + '.pxa-opt-sub{font-size:10.5px;color:#535B54;font-weight:400}'
  + '.pxa-bar{width:100%;height:3px;background:#D5CBBF;border-radius:2px;overflow:hidden;margin-top:2px;display:flex;gap:2px}'
  + '.pxa-bar i{flex:1;background:#D5CBBF;border-radius:1px}'
  + '.pxa-bar i.pxa-fill{background:#384E33}'
  + '.pxa-foot{padding:10px 18px;background:#F7F5F0;border-top:1px solid #D5CBBF;font-size:11px;color:#535B54;text-align:center}'
  + '.pxa-reveal{position:fixed;bottom:20px;left:20px;background:#384E33;color:#fff;border:none;border-radius:999px;padding:10px 16px;font-size:13px;cursor:pointer;z-index:99997;display:none;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,.22)}'
  + '.pxa-reveal.pxa-zeigen{display:inline-flex}'
  + '@media(max-width:480px){.pxa-panel{left:12px;bottom:70px;width:calc(100vw - 24px)}.pxa-btn{left:12px;width:44px;height:44px}.pxa-btn svg{width:21px;height:21px}.pxa-reveal{left:12px;padding:8px 14px;font-size:12px}}'
  // ---- Effekt-Klassen auf html ----
  + 'html.pxa-links-links main,html.pxa-links-links body{text-align:left !important}'
  + 'html.pxa-lesbare-schrift body,html.pxa-lesbare-schrift body *{font-family:Verdana,Arial,"Helvetica Neue",sans-serif !important;letter-spacing:.02em !important;word-spacing:.05em !important}'
  + 'html.pxa-graustufen body{filter:grayscale(1)}'
  + 'html.pxa-bilder-aus img,html.pxa-bilder-aus picture,html.pxa-bilder-aus video{visibility:hidden !important}'
  + 'html.pxa-keine-anim *{animation-play-state:paused !important;transition:none !important;scroll-behavior:auto !important}'
  + 'html.pxa-links-hervor a{text-decoration:underline !important;text-decoration-thickness:2px !important;text-underline-offset:2px !important;background:rgba(217,115,82,.16) !important;border-radius:2px}'
  + 'html.pxa-umrissfokus *:focus{outline:3px solid #A36F5A !important;outline-offset:2px !important}'
  + 'html.pxa-kontrast-dunkel body,html.pxa-kontrast-dunkel body *{background-color:#14191c !important;background-image:none !important;color:#f2ede4 !important;border-color:#3c4750 !important}'
  + 'html.pxa-kontrast-dunkel a{color:#ffb199 !important}'
  + 'html.pxa-kontrast-dunkel img,html.pxa-kontrast-dunkel picture,html.pxa-kontrast-dunkel svg{filter:brightness(.85)}'
  + 'html.pxa-kontrast-hell body,html.pxa-kontrast-hell body *{background-color:#fff !important;background-image:none !important;color:#000 !important;border-color:#000 !important}'
  + 'html.pxa-kontrast-hell a{color:#0645AD !important;text-decoration:underline !important}'
  + '.pxa-strukt-label{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.04em;color:#fff;background:#A36F5A;padding:1px 6px;border-radius:3px;margin-right:8px;vertical-align:middle;font-family:-apple-system,sans-serif}'
  + '.pxa-maske-teil{position:fixed;left:0;right:0;background:rgba(10,14,17,.82);z-index:99990;pointer-events:none}'
  + '.pxa-maske-band{position:fixed;left:0;right:0;height:140px;z-index:99991;pointer-events:none;border-top:2px solid #A36F5A;border-bottom:2px solid #A36F5A}';

  var styleEl = document.createElement('style');
  styleEl.id = 'pxa-styles';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---------- Icons (schlichte Strich-Icons) ----------
  var ic = {
    person: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.4"/><path d="M12 8v6M12 10.3l-5 2.7M12 10.3l5 2.7M12 14l-3.5 6M12 14l3.5 6"/></svg>',
    schliessen: '<svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
    reset: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 1 3 6.7"/><polyline points="3 16 3 21 8 21"/></svg>',
    ausblenden: '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><line x1="3" y1="3" x2="21" y2="21"/></svg>',
    textgroesse: '<svg viewBox="0 0 24 24"><polyline points="4 7 4 4 14 4 14 7"/><line x1="9" y1="4" x2="9" y2="18"/><line x1="6" y1="18" x2="12" y2="18"/><path d="M15 20l3-9 3 9"/><line x1="16" y1="17" x2="21" y2="17"/></svg>',
    zeilenhoehe: '<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><path d="M20 3v6M22 5l-2-2-2 2M20 21v-6M22 19l-2 2-2-2"/></svg>',
    ausrichtung: '<svg viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="18" y2="18"/></svg>',
    schrift: '<svg viewBox="0 0 24 24"><text x="2" y="18" font-size="16" font-family="sans-serif" stroke="none" fill="currentColor">Aa</text></svg>',
    kontrast: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>',
    graustufen: '<svg viewBox="0 0 24 24"><path d="M12 2.5c2.5 3 4 6.3 4 9.5a4 4 0 0 1-8 0c0-3.2 1.5-6.5 4-9.5z"/></svg>',
    bilder: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5.5-5.5L9 17"/><line x1="3" y1="3" x2="21" y2="21"/></svg>',
    animation: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/><path d="M13 4h7v7"/></svg>',
    linkextern: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
    lesemaske: '<svg viewBox="0 0 24 24"><rect x="2" y="9" width="20" height="6" rx="1"/><line x1="2" y1="4" x2="22" y2="4"/><line x1="2" y1="20" x2="22" y2="20"/></svg>',
    umriss: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" stroke-dasharray="3 2.5"/></svg>',
    struktur: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
  };

  // ---------- HTML aufbauen ----------
  var btn = document.createElement('button');
  btn.className = 'pxa-btn';
  btn.setAttribute('aria-label', 'Barrierefreiheit-Einstellungen öffnen');
  btn.innerHTML = ic.person;

  var reveal = document.createElement('button');
  reveal.className = 'pxa-reveal';
  reveal.innerHTML = ic.person + '<span>Barrierefreiheit</span>';
  reveal.setAttribute('aria-label', 'Barrierefreiheit-Widget wieder einblenden');

  var panel = document.createElement('div');
  panel.className = 'pxa-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Barrierefreiheit-Einstellungen');

  function optHtml(id, icon, label, sub, mitBalken, balkenSchritte){
    var balken = '';
    if(mitBalken){
      var teile = '';
      for(var i=0;i<balkenSchritte;i++){ teile += '<i></i>'; }
      balken = '<div class="pxa-bar" data-bar="'+id+'">'+teile+'</div>';
    }
    return '<div class="pxa-opt" data-opt="'+id+'" tabindex="0" role="button" aria-pressed="false">'
      + '<div class="pxa-opt-icon">'+icon+'</div>'
      + '<div class="pxa-opt-txt">'+label+(sub?'<div class="pxa-opt-sub" data-sub="'+id+'">'+sub+'</div>':'')+'</div>'
      + balken
      + '</div>';
  }

  panel.innerHTML =
    '<div class="pxa-head">' + ic.person +
    '<h2>Barrierefreiheit</h2>' +
    '<div class="pxa-head-btns">' +
      '<button class="pxa-icon-btn" data-action="verstecken" aria-label="Widget ausblenden">' + ic.ausblenden + '</button>' +
      '<button class="pxa-icon-btn" data-action="reset" aria-label="Einstellungen zurücksetzen">' + ic.reset + '</button>' +
      '<button class="pxa-icon-btn" data-action="schliessen" aria-label="Schließen">' + ic.schliessen + '</button>' +
    '</div></div>' +
    '<div class="pxa-body">' +
      '<div class="pxa-sektion"><p class="pxa-sektion-h">Text</p><div class="pxa-grid">' +
        optHtml('textSchritt', ic.textgroesse, 'Größerer Text', '', true, 4) +
        optHtml('zeileSchritt', ic.zeilenhoehe, 'Zeilenhöhe', '', true, 3) +
        optHtml('linksAusrichten', ic.ausrichtung, 'Linksbündig', '') +
        optHtml('lesbareSchrift', ic.schrift, 'Lesbare Schrift', '') +
      '</div></div>' +
      '<div class="pxa-sektion"><p class="pxa-sektion-h">Visuell</p><div class="pxa-grid">' +
        optHtml('kontrast', ic.kontrast, 'Kontrast', '', true, 2) +
        optHtml('graustufen', ic.graustufen, 'Graustufen', '') +
        optHtml('bilderAus', ic.bilder, 'Bilder ausblenden', '') +
        optHtml('animationenAus', ic.animation, 'Animationen anhalten', '') +
      '</div></div>' +
      '<div class="pxa-sektion"><p class="pxa-sektion-h">Orientierung</p><div class="pxa-grid">' +
        optHtml('linksHervorheben', ic.linkextern, 'Links hervorheben', '') +
        optHtml('lesemaske', ic.lesemaske, 'Lesemaske', '') +
        optHtml('umrissfokus', ic.umriss, 'Umrissfokus', '') +
        optHtml('struktur', ic.struktur, 'Seitenstruktur', '') +
      '</div></div>' +
    '</div>' +
    '<div class="pxa-foot">Land-Harz-Praxis Dr. med. Christian Müller</div>';

  function anhaengen(){
    // als Geschwister von <body> anhaengen (nicht als Kind) - so bleibt das
    // Widget von Graustufen-Filter und Kontrast-Overrides unberuehrt, die
    // auf body/body * zielen
    document.documentElement.appendChild(btn);
    document.documentElement.appendChild(panel);
    document.documentElement.appendChild(reveal);
    verdrahten();
    anwenden();
  }

  function verdrahten(){
    btn.addEventListener('click', function(){ panelToggle(true); });
    reveal.addEventListener('click', function(){
      state.versteckt = false; speichern(); anwenden();
      panelToggle(true);
    });

    panel.querySelector('[data-action="schliessen"]').addEventListener('click', function(){ panelToggle(false); });
    panel.querySelector('[data-action="reset"]').addEventListener('click', function(){
      state = Object.assign({}, defaults);
      speichern(); anwenden(); render();
    });
    panel.querySelector('[data-action="verstecken"]').addEventListener('click', function(){
      state.versteckt = true; speichern(); anwenden(); panelToggle(false);
    });

    var opts = panel.querySelectorAll('[data-opt]');
    opts.forEach(function(el){
      el.addEventListener('click', function(){ klick(el.getAttribute('data-opt')); });
      el.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); klick(el.getAttribute('data-opt')); }
      });
    });

    // nicht reagieren wenn die Beruehrung/Maus gerade ueber dem Widget
    // selbst ist (Panel, Button, Einblenden) - sonst springt die Maske beim
    // Bedienen der eigenen Buttons (z.B. Schliessen oben im Panel) dorthin
    function istImWidget(el){
      return !!(el && el.closest && (el.closest('.pxa-panel') || el.closest('.pxa-btn') || el.closest('.pxa-reveal')));
    }
    // Lesemaske folgt der Maus
    document.addEventListener('mousemove', function(e){
      if(!state.lesemaske || istImWidget(e.target)) return;
      positioniereMaske(e.clientY);
    });
    // Lesemaske folgt dem Finger - ohne das gibt es auf Handy/Tablet gar
    // kein mousemove und die Maske bleibt einfach stehen wo sie zuerst
    // (oder gar nicht) positioniert wurde
    document.addEventListener('touchmove', function(e){
      if(!state.lesemaske || istImWidget(e.target)) return;
      if(e.touches && e.touches[0]) positioniereMaske(e.touches[0].clientY);
    }, {passive:true});
    document.addEventListener('touchstart', function(e){
      if(!state.lesemaske || istImWidget(e.target)) return;
      if(e.touches && e.touches[0]) positioniereMaske(e.touches[0].clientY);
    }, {passive:true});

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && panel.classList.contains('pxa-offen')) panelToggle(false);
    });
  }

  function panelToggle(offen){
    panel.classList.toggle('pxa-offen', offen);
    btn.setAttribute('aria-expanded', offen ? 'true' : 'false');
  }

  function klick(id){
    if(id === 'textSchritt'){ state.textSchritt = (state.textSchritt + 1) % 5; }
    else if(id === 'zeileSchritt'){ state.zeileSchritt = (state.zeileSchritt + 1) % 4; }
    else if(id === 'kontrast'){ state.kontrast = (state.kontrast + 1) % 3; }
    else { state[id] = !state[id]; }
    speichern();
    anwenden();
    render();
  }

  // ---------- Effekte anwenden ----------
  var textSchritte = [1, 1.15, 1.3, 1.45, 1.6];
  var zeileSchritte = [1, 1.25, 1.5, 1.8];
  var origFontSize = new WeakMap();
  var origLineHeight = new WeakMap();

  var TEXT_SEL = 'h1,h2,h3,h4,h5,h6,p,a,li,span,label,button,input,textarea,td,th,dd,dt,figcaption,blockquote,small,strong,em,b,i';
  function textElemente(){
    var alle = document.querySelectorAll(TEXT_SEL);
    var raus = [];
    alle.forEach(function(el){
      if(el.closest('.pxa-panel') || el.closest('.pxa-btn') || el.closest('.pxa-reveal')) return;
      raus.push(el);
    });
    return raus;
  }

  function skaliereText(faktor){
    textElemente().forEach(function(el){
      if(el.children.length && el.textContent.trim() === '') return;
      if(!origFontSize.has(el)){
        var cs = window.getComputedStyle(el);
        origFontSize.set(el, parseFloat(cs.fontSize) || 16);
      }
      if(faktor === 1){ el.style.fontSize = ''; }
      else { el.style.fontSize = (origFontSize.get(el) * faktor) + 'px'; }
    });
  }

  function skaliereZeile(faktor){
    textElemente().forEach(function(el){
      if(!origLineHeight.has(el)){
        var cs = window.getComputedStyle(el);
        var lh = parseFloat(cs.lineHeight);
        var fs = parseFloat(cs.fontSize) || 16;
        origLineHeight.set(el, isNaN(lh) ? fs*1.4 : lh);
      }
      if(faktor === 1){ el.style.lineHeight = ''; }
      else { el.style.lineHeight = (origLineHeight.get(el) * faktor) + 'px'; }
    });
  }

  function positioniereMaske(y){
    entferneMaske();
    var oben = document.createElement('div');
    oben.className = 'pxa-maske-teil pxa-maske-oben';
    oben.style.top = '0'; oben.style.height = Math.max(0, y - 70) + 'px';
    var unten = document.createElement('div');
    unten.className = 'pxa-maske-teil pxa-maske-unten';
    unten.style.top = (y + 70) + 'px'; unten.style.bottom = '0';
    var band = document.createElement('div');
    band.className = 'pxa-maske-band';
    band.style.top = (y - 70) + 'px';
    document.documentElement.appendChild(oben);
    document.documentElement.appendChild(unten);
    document.documentElement.appendChild(band);
  }
  function entferneMaske(){
    document.querySelectorAll('.pxa-maske-teil,.pxa-maske-band').forEach(function(el){ el.remove(); });
  }

  function struktur(an){
    document.querySelectorAll('[data-pxa-label]').forEach(function(el){
      var lab = el.querySelector(':scope > .pxa-strukt-label');
      if(lab) lab.remove();
      el.removeAttribute('data-pxa-label');
    });
    if(!an) return;
    var sel = 'h1,h2,h3,h4,h5,h6,nav,header,footer,main';
    document.querySelectorAll(sel).forEach(function(el){
      if(el.closest('.pxa-panel') || el.closest('.pxa-btn') || el.closest('.pxa-reveal')) return;
      var label = document.createElement('span');
      label.className = 'pxa-strukt-label';
      label.textContent = el.tagName;
      el.insertBefore(label, el.firstChild);
      el.setAttribute('data-pxa-label', '1');
    });
  }

  function anwenden(){
    var html = document.documentElement;

    skaliereText(textSchritte[state.textSchritt]);
    skaliereZeile(zeileSchritte[state.zeileSchritt]);

    html.classList.toggle('pxa-links-links', !!state.linksAusrichten);
    html.classList.toggle('pxa-lesbare-schrift', !!state.lesbareSchrift);
    html.classList.toggle('pxa-graustufen', !!state.graustufen);
    html.classList.toggle('pxa-bilder-aus', !!state.bilderAus);
    html.classList.toggle('pxa-keine-anim', !!state.animationenAus);
    html.classList.toggle('pxa-links-hervor', !!state.linksHervorheben);
    html.classList.toggle('pxa-umrissfokus', !!state.umrissfokus);

    html.classList.remove('pxa-kontrast-dunkel', 'pxa-kontrast-hell');
    if(state.kontrast === 1) html.classList.add('pxa-kontrast-dunkel');
    if(state.kontrast === 2) html.classList.add('pxa-kontrast-hell');

    if(!state.lesemaske) entferneMaske();
    // beim Einschalten sofort in der Bildschirmmitte zeigen, nicht erst
    // warten bis sich Maus/Finger bewegt (auf Handy kommt sonst evtl. nie
    // ein erstes mousemove und die Maske haengt ganz oben / gar nicht)
    else if(!document.querySelector('.pxa-maske-band')) positioniereMaske(window.innerHeight/2);

    struktur(!!state.struktur);

    btn.style.display = state.versteckt ? 'none' : 'flex';
    reveal.classList.toggle('pxa-zeigen', !!state.versteckt);
    if(state.versteckt) panelToggle(false);
  }

  var barLabels = {
    textSchritt: ['Aus','1,15x','1,3x','1,45x','1,6x'],
    zeileSchritt: ['Normal','1,25x','1,5x','1,8x'],
    kontrast: ['Normal','Dunkler Kontrast','Starker Kontrast']
  };

  function render(){
    panel.querySelectorAll('[data-opt]').forEach(function(el){
      var id = el.getAttribute('data-opt');
      var an = !!state[id];
      if(id === 'textSchritt') an = state.textSchritt > 0;
      if(id === 'zeileSchritt') an = state.zeileSchritt > 0;
      if(id === 'kontrast') an = state.kontrast > 0;
      el.classList.toggle('pxa-an', an);
      el.setAttribute('aria-pressed', an ? 'true' : 'false');

      var bar = panel.querySelector('[data-bar="'+id+'"]');
      if(bar){
        var schritt = state[id];
        var kinder = bar.children;
        for(var i=0;i<kinder.length;i++){ kinder[i].classList.toggle('pxa-fill', i < schritt); }
      }
      var sub = panel.querySelector('[data-sub="'+id+'"]');
      if(sub && barLabels[id]) sub.textContent = barLabels[id][state[id]];
    });
  }

  // erst hier starten - alle Variablen/Funktionen sind jetzt initialisiert
  // schutz gegen doppelten start: bei defer-Skripten ist readyState beim
  // Ausfuehren oft schon nicht mehr 'loading', ABER DOMContentLoaded feuert
  // gleich danach trotzdem noch - ohne diese Sperre wuerde anhaengen() (und
  // damit verdrahten()) zweimal laufen und jeder Klick doppelt zaehlen
  var gestartet = false;
  function starteEinmal(){
    if(gestartet) return;
    gestartet = true;
    anhaengen();
  }
  document.addEventListener('DOMContentLoaded', starteEinmal);
  if(document.readyState !== 'loading') starteEinmal();

})();
