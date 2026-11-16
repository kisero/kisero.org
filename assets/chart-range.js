/* The same time window drives all three Boat Status charts. */
(()=>{
  const day=86400000;
  const control=document.getElementById('chart-range');
  let days=1;
  window.KiseroChartRange={
    window(end=Date.now()){
      const midnight=new Date(end);
      midnight.setHours(0,0,0,0);
      return {start:days===1?+midnight:end-days*day,end,days};
    },
    tick(time){
      const options=days===1?{hour:'2-digit',minute:'2-digit'}:{month:'short',day:'numeric'};
      return new Date(time).toLocaleString(window.KiseroI18n.locale,options);
    }
  };
  control.addEventListener('click',event=>{
    const button=event.target.closest('button[data-days]');
    if(!button||days===Number(button.dataset.days))return;
    days=Number(button.dataset.days);
    for(const item of control.querySelectorAll('button'))item.setAttribute('aria-pressed',String(item===button));
    window.dispatchEvent(new Event('kisero-chart-range'));
  });
})();
