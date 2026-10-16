// THE NOVEMBER ROAD — editable timeline engine (vanilla, localStorage, no deps)
// PLAN (the seed) is defined in the page above this script as `const PLAN = {...}`.
const KEY='ssnov.v1';
const LANES={design:'design verdict',build:'build card',art:'art / MJ',store:'store / shell',video:'video / playable',test:'play-test',hold:'buffer'};
const SIZES=['S','M','L'];
const STATUS=['todo','doing','done','cut'];
let state=null;
function fresh(){return {rel:PLAN.release,alt:PLAN.altRelease,tasks:PLAN.tasks.map(t=>Object.assign({},t)),nextId:PLAN.tasks.length+1,edited:null};}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.tasks)return s;}catch(e){}return fresh();}
function save(){state.edited=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}paint();}
const DAYMS=864e5;
function d2s(d){return d.toISOString().slice(0,10)}
function s2d(s){return new Date(s+'T12:00:00Z')}
function dayName(s){const d=s2d(s);return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()]}
function pretty(s){const d=s2d(s);return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()]+' '+d.getUTCDate()}
function weekend(s){const w=s2d(s).getUTCDay();return w===0||w===6}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function paint(){
  state=state||load();
  const host=document.getElementById('days');host.innerHTML='';
  const tasks=state.tasks.slice().sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:(a.ord||0)-(b.ord||0));
  const byDay={};for(const t of tasks){(byDay[t.date]=byDay[t.date]||[]).push(t)}
  const first=PLAN.start, last=state.tasks.reduce((m,t)=>t.date>m?t.date:m,state.alt);
  let d=s2d(first);const end=s2d(last);
  const today=d2s(new Date(Date.now()-new Date().getTimezoneOffset()*6e4));
  while(d<=end){
    const key=d2s(d);const list=byDay[key]||[];
    const el=document.createElement('section');el.className='day'+(weekend(key)?' wk':'')+(key===today?' today':'')+(key===state.rel?' rel':'')+(key===state.alt?' alt':'');
    const m=PLAN.marks[key];
    el.innerHTML=`<header><div class="dn"><b>${dayName(key)}</b> ${pretty(key)}${key===today?' <span class="tag">today</span>':''}${key===state.rel?' <span class="tag gold">RELEASE AIM</span>':''}${key===state.alt?' <span class="tag dim">fallback release</span>':''}</div>${m?`<div class="mark">${esc(m)}</div>`:''}<button class="add" data-d="${key}" title="add a task on this day">+ task</button></header>`;
    const ul=document.createElement('div');ul.className='tasks';
    if(!list.length)ul.innerHTML=`<div class="empty">${weekend(key)?'weekend · buffer':'open'}</div>`;
    for(const t of list)ul.appendChild(taskEl(t));
    el.appendChild(ul);host.appendChild(el);
    d=new Date(d.getTime()+DAYMS);
  }
  host.querySelectorAll('.add').forEach(b=>b.onclick=()=>{state.tasks.push({id:'n'+(state.nextId++),date:b.dataset.d,lane:'build',size:'M',status:'todo',title:'new task',note:'',ord:99});save();});
  // stats
  const n=state.tasks.filter(t=>t.status!=='cut').length,done=state.tasks.filter(t=>t.status==='done').length;
  const left=Math.round((s2d(state.rel)-s2d(today))/DAYMS);
  document.getElementById('st').innerHTML=`<b>${done}/${n}</b> done · <b>${left}</b> days to the ${pretty(state.rel)} aim · fallback ${pretty(state.alt)}${state.edited?' · <span class="ok">your edits are saved in this browser</span>':' · the seed plan, unedited'}`;
  document.getElementById('relIn').value=state.rel;document.getElementById('altIn').value=state.alt;
  const lanesEl=document.getElementById('lanecount');if(lanesEl){const c={};for(const t of state.tasks)if(t.status!=='cut')c[t.lane]=(c[t.lane]||0)+1;lanesEl.innerHTML=Object.keys(LANES).map(k=>`<span class="lp l-${k}">${LANES[k]} <b>${c[k]||0}</b></span>`).join('')}
}
function taskEl(t){
  const el=document.createElement('div');el.className=`task l-${t.lane} s-${t.status}`;el.dataset.id=t.id;
  el.innerHTML=`<div class="trow">
    <button class="chk" title="cycle: todo → doing → done">${t.status==='done'?'✓':t.status==='doing'?'…':t.status==='cut'?'✗':''}</button>
    <div class="ttl" contenteditable="true" spellcheck="false">${esc(t.title)}</div>
    <span class="sz" title="size: S half a session · M one · L two or more">${t.size}</span>
  </div>
  <div class="tnote" contenteditable="true" spellcheck="false" data-ph="note (what, why, who rules it)">${esc(t.note||'')}</div>
  <div class="tctl">
    <select class="lane">${Object.keys(LANES).map(k=>`<option value="${k}"${k===t.lane?' selected':''}>${LANES[k]}</option>`).join('')}</select>
    <select class="size">${SIZES.map(s=>`<option${s===t.size?' selected':''}>${s}</option>`).join('')}</select>
    <select class="status">${STATUS.map(s=>`<option${s===t.status?' selected':''}>${s}</option>`).join('')}</select>
    <input type="date" class="date" value="${t.date}" title="move to another day">
    <button class="mv" data-n="-1" title="a day earlier">◀</button><button class="mv" data-n="1" title="a day later">▶</button>
    <button class="del" title="remove">remove</button>
    ${t.link?`<a class="lnk" href="${esc(t.link)}" target="_blank" rel="noopener">page ↗</a>`:''}
  </div>`;
  const find=()=>state.tasks.find(x=>x.id===t.id);
  el.querySelector('.chk').onclick=()=>{const x=find();x.status=x.status==='todo'?'doing':x.status==='doing'?'done':'todo';save();};
  el.querySelector('.ttl').onblur=e=>{const x=find();const v=e.target.textContent.trim();if(v!==x.title){x.title=v;save();}};
  el.querySelector('.tnote').onblur=e=>{const x=find();const v=e.target.textContent.trim();if(v!==(x.note||'')){x.note=v;save();}};
  el.querySelectorAll('.ttl,.tnote').forEach(n=>n.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();n.blur();}});
  el.querySelector('.lane').onchange=e=>{find().lane=e.target.value;save();};
  el.querySelector('.size').onchange=e=>{find().size=e.target.value;save();};
  el.querySelector('.status').onchange=e=>{find().status=e.target.value;save();};
  el.querySelector('.date').onchange=e=>{if(e.target.value){find().date=e.target.value;save();}};
  el.querySelectorAll('.mv').forEach(b=>b.onclick=()=>{const x=find();x.date=d2s(new Date(s2d(x.date).getTime()+DAYMS*+b.dataset.n));save();});
  el.querySelector('.del').onclick=()=>{state.tasks=state.tasks.filter(x=>x.id!==t.id);save();};
  return el;
}
function asText(){
  const tasks=state.tasks.slice().sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:(a.ord||0)-(b.ord||0));
  let out=`STARSPELL — THE NOVEMBER ROAD (edited ${state.edited?state.edited.slice(0,16).replace('T',' '):'never'})\nrelease aim ${state.rel} · fallback ${state.alt}\n\n`;let cur='';
  for(const t of tasks){if(t.date!==cur){cur=t.date;out+=`\n${dayName(cur)} ${pretty(cur)} (${cur})\n`;}out+=`  [${t.status==='done'?'x':t.status==='doing'?'~':t.status==='cut'?'-':' '}] ${t.title} · ${LANES[t.lane]} · ${t.size}${t.note?'\n      '+t.note:''}\n`;}
  return out;
}
document.getElementById('copy').onclick=async()=>{const s=asText();try{await navigator.clipboard.writeText(s);flash('copied — paste it to me and I will bake it into the page')}catch(e){prompt('copy this',s)}};
document.getElementById('json').onclick=async()=>{const s=JSON.stringify(state,null,1);try{await navigator.clipboard.writeText(s);flash('JSON copied')}catch(e){prompt('copy this',s)}};
document.getElementById('imp').onclick=()=>{const s=prompt('paste a JSON export');if(!s)return;try{const j=JSON.parse(s);if(j.tasks){state=j;save();flash('imported')}}catch(e){flash('that was not valid JSON')}};
document.getElementById('reset').onclick=()=>{if(confirm('Throw away your edits and go back to the seed plan?')){state=fresh();try{localStorage.removeItem(KEY)}catch(e){}paint();}};
document.getElementById('relIn').onchange=e=>{state.rel=e.target.value;save();};
document.getElementById('altIn').onchange=e=>{state.alt=e.target.value;save();};
document.getElementById('shift').onclick=()=>{const n=+prompt('Shift every unfinished task by how many days? (negative = earlier)','1');if(!n)return;for(const t of state.tasks)if(t.status!=='done')t.date=d2s(new Date(s2d(t.date).getTime()+DAYMS*n));save();};
function flash(m){const s=document.getElementById('st');const o=s.innerHTML;s.innerHTML=`<span class="ok">${m}</span>`;setTimeout(()=>paint(),1800);}
paint();
