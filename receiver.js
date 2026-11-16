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
   speed, ?settle= seconds between skips. The sender can turn the status line on with a 'dbg'
   message. */
var NS='urn:x-cast:com.interstellarmarines.cia';
var Q=new URLSearchParams(location.search);
var TARGET=+(Q.get('target')||0.75), JUMP=+(Q.get('jump')||3.0), RATE=+(Q.get('rate')||1.08);
var SETTLE=+(Q.get('settle')||3.0), FAST=+(Q.get('fast')||0.5);
var v=document.getElementById('v'), st=document.getElementById('st');
var idle=document.getElementById('idle'), idlesay=document.getElementById('idlesay');
var ctx=null, sender=null, heard={}, gone=null;

function say(t){ idlesay.textContent=t; }
/* everything this page wants to report goes back to CIA inside the Cast connection */
function tell(o){ if(ctx&&sender){ try{ ctx.sendCustomMessage(NS,sender,o); }catch(e){} } }
function log(o){ o.at='tv'; tell({k:'log',o:o}); }
window.onerror=function(m,s,l){ log({k:'error',m:String(m),l:l}); say('Error: '+m); };
window.onunhandledrejection=function(e){ log({k:'error',m:String(e.reason)}); };

/* ALL ABOUT THIS SCREEN, for CIA's Screens page (Kim, 16 Nov: "a diag page that allows you to read all about the
   cast tech in Conference"). Sent once a sender is heard; the sender keeps it, one file per screen. Each film size
   is asked two ways: the Cast system's own "can this screen show it" (with size and frame rate), and the browser's
   "can it decode it smoothly". */
function screenReport(){
  var r={v:1,ua:navigator.userAgent,screen:[screen.width,screen.height],page:[innerWidth,innerHeight],dpr:window.devicePixelRatio||1,
         cores:navigator.hardwareConcurrency||0,memory:navigator.deviceMemory||0,cast:{},plays:[]};
  try{ var dc=ctx.getDeviceCapabilities()||{}; for(var k in dc)r.cast[k]=dc[k]; }catch(e){ r.cast.error=String(e); }
  var C=[['H.264','video/mp4','avc1.640028'],['H.264 high level','video/mp4','avc1.640033'],['HEVC','video/mp4','hev1.1.6.L150.B0'],
         ['VP9','video/webm','vp09.00.50.08'],['AV1','video/mp4','av01.0.08M.08']];
  var S=[[1280,720,30],[1920,820,24],[1920,1080,24],[1920,1080,30],[1920,1080,60],[3840,2160,30],[3840,2160,60]];
  var jobs=[];
  C.forEach(function(c){ S.forEach(function(s){
    var row={codec:c[0],w:s[0],h:s[1],fps:s[2],show:null,decode:null,smooth:null,efficient:null};
    try{ row.show=ctx.canDisplayType(c[1],c[2],s[0],s[1],s[2]); }catch(e){ row.show='?'; }
    r.plays.push(row);
    if(navigator.mediaCapabilities&&navigator.mediaCapabilities.decodingInfo){
      jobs.push(navigator.mediaCapabilities.decodingInfo({type:'media-source',video:{contentType:c[1]+';codecs="'+c[2]+'"',
        width:s[0],height:s[1],bitrate:s[1]>1100?16000000:5000000,framerate:s[2]}})
        .then(function(d){ row.decode=!!d.supported; row.smooth=!!d.smooth; row.efficient=!!d.powerEfficient; },function(){ row.decode='?'; }));
    }
  }); });
  Promise.all(jobs).then(function(){ tell({k:'screen',r:r}); },function(){ tell({k:'screen',r:r}); });
}
/* WHAT THIS TELEVISION CAN PLAY, reported once CIA is connected */
function caps(){
  var want=['video/mp4;codecs="avc1.640028"','video/mp4;codecs="avc1.4d0028"','video/mp4;codecs="avc1.42e028"',
            'audio/mp4;codecs="mp4a.40.2"','video/mp4;codecs="avc1.640028,mp4a.40.2"'];
  var c={k:'caps'};
  want.forEach(function(x){ try{ c[x]=MediaSource.isTypeSupported(x); }catch(e){ c[x]='threw'; } });
  c.ua=navigator.userAgent; c.w=screen.width; c.h=screen.height; c.dpr=window.devicePixelRatio||1;
  log(c);
  screenReport();
  /* WHERE THE START WENT (5 Nov: the MiBox takes far longer than C17). Milliseconds from the moment
     this screen began opening the page: Google's receiver code arriving, ours, Cast started, and the
     first word from CIA. Its own line, because the desk keeps only 400 characters of each. */
  var s={k:'start',first:Math.round(performance.now()),started:startedAt};
  /* each as asked, first byte, arrived - a late ask is the screen busy, a late byte the network (MiBox,
     5 Nov: the page in 0.2 s, Google's code and our logo only at 12.8) */
  var t=function(r){ return [Math.round(r.startTime),Math.round(r.responseStart),Math.round(r.responseEnd)]; };
  try{ performance.getEntriesByType('resource').forEach(function(r){
    if(/cast_receiver_framework/.test(r.name))s.google=t(r);
    else if(/receiver\.js/.test(r.name))s.ours=t(r);
    else if(/logo\.png/.test(r.name))s.logo=t(r);
  }); var n=performance.getEntriesByType('navigation')[0]; if(n)s.page=Math.round(n.responseEnd); }catch(e){}
  log(s);
}
var startedAt=null;

/* ---- A PICTURE (N1512, 4 Nov 2026). The phone sends the file itself, because away from home
   the television can never reach the desk: down the call's data channel as a 'pic' piece, or,
   where the call cannot connect, in small parts inside the Cast connection. It is decoded off
   screen and only then swapped in, so the last picture holds until the next is ready. ---- */
var pic=document.createElement('img');
pic.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;display:none';
document.body.appendChild(pic);
var picUrl=null, picIn={}, picW=0, picH=0;
/* THE ZOOM IS THE PHONE'S (N1512, 5 Nov 2026). The phone says how far in, as a multiple of the
   picture fitted, and which point of the picture sits at the centre of this screen; the picture in
   hand moves at once. Once his fingers rest, the phone sends that exact view drawn sharp from the
   full file, a 'frame', shown over it until the next move. A new picture takes the standing zoom. */
var view={z:1,cx:0.5,cy:0.5,vs:0};
var sharp=document.createElement('img');
sharp.style.cssText=pic.style.cssText;
document.body.appendChild(sharp);
var sharpUrl=null, picIm=null;
/* A ZOOMED VIEW IS DRAWN, NOT STRETCHED (Kim, 5 Nov: "when I pan a bit more, I get black lines and it jumps").
   The picture used to be the whole screen's image scaled up to eight times by the browser, a layer far larger
   than an old box draws in one go: it painted it in tiles as the pan reached them, black until each arrived.
   Now only the part on screen is drawn, on a canvas the size of the screen, with the same sums the phone's sharp
   frame uses. Each move glides there over a few frames, as the transition did, and a gesture's moves are
   counted (`pan` lines), so a jump the link causes can be told from one this page causes. */
var zc=document.createElement('canvas');
zc.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:none;background:#000';
document.body.insertBefore(zc,sharp);
var zg=zc.getContext('2d'), zcur=null, zraf=0, pan=null;
function zDraw(v){
  var dpr=window.devicePixelRatio||1, W=Math.round(window.innerWidth*dpr), H=Math.round(window.innerHeight*dpr);
  if(zc.width!==W||zc.height!==H){ zc.width=W; zc.height=H; }
  zg.fillStyle='#000'; zg.fillRect(0,0,W,H);
  var s=Math.min(W/picW,H/picH)*v.z, dx=W/2-v.cx*picW*s, dy=H/2-v.cy*picH*s;
  var x0=Math.max(0,dx), y0=Math.max(0,dy), x1=Math.min(W,dx+picW*s), y1=Math.min(H,dy+picH*s);
  if(x1>x0&&y1>y0){ zg.imageSmoothingQuality='high';
    zg.drawImage(picIm,(x0-dx)/s,(y0-dy)/s,(x1-x0)/s,(y1-y0)/s,x0,y0,x1-x0,y1-y0); }
  if(pan)pan.draws++;
}
function zStep(){
  zraf=0;
  if(!picIm||view.z<=1||!zcur)return;
  var k=0.45, d=Math.abs(view.z-zcur.z)/view.z+Math.abs(view.cx-zcur.cx)+Math.abs(view.cy-zcur.cy);
  if(d<0.0005){ zcur={z:view.z,cx:view.cx,cy:view.cy}; }
  else{ zcur={z:zcur.z+(view.z-zcur.z)*k,cx:zcur.cx+(view.cx-zcur.cx)*k,cy:zcur.cy+(view.cy-zcur.cy)*k}; }
  zDraw(zcur);
  if(d>=0.0005)zraf=requestAnimationFrame(zStep);
}
function placePic(snap){
  pic.style.transform='';
  if(!picW||!picH||!picIm||view.z<=1){ zc.style.display='none'; zcur=null; return; }
  if(snap||!zcur||zc.style.display==='none'){ zcur={z:view.z,cx:view.cx,cy:view.cy}; zDraw(zcur); }
  else if(!zraf)zraf=requestAnimationFrame(zStep);
  zc.style.display='';
}
/* one gesture's moves, said once its fingers have rested a second */
function panNote(){
  var now=Date.now();
  if(!pan)pan={t0:now,last:now,n:0,max:0,draws:0,tm:0};
  else{ pan.max=Math.max(pan.max,now-pan.last); pan.last=now; }
  pan.n++; clearTimeout(pan.tm);
  pan.tm=setTimeout(function(){ var p=pan; pan=null;
    if(p.n>2)log({k:'pan',moves:p.n,ms:p.last-p.t0,gapMax:p.max,gapAvg:Math.round((p.last-p.t0)/(p.n-1)),draws:p.draws,z:view.z}); },1000);
}
function onView(m){
  view={z:+m.z||1,cx:m.cx!=null?+m.cx:0.5,cy:m.cy!=null?+m.cy:0.5,vs:+m.vs||0};
  sharp.style.display='none';
  panNote();
  placePic();
}
function showPic(u8,meta){
  var t0=Date.now(), url=URL.createObjectURL(new Blob([u8],{type:meta.mime||'image/jpeg'}));
  var im=new Image(); im.src=url;
  (im.decode?im.decode():Promise.resolve()).then(function(){
    if(meta.frame){
      /* a sharp view that a newer move has already overtaken is dropped */
      if(meta.vs!==view.vs||view.z<=1||live){ URL.revokeObjectURL(url); }
      else{ sharp.src=url; sharp.style.display=''; if(sharpUrl)URL.revokeObjectURL(sharpUrl); sharpUrl=url; }
    }
    else{
      picW=im.naturalWidth; picH=im.naturalHeight; picIm=im; placePic(true);
      pic.src=url; pic.style.display=''; idle.style.display='none'; sharp.style.display='none';
      if(picUrl)URL.revokeObjectURL(picUrl); picUrl=url;
    }
    log({k:'pic',id:meta.id,frame:!!meta.frame,bytes:u8.length,w:im.naturalWidth,h:im.naturalHeight,ms:Date.now()-t0});
    tell({k:'shown',id:meta.id,frame:meta.frame?1:0});
  },function(err){ URL.revokeObjectURL(url); log({k:'picerr',id:meta.id,e:String(err)}); tell({k:'shown',id:meta.id,failed:true,frame:meta.frame?1:0}); });
}
function picPart(m){
  if(m.k==='pic0'){ picIn={id:m.id,mime:m.mime,len:m.len,frame:m.frame,vs:m.vs,parts:[]}; return; }
  if(m.id!==picIn.id)return;
  if(m.k==='picp'){ picIn.parts.push(m.b); return; }
  var s=atob(picIn.parts.join('')), u8=new Uint8Array(s.length);
  for(var i=0;i<s.length;i++)u8[i]=s.charCodeAt(i);
  showPic(u8,picIn); picIn={};
}

/* ---- the picture ---- */
var done=false;
var ms=new MediaSource(), sb=null, queue=[], hdr=null, parts=[], got=0;
var recStart=null, off=null, live=false;
var segs=0, bytes=0, waits=0, jumps=0, appendErr=null, appends=0, appendMs=0, appendT=0;
var asb=null, aqueue=[], asegs=0, amime=null;
var keys=[], lastSkip=0, skipAt=0;                // keyframe times in hand; when the last skip was
v.src=URL.createObjectURL(ms);
v.addEventListener('waiting',function(){ waits++; });
/* how long each skip took to show a picture again, into the log (N1110) */
v.addEventListener('playing',function(){ if(skipAt){ log({k:'resumed',ms:Date.now()-skipAt}); skipAt=0; } });

function onMedia(e){
  if(typeof e.data==='string'){
    var m=JSON.parse(e.data);
    if(m.k==='hello'){ recStart=m.recStart; openSb(m.mime); }
    else if(m.k==='ahello'){ amime=m.mime; openASb(m.mime); }
    else if(m.k==='seg'||m.k==='pic'){ hdr=m; parts=[]; got=0; }
    else if(m.k==='bye'){ finish(m.said||''); }
    return;
  }
  parts.push(new Uint8Array(e.data)); got+=e.data.byteLength;
  if(hdr && got>=hdr.len){
    var all=new Uint8Array(got), o=0;
    parts.forEach(function(p){ all.set(p,o); o+=p.length; });
    if(hdr.k==='pic'){ var meta=hdr; hdr=null; parts=[]; got=0; showPic(all,meta); }
    else if(hdr.s===2){ if(amime||asb)aqueue.push(all.buffer); asegs++; bytes+=got; hdr=null; parts=[]; got=0; apump(); }
    else {
      if(hdr.kt!=null){ keys.push(hdr.kt); if(keys.length>40)keys.shift(); }
      queue.push(all.buffer); segs++; bytes+=got; hdr=null; parts=[]; got=0; pump();
    }
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
/* THREE QUARTERS OF A SECOND IN HAND (N1112). It was a quarter, and on C17 over Wi-Fi the
   pieces arrive in bursts with half-second gaps: the screen froze for about a second twice a
   minute, and it played slightly fast most of the time to stay that close, eating its own
   cushion. Now it starts with 0.75 s in hand, plays fast only when more than half a second
   past that, and skips only past 3 seconds - a steady second or so behind instead of
   bouncing between half a second and two and a half. A skip restarts this device's
   hardware player, so it is the last resort. */
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
    if(!live && !v.paused && v.currentTime>0){ live=true; idle.style.display='none'; pic.style.display='none'; sharp.style.display='none'; }
    if(lag>JUMP && Date.now()-lastSkip>SETTLE*1000){
      /* SKIP ONTO A KEYFRAME, AND LET IT SETTLE (N1110). C17, 24 Sep, a film with sound: 60
         skips in twelve minutes, each one landing wherever the buffer ended - so the stick had
         to decode from the keyframe before it, up to two seconds of pictures, the likeliest
         reason it fell straight behind again. The newest keyframe in hand is where a picture
         can start at once; a sender too old to say where they are gets the old skip. Every
         skip is logged with both tracks' ends, so the next cast says which one it waited on. */
      var to=end-TARGET, onKey=false;
      for(var i=keys.length-1;i>=0;i--){
        if(keys[i]<=end-TARGET){ if(keys[i]>v.currentTime+0.5){ to=keys[i]; onKey=true; } break; }
      }
      log({k:'skip',from:+v.currentTime.toFixed(3),to:+to.toFixed(3),key:onKey,lag:+lag.toFixed(3),
           vr:sb?sb.buffered.length:0,ar:asb?asb.buffered.length:0,av:avGap()});
      skipAt=lastSkip=Date.now();
      v.currentTime=to; jumps++;
    }
    else if(lag>TARGET+FAST) v.playbackRate=RATE;
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
  live=false; idle.style.display=''; pic.style.display='none'; sharp.style.display='none';
  say(said||'CIA stopped sending');
  log({k:'bye',said:said});
}

/* ---- the call: the offer arrives inside the Cast connection, and so does our answer ---- */
var pc=null, tc=null;
function answer(sdp){
  /* a sender that comes back (the phone's app reopened) makes a new call; the old one goes */
  if(pc){ try{ pc.close(); }catch(e){} pc=null; }
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
    /* A CALL THAT DOES NOT CONNECT ENDS ONLY A FILM (5 Nov 2026). From the phone the call is the fast
       road for pictures, and where it cannot connect they come inside the Cast connection instead -
       so saying goodbye over it left the MiBox showing 'dropped' with the Cast connection still up. */
    var gone=pc.iceConnectionState==='failed'||pc.iceConnectionState==='disconnected';
    if(gone&&(live||segs))finish(pc.iceConnectionState==='failed'?'The connection to CIA failed':'The connection to CIA dropped');
    else if(gone&&(!pic.src||pic.style.display==='none'))say('Connected to CIA - waiting for a picture');
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

/* the picture's buffered end less the sound's, in milliseconds: which track the screen is
   waiting on when it stalls (vr and ar count each track's pieces of buffer - more than one
   is a hole) */
function avGap(){
  try{
    if(sb&&asb&&sb.buffered.length&&asb.buffered.length)
      return Math.round(1000*(sb.buffered.end(sb.buffered.length-1)-asb.buffered.end(asb.buffered.length-1)));
  }catch(e){}
  return null;
}
/* ---- how it is going, every two seconds, back to CIA ---- */
setInterval(function(){
  var o={k:'tv',segs:segs,asegs:asegs,sound:!!asb,kbps:Math.round(bytes*8/2000),waits:waits,jumps:jumps,
         rate:v.playbackRate,paused:v.paused,err:appendErr,w:v.videoWidth,h:v.videoHeight,
         appends:appends,appendMs:appends?Math.round(appendMs/appends):null};
  if(v.buffered.length)o.reserve=Math.round(1000*(v.buffered.end(v.buffered.length-1)-v.currentTime));
  o.vr=sb?sb.buffered.length:0; o.ar=asb?asb.buffered.length:0; o.av=avGap();
  if(off!==null && recStart!==null && v.currentTime>0)o.delay=Math.round((Date.now()-off)-(recStart+v.currentTime*1000));
  try{ var pq=v.getVideoPlaybackQuality(); o.total=pq.totalVideoFrames; o.dropped=pq.droppedVideoFrames; }catch(e){}
  if(live||segs)log(o);
  st.textContent=o.w+'x'+o.h+'   delay '+o.delay+' ms   reserve '+o.reserve+' ms   stalls '+waits+'   '+o.kbps+' kbps';
  segs=0; asegs=0; bytes=0; appends=0; appendMs=0;
},2000);

/* ---- BANDEN QUIZ BORROWS THIS SCREEN (Kim, 7 Nov 2026: "just for this quiz") ----
   Every message whose k starts with 'bq' goes to the quiz's own script, quiz/tv.js on this site,
   loaded on the first one and fetched fresh like this file. CIA never sends one, so nothing of
   CIA's changes. The quiz itself lives in Dropbox/Banden Quiz 2026. */
var bqWait=null;
function bq(m){
  if(window.BQ){ window.BQ.on(m,tell); return; }
  if(bqWait){ bqWait.push(m); return; }
  bqWait=[m];
  var s=document.createElement('script'); s.src='quiz/tv.js?v='+Date.now();
  s.onload=function(){ var q=bqWait; bqWait=null; q.forEach(function(x){ window.BQ.on(x,tell); }); };
  s.onerror=function(){ bqWait=null; log({k:'bqerr',e:'quiz/tv.js did not load'}); };
  document.body.appendChild(s);
}

/* ---- A FILM FROM THE PHONE (N1512 step 4, D751, 12 Nov 2026) ----
   The desk makes the film into pieces two seconds long, 1080p at about 4 Mbit/s with its sound, and
   the phone passes each one on inside the Cast connection, which carried 9 to 12 Mbit/s to the
   conference TV. This page asks for the pieces it needs, one at a time, keeping 20 seconds in hand
   (a 2013 stick holds that easily), and plays them in a video of its own, so the desk's live cast
   above is never touched. The phone is the remote: play, pause, scrub, volume; this page says where
   it is every second. A scrub asks for the piece it landed in first; what lies far behind or far
   ahead is let go. ?cushion= seconds, for testing. */
var CUSH=+(Q.get('cushion')||20);
var film=null, fv=null, fIn={};
function filmStart(m){
  filmStop(true);
  var f={id:m.id,dur:+m.dur||0,np:+m.np||Math.ceil((+m.dur||0)/2),codecs:String(m.codecs||'avc1.640028,mp4a.40.2'),
         have:{},ask:null,seq:0,q:[],play:!m.paused,loop:!!m.loop,t0:Date.now(),first:0,stalls:0,said:0,bytes:0,retry:null,done:null};
  film=f;
  fv=document.createElement('video');
  fv.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000';
  fv.playsInline=true; fv.volume=m.vol!=null?+m.vol:1;
  f.rate=+m.rate||1;
  document.body.appendChild(fv);
  idle.style.display='none';
  fv.addEventListener('waiting',function(){ if(film===f&&f.first&&!fv.seeking)f.stalls++; });
  fv.addEventListener('playing',function(){ if(film===f&&!f.first){ f.first=Date.now(); log({k:'film',id:f.id,started:f.first-f.t0}); } });
  /* a looping film goes back to its start, which is kept in hand for it (Kim, 12 Nov: "loop does not work") */
  fv.addEventListener('ended',function(){ if(film!==f)return; if(f.loop){ fv.currentTime=0; filmTick(); } else tell({k:'fend',id:f.id}); });
  /* A FILM THE SCREEN CANNOT DECODE ENDS HERE, saying why (Kim, 16 Nov: the conference TV played Resurrection, 820 tall,
     and refused Aliens and The Creator, 1080 tall, at their first frame, then asked for the same piece every second) */
  fv.addEventListener('error',function(){
    if(film!==f||f.dead)return; f.dead=1;
    var er=fv.error||{};
    log({k:'filmerr',e:'video error '+(er.code||'?')+' '+(er.message||''),id:f.id,w:fv.videoWidth,h:fv.videoHeight,t:+fv.currentTime.toFixed(2)});
    tell({k:'fend',id:f.id,failed:'This television could not play the film ('+(er.message||('error '+(er.code||'?')))+')'});
  });
  f.ms=new MediaSource();
  f.ms.addEventListener('sourceopen',function(){
    if(film!==f||f.sb)return;                    /* it opens again after every end, when a piece is let go */
    try{ f.sb=f.ms.addSourceBuffer('video/mp4; codecs="'+f.codecs+'"'); }
    catch(e){ log({k:'filmerr',e:'sourcebuffer '+e,codecs:f.codecs}); tell({k:'fend',id:f.id,failed:'This television cannot play the film'}); return; }
    try{ f.ms.duration=f.dur; }catch(e){}
    f.sb.addEventListener('updateend',function(){ filmAppend(f); });
    if(m.at>0)fv.currentTime=+m.at;
    filmTick();
  });
  fv.src=URL.createObjectURL(f.ms);
  fv.defaultPlaybackRate=f.rate; fv.playbackRate=f.rate;   /* a load sets the speed back, so after it */
}
function filmStop(quiet){
  var f=film; film=null; fIn={};
  if(fv){ try{ fv.pause(); }catch(e){} try{ URL.revokeObjectURL(fv.src); }catch(e){} fv.removeAttribute('src'); try{ fv.load(); }catch(e){} fv.remove(); fv=null; }
  if(f&&!quiet)log({k:'filmstop',id:f.id,stalls:f.stalls,mb:Math.round(f.bytes/1e5)/10});
  if(!quiet&&(!pic.src||pic.style.display==='none'))idle.style.display='';
}
/* the pieces arrive like a picture's parts, base64 inside the Cast connection */
function filmPart(m){
  var f=film; if(!f||m.id!==f.id)return;
  if(m.k==='fp0'){ fIn={seq:m.seq,n:m.n,off:+m.off||0,parts:[]}; return; }
  if(m.seq!==fIn.seq)return;
  if(m.k==='fpp'){ fIn.parts.push(m.b); return; }
  var s=atob(fIn.parts.join('')), u8=new Uint8Array(s.length);
  for(var i=0;i<s.length;i++)u8[i]=s.charCodeAt(i);
  var p={n:fIn.n,off:fIn.off,u8:u8}; fIn={};
  if(f.ask&&f.ask.seq===m.seq)f.ask=null;
  f.bytes+=u8.length;
  f.q.push(p); filmAppend(f);
  filmTick();
}
function filmAppend(f){
  if(film!==f||!f.sb||f.sb.updating||f.dead)return;
  if(f.done){ f.have[f.done.n]=2; f.done=null; }
  if(f.retry){ var r=f.retry; f.retry=null; f.q.unshift(r); }
  var p=f.q.shift(); if(!p)return;
  try{ f.sb.timestampOffset=p.off; f.sb.appendBuffer(p.u8); f.done=p; }
  catch(e){
    /* full: let go of what is behind and try that piece again */
    if(String(e).indexOf('Quota')>=0&&fv.currentTime>4){ f.retry=p; var q1=filmEdge(fv.currentTime-2,false); try{ f.sb.remove(0,q1); }catch(x){} filmForget(f,0,q1); }
    else{ delete f.have[p.n]; log({k:'filmerr',e:'append '+e,n:p.n}); }
  }
}
/* EVERY PIECE A LET-GO STRETCH TOUCHES is asked for again if he comes back, not only those wholly inside it
   (Kim, 14 Nov: a looping 16 s clip, started over, stopped dead at 8 s for good). Letting go of half a piece
   takes its whole picture with it, as the rest hangs on the frames let go, while the screen still counted
   the piece as in hand and never asked for it again. So a stretch is also cut on a piece's edge: each piece
   starts on the first frame at or after its even second. */
function filmEdge(t,up){ return 2*(up?Math.ceil(t/2):Math.floor(t/2)); }
function filmForget(f,a,b){
  for(var k in f.have){ var n=+k; if(f.have[k]===2&&2*n<b-0.05&&2*n+2>a+0.05)delete f.have[k]; }
}
function filmSeek(t){
  var f=film; if(!f)return;
  t=Math.max(0,Math.min(f.dur-0.1,+t||0));
  fv.currentTime=t;
  /* a piece still on its way for somewhere else is not waited for */
  if(f.ask&&Math.abs(2*f.ask.n-t)>CUSH){ delete f.have[f.ask.n]; f.ask=null; fIn={}; }
  filmTick();
}
function filmTick(){
  var f=film; if(!f||!f.sb||f.dead)return;
  var t=fv.currentTime, b=fv.buffered, ahead=0, nextS=null, i;
  for(i=0;i<b.length;i++){
    if(b.start(i)<=t+0.05&&b.end(i)>t)ahead=b.end(i)-t;
    if(b.start(i)>t&&(nextS===null||b.start(i)<nextS))nextS=b.start(i);
  }
  /* a hair's gap between two makings, or before the first piece after a scrub: hop it */
  if(ahead===0&&nextS!==null&&nextS-t<0.6){ fv.currentTime=nextS+0.01; t=nextS+0.01; ahead=0.01; }
  /* nothing to play where it stands, yet that piece counted as in hand: it is not, so ask for it again */
  var hn=Math.floor(t/2);
  if(ahead===0&&f.have[hn]===2&&!f.sb.updating&&!f.q.length&&!f.done&&t<f.dur-0.6){ delete f.have[hn]; log({k:'filmerr',e:'piece '+hn+' was gone',t:+t.toFixed(2)}); }
  /* the next piece it has not got, from where it plays, within the cushion */
  if(!f.ask){
    var n=Math.floor(t/2);
    while(f.have[n])n++;
    /* looping, and all of the rest is in hand: the first four seconds, before the end comes */
    if(n>=f.np&&f.loop&&t+CUSH>f.dur){ n=0; while(n<2&&f.have[n])n++; if(n>=2)n=f.np; }
    if(n<f.np&&2*n<t+CUSH){
      f.have[n]=1; f.ask={n:n,seq:++f.seq,t:Date.now()};
      tell({k:'fneed',id:f.id,n:n,seq:f.seq});
    }
  }
  else if(Date.now()-f.ask.t>15000){ log({k:'filmerr',e:'piece '+f.ask.n+' never came'}); delete f.have[f.ask.n]; f.ask=null; fIn={}; }
  /* the film has an end once its last piece is in hand up to here, or it waits at its final frame for ever;
     letting a piece go opens it again, so this is asked every tick */
  /* judged by the stretch it plays in reaching the end, not by time in hand: a loop's start arriving in the last
     second opened it again with nothing left ahead, and it never ended (12 Nov) */
  var tail=false;
  for(i=0;i<b.length;i++)if(b.start(i)<=t+0.05&&b.end(i)>=f.dur-0.5)tail=true;
  if(f.ms.readyState==='open'&&!f.sb.updating&&!f.q.length&&!f.done&&f.have[f.np-1]===2&&tail){
    try{ f.ms.endOfStream(); }catch(e){}
  }
  /* it starts once there are four seconds in hand, or the rest of the film; after a pause, two */
  if(f.play&&fv.paused&&!fv.ended&&ahead>0&&ahead>=Math.min(f.first?2:4,f.dur-t-0.2)){
    var pr=fv.play();
    if(pr&&pr.catch)pr.catch(function(err){ log({k:'play',e:String(err),muted:fv.muted}); if(!fv.muted){ fv.muted=true; } });
  }
  /* let go of what is well behind, and of what lies far ahead after a scrub back */
  if(!f.sb.updating&&!f.q.length&&!f.done){
    var keep=f.loop?4:0, s0=null;                 /* a looping film keeps its first four seconds */
    for(i=0;i<b.length;i++){ var a0=Math.max(b.start(i),keep); if(a0<t-12&&b.end(i)>a0){ s0=a0; break; } }
    var e1=filmEdge(t-8,false);
    if(s0!==null&&e1>s0){ try{ f.sb.remove(s0,e1); }catch(x){} filmForget(f,s0,e1); }
    else if(b.length&&b.end(b.length-1)>t+CUSH+12){ var s1=filmEdge(t+CUSH+6,true); try{ f.sb.remove(s1,f.dur+10); }catch(x){} filmForget(f,s1,f.dur+10); }
  }
}
setInterval(filmTick,250);
/* where the film is, every second, to the phone; and how it went, every ten, to the desk's log */
setInterval(function(){
  var f=film; if(!f||!fv)return;
  var b=fv.buffered, ahead=0;
  for(var i=0;i<b.length;i++)if(b.start(i)<=fv.currentTime+0.05&&b.end(i)>fv.currentTime)ahead=b.end(i)-fv.currentTime;
  tell({k:'fpos',id:f.id,t:+fv.currentTime.toFixed(2),dur:f.dur,paused:!f.play,wait:f.play&&fv.paused,ahead:+ahead.toFixed(1),vol:fv.volume});
  if(++f.said%10===0){
    var o={k:'filmtv',id:f.id,t:Math.round(fv.currentTime),ahead:+ahead.toFixed(1),stalls:f.stalls,mb:Math.round(f.bytes/1e5)/10,w:fv.videoWidth,h:fv.videoHeight};
    try{ var pq=fv.getVideoPlaybackQuality(); o.dropped=pq.droppedVideoFrames; o.total=pq.totalVideoFrames; }catch(e){}
    log(o);
  }
},1000);
function filmCtl(m){
  var f=film; if(!f||m.id!==f.id)return;
  if(m.op==='play'){ f.play=true; if(fv.ended)filmSeek(0); filmTick(); }   /* play at the end starts it again */
  else if(m.op==='pause'){ f.play=false; fv.pause(); }
  else if(m.op==='seek'){ filmSeek(m.t); }
  else if(m.op==='loop'){ f.loop=!!m.v; }
  else if(m.op==='rate'){ f.rate=Math.max(0.25,Math.min(2,+m.v||1)); fv.defaultPlaybackRate=f.rate; fv.playbackRate=f.rate; }
  else if(m.op==='vol'){ fv.volume=Math.max(0,Math.min(1,+m.v)); if(fv.volume>0)fv.muted=false; }
}

/* ---- Cast: the receiver side of the connection CIA opened ---- */
try{
  ctx=cast.framework.CastReceiverContext.getInstance();
  ctx.addCustomMessageListener(NS,function(e){
    var m=e.data;
    if(typeof m==='string'){ try{ m=JSON.parse(m); }catch(x){ return; } }
    if(!m)return;
    /* EVERY SENDER HEARS WHAT THIS SCREEN CAN DO, not only the first (N1512): a phone that
       joined a cast already running was answered with nothing at all */
    var first=!heard[e.senderId];
    heard[e.senderId]=1; sender=e.senderId;
    if(first)caps();
    /* how long the screen stood alone before a phone came back, and why it went (Kim, 5 Nov) */
    if(first&&gone){ log({k:'alone',s:Math.round((Date.now()-gone.t)/1000),why:gone.why}); gone=null; }
    if(m.k==='offer'){ if(!pic.src||pic.style.display==='none')say('Connecting to CIA'); answer(m.sdp); }
    else if(m.k==='pic0'||m.k==='picp'||m.k==='pic1'){ picPart(m); }
    else if(m.k==='view'){ onView(m); }
    else if(m.k==='film'){ filmStart(m); }
    else if(m.k==='fp0'||m.k==='fpp'||m.k==='fp1'){ filmPart(m); }
    else if(m.k==='fctl'){ filmCtl(m); }
    else if(m.k==='fstop'){ filmStop(); }
    else if(m.k==='bye'){ finish(m.said||''); }
    else if(m.k==='dbg'){ document.body.classList.toggle('dbg',!!m.on); }
    else if(typeof m.k==='string'&&m.k.indexOf('bq')===0){ bq(m); }
  });
  ctx.addEventListener(cast.framework.system.EventType.SENDER_DISCONNECTED,function(e){
    gone={t:Date.now(),why:String(e.reason||'')};
    /* the phone feeds the film, so with the phone gone it waits where it is (Kim, 12 Nov) */
    if(film&&e.senderId===sender){ film.play=false; try{ fv.pause(); }catch(x){} }
    if(e.senderId===sender && !done && live)finish('CIA disconnected');
  });
  var opts=new cast.framework.CastReceiverOptions();
  opts.disableIdleTimeout=true;
  /* A PHONE IN ANOTHER APP MAY GO QUIET FOR MINUTES (Kim, 5 Nov: "at least 10 min"). The screen keeps it
     counted as connected for ten minutes of silence rather than ten seconds. */
  opts.maxInactivity=600;
  opts.skipPlayersLoad=true;
  opts.statusText='Interstellar Marines';
  opts.customNamespaces={};
  opts.customNamespaces[NS]=cast.framework.system.MessageType.JSON;
  startedAt=Math.round(performance.now());
  ctx.start(opts);
}catch(e){ say('This page must be opened by Cast: '+e); }
