/* BANDEN — KAMPEN OM KRONEN, the quiz's half of the television (Kim, 7 Nov 2026).
   Borrowed screen: CIA's receiver loads this on the first 'bq' message and hands every later one
   to BQ.on. Nothing personal lives on this public site; the phone sends it during the game.

   Step 0, the YouTube test: can C17 play a clip inside this page, from a given second to another,
   and what does the player report while it does. Every report goes back to the sender as k:'bq'. */
(function(){
  var tell=function(){}, root=null, yt=null, ytReady=false, ytWait=null, tick=0;
  function say(o){ o.k='bq'; o.at=Date.now(); tell(o); }

  function screen(){
    if(root)return root;
    root=document.createElement('div');
    root.style.cssText='position:absolute;inset:0;z-index:50;background:radial-gradient(70% 70% at 50% 40%,#2a1240,#07040c);'+
      'color:#fff;font:600 40px/1.25 system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px';
    root.innerHTML='<div style="font-size:84px;letter-spacing:.04em">BANDEN</div>'+
      '<div style="font-size:40px;color:#ffcf4a">Kampen om Kronen</div>'+
      '<div id="bqline" style="font-size:30px;color:#c9b8e0">Test af skærmen</div>'+
      '<div id="bqyt" style="position:absolute;inset:0;display:none"></div>';
    document.body.appendChild(root);
    return root;
  }
  function line(t){ var e=document.getElementById('bqline'); if(e)e.textContent=t; }

  function loadYt(then){
    if(ytReady){ then(); return; }
    if(ytWait){ ytWait.push(then); return; }
    ytWait=[then];
    window.onYouTubeIframeAPIReady=function(){ ytReady=true; var q=ytWait; ytWait=null; say({e:'api'}); q.forEach(function(f){ f(); }); };
    var s=document.createElement('script'); s.src='https://www.youtube.com/iframe_api';
    s.onerror=function(){ say({e:'apifail'}); };
    document.body.appendChild(s);
  }

  function play(m){
    screen(); line('Henter klip …');
    loadYt(function(){
      var box=document.getElementById('bqyt'); box.style.display='';
      if(yt){ try{ yt.destroy(); }catch(e){} yt=null; }
      box.innerHTML='<div id="bqp"></div>';
      var t0=Date.now();
      yt=new YT.Player('bqp',{width:'100%',height:'100%',videoId:m.id,
        playerVars:{autoplay:1,controls:0,start:m.start||0,end:m.end||0,playsinline:1,rel:0,modestbranding:1,origin:location.origin},
        events:{
          onReady:function(){ say({e:'ready',id:m.id,ms:Date.now()-t0}); try{ yt.unMute(); yt.setVolume(100); yt.playVideo(); }catch(e){} },
          onStateChange:function(ev){ say({e:'state',id:m.id,s:ev.data,t:safe(function(){ return yt.getCurrentTime(); }),ms:Date.now()-t0}); },
          onError:function(ev){ say({e:'error',id:m.id,code:ev.data}); line('Klippet vil ikke spille (fejl '+ev.data+')'); box.style.display='none'; }
        }});
      clearInterval(tick);
      tick=setInterval(function(){
        if(!yt||!yt.getPlayerState)return;
        say({e:'tick',id:m.id,s:safe(function(){ return yt.getPlayerState(); }),t:safe(function(){ return yt.getCurrentTime(); }),
             dur:safe(function(){ return yt.getDuration(); }),muted:safe(function(){ return yt.isMuted(); }),
             q:safe(function(){ return yt.getPlaybackQuality(); })});
      },1000);
    });
  }
  function safe(f){ try{ var v=f(); return typeof v==='number'?Math.round(v*10)/10:v; }catch(e){ return null; } }

  function stop(){
    clearInterval(tick);
    if(yt){ try{ yt.destroy(); }catch(e){} yt=null; }
    if(root){ root.remove(); root=null; }
    say({e:'stopped'});
  }

  window.BQ={on:function(m,t){
    tell=t;
    if(m.k==='bqstart'){ screen(); say({e:'started',w:innerWidth,h:innerHeight,ua:navigator.userAgent}); }
    else if(m.k==='bqyt'){ play(m); }
    else if(m.k==='bqstop'){ stop(); }
  }};
})();
