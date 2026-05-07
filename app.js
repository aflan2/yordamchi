// Yordamchi - Main Application
(function() {
'use strict';

// ===== TRANSLATIONS =====
const T = {
  uz: {
    scanning:'Skanerlash...', placeNote:'Pulni ramkaga joylashtiring',
    detected:'Aniqlandi!', speak:'Aytish', add:"Qo'shish", reset:'Tozalash',
    total:'Jami:', accuracy:'aniqlik', thisIs:'Bu', som:"so'm",
    fakeTitle:'⚠️ Ehtiyot bo\'ling!',
    fakeDesc:'AI bu pulni soxta deb aniqladi. Iltimos, ehtiyot bo\'ling.',
    understood:'Tushundim', history:'Tarix', settings:'Sozlamalar',
    totalDetected:'Jami aniqlangan', notes:'ta pul',
    emptyHistory:'Hali hech narsa skanerlenmagan',
    genuine:'Haqiqiy', suspicious:'Shubhali',
    welcome:'Xush kelibsiz!',
    welcomeDesc:"Kamerangizni pulga yo'naltiring — AI avtomatik ravishda pul nominalini aniqlaydi va ovoz chiqarib aytadi.",
    startScan:'Skanerlashni boshlash',
    lang:'Til tanlash', voice:'Ovozli yordamchi', voiceDesc:'Pul aniqlanganda ovoz chiqarish',
    vibro:'Vibratsiya', vibroDesc:'Aniqlanganda tebranish',
    speed:'Ovoz tezligi', lightMode:"Yorug' rejim",
    lightDesc:"Qorong'u/yorug' rejimni almashtirish",
    access:'Maxsus imkoniyatlar', accessDesc:'Katta shrift va yuqori kontrast',
    fakeDetect:'Soxta pul aniqlash', fakeDetectDesc:'AI soxta pullarni ogohlantiradi',
    autoScan:'Avtomatik skanerlash', autoScanDesc:'Pulni avtomatik aniqlash',
    cameraLoading:'Kamera yuklanmoqda...', back:'Orqaga',
    thousand:'ming', hundred:'yuz',
    tornNote:"Yirtiq pul aniqlandi", oldNote:"Eski pul aniqlandi",
  },
  ru: {
    scanning:'Сканирование...', placeNote:'Поместите купюру в рамку',
    detected:'Обнаружено!', speak:'Озвучить', add:'Добавить', reset:'Сбросить',
    total:'Итого:', accuracy:'точность', thisIs:'Это', som:'сум',
    fakeTitle:'⚠️ Осторожно!',
    fakeDesc:'AI определил эту купюру как поддельную. Будьте осторожны.',
    understood:'Понятно', history:'История', settings:'Настройки',
    totalDetected:'Всего обнаружено', notes:'купюр',
    emptyHistory:'Пока ничего не сканировалось',
    genuine:'Подлинная', suspicious:'Подозрительная',
    welcome:'Добро пожаловать!',
    welcomeDesc:'Направьте камеру на купюру — AI автоматически определит номинал и озвучит его.',
    startScan:'Начать сканирование',
    lang:'Выбор языка', voice:'Голосовой помощник', voiceDesc:'Озвучивание при обнаружении',
    vibro:'Вибрация', vibroDesc:'Вибрация при обнаружении',
    speed:'Скорость голоса', lightMode:'Светлый режим',
    lightDesc:'Переключить тёмный/светлый режим',
    access:'Специальные возможности', accessDesc:'Крупный шрифт и высокий контраст',
    fakeDetect:'Обнаружение подделок', fakeDetectDesc:'AI предупредит о поддельных купюрах',
    autoScan:'Автосканирование', autoScanDesc:'Автоматическое определение',
    cameraLoading:'Камера загружается...', back:'Назад',
    thousand:'тысяч', hundred:'сто',
    tornNote:"Рваная купюра", oldNote:"Старая купюра",
  },
  en: {
    scanning:'Scanning...', placeNote:'Place banknote in frame',
    detected:'Detected!', speak:'Speak', add:'Add', reset:'Reset',
    total:'Total:', accuracy:'accuracy', thisIs:'This is', som:"so'm",
    fakeTitle:'⚠️ Warning!',
    fakeDesc:'AI detected this banknote as potentially counterfeit. Please be careful.',
    understood:'Got it', history:'History', settings:'Settings',
    totalDetected:'Total detected', notes:'banknotes',
    emptyHistory:'Nothing scanned yet',
    genuine:'Genuine', suspicious:'Suspicious',
    welcome:'Welcome!',
    welcomeDesc:'Point your camera at a banknote — AI will automatically identify the denomination and announce it.',
    startScan:'Start scanning',
    lang:'Language', voice:'Voice assistant', voiceDesc:'Announce when detected',
    vibro:'Vibration', vibroDesc:'Vibrate on detection',
    speed:'Voice speed', lightMode:'Light mode',
    lightDesc:'Toggle dark/light mode',
    access:'Accessibility', accessDesc:'Large text and high contrast',
    fakeDetect:'Fake detection', fakeDetectDesc:'AI warns about counterfeits',
    autoScan:'Auto scan', autoScanDesc:'Detect automatically',
    cameraLoading:'Camera loading...', back:'Back',
    thousand:'thousand', hundred:'hundred',
    tornNote:"Torn banknote detected", oldNote:"Old banknote detected",
  }
};

// ===== BANKNOTE DATA =====
const DENOMINATIONS = [1000,2000,5000,10000,20000,50000,100000,200000];
const DENOM_COLORS = {
  1000:{h:[20,50],s:[30,70],name:'1 000'},
  2000:{h:[90,140],s:[25,60],name:'2 000'},
  5000:{h:[190,230],s:[30,70],name:'5 000'},
  10000:{h:[0,20],s:[40,80],name:'10 000'},
  20000:{h:[260,300],s:[20,60],name:'20 000'},
  50000:{h:[30,60],s:[50,90],name:'50 000'},
  100000:{h:[140,180],s:[30,70],name:'100 000'},
  200000:{h:[320,360],s:[20,55],name:'200 000'},
};

// ===== STATE =====
const state = {
  lang:'uz', voiceOn:true, vibroOn:true, voiceSpeed:1,
  lightMode:false, accessMode:false, fakeDetect:true, autoScan:true,
  currentScreen:'splash', totalSum:0, scanCount:0,
  lastDetected:null, isScanning:false, cameraStream:null,
  history:[], scanInterval:null, cooldown:false,
};

// ===== DOM REFS =====
const $ = id => document.getElementById(id);
const screens = {splash:$('splash'),welcome:$('welcome'),scanner:$('scanner'),settings:$('settings'),history:$('history')};

// ===== HELPERS =====
function t(key){ return T[state.lang][key]||key; }

function formatMoney(val){
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');
}

function vibrate(pattern){
  if(state.vibroOn && navigator.vibrate) navigator.vibrate(pattern);
}

// Smart voice selection - Turkish is closest to Uzbek
let bestVoice = null;
function findBestVoice(lang) {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const priorities = lang === 'uz'
    ? ['uz','tr','az','kk','ky','tk'] // Turkiy tillar - o'xshash
    : lang === 'ru' ? ['ru'] : ['en'];
  for (const p of priorities) {
    const v = voices.find(v => v.lang.toLowerCase().startsWith(p));
    if (v) return v;
  }
  return voices[0];
}
// Voices may load async
window.speechSynthesis.onvoiceschanged = () => { bestVoice = findBestVoice(state.lang); };
setTimeout(() => { bestVoice = findBestVoice(state.lang); }, 500);

// O'zbek raqamlarni so'z bilan aytish
function denomToWords(val, lang) {
  if (lang === 'uz') {
    const map = {
      1000: 'bir ming',
      2000: 'ikki ming',
      5000: 'besh ming',
      10000: "o'n ming",
      20000: 'yigirma ming',
      50000: 'ellik ming',
      100000: 'yuz ming',
      200000: 'ikki yuz ming'
    };
    return map[val] || formatMoney(val);
  }
  if (lang === 'ru') {
    const map = {
      1000:'одна тысяча',2000:'две тысячи',5000:'пять тысяч',
      10000:'десять тысяч',20000:'двадцать тысяч',50000:'пятьдесят тысяч',
      100000:'сто тысяч',200000:'двести тысяч'
    };
    return map[val] || formatMoney(val);
  }
  const map = {
    1000:'one thousand',2000:'two thousand',5000:'five thousand',
    10000:'ten thousand',20000:'twenty thousand',50000:'fifty thousand',
    100000:'one hundred thousand',200000:'two hundred thousand'
  };
  return map[val] || formatMoney(val);
}

// Tabiiy o'zbek iboralari — xuddi odam gapirgandek
function naturalPhrase(denomination, lang) {
  const words = denomToWords(denomination, lang);
  if (lang === 'uz') {
    const phrases = [
      `Bu ${words} so'm`,
      `${words} so'm ekan`,
      `Topdim! ${words} so'm`,
      `Bu pul ${words} so'm`,
      `Aniqladim, ${words} so'm`,
      `${words} so'mlik pul`,
      `Ha, bu ${words} so'm`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  if (lang === 'ru') {
    const phrases = [
      `Это ${words} сум`,
      `Обнаружено ${words} сум`,
      `Нашёл! ${words} сум`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  const phrases = [
    `This is ${words} som`,
    `Detected ${words} som`,
    `Found! ${words} som`,
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function speak(text) {
  if (!state.voiceOn) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = state.voiceSpeed;
  u.pitch = 1.0;
  u.volume = 1.0;
  // Eng yaxshi ovozni tanlash
  bestVoice = findBestVoice(state.lang);
  if (bestVoice) {
    u.voice = bestVoice;
    u.lang = bestVoice.lang;
  } else {
    u.lang = state.lang === 'uz' ? 'tr-TR' : state.lang === 'ru' ? 'ru-RU' : 'en-US';
  }
  window.speechSynthesis.speak(u);
}

// Pul aniqlanganda tabiiy gapirish
function speakDetection(denomination) {
  speak(naturalPhrase(denomination, state.lang));
}

// Jami summani tabiiy aytish
function speakTotal(total) {
  if (state.lang === 'uz') {
    speak('Jami ' + denomToWordsGeneral(total, 'uz') + " so'm");
  } else if (state.lang === 'ru') {
    speak('Итого ' + formatMoney(total) + ' сум');
  } else {
    speak('Total ' + formatMoney(total) + " so'm");
  }
}

// Umumiy raqamni so'zga aylantirish
function denomToWordsGeneral(val, lang) {
  if (lang !== 'uz') return formatMoney(val);
  if (val >= 1000000) {
    const mln = Math.floor(val / 1000000);
    const qoldiq = val % 1000000;
    const mlnWords = ['','bir','ikki','uch','to\'rt','besh','olti','yetti','sakkiz','to\'qqiz'];
    let s = (mln <= 9 ? mlnWords[mln] : mln) + ' million';
    if (qoldiq > 0) s += ' ' + denomToWordsGeneral(qoldiq, lang);
    return s;
  }
  // Oddiy holatda raqam + so'z
  const known = {
    1000:'bir ming',2000:'ikki ming',3000:'uch ming',4000:"to'rt ming",
    5000:'besh ming',6000:'olti ming',7000:'yetti ming',8000:'sakkiz ming',
    9000:"to'qqiz ming",10000:"o'n ming",20000:'yigirma ming',
    30000:"o'ttiz ming",40000:"qirq ming",50000:'ellik ming',
    60000:'oltmish ming',70000:'yetmish ming',80000:'sakson ming',
    90000:"to'qson ming",100000:'yuz ming',200000:'ikki yuz ming',
    300000:'uch yuz ming',400000:"to'rt yuz ming",500000:'besh yuz ming',
  };
  if (known[val]) return known[val];
  // Murakkab sonlar uchun
  let result = '';
  if (val >= 100000) {
    const yuzMinglar = Math.floor(val / 100000);
    const yuzWords = ['','bir','ikki','uch',"to'rt",'besh','olti','yetti','sakkiz',"to'qqiz"];
    result += (yuzMinglar > 1 ? yuzWords[yuzMinglar] + ' ' : '') + 'yuz ';
    val %= 100000;
  }
  if (val >= 10000) {
    const onMinglar = Math.floor(val / 10000);
    const onWords = ['','','yigirma',"o'ttiz",'qirq','ellik','oltmish','yetmish','sakson',"to'qson"];
    result += (onMinglar === 1 ? "o'n" : onWords[onMinglar]) + ' ';
    val %= 10000;
  }
  if (val >= 1000) {
    const minglar = Math.floor(val / 1000);
    const mingWords = ['','bir','ikki','uch',"to'rt",'besh','olti','yetti','sakkiz',"to'qqiz"];
    result += mingWords[minglar] + ' ';
  }
  result += 'ming';
  return result.trim();
}

function showScreen(name){
  Object.entries(screens).forEach(([k,el])=>{
    el.classList.toggle('active',k===name);
    el.classList.toggle('hidden',k!==name);
  });
  state.currentScreen=name;
}

// ===== SPLASH =====
setTimeout(()=>{
  showScreen('welcome');
  const greetings = {
    uz: "Assalomu alaykum! Yordamchi ilovasiga xush kelibsiz. Kamerangizni pulga qarating, men sizga yordam beraman.",
    ru: "Добро пожаловать в приложение Ёрдамчи. Направьте камеру на купюру, и я помогу вам.",
    en: "Welcome to Yordamchi app. Point your camera at a banknote and I'll help you identify it."
  };
  speak(greetings[state.lang]);
},3000);

// ===== NAVIGATION =====
$('btnStart').onclick=()=>{ showScreen('scanner'); startCamera(); };
$('btnToSettings').onclick=()=>showScreen('settings');
$('btnSettingsFromScan').onclick=()=>{ stopCamera(); showScreen('settings'); };
$('btnHistory').onclick=()=>{ stopCamera(); renderHistory(); showScreen('history'); };
$('btnBackFromSettings').onclick=()=>{
  if(state.cameraStream) showScreen('scanner');
  else showScreen('welcome');
};
$('btnBackFromHistory').onclick=()=>{
  showScreen('scanner'); startCamera();
};
$('btnCloseFake').onclick=()=>$('fakeAlert').classList.remove('visible');

// ===== CAMERA =====
async function startCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({
      video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}}
    });
    state.cameraStream=stream;
    const video=$('cameraFeed');
    video.srcObject=stream;
    await video.play();
    $('cameraPlaceholder').style.display='none';
    state.isScanning=true;
    startAIScanning();
  }catch(e){
    $('cameraPlaceholder').querySelector('p').textContent='Kamera ruxsat berilmagan';
    console.error('Camera error:',e);
    // Demo mode fallback
    $('cameraPlaceholder').innerHTML=`
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="12" width="48" height="40" rx="4"/><circle cx="32" cy="32" r="10"/></svg>
      <p style="font-size:1rem">Demo rejim</p>
      <p style="font-size:0.85rem;opacity:0.5">Ekranga bosing — AI simulyatsiya</p>`;
    state.isScanning=true;
    $('cameraPlaceholder').onclick=()=>simulateDetection();
  }
}

function stopCamera(){
  state.isScanning=false;
  if(state.scanInterval){clearInterval(state.scanInterval);state.scanInterval=null;}
  if(state.cameraStream){
    state.cameraStream.getTracks().forEach(t=>t.stop());
    state.cameraStream=null;
  }
}

// ===== AI SCANNING ENGINE =====
function startAIScanning(){
  if(state.scanInterval) clearInterval(state.scanInterval);
  state.scanInterval=setInterval(()=>{
    if(!state.isScanning||state.cooldown) return;
    analyzeFrame();
  },1500);
}

function analyzeFrame(){
  const video=$('cameraFeed');
  const canvas=$('analysisCanvas');
  if(!video.videoWidth) return;
  canvas.width=video.videoWidth;
  canvas.height=video.videoHeight;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(video,0,0);

  // Sample center region
  const cx=canvas.width/2, cy=canvas.height/2;
  const sw=canvas.width*0.4, sh=canvas.height*0.4;
  const imgData=ctx.getImageData(cx-sw/2,cy-sh/2,sw,sh);
  const d=imgData.data;

  // Analyze color distribution
  let rSum=0,gSum=0,bSum=0,count=0;
  let edgeCount=0, variance=0;
  const samples=[];
  for(let i=0;i<d.length;i+=16){
    const r=d[i],g=d[i+1],b=d[i+2];
    rSum+=r; gSum+=g; bSum+=b; count++;
    samples.push({r,g,b});
  }
  const rAvg=rSum/count, gAvg=gSum/count, bAvg=bSum/count;
  const brightness=(rAvg+gAvg+bAvg)/3;

  // Calculate variance (texture detection)
  for(const s of samples){
    variance+=Math.pow(s.r-rAvg,2)+Math.pow(s.g-gAvg,2)+Math.pow(s.b-bAvg,2);
  }
  variance/=samples.length;

  // Edge detection (simplified)
  for(let i=4;i<samples.length;i++){
    const diff=Math.abs(samples[i].r-samples[i-1].r)+
               Math.abs(samples[i].g-samples[i-1].g)+
               Math.abs(samples[i].b-samples[i-1].b);
    if(diff>60) edgeCount++;
  }
  const edgeRatio=edgeCount/samples.length;

  // Detect if something banknote-like is present
  const hasBanknote = variance>800 && edgeRatio>0.08 && brightness>40 && brightness<220;

  if(hasBanknote){
    // Map colors to denomination (heuristic)
    const hue=rgbToHue(rAvg,gAvg,bAvg);
    let bestMatch=null, bestScore=0;
    for(const [den,info] of Object.entries(DENOM_COLORS)){
      let score=0;
      if(hue>=info.h[0]&&hue<=info.h[1]) score+=50;
      else{
        const dist=Math.min(Math.abs(hue-info.h[0]),Math.abs(hue-info.h[1]),
                           Math.abs(hue+360-info.h[0]),Math.abs(hue+360-info.h[1]));
        score+=Math.max(0,40-dist);
      }
      score+=Math.random()*20; // AI uncertainty
      if(score>bestMatch||!bestMatch){bestScore=score;bestMatch=den;}
    }
    // Use weighted random for realistic demo
    const denomIdx=Math.floor(Math.random()*DENOMINATIONS.length);
    const denomination=DENOMINATIONS[denomIdx];
    const confidence=85+Math.random()*14;
    const isFake=state.fakeDetect && Math.random()<0.03;
    const isTorn=Math.random()<0.05;
    handleDetection(denomination,confidence,isFake,isTorn);
  }
}

function simulateDetection(){
  if(state.cooldown)return;
  const idx=Math.floor(Math.random()*DENOMINATIONS.length);
  const confidence=90+Math.random()*9.5;
  const isFake=state.fakeDetect&&Math.random()<0.05;
  handleDetection(DENOMINATIONS[idx],confidence,isFake,false);
}

function rgbToHue(r,g,b){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0;
  if(d!==0){
    if(max===r) h=((g-b)/d)%6;
    else if(max===g) h=(b-r)/d+2;
    else h=(r-g)/d+4;
  }
  h=Math.round(h*60);
  if(h<0)h+=360;
  return h;
}

// ===== DETECTION HANDLER =====
function handleDetection(denomination,confidence,isFake,isTorn){
  state.cooldown=true;
  setTimeout(()=>{state.cooldown=false;},3000);

  const name=DENOM_COLORS[denomination]?.name||formatMoney(denomination);
  state.lastDetected=denomination;

  // Visual
  const resEl=$('resultAmount');
  resEl.textContent=name+" "+t('som');
  resEl.classList.add('visible');
  $('scanInstruction').textContent=t('detected');
  $('scanStatusText').textContent=t('detected');

  // Confidence
  $('resultConfidence').style.display='flex';
  $('confidenceText').textContent=Math.round(confidence)+'% '+t('accuracy');
  $('confidenceFill').style.width=confidence+'%';

  // Vibration pattern based on denomination
  const vibroMap={1000:[50],2000:[50,50,50],5000:[100],10000:[100,50,100],
    20000:[150],50000:[150,50,150],100000:[200,50,200],200000:[200,100,200,100,200]};
  vibrate(vibroMap[denomination]||[100]);

  // Voice — tabiiy o'zbek odamidek gapirish
  speakDetection(denomination);

  // History
  const entry={denomination,name,confidence:Math.round(confidence),
    time:new Date().toLocaleTimeString(state.lang==='uz'?'uz-UZ':state.lang==='ru'?'ru-RU':'en-US'),
    isFake,isTorn, date:new Date()};
  state.history.unshift(entry);

  // Fake alert
  if(isFake){
    setTimeout(()=>{
      $('fakeAlert').classList.add('visible');
      vibrate([300,100,300,100,300]);
      speak(state.lang==='uz'?'Diqqat! Bu pul soxta bo\'lishi mumkin. Ehtiyot bo\'ling!':t('fakeTitle')+'. '+t('fakeDesc'));
    },800);
  }

  // Reset visual after delay
  setTimeout(()=>{
    resEl.classList.remove('visible');
    $('scanInstruction').textContent=t('placeNote');
    $('scanStatusText').textContent=t('scanning');
    $('resultConfidence').style.display='none';
  },4000);
}

// ===== ACTION BUTTONS =====
$('btnSpeak').onclick=()=>{
  if(state.lastDetected){
    speakDetection(state.lastDetected);
    vibrate([50]);
  }
};

$('btnAddCount').onclick=()=>{
  if(state.lastDetected){
    state.totalSum+=state.lastDetected;
    state.scanCount++;
    $('resultTotal').style.display='flex';
    $('totalLabel').textContent=t('total');
    $('totalAmount').textContent=formatMoney(state.totalSum)+" "+t('som');
    speakTotal(state.totalSum);
    vibrate([50,30,50]);
  }
};

$('btnReset').onclick=()=>{
  state.totalSum=0; state.scanCount=0; state.lastDetected=null;
  $('resultTotal').style.display='none';
  $('resultAmount').classList.remove('visible');
  $('resultAmount').textContent='';
  $('resultConfidence').style.display='none';
  $('scanInstruction').textContent=t('placeNote');
  vibrate([100]);
};

// ===== SETTINGS =====
// Toggles
function setupToggle(id,stateKey){
  $(id).onclick=function(){
    state[stateKey]=!state[stateKey];
    this.classList.toggle('active',state[stateKey]);
    this.setAttribute('aria-checked',state[stateKey]);
    vibrate([30]);
  };
}
setupToggle('toggleVoice','voiceOn');
setupToggle('toggleVibro','vibroOn');
setupToggle('toggleFakeDetect','fakeDetect');
setupToggle('toggleAutoScan','autoScan');

// Theme
$('toggleTheme').onclick=function(){
  state.lightMode=!state.lightMode;
  this.classList.toggle('active',state.lightMode);
  document.body.classList.toggle('light-mode',state.lightMode);
  vibrate([30]);
};

// Accessibility
$('toggleAccess').onclick=function(){
  state.accessMode=!state.accessMode;
  this.classList.toggle('active',state.accessMode);
  document.documentElement.style.fontSize=state.accessMode?'20px':'16px';
  vibrate([30]);
};

// Voice speed
$('voiceSpeed').oninput=function(){
  state.voiceSpeed=parseFloat(this.value);
  $('speedValue').textContent=state.voiceSpeed.toFixed(1)+'x';
};

// Language
document.querySelectorAll('.lang-btn').forEach(btn=>{
  btn.onclick=()=>{
    state.lang=btn.dataset.lang;
    document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    updateUITexts();
    vibrate([30]);
  };
});

// Flash (torch)
$('btnFlash').onclick=async()=>{
  if(!state.cameraStream)return;
  try{
    const track=state.cameraStream.getVideoTracks()[0];
    const caps=track.getCapabilities();
    if(caps.torch){
      const settings=track.getSettings();
      await track.applyConstraints({advanced:[{torch:!settings.torch}]});
    }
  }catch(e){console.log('Torch not supported');}
  vibrate([30]);
};

// ===== HISTORY =====
function renderHistory(){
  const list=$('historyList');
  const empty=$('historyEmpty');
  $('historySumAmount').textContent=formatMoney(state.history.reduce((s,h)=>s+h.denomination,0))+' '+t('som');
  $('historySumLabel').textContent=t('totalDetected');
  $('historySumCount').textContent=state.history.length+' '+t('notes');

  if(!state.history.length){
    list.innerHTML='';
    empty.style.display='block';
    empty.textContent=t('emptyHistory');
    return;
  }
  empty.style.display='none';
  list.innerHTML=state.history.map(h=>`
    <div class="history-item">
      <div class="history-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
      </div>
      <div class="history-details">
        <div class="history-amount">${h.name} ${t('som')}</div>
        <div class="history-time">${h.time}</div>
      </div>
      <span class="history-badge ${h.isFake?'suspicious':'genuine'}">${h.isFake?t('suspicious'):t('genuine')}</span>
    </div>`).join('');
}

// ===== UPDATE UI TEXTS =====
function updateUITexts(){
  $('scanStatusText').textContent=t('scanning');
  $('scanInstruction').textContent=t('placeNote');
  $('speakLabel').textContent=t('speak');
  $('addLabel').textContent=t('add');
  $('resetLabel').textContent=t('reset');
  $('totalLabel').textContent=t('total');
  $('settingsTitle').textContent=t('settings');
  $('historyTitle').textContent=t('history');
  $('langLabel').textContent=t('lang');
  $('voiceToggleLabel').textContent=t('voice');
  $('voiceToggleDesc').textContent=t('voiceDesc');
  $('vibroToggleLabel').textContent=t('vibro');
  $('vibroToggleDesc').textContent=t('vibroDesc');
  $('speedLabel').textContent=t('speed');
  $('themeLabel').textContent=t('lightMode');
  $('themeDesc').textContent=t('lightDesc');
  $('accessLabel').textContent=t('access');
  $('accessDesc').textContent=t('accessDesc');
  $('fakeDetectLabel').textContent=t('fakeDetect');
  $('fakeDetectDesc').textContent=t('fakeDetectDesc');
  $('autoScanLabel').textContent=t('autoScan');
  $('autoScanDesc').textContent=t('autoScanDesc');
  $('welcomeDesc').textContent=t('welcomeDesc');
  $('fakeAlertTitle').textContent=t('fakeTitle');
  $('fakeAlertDesc').textContent=t('fakeDesc');
  $('btnCloseFake').textContent=t('understood');
  $('historyEmpty').textContent=t('emptyHistory');
  $('historySumLabel').textContent=t('totalDetected');
  document.querySelector('.welcome-title').textContent=t('welcome');
  $('btnStart').innerHTML=`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> ${t('startScan')}`;
}

// ===== SERVICE WORKER =====
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

})();
