'use strict';
const QUEUE_PREFIX='geo_cloud_events_v1_';
const MIGRATION_PREFIX='geo_cloud_migrated_v1_';
const LAST_USER_KEY='geo_cloud_last_uid_v1';
const SESSION_MODE_KEY='geo_cloud_session_mode_v1';
const GUEST_QUEUE_KEY='geo_cloud_guest_events_v1';
const SDK_BASE='https://www.gstatic.com/firebasejs/13.2.0/';
function deepCopy(x){return JSON.parse(JSON.stringify(x));}
function emptyState(){return {records:{},marks:{},history:[],answered:0,correct:0};}
function isNonempty(data){return !!(data?.answered||Object.keys(data?.records||{}).length||Object.keys(data?.marks||{}).length||(data?.history||[]).length);}
function mergeLegacy(base,old){
  if(!old||typeof old!=='object')return base;
  base.answered+=(Number(old.answered)||0);
  base.correct+=(Number(old.correct)||0);
  for(const [k,v] of Object.entries(old.records||{})){
    if(!v||typeof v!=='object')continue;
    const current=base.records[k]||{attempts:0,wrong:0,mastered:false,lastWrong:''};
    current.attempts+=(Number(v.attempts)||0);
    current.wrong+=(Number(v.wrong)||0);
    const currentLatest=Math.max(Date.parse(current.lastWrong||'')||0,Date.parse(current.masteredAt||'')||0);
    const importedLatest=Math.max(Date.parse(v.lastWrong||'')||0,Date.parse(v.masteredAt||'')||0);
    if(importedLatest>=currentLatest){current.mastered=!!v.mastered;current.masteredAt=v.masteredAt||'';}
    if((v.lastWrong||'')>(current.lastWrong||''))current.lastWrong=v.lastWrong;
    base.records[k]=current;
  }
  for(const [k,v] of Object.entries(old.marks||{}))if(v)base.marks[k]=true;
  base.history=[...(base.history||[]),...(old.history||[])].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,200);
  return base;
}
export function applyEvent(state,event){
  const at=event.at||new Date(0).toISOString();
  if(event.type==='reset')return emptyState();
  if(event.type==='replace')return {...emptyState(),...deepCopy(event.data||{})};
  if(event.type==='import')return mergeLegacy(state,event.data);
  if(event.type==='mark'){
    if(event.checked)state.marks[event.key]=true;
    else delete state.marks[event.key];
  }
  if(event.type==='master'){
    delete state.marks[event.key];
    const rec=state.records[event.key];
    if(rec){rec.mastered=!!event.mastered;if(rec.mastered)rec.masteredAt=at;}
  }
  if(event.type==='grade'){
    let correct=0;
    const rows=Array.isArray(event.rows)?event.rows:[];
    for(const row of rows){
      if(!row?.key)continue;
      const rec=state.records[row.key]||{attempts:0,wrong:0,mastered:false,lastWrong:''};
      rec.attempts++;
      state.answered++;
      if(row.good){
        state.correct++;correct++;
        if(rec.wrong>0){rec.mastered=true;rec.masteredAt=at;}
      }else{rec.wrong++;rec.mastered=false;rec.lastWrong=at;}
      state.records[row.key]=rec;
    }
    state.history.unshift({date:at,correct,answered:rows.length,unanswered:event.unanswered||0,tables:event.tables||[]});
    state.history=state.history.slice(0,200);
  }
  return state;
}
export function rebuildState(events){
  const sorted=[...events].sort((a,b)=>(Number(a.time)||0)-(Number(b.time)||0)||String(a.id).localeCompare(String(b.id)));
  let current=emptyState();
  const seen=new Set();
  for(const event of sorted){if(!event.id||seen.has(event.id))continue;seen.add(event.id);current=applyEvent(current,event);}
  return current;
}
if(typeof window!=='undefined')startCloud();
async function startCloud(){
  const app=window.StudyApp,login=document.getElementById('cloudLogin'),logout=document.getElementById('cloudLogout');
  const status=document.getElementById('cloudState'),userText=document.getElementById('cloudUser'),badge=document.getElementById('cloudBadge');
  function show(text,label='ローカル学習モード'){status.textContent=text;badge.textContent=label;}
  const config=window.GEO_FIREBASE_CONFIG;
  if(!app||!config||!config.apiKey||!config.projectId||!config.appId||Object.values(config).some(v=>String(v).includes('YOUR_')||String(v).includes('PASTE_'))){
    show('クラウド未設定です。付属のREADMEに従ってFirebaseを設定してください。保存はこの端末のみです。');
    return;
  }
  show('Firebaseへ接続中…','接続準備中');
  let firebaseApp,auth,db,collection,doc,onSnapshot,setDoc,signInWithPopup,signOut,GoogleAuthProvider,onAuthStateChanged;
  try{
    const [core,authentication,firestore]=await Promise.all([
      import(SDK_BASE+'firebase-app.js'),import(SDK_BASE+'firebase-auth.js'),import(SDK_BASE+'firebase-firestore.js')
    ]);
    firebaseApp=core.initializeApp(config);
    auth=authentication.getAuth(firebaseApp);
    db=firestore.getFirestore(firebaseApp);
    ({signInWithPopup,signOut,GoogleAuthProvider,onAuthStateChanged}=authentication);
    ({collection,doc,onSnapshot,setDoc}=firestore);
  }catch(error){show('Firebaseの初期化に失敗しました。ネットワークと設定を確認してください。'+error.message,'接続失敗');return;}
  let uid=null,remoteEvents=[],remoteIds=new Set(),committedIds=new Set(),loaded=false,unsub=null,flushing=false,serverError='';
  const queueKey=id=>QUEUE_PREFIX+id;
  function readQueue(id){try{return JSON.parse(localStorage.getItem(queueKey(id))||'[]');}catch{return [];}}
  function writeQueue(id,list){try{localStorage.setItem(queueKey(id),JSON.stringify(list));}catch{show('ローカル領域に同期待ちの記録を書き込めません。手動バックアップを取ってください。','保存できません');}}
  function updateStatus(){
    if(!uid){show('Googleログインすると記録をクラウドへ自動保存します。','未ログイン');return;}
    if(serverError){show('同期エラー：'+serverError+'　ローカル保存は継続します。','同期エラー');return;}
    const n=readQueue(uid).length;
    if(!loaded){show('クラウドの学習記録を取得しています…','読み込み中');return;}
    show(n?`同期待ち ${n} 件。ネットに接続すると自動再送します。`:'クラウドに保存済み。別端末にも自動反映されます。',n?'同期待ち':'同期済み');
  }
  function recompute(){
    if(!uid||!loaded)return;
    const local=readQueue(uid).filter(e=>!remoteIds.has(e.id));
    app.setState(rebuildState([...remoteEvents,...local]));
    updateStatus();
  }
  function eventId(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random().toString(36).slice(2);}
  function readGuestQueue(){try{return JSON.parse(localStorage.getItem(GUEST_QUEUE_KEY)||'[]');}catch{return [];}}
  function guestEvent(detail){const list=readGuestQueue();list.push({...deepCopy(detail),id:eventId(),time:Date.now(),at:detail.at||new Date().toISOString()});try{localStorage.setItem(GUEST_QUEUE_KEY,JSON.stringify(list));}catch{show('端末内の学習履歴を保存できません。バックアップしてください。','保存失敗');}}
  function queueEvent(detail){
    if(!uid)return;
    const item={...deepCopy(detail),id:detail.id||eventId(),time:detail.time||Date.now(),at:detail.at||new Date().toISOString()};
    const queue=readQueue(uid);queue.push(item);writeQueue(uid,queue);
    recompute();flush();
  }
  async function flush(){
    if(!uid||flushing)return;
    flushing=true;
    const currentUid=uid;
    try{
      for(const item of readQueue(currentUid)){
        if(uid!==currentUid)break;
        if(committedIds.has(item.id))continue;
        await setDoc(doc(db,'users',currentUid,'events',item.id),item);
      }
      serverError='';
    }catch(error){serverError=error.code==='permission-denied'?'Firestoreの権限が拒否されました。セキュリティルールとGoogleアカウントを確認してください。':(error.message||String(error));}
    finally{flushing=false;updateStatus();}
  }
  function handleSnapshot(snap){
    if(snap.metadata.fromCache&&snap.empty){show('接続待ちです。端末内の学習記録を保持しています。オンラインになると同期します。','オフライン');return;}
    remoteEvents=snap.docs.map(x=>({id:x.id,...x.data()}));
    remoteIds=new Set(remoteEvents.map(x=>x.id));
    if(!snap.metadata.fromCache){
      committedIds=new Set(snap.docs.filter(x=>!x.metadata.hasPendingWrites).map(x=>x.id));
      const waiting=readQueue(uid).filter(x=>!committedIds.has(x.id));
      writeQueue(uid,waiting);
    }
    loaded=true;serverError='';recompute();flush();
  }
  login.disabled=false;
  login.addEventListener('click',async()=>{
    login.disabled=true;show('Googleログイン画面を開いています…','ログイン処理中');
    try{await signInWithPopup(auth,new GoogleAuthProvider());}
    catch(e){show('ログインできませんでした：'+(e.code||e.message)+ '。GitHub Pagesのドメイン許可も確認してください。','ログイン失敗');}
    finally{login.disabled=false;}
  });
  logout.addEventListener('click',async()=>{try{await signOut(auth);}catch(e){show('ログアウトに失敗しました：'+e.message,'エラー');}});
  onAuthStateChanged(auth,async user=>{
    if(unsub){unsub();unsub=null;}
    uid=null;loaded=false;remoteEvents=[];remoteIds.clear();committedIds.clear();serverError='';app.onEvent=null;
    if(!user){
      userText.textContent='';login.hidden=false;logout.hidden=true;
      if(localStorage.getItem(SESSION_MODE_KEY)==='user')app.setState(emptyState());
      localStorage.setItem(SESSION_MODE_KEY,'guest');app.onEvent=guestEvent;
      updateStatus();return;
    }
    const previous=localStorage.getItem(LAST_USER_KEY);
    const original=app.getState();
    uid=user.uid;login.hidden=true;logout.hidden=false;userText.textContent=`ログイン：${user.email||'Googleアカウント'}`;
    if(previous&&previous!==uid)app.setState(emptyState());
    const migratedKey=MIGRATION_PREFIX+uid;
    const guestQueue=readGuestQueue();
    if(!guestQueue.length&&!previous&&!localStorage.getItem(migratedKey)&&isNonempty(original)){
      queueEvent({type:'import',data:original,at:new Date().toISOString()});
      localStorage.setItem(migratedKey,'1');
    }
    for(const guest of guestQueue)queueEvent(guest);
    if(guestQueue.length)localStorage.removeItem(GUEST_QUEUE_KEY);
    localStorage.setItem(LAST_USER_KEY,uid);
    localStorage.setItem(SESSION_MODE_KEY,'user');
    app.onEvent=queueEvent;
    updateStatus();
    unsub=onSnapshot(collection(db,'users',uid,'events'),{includeMetadataChanges:true},handleSnapshot,error=>{
      serverError=error.code==='permission-denied'?'本人以外は保存できない設定です。Firestoreのルールとログイン中のメールを確認してください。':error.message;
      updateStatus();
    });
    flush();
  },error=>{show('認証の初期化に失敗しました：'+error.message,'認証エラー');});
  window.addEventListener('online',()=>{if(uid)flush();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&uid)flush();});
}
