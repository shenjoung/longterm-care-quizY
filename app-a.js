let QUESTIONS=[];
const STORAGE_KEY='care-quiz-progress-v1',QUESTION_COUNT=202,SESSION_SIZE=50,CYCLE_LENGTH=5,PASS_SCORE=45,circled=['①','②','③','④'];
const main=document.getElementById('appMain'),homeButton=document.getElementById('homeButton'),headerAction=document.getElementById('headerAction');
let store=loadStore(),session=null;
async function loadQuestions(){try{const files=['data/questions-1.txt','data/questions-2.txt','data/questions-3.txt'];const res=await Promise.all(files.map(f=>fetch(f,{cache:'no-cache'})));if(res.some(r=>!r.ok))throw Error('load');const source=(await Promise.all(res.map(r=>r.text()))).join('\n');QUESTIONS=source.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^\d+\.（[1-4]）/.test(x)).map(parseQuestionLine);if(QUESTIONS.length!==QUESTION_COUNT||QUESTIONS.some((q,i)=>q.id!==i+1))throw Error('ids');renderHome()}catch(e){main.innerHTML='<h1>題庫讀取失敗</h1><p class="subtitle">請確認 data/questions-1.txt、data/questions-2.txt、data/questions-3.txt 已經存在。</p>'}}
function parseQuestionLine(line){const m=line.match(/^(\d+)\.（([1-4])）([\s\S]+)$/);if(!m)throw Error('format');const body=m[3],marks=['①','②','③','④'],pos=marks.map(x=>body.indexOf(x));if(pos.some(x=>x<0))throw Error('options');return{id:+m[1],answer:+m[2],question:body.slice(0,pos[0]).trim(),options:pos.map((p,i)=>body.slice(p+1,i===3?body.length:pos[i+1]).replace(/。$/,'').trim())}}
function defaultCycle(){return{number:1,index:1,seen:[]}}
function defaultStore(){return{version:1,records:{},exams:[],cycles:{exam:defaultCycle(),practice:defaultCycle()},updatedAt:Date.now()}}
function normCycle(v){return v&&Array.isArray(v.seen)?{number:+(v.number||1),index:+(v.index||1),seen:v.seen.map(Number).filter(Boolean)}:defaultCycle()}
function loadStore(){try{const p=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!p||p.version!==1||!p.records)return defaultStore();const s={...defaultStore(),...p,exams:Array.isArray(p.exams)?p.exams:[]};s.cycles={exam:normCycle(p.cycles?.exam||p.examCycle),practice:normCycle(p.cycles?.practice||p.practiceCycle)};return s}catch{return defaultStore()}}
function saveStore(){store.updatedAt=Date.now();localStorage.setItem(STORAGE_KEY,JSON.stringify(store))}
function blankRecord(){return{attempts:0,correct:0,wrong:0,streak:0,level:0,nextReview:0,lastAnswered:0,repeatedWrong:0,wrongDates:[]}}
function recordFor(id){return{...blankRecord(),...(store.records[id]||{})}}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function shuffle(a){const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
function cycleFor(group){store.cycles=store.cycles||{exam:defaultCycle(),practice:defaultCycle()};store.cycles[group]=store.cycles[group]||defaultCycle();const c=store.cycles[group];if(c.index>CYCLE_LENGTH)store.cycles[group]={number:(c.number||1)+1,index:1,seen:[]};return store.cycles[group]}
function cycleStats(group){const c=store.cycles?.[group]||defaultCycle();return{index:Math.min(c.index,CYCLE_LENGTH),finished:c.index>CYCLE_LENGTH,seen:new Set(c.seen||[]).size,number:c.number||1}}
function stats(){const r=Object.values(store.records),now=Date.now();return{practiced:r.filter(x=>x.attempts>0).length,wrong:r.filter(x=>x.wrong>0&&x.streak<2).length,repeatedWrong:r.filter(x=>x.wrong>=2).length,due:r.filter(x=>x.attempts>0&&x.nextReview<=now&&x.level<4).length,mastered:r.filter(x=>x.level>=4).length,exams:store.exams.length,examCycle:cycleStats('exam'),practiceCycle:cycleStats('practice')}}
