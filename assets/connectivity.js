/* Connectivity is based only on authenticated Pi heartbeats received by AWS. */
(()=>{
  'use strict';
  const svg=document.getElementById('internet-chart');
  if(!svg)return;
  let beats=[],started=null,grace=90000,serverTime=null,history=null,lastContact=null;
  const NS='http://www.w3.org/2000/svg';
  const format=t=>new Date(t).toLocaleString(window.KiseroI18n.locale,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
  function formatLastUpdate(timestamp){
    const locale=window.KiseroI18n.locale;
    const date=new Date(timestamp);
    const options={day:'numeric',month:'long',hour:'numeric',minute:'2-digit'};
    if(!locale.startsWith('en'))return date.toLocaleString(locale,options);
    const fields=Object.fromEntries(new Intl.DateTimeFormat(locale,{...options,hour12:true})
      .formatToParts(date).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
    const day=Number(fields.day);
    const suffix=day>=11&&day<=13?'th':({1:'st',2:'nd',3:'rd'}[day%10]||'th');
    return `${day}${suffix} ${fields.month} ${fields.hour}:${fields.minute}${fields.dayPeriod.toUpperCase()}`;
  }
  function render(){
    const {start,end,days}=KiseroChartRange.window(),span=Math.max(1,end-start),width=Math.max(320,svg.clientWidth),left=16,right=width-16;
    svg.setAttribute('viewBox',`0 0 ${width} 108`);svg.replaceChildren();
    const add=(tag,attrs={},label)=>{const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));if(label)el.textContent=label;svg.append(el);return el;};
    const x=t=>left+Math.max(0,Math.min(1,(t-start)/span))*(right-left);
    const rect=(a,b,color,label)=>{if(b<=a)return;const el=add('rect',{x:x(a),y:24,width:Math.max(1,x(b)-x(a)),height:42,fill:color,rx:3});const title=document.createElementNS(NS,'title');title.textContent=label;el.append(title);};
    rect(start,end,'#edf1ef','No data');
    beats=beats.filter(t=>t>=end-86400000-grace&&t<=end+60000).sort((a,b)=>a-b);
    const sourceFresh=serverTime!==null&&end-serverTime<75000&&navigator.onLine;
    const knownEnd=sourceFresh?end:Math.min(end,serverTime??start);
    const historyStart=history?.startedAt?Date.parse(history.startedAt):null;
    const knownStart=days===1?started:(historyStart??(started===null?null:Math.max(started,end-86400000)));
    if(knownStart!==null){
      rect(Math.max(start,knownStart),knownEnd,'#c34f3f','No contact');
      const intervals=days===1?[]:(history?.intervals||[]).map(([a,b])=>[a*1000,b*1000]);
      intervals.push(...beats.map(beat=>[beat,beat+grace]));
      intervals.sort((a,b)=>a[0]-b[0]);
      const merged=[];
      for(const [from,to] of intervals){
        const a=Math.max(start,knownStart,from),b=Math.min(knownEnd,to);
        if(b<=a)continue;
        const previous=merged.at(-1);
        if(previous&&a<=previous[1])previous[1]=Math.max(previous[1],b);else merged.push([a,b]);
      }
      for(const [a,b]of merged)rect(a,b,'#32834d',`Contact confirmed: ${format(a)} – ${format(b)}`);
    }
    for(let i=0;i<=4;i++){const t=start+i*span/4;add('text',{x:left+(right-left)*i/4,y:91,'text-anchor':i===0?'start':i===4?'end':'middle'},KiseroChartRange.tick(t));}
    const latest=Math.max(lastContact??0,beats.at(-1)??0);
    const last=latest||undefined,online=last!==undefined&&Date.now()-last<=60000;
    const header=document.getElementById('cabin-sensor-status');
    if(header)header.textContent=last===undefined?'Waiting for Pi contact':`Last update ${formatLastUpdate(last)}`;
    const summary=document.getElementById('internet-summary');
    if(summary){summary.textContent=online?'':last===undefined?'Waiting for Pi contact':`No readings since ${format(last)}`;summary.classList.toggle('data-warning',!online);summary.hidden=online;}

  }
  window.KiseroHome?.subscribe(({device})=>{
    const received=Date.parse(device?.receivedAt);
    if(Number.isFinite(received))lastContact=Math.max(lastContact??0,received);
    render();
  });
  window.addEventListener('kisero-alarm-update',event=>{
    const packet=event.detail||{};
    if(packet.serverTime&&Number.isFinite(Date.parse(packet.serverTime)))serverTime=Date.parse(packet.serverTime);
    if(packet.connectivity){const history=packet.connectivity;if(history.startedAt)started=Date.parse(history.startedAt);if(Number.isFinite(history.graceSeconds))grace=history.graceSeconds*1000;beats.push(...(history.beats||[]).map(Date.parse).filter(Number.isFinite));}
    if(packet.connectivityStartedAt)started=Date.parse(packet.connectivityStartedAt);
    for(const value of [packet.connectivityBeat,packet.device?.receivedAt]){
      const received=Date.parse(value);
      if(!Number.isFinite(received))continue;
      lastContact=Math.max(lastContact??0,received);
      beats.push(received);
    }
    beats=[...new Set(beats)];render();
  });
  window.addEventListener('kisero-chart-history',event=>{history=event.detail;render();});
  window.addEventListener('resize',render);
  window.addEventListener('offline',render);window.addEventListener('online',render);
  setInterval(render,5000);render();
})();
