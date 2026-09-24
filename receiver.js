/* CIA ON ANY TELEVISION - OUR OWN RECEIVER (N1104, 24 Sep 2026). Registered with Google as
   "Interstellar Marines", application B75F7675, and published from this address, so any
   Chromecast in any room can open it - a boardroom's, a friend's - not only the ones at home.

   It is the television page CIA already had (IM_05_Cast-TV.html, N833, D433) with one thing
   changed: the introductions. That page was opened through DashCast and fetched its half of
   the call from the desk, which only works where the television can reach the desk - at home.
   This one is opened by Cast itself, and the call's offer and answer travel inside the Cast
   connection between the television and the machine running CIA. No desk, no server.

   The picture then comes straight from the machine running CIA over the room's own network,
   one H.264 frame at a time, into this device's hardware decoder: measured on C17, the 2013
   Chromecast we build to (D432), 1080p about half a second behind with nothing dropped.

   THIS FILE IS FETCHED FRESH ON EVERY LAUNCH (index.html adds the time to its address), because
   GitHub lets a screen keep a page ten minutes and a fix should not wait that long.

   Knobs, for testing: ?target= reserve seconds, ?jump= seconds before a skip, ?rate= catch-up
   speed. The sender can turn the status line on with a 'dbg' message. */
var NS='urn:x-cast:com.interstellarmarines.cia';
var Q=new URLSearchParams(location.search);
var TARGET=+(Q.get('target')||0.25), JUMP=+(Q.get('jump')||2.0), RATE=+(Q.get('rate')||1.08);
var v=document.getElementById('v'), st=document.getElementById('st');
var idle=document.getElementById('idle'), idlesay=document.getElementById('idlesay');
var ctx=null, sender=null;

function say(t){ idlesay.textContent=t; }
/* everything this page wants to report goes back to CIA inside the Cast connection */
function tell(o){ if(ctx&&sender){ try{ ctx.sendCustomMessage(NS,sender,o); }catch(e){} } }
function log(o){ o.at='tv'; tell({k:'log',o:o}); }
window.onerror=function(m,s,l){ log({k:'error',m:String(m),l:l}); say('Error: '+m); };
window.onunhandledrejection=function(e){ log({k:'error',m:String(e.reason)}); };

/* WHAT THIS TELEVISION CAN PLAY, reported once CIA is connected */
function caps(){
  var want=['video/mp4;codecs="avc1.640028"','video/mp4;codecs="avc1.4d0028"','video/mp4;codecs="avc1.42e028"',
            'audio/mp4;codecs="mp4a.40.2"','video/mp4;codecs="avc1.640028,mp4a.40.2"'];
  var c={k:'caps'};
  want.forEach(function(x){ try{ c[x]=MediaSource.isTypeSupported(x); }catch(e){ c[x]='threw'; } });
  c.ua=navigator.userAgent; c.w=screen.width; c.h=screen.height;
  log(c);
}

/* ---- the picture ---- */
var done=false;
var ms=new MediaSource(), sb=null, queue=[], hdr=null, parts=[], got=0;
var recStart=null, off=null, live=false;
var segs=0, bytes=0, waits=0, jumps=0, appendErr=null, appends=0, appendMs=0, appendT=0;
var asb=null, aqueue=[], asegs=0, amime=null;
v.src=URL.createObjectURL(ms);
v.addEventListener('waiting',function(){ waits++; });

function onMedia(e){
  if(typeof e.data==='string'){
    var m=JSON.parse(e.data);
    if(m.k==='hello'){ recStart=m.recStart; openSb(m.mime); }
    else if(m.k==='ahello'){ amime=m.mime; openASb(m.mime); }
    else if(m.k==='seg'){ hdr=m; parts=[]; got=0; }
    else if(m.k==='bye'){ finish(m.said||''); }
    return;
  }
  parts.push(new Uint8Array(e.data)); got+=e.data.byteLength;
  if(hdr && got>=hdr.len){
    var all=new Uint8Array(got), o=0;
    parts.forEach(function(p){ all.set(p,o); o+=p.length; });
    if(hdr.s===2){ if(amime||asb)aqueue.push(all.buffer); asegs++; bytes+=got; hdr=null; parts=[]; got=0; apump(); }
    else { queue.push(all.buffer); segs++; bytes+=got; hdr=null; parts=[]; got=0; pump(); }
  }
}
function openSb(mime){
  var tries=[mime,'video/mp4;codecs="avc1.640028"','video/mp4;codecs="avc1.42E01F"'];
  for(var i=0;i<tries.length && !sb;i++){
    try{ sb=ms.addSourceBuffer(tries[i]); log({k:'sourcebuffer',type:tries[i]}); }
    catch(err){ log({k:'sberr',type:tries[i],e:String(err)}); }
  }
  if(!sb){ say('This television cannot play the picture'); return; }
  sb.addEventListener('updateend',function(){ appendMs+=performance.now()-appendT; pump(); });
  sb.addEventListener('error',function(){ appendErr='sb error'; });
  /* the sound usually says hello first, and was then never opened at all: open it now */
  if(amime && !asb)openASb(amime);
}
/* Everything that arrived while the last append ran goes in as one: a 2013 stick cannot
   take thirty separate appends a second, and as one buffer it keeps up. */
function pump(){
  if(!sb || sb.updating || !queue.length) return;
  var buf=queue[0];
  if(queue.length>1){
    var len=0; queue.forEach(function(b){ len+=b.byteLength; });
    var o=new Uint8Array(len), i=0;
    queue.forEach(function(b){ o.set(new Uint8Array(b),i); i+=b.byteLength; });
    buf=o.buffer;
  }
  queue=[];
  try{ appendT=performance.now(); sb.appendBuffer(buf); appends++; }
  catch(err){ appendErr=String(err); log({k:'appenderr',e:appendErr}); }
}
/* the sound's buffer is only ever the second one: C17 allows one (D436) */
function openASb(mime){
  if(asb)return;
  if(!sb)return;                                   // opened from openSb once the picture has its buffer
  try{ asb=ms.addSourceBuffer(mime); log({k:'asourcebuffer',type:mime}); }
  catch(err){ log({k:'asberr',type:mime,e:String(err)}); amime=null; aqueue=[]; return; }
  asb.addEventListener('updateend',apump);
  apump();                                          // everything that arrived while it waited
  /* THE PAGE STARTS MUTED, because a muted video may start on its own anywhere - and the first
     sound test in a meeting room, 24 Sep, played every piece of sound in perfect silence. With a
     sound track in hand it speaks; if this screen refuses sound without a press, steer() puts
     the mute back rather than lose the picture. */
  try{ v.muted=false; v.volume=1; log({k:'unmuted'}); }catch(e){}
}
function apump(){
  if(!asb || asb.updating || !aqueue.length) return;
  var buf=aqueue[0];
  if(aqueue.length>1){
    var len=0; aqueue.forEach(function(b){ len+=b.byteLength; });
    var o=new Uint8Array(len), i=0;
    aqueue.forEach(function(b){ o.set(new Uint8Array(b),i); i+=b.byteLength; });
    buf=o.buffer;
  }
  aqueue=[];
  try{ asb.appendBuffer(buf); }catch(err){ log({k:'aappenderr',e:String(err)}); }
}
/* A quarter of a second in hand; when it falls behind it plays slightly fast rather than
   skipping, because a skip restarts this device's hardware player. */
function steer(){
  if(done)return;
  if(v.buffered.length){
    var end=v.buffered.end(v.buffered.length-1), lag=end-v.currentTime;
    if(v.paused && lag>TARGET){
      var p=v.play();
      if(p&&p.catch)p.catch(function(err){
        log({k:'play',e:String(err),muted:v.muted});
        if(!v.muted){ v.muted=true; log({k:'muted-again',said:'this screen will not start sound on its own'}); }
      });
    }
    if(!live && !v.paused && v.currentTime>0){ live=true; idle.style.display='none'; }
    if(lag>JUMP){ v.currentTime=end-TARGET; jumps++; }
    else if(lag>TARGET+0.15) v.playbackRate=RATE;
    else v.playbackRate=1.0;
    if(sb && !sb.updating && v.buffered.length && v.currentTime-v.buffered.start(0)>15){
      try{ sb.remove(0,v.currentTime-8); }catch(err){}
      if(asb && !asb.updating){ try{ asb.remove(0,v.currentTime-8); }catch(err){} }
    }
  }
  setTimeout(steer,250);
}
steer();

function finish(said){
  if(done)return; done=true;
  try{ v.pause(); }catch(e){}
  live=false; idle.style.display='';
  say(said||'CIA stopped sending');
  log({k:'bye',said:said});
}

/* ---- the call: the offer arrives inside the Cast connection, and so does our answer ---- */
var pc=null, tc=null;
function answer(sdp){
  pc=new RTCPeerConnection({iceServers:[]});
  pc.ondatachannel=function(e){
    var ch=e.channel;
    if(ch.label==='m'){ ch.binaryType='arraybuffer'; ch.onmessage=onMedia; }
    else{
      tc=ch;
      tc.onmessage=function(ev){
        var m=JSON.parse(ev.data);
        /* CIA times the round trip and tells us the gap between the clocks, which is the only
           way the delay figure below means anything */
        if(m.k==='ping') tc.send(JSON.stringify({k:'pong',t0:m.t0,tr:Date.now()}));
        else if(m.k==='off') off=m.off;
      };
    }
  };
  pc.oniceconnectionstatechange=function(){
    log({k:'ice',s:pc.iceConnectionState});
    if(pc.iceConnectionState==='connected')say('Connected - waiting for the picture');
    if(pc.iceConnectionState==='failed')finish('The connection to CIA failed');
    if(pc.iceConnectionState==='disconnected')finish('The connection to CIA dropped');
  };
  pc.setRemoteDescription({type:'offer',sdp:sdp})
    .then(function(){ return pc.createAnswer(); })
    .then(function(a){ return pc.setLocalDescription(a); })
    .then(function(){
      return new Promise(function(res){
        if(pc.iceGatheringState==='complete')return res();
        pc.onicegatheringstatechange=function(){ if(pc.iceGatheringState==='complete')res(); };
        setTimeout(res,3000);
      });
    })
    .then(function(){ tell({k:'answer',sdp:pc.localDescription.sdp}); say('Answering CIA'); })
    .catch(function(e){ log({k:'rtcerr',e:String(e)}); tell({k:'failed',said:String(e)}); say('Could not connect: '+e); });
}

/* ---- how it is going, every two seconds, back to CIA ---- */
setInterval(function(){
  var o={k:'tv',segs:segs,asegs:asegs,sound:!!asb,kbps:Math.round(bytes*8/2000),waits:waits,jumps:jumps,
         rate:v.playbackRate,paused:v.paused,err:appendErr,w:v.videoWidth,h:v.videoHeight,
         appends:appends,appendMs:appends?Math.round(appendMs/appends):null};
  if(v.buffered.length)o.reserve=Math.round(1000*(v.buffered.end(v.buffered.length-1)-v.currentTime));
  if(off!==null && recStart!==null && v.currentTime>0)o.delay=Math.round((Date.now()-off)-(recStart+v.currentTime*1000));
  try{ var pq=v.getVideoPlaybackQuality(); o.total=pq.totalVideoFrames; o.dropped=pq.droppedVideoFrames; }catch(e){}
  if(live||segs)log(o);
  st.textContent=o.w+'x'+o.h+'   delay '+o.delay+' ms   reserve '+o.reserve+' ms   stalls '+waits+'   '+o.kbps+' kbps';
  segs=0; asegs=0; bytes=0; appends=0; appendMs=0;
},2000);

/* ---- Cast: the receiver side of the connection CIA opened ---- */
try{
  ctx=cast.framework.CastReceiverContext.getInstance();
  ctx.addCustomMessageListener(NS,function(e){
    var m=e.data;
    if(typeof m==='string'){ try{ m=JSON.parse(m); }catch(x){ return; } }
    if(!m)return;
    var first=!sender;
    sender=e.senderId;
    if(first)caps();
    if(m.k==='offer'){ say('Connecting to CIA'); answer(m.sdp); }
    else if(m.k==='bye'){ finish(m.said||''); }
    else if(m.k==='dbg'){ document.body.classList.toggle('dbg',!!m.on); }
  });
  ctx.addEventListener(cast.framework.system.EventType.SENDER_DISCONNECTED,function(e){
    if(e.senderId===sender && !done && live)finish('CIA disconnected');
  });
  var opts=new cast.framework.CastReceiverOptions();
  opts.disableIdleTimeout=true;
  opts.skipPlayersLoad=true;
  opts.statusText='Interstellar Marines';
  opts.customNamespaces={};
  opts.customNamespaces[NS]=cast.framework.system.MessageType.JSON;
  ctx.start(opts);
}catch(e){ say('This page must be opened by Cast: '+e); }
