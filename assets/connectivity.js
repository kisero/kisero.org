/* Connectivity is based only on authenticated Pi heartbeats received by AWS. */
(()=>{
  'use strict';
  const svg=document.getElementById('internet-chart'),status=document.getElementById('internet-current');
  if(!svg||!status)return;
  let beats=[],started=null,grace=90000,serverTime=null;
  const NS='http://www.w3.org/2000/svg';
  const format=t=>new Date(t).toLocaleString(window.KiseroI18n.locale,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
  function render(){
    const end=Date.now(),start=end-86400000,width=Math.max(320,svg.clientWidth),left=16,right=width-16;
    svg.setAttribute('viewBox',`0 0 ${width} 108`);svg.replaceChildren();
    const add=(tag,attrs={},label)=>{const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));if(label)el.textContent=label;svg.append(el);return el;};
    const x=t=>left+Math.max(0,Math.min(1,(t-start)/86400000))*(right-left);
    const rect=(a,b,color,label)=>{if(b<=a)return;const el=add('rect',{x:x(a),y:24,width:Math.max(1,x(b)-x(a)),height:42,fill:color,rx:3});const title=document.createElementNS(NS,'title');title.textContent=label;el.append(title);};
    rect(start,end,'#edf1ef','No data');
    beats=beats.filter(t=>t>=start-grace&&t<=end+60000).sort((a,b)=>a-b);
    const sourceFresh=serverTime!==null&&end-serverTime<75000&&navigator.onLine;
    const knownEnd=sourceFresh?end:Math.min(end,serverTime??start);
    if(started!==null){
      rect(Math.max(start,started),knownEnd,'#c34f3f','No contact');
      let merged=[];
      for(const beat of beats){const a=Math.max(start,started,beat),b=Math.min(knownEnd,beat+grace);if(b<=a)continue;const previous=merged.at(-1);if(previous&&a<=previous[1])previous[1]=Math.max(previous[1],b);else merged.push([a,b]);}
      for(const [a,b]of merged)rect(a,b,'#32834d',`Contact confirmed: ${format(a)} – ${format(b)}`);
    }
    for(let i=0;i<=4;i++){const t=start+i*21600000;add('text',{x:left+(right-left)*i/4,y:91,'text-anchor':i===0?'start':i===4?'end':'middle'},new Date(t).toLocaleTimeString(window.KiseroI18n.locale,{hour:'2-digit',minute:'2-digit'}));}
    const last=beats.at(-1),online=sourceFresh&&last!==undefined&&end-last<grace;
    status.textContent=started===null?'Waiting for Pi contact':!sourceFresh?'Status unavailable':online?'Online':'No contact';
    status.dataset.online=String(online);
  }
  window.addEventListener('kisero-alarm-update',event=>{
    const packet=event.detail||{};
    if(packet.serverTime&&Number.isFinite(Date.parse(packet.serverTime)))serverTime=Date.parse(packet.serverTime);
    if(packet.connectivity){const history=packet.connectivity;if(history.startedAt)started=Date.parse(history.startedAt);if(Number.isFinite(history.graceSeconds))grace=history.graceSeconds*1000;beats.push(...(history.beats||[]).map(Date.parse).filter(Number.isFinite));}
    if(packet.connectivityStartedAt)started=Date.parse(packet.connectivityStartedAt);
    for(const value of [packet.connectivityBeat,packet.device?.receivedAt]){if(value&&Number.isFinite(Date.parse(value)))beats.push(Date.parse(value));}
    beats=[...new Set(beats)];render();
  });
  window.addEventListener('resize',render);
  window.addEventListener('offline',render);window.addEventListener('online',render);
  setInterval(render,15000);render();
})();
