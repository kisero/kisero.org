/* Site-owned text and accessibility labels, including live updates and SVGs.
   Original English text is the catalog key; place names and nautical symbols stay intact. */
(()=>{
  'use strict';
  const locales={en:'en-GB',es:'es-ES',hr:'hr-HR',sk:'sk-SK'};
  let saved='en';try{saved=localStorage.getItem('kisero-language')||'en';}catch(_){}
  const requested=new URLSearchParams(location.search).get('lang');
  if(Object.hasOwn(locales,requested)){saved=requested;try{localStorage.setItem('kisero-language',requested);}catch(_){}}
  const lang=Object.hasOwn(locales,saved)?saved:'en',column=['en','es','hr','sk'].indexOf(lang);
  document.documentElement.lang=lang;
  const rows=window.KiseroMessages||[],exact=new Map(rows.map(row=>[row[0],row[column]]));
  const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const patterns=rows.filter(row=>/\{\d+\}/.test(row[0])).sort((a,b)=>b[0].replace(/\{\d+\}/g,'').length-a[0].replace(/\{\d+\}/g,'').length).map(row=>{
    const slots=[];const expression=row[0].split(/(\{\d+\})/).map(part=>/^\{\d+\}$/.test(part)?(slots.push(Number(part.slice(1,-1))),'([\\s\\S]+?)'):escape(part)).join('');
    return {re:new RegExp('^'+expression+'$'),slots,value:row[column]};
  });
  function numbers(value){
    return lang==='en'?value:value.replace(/\d+\.\d+/g,n=>n.replace('.',','));
  }
  function t(input,depth=0){
    const source=String(input),value=source.trim();if(lang==='en'||!value||depth>5)return source;
    const paddingStart=source.slice(0,source.indexOf(value)),paddingEnd=source.slice(source.indexOf(value)+value.length);
    let translated=exact.get(value);
    if(translated===undefined){
      for(const p of patterns){const match=value.match(p.re);if(!match)continue;const args={};p.slots.forEach((slot,i)=>args[slot]=t(match[i+1],depth+1));translated=p.value.replace(/\{(\d+)\}/g,(_,n)=>args[n]??'');break;}
    }
    if(translated===undefined){
      // Measurements use local decimal separators; GPS coordinates and identifiers are preserved.
      translated=/^[\d\s.,/+:—–−°%\-]+(?:kn|nm|m|°C|%)?$/.test(value)?numbers(value):value;
    }
    return paddingStart+translated+paddingEnd;
  }
  const seen=new WeakMap(),attributes=new WeakMap();
  const ignore=el=>!el||!!el.closest('script,style,noscript,option,[translate="no"],code,pre');
  function text(node){
    if(ignore(node.parentElement)||seen.get(node)===node.nodeValue)return;
    const result=t(node.nodeValue);seen.set(node,result);if(node.nodeValue!==result)node.nodeValue=result;
  }
  function labels(el){
    if(ignore(el))return;
    let values=attributes.get(el);if(!values){values={};attributes.set(el,values);}
    for(const key of ['title','aria-label','alt','placeholder','aria-valuetext']){const value=el.getAttribute(key);if(value===null||values[key]===value)continue;const result=t(value);values[key]=result;if(value!==result)el.setAttribute(key,result);}
  }
  function translate(root){
    if(root.nodeType===Node.TEXT_NODE){text(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE||ignore(root))return;
    labels(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){if(node.nodeType===Node.TEXT_NODE)text(node);else labels(node);}
  }
  window.KiseroI18n=Object.freeze({lang,locale:locales[lang],t,translate});
  document.addEventListener('DOMContentLoaded',()=>{
    document.title=t(document.title);
    translate(document.body);
    document.querySelectorAll('[data-language]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.language===lang));
      button.addEventListener('click',()=>{
        const next=button.dataset.language;if(!Object.hasOwn(locales,next)||next===lang)return;
        try{localStorage.setItem('kisero-language',next);}catch(_){}
        const url=new URL(location.href);url.searchParams.set('lang',next);location.href=url.href;
      });
    });
    new MutationObserver(records=>{
      const roots=new Set();for(const record of records){if(record.type==='characterData')text(record.target);else if(record.type==='attributes')labels(record.target);else for(const node of record.addedNodes)roots.add(node);}
      for(const root of roots)if(root.isConnected)translate(root);
    }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','alt','placeholder','aria-valuetext']});
  });
})();
