/* Public, read-only live feed. The private capability is used only on alarm.html. */
(()=>{
'use strict';
const API='https://6zdivjvubh.execute-api.eu-north-1.amazonaws.com';
const $=id=>document.getElementById(id);
const admin=!!$('alarm-controls');
const capability=admin?location.hash.slice(1):'';
let model=null,events=[],socket=null,reconnect=null,lastPacket=0,closed=false;
const format=t=>new Date(t).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function merge(packet){
 if(packet.type==='pong')return;
 lastPacket=Date.now();
 if(packet.events)events=Array.from(new Map([...events,...packet.events].map(e=>[e.id,e])).values());
 if(packet.event&&!events.some(e=>e.id===packet.event.id))events.push(packet.event);
 events=events.filter(e=>Date.parse(e.observedAt)>Date.now()-86400000).sort((a,b)=>a.observedAt.localeCompare(b.observedAt)).slice(-500);
 model={...model,...packet};render();
 window.dispatchEvent(new CustomEvent('kisero-alarm-update'));
}
function render(){
 if(!model)return;
 const d=model.device,c=model.control||{},fresh=d&&Date.now()-Date.parse(d.reportedAt)<90000;
 const pending=!d||d.controlVersion!==c.version;
 const delay=d?.armingUntil&&Date.parse(d.armingUntil)>Date.now();
 const state=d?(d.armed?'On':'Off'):'Unknown';
 let detail=!fresh?'Pi offline':pending?'Applying change…':!d.ready?'Sensor warming up':delay?'Exit delay':d.sounding?'Motion alarm sounding':d.motion?'Movement detected':'No movement';
 if(!fresh&&c.armed!==d?.armed)detail='Pi offline · change pending';
 if($('alarm-label'))$('alarm-label').textContent=`Alarm (${state})`;
 if($('alarm-detail'))$('alarm-detail').textContent=detail;
 if($('alarm-badge'))$('alarm-badge').dataset.state=d?.sounding?'triggered':d?.armed?'on':'off';
 if($('motion-status'))$('motion-status').textContent=detail;
 if($('motion-live')){
  $('motion-live').textContent=fresh?(socket?.readyState===1?'Live updates':'Reconnecting live feed'):'Pi offline';
  $('motion-live').dataset.online=String(!!fresh&&socket?.readyState===1);
 }
 if($('motion-updated'))$('motion-updated').textContent=d?`Last Pi contact: ${format(d.reportedAt)} · Last 24 hours · Times shown in your local time`:'Waiting for the Pi to report. Motion history will appear here.';
 draw();
 if($('movement-events')){
  const labels={motion:'Movement detected',armed:'Alarm turned on · exit delay',disarmed:'Alarm turned off',triggered:'Buzzer alarm triggered',silenced:'Buzzer stopped',ready:'Motion sensor ready'};
  $('movement-events').innerHTML=events.slice().reverse().slice(0,40).map(e=>`<div class="movement-event" data-kind="${esc(e.kind)}"><time datetime="${esc(e.observedAt)}">${esc(format(e.observedAt))}</time><strong>${esc(e.kind==='motion'&&!e.motion?'Movement cleared':labels[e.kind]||e.kind)}</strong></div>`).join('')||'<p class="movement-empty">No recorded motion events in the last 24 hours.</p>';
 }
 if(admin){
  $('alarm-current').textContent=`Alarm (${state}) · ${detail}`;
  $('alarm-contact').textContent=d?`Last Pi contact: ${format(d.reportedAt)}`:'Waiting for first Pi contact.';
  $('alarm-requested').textContent=pending?`Requested: ${c.armed?'On':'Off'} — waiting for Pi confirmation.`:'';
  if(!pending&&$('alarm-message').textContent==='Change saved. Waiting for the Pi to confirm.')$('alarm-message').textContent='Confirmed by the Pi.';
  document.querySelectorAll('#alarm-controls button').forEach(b=>b.disabled=!/^[a-f0-9]{64}$/.test(capability));
 }
}
function draw(){
 const svg=$('motion-chart');if(!svg)return;
 const end=Date.now(),start=end-86400000,x=t=>40+Math.max(0,Math.min(1,(t-start)/86400000))*560;
 let active=null,segments=[];
 for(const e of events){const t=Date.parse(e.observedAt);if((e.kind==='motion'||e.kind==='ready')&&e.motion){if(active===null)active=t;}else if((e.kind==='motion'||e.kind==='ready')&&!e.motion&&active!==null){segments.push([active,t]);active=null;}}
 if(active!==null){const contact=Date.parse(model.device?.reportedAt);segments.push([active,Math.min(end,Number.isFinite(contact)?contact:end)]);}
 let html='<rect x="40" y="24" width="560" height="42" rx="7" fill="#edf1ef"/>';
 for(let i=0;i<=4;i++){const t=start+i*21600000;html+=`<text x="${40+i*140}" y="91" text-anchor="${i===0?'start':i===4?'end':'middle'}">${esc(new Date(t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))}</text>`;}
 for(const [a,b]of segments){if(b>=a)html+=`<rect class="activity" x="${x(a)}" y="24" width="${Math.max(3,x(b)-x(a))}" height="42" rx="3"><title>Movement: ${esc(format(a))} – ${esc(format(b))}</title></rect>`;}
 for(const e of events.filter(e=>e.kind==='triggered'))html+=`<rect class="alert" x="${x(Date.parse(e.observedAt))}" y="18" width="4" height="54"><title>Buzzer triggered: ${esc(format(e.observedAt))}</title></rect>`;
 svg.innerHTML=html;
}
async function snapshot(){try{const r=await fetch(API+'/v1/alarm',{cache:'no-store'});if(!r.ok)throw Error();const p=await r.json();merge(p);connect(p.websocketUrl);}catch(e){if($('motion-live')){$('motion-live').textContent='Feed unavailable';$('motion-live').dataset.online='false';}if($('alarm-message'))$('alarm-message').textContent='Cannot reach the alarm service. Try again shortly.';}}
function connect(url){
 if(!url||closed||socket?.readyState===0||socket?.readyState===1)return;
 socket=new WebSocket(url);
 socket.onopen=()=>{render();snapshot();};
 socket.onmessage=e=>{try{merge(JSON.parse(e.data));}catch(_){}};
 socket.onerror=()=>socket.close();
 socket.onclose=()=>{render();clearTimeout(reconnect);reconnect=setTimeout(()=>snapshot(),4000);};
}
if(admin){
 if(!/^[a-f0-9]{64}$/.test(capability))$('alarm-message').textContent='Open your private control link to turn the alarm on or off.';
 document.querySelectorAll('#alarm-controls button').forEach(button=>button.addEventListener('click',async()=>{
  document.querySelectorAll('#alarm-controls button').forEach(b=>b.disabled=true);
  $('alarm-message').textContent='Sending change…';
  try{const r=await fetch(API+'/v1/alarm/control',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+capability},body:JSON.stringify({armed:button.dataset.armed==='true'})});if(!r.ok)throw Error(r.status===401?'This private control link is invalid.':'Could not save the change.');merge(await r.json());$('alarm-message').textContent='Change saved. Waiting for the Pi to confirm.';}catch(e){$('alarm-message').textContent=e.message;}finally{render();}
 }));
}
snapshot();
setInterval(()=>{render();if(socket?.readyState===1)socket.send('{"action":"ping"}');if(socket?.readyState!==1||Date.now()-lastPacket>75000)snapshot();},15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)snapshot();});
window.addEventListener('pagehide',()=>{closed=true;socket?.close();clearTimeout(reconnect);});
})();
