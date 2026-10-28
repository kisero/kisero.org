/* Statistics use original GPS samples, before chart averaging or filtering. */
(()=>{
  'use strict';
  function sustainedSog(track){
    let best=null;
    // Preserve sample order and invalid rows: never bridge a missing reading.
    const points=(Array.isArray(track)?track:[]).map(row=>{
      if(!Array.isArray(row)||typeof row[2]!=='string'||typeof row[3]!=='number'||!Number.isFinite(row[3])||row[3]<0)return null;
      const time=Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(row[2])?row[2]:row[2]+'Z');
      return Number.isFinite(time)?{time,speed:row[3]}:null;
    });
    for(let i=2;i<points.length;i++){
      const a=points[i-2],b=points[i-1],c=points[i];
      if(!a||!b||!c||b.time-a.time!==15000||c.time-b.time!==15000)continue;
      const average=(a.speed+b.speed+c.speed)/3;
      if(!best||average>best.kn)best={kn:average,start:track[i-2][2],end:track[i][2]};
    }
    return best;
  }
  window.KiseroSailingStats=Object.freeze({sustainedSog});
})();
