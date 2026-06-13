import { useState, useEffect } from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, Plus, Trash2, Edit3, Search, X, Bell, Calendar, Tag, Download } from 'lucide-react';

const ACCENT = '#f59e0b';
const SK = 'ddm_docs_v1';
const SS = 'ddm_settings_v1';
const SO = 'ddm_onboarded_v1';

type Status = 'expired' | 'critical' | 'warning' | 'safe';
type Page = 'dashboard' | 'documents' | 'calendar' | 'settings' | 'help';

interface Doc {
  id: string; name: string; category: string; expiryDate: string;
  renewalSteps: string[]; notes: string; tags: string[]; priority: 'high'|'medium'|'low';
  isSample?: boolean;
}

function ld<T>(k:string,fb:T):T{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}}
function sv<T>(k:string,v:T){localStorage.setItem(k,JSON.stringify(v));}
function uid(){return Math.random().toString(36).slice(2,10);}
function daysLeft(date:string):number{return Math.ceil((new Date(date).getTime()-Date.now())/86400000);}
function getStatus(d:Doc):Status{
  const days=daysLeft(d.expiryDate);
  if(days<0)return 'expired';
  if(days<=14)return 'critical';
  if(days<=60)return 'warning';
  return 'safe';
}

const CATEGORIES=['Identity','Insurance','Vehicle','Property','Professional','Health','Financial','Other'];

const SAMPLE_DOCS:Doc[]=[
  {id:'s1',name:'Passport',category:'Identity',expiryDate:new Date(Date.now()+5*86400000*1).toISOString().split('T')[0],renewalSteps:['Gather supporting documents','Complete application form DS-82','Submit at post office','Wait 8-11 weeks'],notes:'International travel document',tags:['urgent','travel'],priority:'high',isSample:true},
  {id:'s2',name:'Car Insurance',category:'Insurance',expiryDate:new Date(Date.now()+25*86400000).toISOString().split('T')[0],renewalSteps:['Compare quotes online','Contact current insurer','Confirm no claims bonus','Make payment'],notes:'Comprehensive cover – renewal quote due',tags:['vehicle'],priority:'high',isSample:true},
  {id:'s3',name:'Driving Licence',category:'Vehicle',expiryDate:new Date(Date.now()+180*86400000).toISOString().split('T')[0],renewalSteps:['Complete D1 form','Provide passport photo','Pay £14 fee','Post to DVLA'],notes:'Photo card expires every 10 years',tags:['driving'],priority:'medium',isSample:true},
  {id:'s4',name:'Home Insurance',category:'Insurance',expiryDate:new Date(Date.now()+90*86400000).toISOString().split('T')[0],renewalSteps:['Review current cover','Get 3 comparison quotes','Check flood/subsidence cover','Renew or switch'],notes:'Buildings + contents policy',tags:['property'],priority:'medium',isSample:true},
  {id:'s5',name:'Health Certificate',category:'Health',expiryDate:new Date(Date.now()-10*86400000).toISOString().split('T')[0],renewalSteps:['Book GP appointment','Complete medical form','Submit to employer','File copy'],notes:'Annual occupational health check',tags:['work','health'],priority:'high',isSample:true},
];

const TEMPLATES=[
  {name:'Passport',category:'Identity',renewalSteps:['Gather supporting documents','Complete application form','Submit at post office or embassy','Wait for processing']},
  {name:'Driving Licence',category:'Vehicle',renewalSteps:['Complete renewal form','Provide passport photo','Pay renewal fee','Submit to authority']},
  {name:'Vehicle Insurance',category:'Insurance',renewalSteps:['Compare market quotes','Contact current insurer','Confirm coverage details','Make payment']},
  {name:'Residence Card',category:'Identity',renewalSteps:['Book biometric appointment','Gather required documents','Pay government fee','Attend appointment']},
  {name:'Professional Certification',category:'Professional',renewalSteps:['Complete CPD requirements','Submit renewal application','Pay membership fee','Download certificate']},
];

export default function App() {
  const [docs,setDocs]=useState<Doc[]>(()=>ld(SK,[]));
  const [onboarded,setOnboarded]=useState(()=>ld(SO,false));
  const [page,setPage]=useState<Page>('dashboard');
  const [search,setSearch]=useState('');
  const [filterCat,setFilterCat]=useState('all');
  const [filterStatus,setFilterStatus]=useState<Status|'all'>('all');
  const [modal,setModal]=useState(false);
  const [editDoc,setEditDoc]=useState<Doc|null>(null);
  const [theme,setTheme]=useState(()=>ld(SS,{theme:'system'}).theme);
  const [form,setForm]=useState({name:'',category:'Identity',expiryDate:'',notes:'',priority:'medium' as Doc['priority'],tags:''});
  const [steps,setSteps]=useState<string[]>(['']);

  useEffect(()=>{sv(SK,docs);},[docs]);
  useEffect(()=>{
    const el=document.documentElement;
    if(theme==='dark')el.classList.add('dark');
    else if(theme==='light')el.classList.remove('dark');
    else{window.matchMedia('(prefers-color-scheme: dark)').matches?el.classList.add('dark'):el.classList.remove('dark');}
    sv(SS,{theme});
  },[theme]);

  const addDoc=(withSample:boolean)=>{
    if(withSample)setDocs(SAMPLE_DOCS);
    setOnboarded(true);sv(SO,true);
  };

  const openEdit=(d:Doc)=>{
    setEditDoc(d);
    setForm({name:d.name,category:d.category,expiryDate:d.expiryDate,notes:d.notes,priority:d.priority,tags:d.tags.join(', ')});
    setSteps(d.renewalSteps.length?d.renewalSteps:['']);
    setModal(true);
  };

  const openNew=(tpl?:typeof TEMPLATES[0])=>{
    setEditDoc(null);
    setForm({name:tpl?.name||'',category:tpl?.category||'Identity',expiryDate:'',notes:'',priority:'medium',tags:''});
    setSteps(tpl?.renewalSteps||['']);
    setModal(true);
  };

  const save=()=>{
    const d:Doc={
      id:editDoc?.id||uid(),name:form.name,category:form.category,expiryDate:form.expiryDate,
      notes:form.notes,priority:form.priority,
      renewalSteps:steps.filter(s=>s.trim()),
      tags:form.tags.split(',').map(t=>t.trim()).filter(Boolean),
    };
    setDocs(prev=>editDoc?prev.map(x=>x.id===editDoc.id?d:x):[d,...prev]);
    setModal(false);
  };

  const del=(id:string)=>setDocs(prev=>prev.filter(d=>d.id!==id));

  const exportCSV=()=>{
    const rows=docs.map(d=>[d.name,d.category,d.expiryDate,daysLeft(d.expiryDate),getStatus(d),d.priority].join(','));
    const csv='Name,Category,Expiry,DaysLeft,Status,Priority\n'+rows.join('\n');
    const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='documents.csv';a.click();
  };

  const filtered=docs.filter(d=>{
    const q=search.toLowerCase();
    const mq=!q||d.name.toLowerCase().includes(q)||d.category.toLowerCase().includes(q)||d.tags.some(t=>t.includes(q));
    const ms=filterStatus==='all'||getStatus(d)===filterStatus;
    const mc=filterCat==='all'||d.category===filterCat;
    return mq&&ms&&mc;
  });

  const stats={
    expired:docs.filter(d=>getStatus(d)==='expired').length,
    critical:docs.filter(d=>getStatus(d)==='critical').length,
    warning:docs.filter(d=>getStatus(d)==='warning').length,
    safe:docs.filter(d=>getStatus(d)==='safe').length,
    hasSample:docs.some(d=>d.isSample),
  };

  const statusColor=(s:Status)=>({expired:'text-red-600',critical:'text-orange-500',warning:'text-yellow-600',safe:'text-green-600'}[s]);
  const statusBg=(s:Status)=>({expired:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',critical:'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',warning:'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',safe:'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}[s]);
  const statusLabel=(s:Status)=>({expired:'Expired',critical:'Urgent',warning:'Due Soon',safe:'Safe'}[s]);

  if(!onboarded)return(
    <div className="min-h-screen bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-5xl">📄</div>
          <h1 className="text-3xl font-bold text-white mb-2">Document Deadline Manager</h1>
          <p className="text-amber-100">Never miss a passport, insurance, or permit renewal again.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={()=>addDoc(false)} className="bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-2xl p-6 text-left text-white transition-all">
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold">Start Empty</div>
            <div className="text-amber-200 text-sm mt-1">Add your own documents</div>
          </button>
          <button onClick={()=>addDoc(true)} className="bg-white rounded-2xl p-6 text-left transition-all hover:bg-amber-50">
            <div className="text-2xl mb-2">✨</div>
            <div className="font-semibold text-amber-700">Explore Sample Workspace</div>
            <div className="text-amber-600 text-sm mt-1">5 sample documents to explore</div>
            <div className="text-amber-400 text-xs mt-2">Clearly labelled · Remove anytime</div>
          </button>
        </div>
        <p className="text-center text-amber-200 text-xs mt-4">One-time paid app · No subscription · Fully unlocked</p>
      </div>
    </div>
  );

  const NavBtn=({id,label,icon:Icon}:{id:Page;label:string;icon:any})=>(
    <button onClick={()=>setPage(id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${page===id?'text-white':'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`} style={page===id?{backgroundColor:ACCENT}:{}}>
      <Icon size={16}/>{label}
    </button>
  );

  return(
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{backgroundColor:ACCENT}}>📄</div>
          <nav className="flex items-center gap-1">
            <NavBtn id="dashboard" label="Dashboard" icon={FileText}/>
            <NavBtn id="documents" label="Documents" icon={Bell}/>
            <NavBtn id="calendar" label="Calendar" icon={Calendar}/>
            <NavBtn id="settings" label="Settings" icon={Tag}/>
            <NavBtn id="help" label="Help" icon={CheckCircle}/>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {(stats.expired+stats.critical)>0&&<span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{stats.expired+stats.critical} urgent</span>}
          <button onClick={()=>setTheme((t:string)=>t==='dark'?'light':'dark')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            {theme==='dark'?'☀️':'🌙'}
          </button>
          <button onClick={()=>openNew()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{backgroundColor:ACCENT}}>
            <Plus size={16}/>Add Document
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* DASHBOARD */}
        {page==='dashboard'&&(<>
          {stats.hasSample&&(
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
              <span className="text-amber-700 dark:text-amber-400 text-sm">✦ Sample workspace loaded — explore with demo documents</span>
              <button onClick={()=>setDocs(prev=>prev.filter(d=>!d.isSample))} className="text-xs text-amber-600 underline">Remove samples</button>
            </div>
          )}
          <div className="grid grid-cols-4 gap-4">
            {[
              {label:'Expired',val:stats.expired,color:'red',icon:'🔴'},
              {label:'Urgent (<14d)',val:stats.critical,color:'orange',icon:'🟠'},
              {label:'Due Soon',val:stats.warning,color:'yellow',icon:'🟡'},
              {label:'Safe',val:stats.safe,color:'green',icon:'🟢'},
            ].map(s=>(
              <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.val}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Urgent items */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold">⚠️ Urgent & Expiring Soon</h2>
              <button onClick={()=>setPage('documents')} className="text-sm underline" style={{color:ACCENT}}>View all</button>
            </div>
            {docs.filter(d=>['expired','critical','warning'].includes(getStatus(d))).sort((a,b)=>daysLeft(a.expiryDate)-daysLeft(b.expiryDate)).slice(0,6).map(d=>{
              const days=daysLeft(d.expiryDate);
              const s=getStatus(d);
              return(
                <div key={d.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBg(s)}`}>{statusLabel(s)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.category} · Expires {d.expiryDate}</p>
                  </div>
                  <span className={`text-sm font-bold ${statusColor(s)}`}>{days<0?`${Math.abs(days)}d ago`:`${days}d`}</span>
                  <button onClick={()=>openEdit(d)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><Edit3 size={14}/></button>
                </div>
              );
            })}
            {docs.filter(d=>['expired','critical','warning'].includes(getStatus(d))).length===0&&(
              <div className="py-10 text-center text-gray-400">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-500"/>
                <p className="font-medium text-green-600">All documents are safe!</p>
              </div>
            )}
          </div>
          {/* Templates */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="font-semibold mb-4">Quick Add from Templates</h2>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map(t=>(
                <button key={t.name} onClick={()=>openNew(t)} className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5">
                  <Plus size={13}/>Add {t.name}
                </button>
              ))}
            </div>
          </div>
        </>)}

        {/* DOCUMENTS */}
        {page==='documents'&&(<>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2"/>
              {search&&<button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={13}/></button>}
            </div>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value as any)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
              <option value="all">All statuses</option>
              <option value="expired">Expired</option>
              <option value="critical">Urgent</option>
              <option value="warning">Due Soon</option>
              <option value="safe">Safe</option>
            </select>
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
              <option value="all">All categories</option>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm hover:bg-gray-50">
              <Download size={14}/>Export CSV
            </button>
          </div>
          {filtered.length===0?(
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📂</div>
              <p className="font-semibold text-lg">No documents found</p>
              <p className="text-gray-400 text-sm mt-1 mb-5">Add your first document to start tracking expiry dates.</p>
              <button onClick={()=>openNew()} className="px-5 py-2.5 rounded-xl text-white font-medium" style={{backgroundColor:ACCENT}}>Add Document</button>
            </div>
          ):(
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map(d=>{
                const days=daysLeft(d.expiryDate);
                const s=getStatus(d);
                return(
                  <div key={d.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{d.name}</span>
                        {d.isSample&&<span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">✦ Sample</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusBg(s)}`}>{statusLabel(s)}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{d.category}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Expires {d.expiryDate} · {d.renewalSteps.length} renewal steps</p>
                      {d.tags.length>0&&<div className="flex gap-1 mt-1">{d.tags.map(t=><span key={t} className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 rounded">#{t}</span>)}</div>}
                    </div>
                    <div className={`text-lg font-bold w-16 text-right ${statusColor(s)}`}>{days<0?`${Math.abs(days)}d ago`:`${days}d`}</div>
                    <div className="flex gap-1">
                      <button onClick={()=>openEdit(d)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><Edit3 size={15}/></button>
                      <button onClick={()=>del(d.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={15}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>)}

        {/* CALENDAR */}
        {page==='calendar'&&(
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Renewal Timeline</h2>
            {['This week','This month','Next 3 months','Later'].map(period=>{
              const periodDocs=docs.filter(d=>{
                const days=daysLeft(d.expiryDate);
                if(period==='This week')return days>=0&&days<=7;
                if(period==='This month')return days>7&&days<=30;
                if(period==='Next 3 months')return days>30&&days<=90;
                return days>90||days<0;
              }).sort((a,b)=>daysLeft(a.expiryDate)-daysLeft(b.expiryDate));
              if(!periodDocs.length)return null;
              return(
                <div key={period} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 font-semibold text-sm">{period} ({periodDocs.length})</div>
                  {periodDocs.map(d=>{
                    const s=getStatus(d);
                    return(
                      <div key={d.id} className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusBg(s)}`}>{statusLabel(s)}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-gray-400">{d.category} · {d.expiryDate}</p>
                        </div>
                        {d.renewalSteps.length>0&&(
                          <div className="text-right">
                            <p className="text-xs text-gray-400">{d.renewalSteps.length} steps</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">{d.renewalSteps[0]}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* SETTINGS */}
        {page==='settings'&&(
          <div className="max-w-lg space-y-5">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
              <h3 className="font-semibold">Appearance</h3>
              <div className="flex gap-3">
                {['light','dark','system'].map(t=>(
                  <button key={t} onClick={()=>setTheme(t)} className={`px-4 py-2 rounded-xl border text-sm capitalize ${theme===t?'text-white border-transparent':'border-gray-200 dark:border-gray-700'}`} style={theme===t?{backgroundColor:ACCENT}:{}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
              <h3 className="font-semibold">Sample Workspace</h3>
              <p className="text-sm text-gray-500">Load demo data to explore the app.</p>
              <div className="flex gap-3">
                <button onClick={()=>setDocs(prev=>{const f=prev.filter(d=>!d.isSample);return[...f,...SAMPLE_DOCS];})} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50">Load Sample Data</button>
                {stats.hasSample&&<button onClick={()=>setDocs(prev=>prev.filter(d=>!d.isSample))} className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">Remove Sample Data</button>}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-gray-500">Document Deadline Manager · v1.0</p>
              <p className="text-sm text-green-600 mt-1">✓ One-time paid app · No subscription · Fully unlocked</p>
            </div>
          </div>
        )}

        {/* HELP */}
        {page==='help'&&(
          <div className="max-w-2xl space-y-3">
            {[
              ['How do I add a document?','Click the "Add Document" button, fill in the name, category, and expiry date. Add renewal steps to remind yourself what actions to take.'],
              ['What do the status colours mean?','Red = Expired, Orange = Expires within 14 days (Urgent), Yellow = Expires within 60 days (Due Soon), Green = Safe (>60 days).'],
              ['What are renewal steps?','A numbered checklist of actions you need to take to renew the document, e.g. "Book appointment", "Gather documents", "Submit form".'],
              ['Can I export my documents?','Yes — use the Export CSV button on the Documents page to download a spreadsheet of all your documents.'],
              ['What is sample data?','Demo documents preloaded to help you explore the app. Clearly labelled and removable from Settings anytime.'],
            ].map(([q,a],i)=>(
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                <p className="font-medium text-sm mb-1">{q}</p>
                <p className="text-sm text-gray-500">{a}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL */}
      {modal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setModal(false)}/>
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{editDoc?'Edit Document':'Add Document'}</h3>
              <button onClick={()=>setModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><X size={18}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Document Name *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Passport" className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none">
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value as Doc['priority']}))} className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Expiry Date *</label>
                <input type="date" value={form.expiryDate} onChange={e=>setForm(f=>({...f,expiryDate:e.target.value}))} className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Renewal Steps</label>
                {steps.map((s,i)=>(
                  <div key={i} className="flex gap-2 mb-2">
                    <span className="text-xs text-gray-400 mt-2.5 w-4">{i+1}.</span>
                    <input value={s} onChange={e=>{const ns=[...steps];ns[i]=e.target.value;setSteps(ns);}} placeholder={`Step ${i+1}`} className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none"/>
                    {steps.length>1&&<button onClick={()=>setSteps(steps.filter((_,j)=>j!==i))} className="p-1.5 text-gray-400 hover:text-red-500"><X size={14}/></button>}
                  </div>
                ))}
                <button onClick={()=>setSteps([...steps,''])} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mt-1">
                  <Plus size={13}/>Add step
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tags (comma separated)</label>
                <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="e.g. travel, urgent" className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none resize-none"/>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={()=>setModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm">Cancel</button>
                <button onClick={save} disabled={!form.name||!form.expiryDate} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50" style={{backgroundColor:ACCENT}}>Save Document</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
