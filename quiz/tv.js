/* BANDEN — KAMPEN OM KRONEN, the television's half (Kim, 7 Nov 2026).
   Borrowed screen: CIA's receiver loads this on the first 'bq' message and hands every later one
   to BQ.on. This site is public, so nothing personal lives here: the phone sends every name,
   question, selfie and line during the game, and this page only draws what it is told.

   The phone drives; this page draws scenes ('bqscene'), plays songs (Deezer previews, looked up
   here so the address is fresh), YouTube clips, the quizmaster's voice (sent from the phone in
   pieces) and its own sound effects, made here so nothing has to be fetched. Built for the 2013
   Chromecast (Chrome 90, 1280x720): opacity and transform only, no heavy filters. */
(function(){
  var tell=function(){}, root=null, stage=null, sub=null, pics={}, snd={}, voiceEl=null;
  function say(o){ o.k='bq'; tell(o); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function h(html){ var d=document.createElement('div'); d.innerHTML=html; return d.firstElementChild; }

  /* ---------- the frame ---------- */
  var CSS=''+
  '@import url("https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@500;700;900&display=swap");'+
  '#bq{position:absolute;inset:0;z-index:50;overflow:hidden;color:#fff;font-family:Inter,Roboto,system-ui,sans-serif;'+
     'background:radial-gradient(80% 90% at 50% 30%,#2b0f4a 0%,#12061f 60%,#07020d 100%)}'+
  '#bq .rays{position:absolute;left:50%;top:40%;width:1500px;height:1500px;margin:-750px 0 0 -750px;opacity:.12;'+
     'background:repeating-conic-gradient(from 0deg,#ffcf4a 0deg 6deg,transparent 6deg 18deg);animation:bqspin 90s linear infinite}'+
  '@keyframes bqspin{to{transform:rotate(360deg)}}'+
  /* NO STUTTER (Kim, 7 Nov: "the sound plays, but it kind of stutters"): the 2013 Chromecast can't redraw
     the spinning lights and keep the voice smooth at once, so the lights hold still while anyone speaks
     and stay off on the roast stage */
  '#bq.talking .rays{animation-play-state:paused}#bq.calm .rays{display:none}'+
  '#bqstage{position:absolute;inset:0}'+
  '.sc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;animation:bqin .45s ease-out both}'+
  '@keyframes bqin{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}'+
  '.big{font-family:Anton,Impact,sans-serif;letter-spacing:.02em;line-height:1}'+
  '.gold{color:#ffcf4a}.pink{color:#ff3d7f}.dim{color:#c7b3e6}'+
  '#bqsub{position:absolute;transform:translateZ(0);will-change:opacity;left:80px;right:80px;bottom:34px;text-align:center;font:700 30px/1.3 Inter,system-ui;'+
     'color:#fff;opacity:0;transition:opacity .3s;z-index:5}'+'#bqsub span{display:inline-block;padding:10px 22px;border-radius:14px;background:rgba(8,2,16,.88);box-shadow:0 0 0 2px #ffcf4a55}'+
  '#bqsub.on{opacity:1}'+
  '.card{width:200px;border-radius:18px;padding:10px 10px 14px;background:linear-gradient(160deg,#2d1650,#160a29);'+
     'box-shadow:0 0 0 3px var(--c),0 10px 30px rgba(0,0,0,.6);text-align:center}'+
  '.card .ph{width:180px;height:180px;border-radius:12px;background:#000 center/cover no-repeat;margin:0 auto 8px;'+
     'display:flex;align-items:center;justify-content:center;font:90px Anton,Impact;color:var(--c)}'+
  '.card .nm{font:40px/1 Anton,Impact;color:var(--c)}'+
  '.card .ty{font:700 16px Inter;color:#c7b3e6;margin-top:4px}'+
  '.card .tt{font:700 15px/1.2 Inter;color:#fff;margin-top:6px;min-height:36px}'+
  '.st{display:flex;align-items:center;gap:6px;font:700 11px Inter;color:#c7b3e6;margin-top:4px;text-align:left}'+
  '.st span{width:86px}.st i{flex:1;height:7px;border-radius:4px;background:#3a2560;overflow:hidden}'+
  '.st i b{display:block;height:100%;background:var(--c)}'+
  '.card.big2{transform:scale(1.25)}'+
  '.card.dim2{opacity:.35}'+
  '.q{position:absolute;left:60px;right:60px;top:40px;text-align:center;font:900 44px/1.15 Inter;text-shadow:0 3px 14px #000}'+
  '.opts{position:absolute;left:70px;right:70px;bottom:70px;display:grid;grid-template-columns:1fr 1fr;gap:16px}'+
  '.opt{border-radius:16px;padding:16px 20px 16px 70px;position:relative;background:rgba(40,18,70,.88);font:700 30px/1.15 Inter;'+
     'box-shadow:inset 0 0 0 2px #5b3a8c;min-height:44px;transition:all .4s}'+
  '.opt b{position:absolute;left:18px;top:50%;margin-top:-20px;width:40px;height:40px;border-radius:50%;background:#ffcf4a;color:#12061f;'+
     'font:900 24px/40px Inter;text-align:center}'+
  '.opt.right{background:#14803e;box-shadow:inset 0 0 0 3px #7ef0a8,0 0 30px #2bd16a}'+
  '.opt.wrong{opacity:.25}'+
  '.opt .who{position:absolute;right:12px;top:-14px;font:900 16px Inter;padding:3px 10px;border-radius:10px;background:var(--c);color:#12061f}'+
  '.duo{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;padding:14px 26px;font:28px Anton,Impact}'+
  '.duo .p{display:flex;align-items:center;gap:12px}'+
  '.duo .pip{width:22px;height:22px;border-radius:50%;box-shadow:inset 0 0 0 3px var(--c)}.duo .pip.on{background:var(--c)}'+
  '.media{position:absolute;left:50%;top:140px;transform:translateX(-50%);width:640px;height:360px;display:flex;align-items:center;justify-content:center}'+
  '.media canvas{max-width:100%;max-height:100%;border-radius:14px;box-shadow:0 10px 40px #000}'+
  '.eq{display:flex;gap:10px;align-items:flex-end;height:180px}.eq i{width:26px;background:linear-gradient(#ff3d7f,#ffcf4a);border-radius:6px;animation:bqeq .5s ease-in-out infinite alternate}'+
  '@keyframes bqeq{from{height:20%}to{height:100%}}'+
  '.timer{position:absolute;right:30px;bottom:24px;font:64px Anton,Impact;color:#ffcf4a}'+
  '.banner{position:absolute;left:0;right:0;top:44%;text-align:center;padding:22px 0;background:linear-gradient(90deg,transparent,#ff3d7fdd,transparent);'+
     'font:70px Anton,Impact;letter-spacing:.04em;animation:bqban 2.6s ease-out both;z-index:4}'+
  '@keyframes bqban{0%{opacity:0;transform:scaleX(.2)}12%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}'+
  '.tbl{width:760px}.tbl .r{display:flex;align-items:center;gap:16px;padding:8px 14px;margin:8px 0;border-radius:14px;background:rgba(40,18,70,.8);'+
     'box-shadow:inset 6px 0 0 var(--c);font:700 30px Inter;animation:bqin .5s both}'+
  '.tbl .r .n{width:46px;font:40px Anton;color:#ffcf4a}.tbl .r .ph{width:56px;height:56px;border-radius:10px;background:#000 center/cover}'+
  '.tbl .r .nm{flex:1;font:38px Anton;color:var(--c)}.tbl .r .pt{font:44px Anton}'+
  '.bomb{font-size:220px;line-height:1;animation:bqshake .12s infinite}'+
  '@keyframes bqshake{0%{transform:translate(0,0) rotate(-2deg)}50%{transform:translate(3px,-2px) rotate(2deg)}100%{transform:translate(-2px,2px) rotate(-1deg)}}'+
  '.boom{position:absolute;inset:0;background:radial-gradient(circle,#fff 0%,#ffcf4a 20%,#ff3d7f 45%,transparent 70%);animation:bqboom 1.2s ease-out both}'+
  '@keyframes bqboom{from{transform:scale(.1);opacity:1}to{transform:scale(3);opacity:0}}'+
  '.tug{position:relative;width:1000px;height:40px;border-radius:20px;background:#2b1748;margin-top:40px}'+
  '.tug .k{position:absolute;top:50%;width:100px;height:76px;margin:-48px 0 0 -50px;transition:left .9s cubic-bezier(.3,1.6,.5,1)}'+
  '.tug .t{position:absolute;top:0;bottom:0;width:4px;background:#ffcf4a55}'+
  '.bars{width:900px}.bars .r{display:flex;align-items:center;gap:14px;margin:10px 0;font:700 30px Inter}'+
  '.bars .r .nm{width:180px;font:36px Anton;color:var(--c)}.bars .r i{height:40px;border-radius:10px;background:var(--c);transition:width 1.2s ease-out;width:0}'+
  '.conf{position:absolute;top:-20px;width:14px;height:22px;animation:bqfall linear forwards}'+
  /* over the top (Kim, 7 Nov: "a lot more over the top cringe, crazy, funny") */
  '.fire{position:absolute;left:0;right:0;top:30%;text-align:center;z-index:4;animation:bqfire 3.4s ease-out both}'+
  '.fire b{display:inline-block;font:110px/1 Anton,Impact;letter-spacing:.03em;color:#fff;padding:10px 40px;'+
     'background:linear-gradient(0deg,#ff2a00,#ff8a00 45%,#ffe14a);border-radius:20px;box-shadow:0 0 60px #ff5a00,0 0 120px #ff2a00;transform:rotate(-4deg)}'+
  '.fire i{display:block;font:900 40px Inter;margin-top:18px;color:#ffe14a;text-shadow:0 0 20px #ff5a00}'+
  '@keyframes bqfire{0%{opacity:0;transform:scale(3)}10%{opacity:1;transform:scale(1)}15%{transform:scale(1.08)}20%{transform:scale(1)}85%{opacity:1}100%{opacity:0;transform:translateY(-40px)}}'+
  '.stamp{position:absolute;left:50%;top:50%;z-index:4;margin:-80px 0 0 -460px;width:920px;text-align:center;font:120px/1 Anton,Impact;color:#ff3d7f;'+
     'border:10px solid #ff3d7f;border-radius:20px;padding:20px 0;background:rgba(18,6,31,.85);transform:rotate(-12deg);animation:bqstamp .5s cubic-bezier(.2,1.6,.4,1) both 1.2s}'+
  '@keyframes bqstamp{from{opacity:0;transform:rotate(-12deg) scale(4)}to{opacity:1;transform:rotate(-12deg) scale(1)}}'+
  '.shake{animation:bqquake .5s linear}'+
  '@keyframes bqquake{0%,100%{transform:none}20%{transform:translate(-14px,6px)}40%{transform:translate(12px,-8px)}60%{transform:translate(-8px,-4px)}80%{transform:translate(6px,8px)}}'+
  '@keyframes bqfall{to{transform:translateY(780px) rotate(720deg)}}'+
  '.crownph{position:relative;width:300px;height:300px;border-radius:24px;background:#000 center/cover;box-shadow:0 0 0 5px #ffcf4a,0 0 80px #ffcf4a88}'+
  '.crownph .cr{position:absolute;left:50%;top:-150px;margin-left:-90px;animation:bqcrown 1.6s cubic-bezier(.3,1.4,.6,1) both .5s}'+
  '@keyframes bqcrown{from{transform:translateY(-500px) rotate(-30deg)}to{transform:translateY(40px) rotate(-8deg)}}'+
  '#bqyt{position:absolute;inset:0;z-index:3;background:#000;display:none}'+
  '#bqyt.on{display:block}#bqyt .lbl{position:absolute;left:0;right:0;top:0;height:104px;box-sizing:border-box;padding:24px 14px 0;text-align:center;font:44px Anton;background:#000;z-index:2}'+
  '#bqyt .cover{position:absolute;left:0;right:0;bottom:0;height:84px;background:#000;z-index:2}';

  function frame(){
    if(root)return;
    /* CIA's own video player sits idle on this page holding one of the old Chromecast's few sound
       channels; the quiz doesn't use it, so it lets it go (CIA's next cast reloads the page anyway) */
    var cv=document.getElementById('v'); if(cv){ try{ cv.pause(); cv.removeAttribute('src'); cv.load(); }catch(e){} }
    var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
    root=h('<div id="bq"><div class="rays"></div><div id="bqstage"></div><div id="bqyt"><div class="lbl"></div><div id="bqytp"></div><div class="cover"></div></div><div id="bqsub"></div></div>');
    document.body.appendChild(root);
    stage=root.querySelector('#bqstage'); sub=root.querySelector('#bqsub');
  }

  /* ---------- sound effects, made here ---------- */
  var ac=null;
  function A(){ if(!ac){ try{ ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(ac&&ac.state==='suspended')ac.resume(); return ac; }
  function tone(f,t0,dur,type,vol,f2){
    var a=A(); if(!a)return; var o=a.createOscillator(), g=a.createGain(); o.type=type||'sine';
    o.frequency.setValueAtTime(f,a.currentTime+t0); if(f2)o.frequency.exponentialRampToValueAtTime(f2,a.currentTime+t0+dur);
    g.gain.setValueAtTime(0.0001,a.currentTime+t0); g.gain.exponentialRampToValueAtTime(vol||.3,a.currentTime+t0+.02);
    g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+t0+dur); o.connect(g); g.connect(a.destination); o.start(a.currentTime+t0); o.stop(a.currentTime+t0+dur+.05);
  }
  function noise(t0,dur,vol,lp){
    var a=A(); if(!a)return; var n=a.sampleRate*dur, b=a.createBuffer(1,n,a.sampleRate), d=b.getChannelData(0);
    for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);
    var s=a.createBufferSource(); s.buffer=b; var f=a.createBiquadFilter(); f.type='lowpass'; f.frequency.value=lp||1200;
    var g=a.createGain(); g.gain.value=vol||.6; s.connect(f); f.connect(g); g.connect(a.destination); s.start(a.currentTime+t0);
  }
  var SFX={
    buzz:function(){ tone(160,0,.35,'sawtooth',.35); tone(240,0,.35,'square',.15); },
    right:function(){ tone(660,0,.14,'triangle',.4); tone(880,.12,.14,'triangle',.4); tone(1320,.24,.35,'triangle',.4); },
    wrong:function(){ tone(300,0,.25,'sawtooth',.35,200); tone(200,.25,.5,'sawtooth',.35,120); },
    drum:function(){ for(var i=0;i<22;i++)noise(i*.07,.06,.25+i*.02,900); noise(1.6,.5,.9,500); tone(90,1.6,.5,'sine',.6); },
    whoosh:function(){ noise(0,.6,.35,3000); },
    tick:function(){ tone(1800,0,.04,'square',.12); },
    boom:function(){ noise(0,1.8,1,700); tone(70,0,1.2,'sine',.8,30); },
    fanfare:function(){ [[523,0],[659,.18],[784,.36],[1047,.54],[784,.8],[1047,.98]].forEach(function(p){ tone(p[0],p[1],.3,'square',.18); tone(p[0]/2,p[1],.3,'triangle',.25); }); tone(1047,1.2,1.2,'square',.2); tone(1319,1.2,1.2,'triangle',.2); },
    vs:function(){ tone(110,0,.9,'sawtooth',.3,55); noise(0,.9,.4,400); tone(880,.5,.3,'square',.12); },
    ding:function(){ tone(1568,0,.6,'sine',.3); },
    lose:function(){ [392,370,349,330].forEach(function(f,i){ tone(f,i*.35,.4,'triangle',.3); }); },
    /* the rimshot: ba-dum… tss */
    rimshot:function(){ tone(180,0,.12,'sine',.5,120); tone(140,.14,.14,'sine',.5,90); noise(.14,.08,.5,6000);
      var a=A(); if(!a)return; var n=a.sampleRate*.9, b=a.createBuffer(1,n,a.sampleRate), d=b.getChannelData(0);
      for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
      var s=a.createBufferSource(); s.buffer=b; var f=a.createBiquadFilter(); f.type='highpass'; f.frequency.value=6000;
      var g=a.createGain(); g.gain.value=.45; s.connect(f); f.connect(g); g.connect(a.destination); s.start(a.currentTime+.38); },
    /* the air horn: three blasts of a fat detuned chord */
    horn:function(){ [0,.32,.64].forEach(function(t,i){ var d=i===2?.9:.24; [311,370,466].forEach(function(f){ tone(f,t,d,'sawtooth',.16); tone(f*1.01,t,d,'sawtooth',.12); }); }); },
    /* the sad trombone */
    trombone:function(){ [[293,0,.45],[277,.5,.45],[261,1,.45],[247,1.5,1.3]].forEach(function(n){ tone(n[0],n[1],n[2],'sawtooth',.22,n[0]*(n[1]>=1.5?.94:1)); tone(n[0]/2,n[1],n[2],'triangle',.2); }); }
  };
  function sfx(n){ try{ SFX[n]&&SFX[n](); }catch(e){} }
  function quake(){ if(!stage)return; stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); }

  /* ---------- the quizmaster's voice: mp3 sent from the phone in pieces ---------- */
  function sndPart(m){
    if(m.k==='bqsnd0'){ snd[m.id]={parts:[],text:m.text,raw:m.raw,mime:m.mime,dur:m.dur,hold:m.hold,asdata:m.asdata}; return; }
    var s=snd[m.id]; if(!s)return;
    if(m.k==='bqsndp'){ s.parts.push(m.b); return; }
    if(m.k==='bqsnd1'){
      delete snd[m.id];
      /* PUT BACK TOGETHER BY THE BROWSER ITSELF (Kim, 7 Nov: still a judder): a letter-by-letter loop
         in script held the old Chromecast's processor for a moment on every line and the voice playing
         at the time stumbled; the browser's own decoder does it far faster */
      /* UNPACKED ON ARRIVAL (Kim, 7 Nov: "very close … optimise a bit more"): the line is decoded into
         plain sound for the effects engine the moment it lands, so playing it later costs the stick
         almost nothing; if decoding fails, the media player plays it as before */
      var mime=s.mime||'audio/mpeg', b64=s.parts.join(''); s.parts=null;
      var ready=function(bu,buf){
        /* A LINE SENT AHEAD (Kim, 7 Nov: "a lot of pauses between the lines"): held until the phone says
           play, so a whole roast can arrive first and then run back to back */
        if(s.hold){ held[m.id]={url:bu,buf:buf,text:s.text,raw:s.raw,dur:s.dur}; say({e:'sndready',id:m.id,dec:buf?1:0}); }
        else playVoice(bu,m.id,s.text,true,s.dur||0,s.raw,buf); };
      /* sound test C: the player reads the line straight from its packed text, no in-memory file */
      if(s.asdata){ ready('data:'+mime+';base64,'+b64,null); return; }
      fetch('data:'+mime+';base64,'+b64).then(function(r){ return r.blob(); })
        .then(function(b){
          var bu=URL.createObjectURL(b);
          /* the effects engine judders worse than the media player on the old Chromecast (hut test,
             16:20), so lines go back to the player; decoding stays off */
          ready(bu,null); })
        .catch(function(){ var bin=atob(b64), u8=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
          ready(URL.createObjectURL(new Blob([u8],{type:mime})),null); });
    }
  }
  var held={};
  function playHeld(id){
    var x=held[id]; if(!x){ say({e:'sndend',id:id,failed:1,why:'not here'}); return; }
    delete held[id]; playVoice(x.url,id,x.text,true,x.dur||0,x.raw,x.buf);
  }
  /* ONE LINE AT A TIME, AND THE WORDS ONLY WHILE THEY ARE SPOKEN (Kim, 7 Nov: subtitles showed with no
     voice). The subtitle appears when the sound actually starts and goes when it ends. Every line
     reports how it went, and a line that never starts, or never ends, is called off rather than
     leaving the phone waiting. */
  var voiceCur=null, vPlayer=null, sPlayer=null;
  function voicePlayer(){ if(!vPlayer){ vPlayer=document.createElement('audio'); vPlayer.preload='auto'; document.body.appendChild(vPlayer); } return vPlayer; }
  function songPlayer(){ if(!sPlayer){ sPlayer=document.createElement('audio'); sPlayer.preload='auto'; document.body.appendChild(sPlayer); } return sPlayer; }
  /* hands the sound back to the Chromecast: stop, forget the source, and reload empty */
  function release(el){ try{ el.pause(); el.removeAttribute('src'); el.load(); }catch(e){} }
  /* SUBTITLES CUED TO THE VOICE (Kim, 7 Nov: "make sure the subs is cued to the speak"). A line is cut
     into phrases at its punctuation; each phrase is weighted by its length, and the acting cues in
     square brackets ([pause], [laughs] …) weigh as the silence they make. While the line plays, the
     phrase whose share of the line Laura has reached is the one on screen. */
  var CUE={'pause':10,'dramatic pause':16,'laughs':9,'chuckles':6,'sighs':7,'mock gasp':6};
  function phrasesOf(raw){
    var segs=[], gap=0;
    String(raw).split(/(\[[^\]]*\])/).forEach(function(part){
      var tag=/^\[([^\]]*)\]$/.exec(part);
      if(tag){ gap+=CUE[tag[1].toLowerCase()]||3; return; }
      (part.match(/[^.!?…,]+[.!?…,]*\s*/g)||[]).forEach(function(p){
        var t=p.trim(); if(!t)return;
        var last=segs[segs.length-1];
        if(last&&!gap&&(last.t.length<18||t.length<8)){ last.t+=' '+t; last.w+=t.length; }
        else { segs.push({t:t,w:t.length,gap:gap}); gap=0; }
      });
    });
    var tot=0; segs.forEach(function(s){ s.from=tot+s.gap; tot+=s.gap+s.w; });
    segs.forEach(function(s){ s.from/=tot||1; });
    return segs;
  }
  function playVoice(src,id,text,revoke,dur,raw,buf){
    if(voiceCur)voiceCur.stop('replaced');
    /* ONE PLAYER, REUSED (Kim, 7 Nov: the first lines played, then silence). The old Chromecast runs only a
       couple of sound players at once; a new one per line, never released, left it playing silence from
       the third line on. The same element plays every line and lets go of each one when it ends.
       A line already unpacked (buf) plays through the effects engine instead, which costs the stick less. */
    var useBuf=!!(buf&&ac), el=useBuf?null:voicePlayer(), node=null, tStart=0, done=false, started=false, t0=Date.now(), dog=0;
    var segs=phrasesOf(raw||text||''), cueT=0, shown=-1, para=null, stalls=0;
    var pos=function(){ return useBuf?Math.max(0,ac.currentTime-tStart):el.currentTime; };
    var cur={stop:function(why){ if(done)return; done=true; clearTimeout(dog); clearInterval(cueT);
      if(useBuf){ try{ node.onended=null; node.stop(); node.disconnect(); }catch(e){} }
      else { el.onplaying=el.onended=el.onerror=el.onwaiting=el.onstalled=null; release(el); }
      if(para)[].forEach.call(para.children,function(x){ x.style.opacity=1; });
      sub.classList.remove('on'); duck(false); if(root)root.classList.remove('talking'); if(revoke&&/^blob:/.test(src))URL.revokeObjectURL(src);
      if(voiceCur===cur)voiceCur=null; say({e:'sndend',id:id,failed:started?0:1,why:why,ms:Date.now()-t0,stalls:stalls,via:useBuf?'engine':'player'}); }};
    voiceCur=cur;
    var onStarted=function(){ if(started)return; started=true; clearTimeout(dog);
      duck(true); root.classList.add('talking'); say({e:'sndplay',id:id,ms:Date.now()-t0,via:useBuf?'engine':'player'});
      /* the old Chromecast doesn't always fire 'ended'; the line's own length closes it instead */
      var len=useBuf?buf.duration:(dur||((el.duration&&isFinite(el.duration))?el.duration:0));
      /* on the roast stage the line is written into the paragraph on the right, phrase by phrase;
         everywhere else it is the subtitle at the bottom */
      var panel=document.getElementById('roastp');
      if(panel&&segs.length){
        [].forEach.call(panel.querySelectorAll('p'),function(p){ p.style.color='#a995c9'; });
        para=document.createElement('p'); para.style.cssText='margin:0 0 16px;color:#fff';
        para.innerHTML=segs.map(function(s){ return '<span style="opacity:.12">'+esc(s.t)+' </span>'; }).join('');
        panel.appendChild(para);
      }
      if(segs.length){
        var cue=function(){ var f=len?Math.min(1,pos()/len):0, i=0;
          for(var k=0;k<segs.length;k++)if(segs[k].from<=f+0.02)i=k;
          if(i===shown)return; shown=i;
          if(para){ [].forEach.call(para.children,function(s,n){ if(n<=i)s.style.opacity=1; }); }
          else { sub.innerHTML='<span>'+esc(segs[i].t)+'</span>'; sub.classList.add('on'); } };
        cue(); if(len&&segs.length>1)cueT=setInterval(cue,200);
      }
      dog=setTimeout(function(){ cur.stop(len?'by length':'overran'); },len?len*1000+(useBuf?600:300):20000); };
    if(useBuf){
      if(ac.state==='suspended')ac.resume();
      node=ac.createBufferSource(); node.buffer=buf; node.connect(ac.destination);
      node.onended=function(){ cur.stop('ended'); };
      tStart=ac.currentTime+0.05; node.start(tStart);
      setTimeout(onStarted,50);
      return;
    }
    voiceEl=el; el.volume=1; el.src=src;
    el.onplaying=onStarted;
    el.onended=function(){ cur.stop('ended'); };
    el.onerror=function(){ cur.stop('error '+(el.error&&el.error.code)); };
    /* every hiccup counted, so a judder can be told from the log */
    stalls=0; el.onwaiting=el.onstalled=function(){ stalls++; };
    dog=setTimeout(function(){ cur.stop('never started'); },10000);
    el.play().catch(function(e){ cur.stop('refused '+e.name); });
  }
  function subtitle(t,ms){ sub.innerHTML='<span>'+esc(t)+'</span>'; sub.classList.add('on'); clearTimeout(sub._t); sub._t=setTimeout(function(){ sub.classList.remove('on'); },ms||4000); }

  /* ---------- pictures (selfies) sent from the phone in pieces ---------- */
  var picIn={};
  function picPart(m){
    if(m.k==='bqpic0'){ picIn[m.id]=[]; return; }
    if(m.k==='bqpicp'){ (picIn[m.id]||[]).push(m.b); return; }
    if(m.k==='bqpic1'){ var p=picIn[m.id]; delete picIn[m.id]; if(!p)return; pics[m.id]='data:image/jpeg;base64,'+p.join(''); say({e:'pic',id:m.id}); }
  }
  function ph(id){ return pics[id]?'background-image:url('+pics[id]+')':''; }

  /* ---------- songs: Deezer's public previews, no advert ---------- */
  var au=null, auVol=1;
  function song(m){
    stopSong();
    var cb='bqdz'+Date.now(), t0=Date.now();
    window[cb]=function(r){
      delete window[cb];
      if(!r||!r.preview){ say({e:'songfail',id:m.deezer}); return; }
      /* the one music player, reused (see voicePlayer) */
      au=songPlayer(); au.volume=auVol; au.src=r.preview;
      var told=false; au.onplaying=function(){ if(told)return; told=true; say({e:'songplay',id:m.deezer,ms:Date.now()-t0}); };
      au.onended=function(){ say({e:'songend',id:m.deezer}); };
      au.play().catch(function(e){ say({e:'songfail',id:m.deezer,m:String(e)}); });
    };
    var s=document.createElement('script');
    s.src='https://api.deezer.com/track/'+encodeURIComponent(m.deezer)+'?output=jsonp&callback='+cb;
    s.onerror=function(){ say({e:'songfail',id:m.deezer}); };
    document.body.appendChild(s);
  }
  function stopSong(){ if(au){ au.onplaying=au.onended=null; release(au); au=null; } }
  function duck(on){ auVol=on?.25:1; if(au)au.volume=auVol; }

  /* ---------- YouTube: the clip shows full screen, adverts and all. Solid black bars top and bottom hide
     YouTube's own title and channel strip (Kim, 7 Nov: the title must not show before the clip plays). ---------- */
  var yt=null, ytReady=false, ytWait=null, ytTick=0, ytLive=false;
  function loadYt(then){
    if(ytReady){ then(); return; }
    if(ytWait){ ytWait.push(then); return; }
    ytWait=[then];
    window.onYouTubeIframeAPIReady=function(){ ytReady=true; var q=ytWait; ytWait=null; q.forEach(function(f){ f(); }); };
    var s=document.createElement('script'); s.src='https://www.youtube.com/iframe_api'; s.onerror=function(){ say({e:'ytfail'}); };
    document.body.appendChild(s);
  }
  function ytPlay(m){
    var box=root.querySelector('#bqyt'); box.querySelector('.lbl').textContent=m.label||'';
    box.classList.add('on'); ytLive=false;
    loadYt(function(){
      if(yt){ try{ yt.destroy(); }catch(e){} yt=null; }
      root.querySelector('#bqytp').outerHTML='<div id="bqytp"></div>';
      yt=new YT.Player('bqytp',{width:'1280',height:'720',videoId:m.id,
        playerVars:{autoplay:1,controls:0,start:m.start||0,end:m.end||0,playsinline:1,rel:0,modestbranding:1,iv_load_policy:3,disablekb:1,origin:location.origin},
        events:{
          onReady:function(){ try{ if(m.mute)yt.mute(); else{ yt.unMute(); yt.setVolume(100); } yt.playVideo(); }catch(e){} },
          onStateChange:function(ev){ if(ev.data===0){ say({e:'ytend',id:m.id}); } },
          onError:function(ev){ say({e:'yterr',id:m.id,code:ev.data}); ytStop(); }
        }});
      clearInterval(ytTick); var adSaid=false;
      ytTick=setInterval(function(){
        if(!yt||!yt.getPlayerState)return;
        var s=yt.getPlayerState(), t=yt.getCurrentTime();
        /* the clip itself has begun once it plays at or past its own start; anything before that is an advert */
        if(!ytLive&&s===1&&t>=(m.start||0)-0.5){ ytLive=true; say({e:'ytlive',id:m.id}); }
        if(!ytLive&&!adSaid&&t>0.5&&t<(m.start||0)-1){ adSaid=true; say({e:'ytad',id:m.id}); }
        if(ytLive&&m.end&&t>=m.end){ say({e:'ytend',id:m.id}); ytStop(); }
      },400);
    });
  }
  function ytStop(){ clearInterval(ytTick); if(yt){ try{ yt.stopVideo(); yt.destroy(); }catch(e){} yt=null; } if(root)root.querySelector('#bqyt').classList.remove('on'); }

  /* ---------- poster that sharpens out of big pixels ---------- */
  var pixRaf=0;
  function pixel(el,url,fx,secs){
    var c=document.createElement('canvas'); c.width=640; c.height=360; el.appendChild(c);
    var g=c.getContext('2d'), im=new Image(); im.crossOrigin='anonymous';
    im.onload=function(){
      var r=Math.min(640/im.naturalWidth,360/im.naturalHeight), w=Math.round(im.naturalWidth*r), hh=Math.round(im.naturalHeight*r);
      c.width=w; c.height=hh; var t0=performance.now(), dur=(secs||18)*1000, tmp=document.createElement('canvas'), tg=tmp.getContext('2d');
      cancelAnimationFrame(pixRaf);
      (function step(){
        var p=Math.min(1,(performance.now()-t0)/dur);
        if(fx==='zoom'){
          var z=8-7*Math.pow(p,.6), sw=im.naturalWidth/z, sh=im.naturalHeight/z;
          g.imageSmoothingEnabled=true; g.drawImage(im,(im.naturalWidth-sw)*0.42,(im.naturalHeight-sh)*0.38,sw,sh,0,0,w,hh);
        } else if(fx==='pixel'){
          var cells=Math.max(4,Math.round(4+Math.pow(p,2.2)*(w-4))); var ch=Math.max(2,Math.round(cells*hh/w));
          tmp.width=cells; tmp.height=ch; tg.imageSmoothingEnabled=true; tg.drawImage(im,0,0,cells,ch);
          g.imageSmoothingEnabled=false; g.drawImage(tmp,0,0,cells,ch,0,0,w,hh);
        } else { g.drawImage(im,0,0,w,hh); p=1; }
        if(p<1&&document.body.contains(c))pixRaf=requestAnimationFrame(step);
      })();
    };
    im.onerror=function(){ say({e:'imgfail',url:url}); };
    im.src=url;
  }
  function revealPic(){ cancelAnimationFrame(pixRaf); var c=stage.querySelector('.media canvas'); if(c&&c._im){} }

  /* ---------- scenes ---------- */
  var timerT=0;
  function startTimer(el,secs){
    clearInterval(timerT); var end=Date.now()+secs*1000;
    timerT=setInterval(function(){ var left=Math.ceil((end-Date.now())/1000); if(!document.body.contains(el)){ clearInterval(timerT); return; }
      el.textContent=Math.max(0,left); if(left<=5&&left>0)sfx('tick'); if(left<=0)clearInterval(timerT); },1000);
    el.textContent=secs;
  }
  function card(p,extra){
    var st=(p.stats||[]).map(function(s){ return '<div class="st"><span>'+esc(s[0])+'</span><i><b style="width:'+s[1]+'%"></b></i></div>'; }).join('');
    return '<div class="card '+(extra||'')+'" style="--c:'+p.c+'"><div class="ph" style="'+ph(p.id)+'">'+(pics[p.id]?'':esc(p.name[0]))+'</div>'+
      '<div class="nm">'+esc(p.name)+'</div><div class="ty">'+esc(p.type)+' · '+esc(p.nick||'')+'</div>'+
      (p.title?'<div class="tt">'+esc(p.title)+'</div>':'')+st+'</div>';
  }
  function show(html){ clearInterval(timerT); root.classList.remove('calm'); var el=h('<div class="sc">'+html+'</div>'); stage.innerHTML=''; stage.appendChild(el); return el; }
  function confetti(n){
    var cols=['#ffcf4a','#ff3d7f','#3de0ff','#7ef0a8','#b388ff'];
    for(var i=0;i<(n||90);i++){ var c=document.createElement('i'); c.className='conf';
      c.style.cssText='left:'+Math.random()*100+'%;background:'+cols[i%5]+';animation-duration:'+(2.5+Math.random()*2.5)+'s;animation-delay:'+(Math.random()*1.5)+'s';
      root.appendChild(c); (function(c){ setTimeout(function(){ c.remove(); },6000); })(c); }
  }

  var S={
    title:function(m){
      show('<div class="big gold" style="font-size:150px;text-shadow:0 0 40px #ff3d7f">BANDEN</div>'+
           '<div class="big" style="font-size:54px;margin-top:10px">KAMPEN OM KRONEN</div>'+
           '<div class="dim" style="font:700 26px Inter;margin-top:26px">'+esc(m.sub||'')+'</div>');
      if(m.sfx!==false)sfx('fanfare');
    },
    msg:function(m){
      show('<div class="big '+(m.cls||'gold')+'" style="font-size:'+(m.size||96)+'px;text-align:center;padding:0 60px">'+esc(m.big||'')+'</div>'+
           (m.small?'<div style="font:700 34px/1.3 Inter;margin-top:24px;text-align:center;max-width:1050px">'+esc(m.small)+'</div>':''));
      if(m.sfx)sfx(m.sfx);
    },
    select:function(m){
      var el=show('<div class="big gold" style="font-size:56px;margin-bottom:26px">VÆLG DIN KÆMPER</div><div style="display:flex;gap:22px">'+
        m.players.map(function(p){ return card(p,p.id===m.on?'big2':(m.on?'dim2':'')); }).join('')+'</div>');
      if(m.on)sfx('whoosh');
    },
    card:function(m){ show(card(m.p,'big2')); sfx('ding'); },
    rules:function(m){
      show('<div class="big gold" style="font-size:64px;margin-bottom:20px">REGLERNE</div><div style="width:1100px">'+
        m.rules.map(function(r,i){ return '<div style="font:700 25px/1.3 Inter;margin:7px 0;animation:bqin .4s both '+(i*.25)+'s"><span class="gold">'+(i+1)+'.</span> '+esc(r)+'</div>'; }).join('')+'</div>');
    },
    round:function(m){
      show('<div class="dim" style="font:900 30px Inter;letter-spacing:.3em">'+esc(m.kicker||'')+'</div>'+
           '<div class="big gold" style="font-size:130px;text-shadow:0 0 50px #ff3d7f">'+esc(m.title)+'</div>'+
           '<div style="font:700 32px Inter;margin-top:14px">'+esc(m.sub||'')+'</div>'); sfx('whoosh');
    },
    bet:function(m){
      show('<div class="big gold" style="font-size:60px">BÆNKEN BETTER</div><div style="display:flex;gap:30px;align-items:center;margin-top:30px">'+
           card(m.bench,'big2')+'</div><div style="font:700 32px Inter;margin-top:60px">'+esc(m.text||'')+'</div>');
    },
    vs:function(m){
      show('<div style="display:flex;align-items:center;gap:90px">'+card(m.a,'big2')+'<div class="big pink" style="font-size:150px;text-shadow:0 0 40px #ff3d7f">VS</div>'+card(m.b,'big2')+'</div>'+
           '<div class="dim" style="font:700 26px Inter;margin-top:70px">'+esc(m.round||'')+(m.bench?' · på bænken: '+esc(m.bench):'')+'</div>');
      sfx('vs');
    },
    q:function(m){
      var duo=m.a?'<div class="duo"><div class="p" style="--c:'+m.a.c+'">'+esc(m.a.name)+' '+pips(m.a.pts)+'</div>'+
        '<div class="dim" style="font:700 22px Inter;padding-top:6px">'+esc(m.label||'')+'</div>'+
        '<div class="p" style="--c:'+m.b.c+'">'+pips(m.b.pts)+' '+esc(m.b.name)+'</div></div>':'';
      var hasMedia=m.media&&(m.media.t==='img'||m.media.t==='song');
      var el=show(duo+'<div class="q" style="'+(hasMedia?'':'top:150px')+'">'+esc(m.text)+'</div>'+
        (hasMedia?'<div class="media"></div>':'')+
        (m.opts?'<div class="opts">'+m.opts.map(function(o,i){ return '<div class="opt" data-i="'+i+'"><b>'+'ABCD'[i]+'</b>'+esc(o)+'</div>'; }).join('')+'</div>':'')+
        (m.slider?'<div style="position:absolute;bottom:120px;font:700 34px Inter" class="dim">Træk i skyderen på telefonen · '+esc(m.slider.min)+'–'+esc(m.slider.max)+' '+esc(m.slider.unit||'')+'</div>':'')+
        '<div class="timer"></div>');
      if(m.media&&m.media.t==='img')pixel(el.querySelector('.media'),m.media.url,m.media.fx,m.secs||18);
      if(m.media&&m.media.t==='song')el.querySelector('.media').innerHTML='<div class="eq">'+'<i></i>'.repeat(14)+'</div>';
      if(m.media&&m.media.t==='song')[].forEach.call(el.querySelectorAll('.eq i'),function(x,i){ x.style.animationDelay=(i*.07)+'s'; x.style.animationDuration=(.35+(i%4)*.12)+'s'; });
      if(m.secs)startTimer(el.querySelector('.timer'),m.secs);
    },
    buzzed:function(m){
      var b=h('<div class="banner" style="background:linear-gradient(90deg,transparent,'+m.c+'ee,transparent)">'+esc(m.name)+' BUZZER!</div>');
      root.appendChild(b); setTimeout(function(){ b.remove(); },2600); sfx('buzz');
      if(m.stopSong)stopSong();
    },
    locked:function(m){ var b=h('<div class="banner" style="font-size:44px;top:58%;background:linear-gradient(90deg,transparent,'+m.c+'aa,transparent)">'+esc(m.name)+' har låst</div>'); root.appendChild(b); setTimeout(function(){ b.remove(); },2600); sfx('tick'); },
    reveal:function(m){
      var opts=stage.querySelectorAll('.opt');
      if(opts.length&&m.ans!=null){
        sfx('drum');
        setTimeout(function(){
          [].forEach.call(opts,function(o,i){ o.classList.add(i===m.ans?'right':'wrong'); });
          (m.picks||[]).forEach(function(p){ if(p.i==null)return; var o=opts[p.i]; if(!o)return; o.classList.remove('wrong'); var w=h('<span class="who" style="--c:'+p.c+'">'+esc(p.name)+'</span>'); o.appendChild(w); });
          sfx(m.good?'right':'wrong'); if(!m.good)quake();
          if(m.line)subtitle(m.line,6000);
        },1900);
      } else {
        show('<div class="dim" style="font:700 30px Inter">Svaret er</div><div class="big gold" style="font-size:'+(m.size||110)+'px;text-align:center;padding:0 40px">'+esc(m.answer)+'</div>'+
          (m.picks?'<div style="display:flex;gap:40px;margin-top:30px">'+m.picks.map(function(p){ return '<div style="font:700 34px Inter;color:'+p.c+'">'+esc(p.name)+': '+esc(p.v)+'</div>'; }).join('')+'</div>':'')+
          (m.line?'<div style="font:700 28px/1.3 Inter;margin-top:30px;max-width:1000px;text-align:center" class="dim">'+esc(m.line)+'</div>':''));
        sfx(m.good?'right':'wrong'); if(!m.good)quake();
      }
      stopSong(); cancelAnimationFrame(pixRaf); clearInterval(timerT); var tm=stage.querySelector('.timer'); if(tm)tm.textContent='';
      var c=stage.querySelector('.media canvas'); if(c&&m.img){ /* show the clean picture */ var im=new Image(); im.crossOrigin='anonymous'; im.onload=function(){ c.getContext('2d').drawImage(im,0,0,c.width,c.height); }; im.src=m.img; }
    },
    duelend:function(m){
      show('<div class="dim" style="font:900 30px Inter;letter-spacing:.2em">VINDER AF DUELLEN</div><div style="margin:30px 0">'+card(m.w,'big2')+'</div>'+
        '<div class="big" style="font-size:60px;margin-top:40px">'+m.sw+' – '+m.sl+'</div>'); sfx('fanfare'); confetti(50);
      if(m.flawless){ root.appendChild(h('<div class="stamp">TOTAL YDMYGELSE</div>')); setTimeout(function(){ sfx('trombone'); var s=root.querySelector('.stamp'); if(s)setTimeout(function(){ s.remove(); },4200); },1300); }
    },
    /* ROAST TIME: the names flash past, slow down and land on the victim */
    roastpick:function(m){
      var el=show('<div class="big pink" style="font-size:120px;text-shadow:0 0 50px #ff3d7f">ROAST-TID</div>'+
        '<div class="big" id="rp" style="font-size:110px;margin-top:40px;height:120px">…</div>'), rp=el.querySelector('#rp');
      var n=m.names, i=0, steps=26, k=0;
      (function spin(){ var x=n[i++%n.length]; if(k===steps-1)x={name:m.pick,c:(n.filter(function(y){ return y.name===m.pick; })[0]||{}).c};
        rp.textContent=x.name; rp.style.color=x.c; sfx('tick'); k++;
        if(k<steps)setTimeout(spin,60+k*k*0.6); else { sfx('drum'); rp.style.transform='scale(1.3)'; rp.style.transition='transform .4s'; } })();
    },
    /* THE ROAST STAGE (Kim, 7 Nov): the victim on the left, the microphone in the middle, and on the
       right the roast itself, written out as a paragraph while Laura reads it. */
    roast:function(m){
      var el=show('<div style="position:absolute;inset:0;transform:translateZ(0);background:radial-gradient(30% 55% at 50% 45%,#fff2 0%,#fff1 40%,transparent 70%)"></div>'+
        '<div style="position:absolute;left:50px;top:0;bottom:0;width:330px;display:flex;flex-direction:column;align-items:center;justify-content:center">'+
          '<div class="crownph" style="width:280px;height:280px;'+ph(m.p.id)+';box-shadow:0 0 0 5px '+m.p.c+',0 0 70px '+m.p.c+';display:flex;align-items:center;justify-content:center">'+
            (pics[m.p.id]?'':'<span style="font:180px Anton,Impact;color:'+m.p.c+'">'+esc(m.p.name[0])+'</span>')+'</div>'+
          '<div class="big" style="font-size:84px;margin-top:22px;color:'+m.p.c+'">'+esc(m.p.name)+'</div>'+
          '<div class="big pink" style="font-size:34px;margin-top:6px;letter-spacing:.18em">BLIVER ROASTET</div></div>'+
        '<svg viewBox="0 0 60 150" width="90" height="225" style="position:absolute;left:420px;top:50%;margin-top:-112px;filter:drop-shadow(0 0 20px #ffcf4a66)">'+
          '<rect x="15" y="0" width="30" height="54" rx="15" fill="#d9cdf0"/><g stroke="#8d7fb0" stroke-width="1.5"><line x1="15" y1="14" x2="45" y2="14"/><line x1="15" y1="24" x2="45" y2="24"/><line x1="15" y1="34" x2="45" y2="34"/></g>'+
          '<path d="M8 40 v6 a22 22 0 0 0 44 0 v-6" fill="none" stroke="#aaa" stroke-width="4"/><rect x="28" y="68" width="4" height="70" fill="#999"/><rect x="10" y="138" width="40" height="8" rx="4" fill="#999"/></svg>'+
        '<div id="roastp" style="position:absolute;transform:translateZ(0);will-change:contents;left:560px;right:50px;top:60px;bottom:60px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;'+
          'font:700 30px/1.35 Inter,system-ui"></div>');
      /* a still spotlight: no spinning lights on the roast stage, so the old Chromecast has breath for the voice */
      root.classList.add('calm'); sfx('whoosh');
    },
    streak:function(m){
      var f=h('<div class="fire"><b>I FULD FLAMME</b><i>'+esc(m.name)+' · '+m.n+' I TRÆK</i></div>');
      root.appendChild(f); setTimeout(function(){ f.remove(); },3500); sfx('horn');
    },
    table:function(m){
      show('<div class="big gold" style="font-size:64px;margin-bottom:16px">'+esc(m.title||'STILLINGEN')+'</div><div class="tbl">'+
        m.rows.map(function(r,i){ return '<div class="r" style="--c:'+r.c+';animation-delay:'+(i*.15)+'s"><span class="n">'+(i+1)+'</span><span class="ph" style="'+ph(r.id)+'"></span><span class="nm">'+esc(r.name)+'</span><span class="dim" style="font:700 22px Inter">'+esc(r.note||'')+'</span><span class="pt">'+r.pts+'</span></div>'; }).join('')+'</div>');
      sfx('whoosh');
    },
    bomb:function(m){
      show('<div class="dim" style="font:900 28px Inter;letter-spacing:.2em">'+esc(m.kicker||'SEND BOMBEN VIDERE')+'</div><div class="bomb"><svg viewBox="0 0 120 120" width="200" height="200"><circle cx="54" cy="70" r="42" fill="#2a1840" stroke="#ff3d7f" stroke-width="4"/><circle cx="40" cy="56" r="10" fill="#ffffff22"/><rect x="62" y="22" width="20" height="16" rx="3" transform="rotate(35 72 30)" fill="#5b3a8c"/><path d="M82 22 q10 -14 22 -8" stroke="#ffcf4a" stroke-width="4" fill="none"/><circle cx="106" cy="14" r="7" fill="#ffcf4a"><animate attributeName="r" values="5;9;5" dur=".3s" repeatCount="indefinite"/></circle></svg></div>'+
        '<div class="big" style="font-size:80px;color:'+m.c+'">'+esc(m.name)+'</div>'+
        '<div style="font:700 36px/1.25 Inter;margin-top:16px;max-width:1100px;text-align:center">'+esc(m.text||'')+'</div>');
      if(m.sfx)sfx(m.sfx);
    },
    boom:function(m){
      stage.innerHTML=''; root.appendChild(h('<div class="boom"></div>'));
      setTimeout(function(){ var b=root.querySelector('.boom'); if(b)b.remove();
        show('<div class="big pink" style="font-size:200px">BOOM</div><div class="big" style="font-size:80px;color:'+m.c+'">'+esc(m.name)+'</div><div style="font:700 34px Inter;margin-top:16px">minus ét point</div>'); },900);
      sfx('boom');
    },
    who:function(m){
      show('<div class="dim" style="font:900 28px Inter;letter-spacing:.2em">'+esc(m.kicker||'HVEM I RUMMET')+'</div>'+
        '<div style="font:900 52px/1.2 Inter;text-align:center;max-width:1100px;margin:20px 0">'+esc(m.text)+'</div>'+
        (m.sub?'<div class="dim" style="font:700 28px Inter">'+esc(m.sub)+'</div>':''));
    },
    bars:function(m){
      var max=Math.max.apply(null,m.rows.map(function(r){ return r.v; }).concat([1]));
      var el=show('<div style="font:900 40px/1.2 Inter;text-align:center;max-width:1100px;margin-bottom:26px">'+esc(m.text)+'</div><div class="bars">'+
        m.rows.map(function(r){ return '<div class="r" style="--c:'+r.c+'"><span class="nm">'+esc(r.name)+'</span><i data-w="'+Math.round(560*r.v/max)+'"></i><span>'+r.v+'</span></div>'; }).join('')+'</div>'+
        (m.line?'<div style="font:700 30px Inter;margin-top:24px" class="gold">'+esc(m.line)+'</div>':''));
      sfx('drum'); setTimeout(function(){ [].forEach.call(el.querySelectorAll('.bars i'),function(i){ i.style.width=i.dataset.w+'px'; }); },1700);
    },
    tug:function(m){
      var pos=50+m.pos*(46/3);
      var el=show('<div class="big gold" style="font-size:70px">KRONEDUELLEN</div><div style="display:flex;width:1100px;justify-content:space-between;align-items:center;margin-top:30px">'+
        card(m.a)+'<div class="big pink" style="font-size:90px">VS</div>'+card(m.b)+'</div>'+
        '<div class="tug"><div class="t" style="left:4%"></div><div class="t" style="left:96%"></div><div class="k" style="left:'+(m.prev!=null?50+m.prev*(46/3):pos)+'%"><svg viewBox="0 0 120 90" width="100" height="76"><path d="M8 78 L16 22 L42 50 L60 8 L78 50 L104 22 L112 78 Z" fill="#ffcf4a" stroke="#b8860b" stroke-width="4" stroke-linejoin="round"/><rect x="8" y="72" width="104" height="12" rx="4" fill="#e0a800"/><circle cx="60" cy="56" r="7" fill="#ff3d7f"/><circle cx="34" cy="62" r="5" fill="#3de0ff"/><circle cx="86" cy="62" r="5" fill="#3de0ff"/></svg></div></div>');
      if(m.prev!=null&&m.prev!==m.pos)setTimeout(function(){ el.querySelector('.k').style.left=pos+'%'; sfx('whoosh'); },300);
    },
    crown:function(m){
      show('<div class="crownph" style="'+ph(m.w.id)+'"><div class="cr"><svg viewBox="0 0 120 90" width="180" height="135"><path d="M8 78 L16 22 L42 50 L60 8 L78 50 L104 22 L112 78 Z" fill="#ffcf4a" stroke="#b8860b" stroke-width="4" stroke-linejoin="round"/><rect x="8" y="72" width="104" height="12" rx="4" fill="#e0a800"/><circle cx="60" cy="56" r="7" fill="#ff3d7f"/><circle cx="34" cy="62" r="5" fill="#3de0ff"/><circle cx="86" cy="62" r="5" fill="#3de0ff"/></svg></div></div>'+
        '<div class="big gold" style="font-size:110px;margin-top:30px;text-shadow:0 0 40px #ff3d7f">'+esc(m.w.name)+'</div>'+
        '<div style="font:900 36px Inter;margin-top:8px">'+esc(m.title||'')+'</div>'+
        (m.court?'<div class="dim" style="font:700 24px Inter;margin-top:16px">Hoffet: '+esc(m.court)+'</div>':''));
      sfx('drum'); setTimeout(function(){ sfx('fanfare'); confetti(80); },1700);
    },
    awards:function(m){
      show('<div class="big gold" style="font-size:64px;margin-bottom:20px">PRISUDDELINGEN</div><div style="width:1100px">'+
        m.rows.map(function(r,i){ return '<div style="display:flex;justify-content:space-between;font:700 32px Inter;margin:12px 0;padding:10px 18px;border-radius:12px;background:rgba(40,18,70,.8);animation:bqin .5s both '+(i*.8)+'s"><span>'+esc(r.award)+'</span><span style="color:'+r.c+';font-family:Anton">'+esc(r.name)+'</span></div>'; }).join('')+'</div>');
      sfx('fanfare');
    },
    power:function(m){
      var b=h('<div class="banner" style="background:linear-gradient(90deg,transparent,'+m.c+'ee,transparent)">'+esc(m.name)+': '+esc(m.power)+'</div>');
      root.appendChild(b); setTimeout(function(){ b.remove(); },2600); sfx('fanfare');
    },
    wheel:function(m){
      var b=h('<div class="banner" style="font-size:54px;background:linear-gradient(90deg,transparent,#ff3d7fee,transparent)">KAOS-HJULET: '+esc(m.result)+'</div>');
      root.appendChild(b); setTimeout(function(){ b.remove(); },3000); sfx('ding');
    }
  };
  function pips(n){ var s=''; for(var i=0;i<3;i++)s+='<i class="pip'+(i<n?' on':'')+'"></i>'; return s; }

  window.BQ={on:function(m,t){
    tell=t; frame(); A();
    var k=m.k;
    if(k==='bqstart'){ S.title({sub:m.sub||''}); say({e:'started',w:innerWidth,h:innerHeight}); }
    else if(k==='bqscene'){ var f=S[m.s]; if(f){ try{ f(m); }catch(e){ say({e:'sceneerr',s:m.s,m:String(e)}); } } }
    else if(k==='bqsfx'){ sfx(m.n); }
    else if(k==='bqsub'){ subtitle(m.text,m.ms); }
    else if(k==='bqsong'){ if(m.stop)stopSong(); else song(m); }
    else if(k==='bqyt'){ if(m.stop)ytStop(); else ytPlay(m); }
    else if(k==='bqsnd0'||k==='bqsndp'||k==='bqsnd1'){ sndPart(m); }
    else if(k==='bqsay'){ playVoice(m.url,m.id,m.text,false,m.dur,m.raw); }
    else if(k==='bqplay'){ playHeld(m.id); }
    /* THE SOUND TEST (Kim, 7 Nov: no voice on the Chromecast, though it reports playing). What this
       screen knows about its own sound, and a line played through the effects engine instead. */
    else if(k==='bqdiag'){
      var o={e:'diag',ctx:ac?ac.state:'none'}; A(); o.ctx2=ac?ac.state:'none';
      try{ var sv=cast.framework.CastReceiverContext.getInstance().getSystemVolume(); o.vol=sv&&sv.level; o.muted=sv&&sv.muted; }catch(e){ o.volErr=String(e); }
      o.mediaEls=document.querySelectorAll('video,audio').length; say(o);
    }
    else if(k==='bqwa'){
      /* a line through the effects engine: fetched, decoded and played by Web Audio */
      fetch(m.url).then(function(r){ return r.arrayBuffer(); }).then(function(b){ return new Promise(function(ok,no){ A().decodeAudioData(b,ok,no); }); })
        .then(function(buf){ var s=ac.createBufferSource(); s.buffer=buf; s.connect(ac.destination); s.start(); say({e:'waplay',len:buf.duration});
          s.onended=function(){ say({e:'waend'}); }; })
        .catch(function(e){ say({e:'wafail',m:String(e)}); });
    }
    else if(k==='bqpic0'||k==='bqpicp'||k==='bqpic1'){ picPart(m); }
    else if(k==='bqstop'){ stopSong(); ytStop(); if(voiceCur)voiceCur.stop('stopped'); if(root){ root.remove(); root=null; } say({e:'stopped'}); }
    else if(k==='bqping'){ say({e:'pong',t:m.t}); }
    /* CAN THIS SCREEN SPEAK? (Kim, 7 Nov: "make the phone play the voice to the TV"). A page cannot hand
       the phone's own speech on, so if the television has a Danish voice of its own, it speaks instead. */
    else if(k==='bqvoices'){
      var rep=function(){ var vs=window.speechSynthesis?speechSynthesis.getVoices():[];
        say({e:'voices',has:!!window.speechSynthesis,n:vs.length,da:vs.filter(function(v){ return /^da/i.test(v.lang); }).map(function(v){ return v.name; }),list:vs.slice(0,30).map(function(v){ return v.lang; })}); };
      if(window.speechSynthesis&&!speechSynthesis.getVoices().length){ speechSynthesis.onvoiceschanged=rep; setTimeout(rep,2500); } else rep();
    }
    else if(k==='bqtts'){
      if(!window.speechSynthesis){ say({e:'ttsend',id:m.id,failed:1}); return; }
      var u=new SpeechSynthesisUtterance(m.text), dv=speechSynthesis.getVoices().filter(function(v){ return /^da/i.test(v.lang); })[0];
      if(dv)u.voice=dv; u.lang='da-DK'; u.rate=m.rate||1.08; u.pitch=m.pitch||1.05;
      subtitle(m.text,Math.max(2500,m.text.length*75)); duck(true);
      u.onend=u.onerror=function(ev){ duck(false); say({e:'ttsend',id:m.id,failed:ev&&ev.type==='error'?1:0}); };
      speechSynthesis.speak(u);
    }
  }};
})();
