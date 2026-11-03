import {sharedEnabled,cleanNickname,readNickname,saveNickname,topScores,submitScore} from './leaderboard.js';
import {MAX_CHARGE,jumpDistance,landed,centered,award,nextPlatform} from './physics.js';
const $=s=>document.querySelector(s), canvas=$('#game'),ctx=canvas.getContext('2d');
let character='snow', sound=false,audio,game=null,W=430,H=800,raf,toastTimer;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
// One transparent atlas: left = snowman, right = cat. Foot anchors stay fixed.
const characterAtlas = new Image();
characterAtlas.src = './characters.png?v=2';
characterAtlas.onload = () => portraits();

function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function path(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function pill(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function heart(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#e87776';c.beginPath();c.moveTo(0,5);c.bezierCurveTo(-19,-6,-10,-20,0,-10);c.bezierCurveTo(10,-20,19,-6,0,5);c.fill();c.restore();}
function pudding(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);ellipse(c,0,9,17,5,'#f8f4de');path(c,[[-10,-9],[10,-9],[14,8],[-14,8]],'#efd08b');ellipse(c,0,-9,10,4,'#9a5e3d');ellipse(c,0,-11,4,2,'#fff0c5');c.restore();}
function drawCharacter(c,x,y,scale,type,squash=1){
 if (characterAtlas.complete && characterAtlas.naturalWidth > 0) {
  const sw=characterAtlas.naturalWidth/2, sh=characterAtlas.naturalHeight;
  const height=118, width=height*sw/sh;
  c.save();c.translate(x,y);c.scale(scale/Math.sqrt(squash),scale*squash);
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  c.drawImage(characterAtlas,type==='snow'?0:sw,0,sw,sh,-width/2,-height*.94,width,height);
  c.restore();return;
 }
 c.save();c.translate(x,y);c.scale(scale/Math.sqrt(squash),scale*squash);
 if(type==='snow'){
  ellipse(c,0,-22,21,27,'#d8e5e1');let b=c.createRadialGradient(-10,-32,2,0,-25,32);b.addColorStop(0,'#fff');b.addColorStop(1,'#dce7e7');ellipse(c,-9,-3,7,8,'#e7eeee');ellipse(c,9,-3,7,8,'#e7eeee');ellipse(c,0,-27,22,29,b);ellipse(c,-25,-23,10,14,'#ee726c');ellipse(c,25,-23,10,14,'#ee726c');ellipse(c,-21,-36,6,6,'#f6f8f6');ellipse(c,21,-36,6,6,'#f6f8f6');heart(c,0,-33,.39);heart(c,0,-19,.39);
  let h=c.createRadialGradient(-13,-77,3,0,-66,39);h.addColorStop(0,'#fff');h.addColorStop(1,'#e2e9e9');ellipse(c,0,-67,36,33,h);ellipse(c,-14,-69,1.8,2.4,'#282b2a');ellipse(c,14,-69,1.8,2.4,'#282b2a');c.strokeStyle='#303430';c.lineWidth=2;c.lineCap='round';c.beginPath();c.moveTo(-11,-59);c.quadraticCurveTo(0,-52,11,-59);c.stroke();
 }else{
  ellipse(c,-10,-5,6,8,'#686a73');ellipse(c,10,-5,6,8,'#686a73');ellipse(c,-21,-28,7,15,'#73757c');ellipse(c,21,-28,7,15,'#73757c');let b=c.createRadialGradient(-7,-37,2,0,-22,30);b.addColorStop(0,'#85858d');b.addColorStop(1,'#626773');ellipse(c,0,-27,22,29,b);path(c,[[-13,-48],[13,-48],[0,-34]],'#a2c9e1');path(c,[[-31,-74],[-27,-111],[-6,-85]],'#777780');path(c,[[10,-85],[27,-115],[34,-72]],'#777780');path(c,[[-24,-87],[-24,-103],[-13,-87]],'#ad99a5');path(c,[[17,-88],[26,-105],[28,-86]],'#ad99a5');let h=c.createRadialGradient(-15,-75,4,0,-68,43);h.addColorStop(0,'#92919b');h.addColorStop(1,'#696b76');ellipse(c,0,-70,39,34,h);
  pill(c,-30,-93,26,13,7,'#a8d4ed');pill(c,4,-93,26,13,7,'#a8d4ed');pill(c,-25,-90,16,7,4,'#293441');pill(c,9,-90,16,7,4,'#293441');pill(c,-5,-89,10,3,2,'#a8d4ed');path(c,[[-27,-71],[-6,-68],[-9,-60],[-24,-61]],'#f5f2ed');path(c,[[6,-68],[27,-71],[24,-61],[9,-60]],'#f5f2ed');ellipse(c,-16,-66,5,5,'#292b32');ellipse(c,16,-66,5,5,'#292b32');c.strokeStyle='#30333b';c.lineWidth=2;c.lineCap='round';c.beginPath();c.moveTo(-27,-72);c.lineTo(-6,-68);c.moveTo(6,-68);c.lineTo(27,-72);c.moveTo(-5,-51);c.lineTo(0,-56);c.lineTo(5,-51);c.moveTo(-32,-55);c.lineTo(-23,-54);c.moveTo(-32,-50);c.lineTo(-24,-50);c.moveTo(23,-54);c.lineTo(32,-55);c.moveTo(24,-50);c.lineTo(32,-50);c.stroke();ellipse(c,0,-59,4,3,'#e9bdcf');
 }c.restore();}
// Procedural three-quarter rear and profile poses keep hands and feet articulated.
function drawJumpCharacter(c,x,y,scale,type,progress,dx){
 const side=dx<0?-1:1,rear=dx>0,flight=Math.sin(progress*Math.PI),snow=type==='snow';
 c.save();c.translate(x,y);c.scale(scale*side,scale);c.rotate(-.12*flight);
 const body=c.createLinearGradient(-24,-100,30,0);body.addColorStop(0,snow?'#ffffff':'#9698a3');body.addColorStop(1,snow?'#cfdfdf':'#5c6271');
 // Far arm and foot, then body, then near limbs give a readable silhouette.
 ellipse(c,-22-10*flight,-33-17*flight,8,13,snow?'#cc5559':'#626977');
 ellipse(c,-12-11*flight,-3-8*flight,8,7,snow?'#d5e3e3':'#575e6b');
 if(!snow){c.strokeStyle='#656c7a';c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(-15,-20);c.quadraticCurveTo(-46,-15,-32,-43-10*flight);c.stroke();}
 ellipse(c,0,-29,22,29,body);
 if(!snow){path(c,[[-29,-78],[-26,-111],[-5,-85]],'#777d89');path(c,[[8,-85],[24,-113],[32,-76]],'#777d89');if(!rear)path(c,[[14,-86],[23,-102],[26,-84]],'#baa4af');}
 ellipse(c,0,-69,snow?34:36,32,body);
 if(rear){
  if(!snow){c.strokeStyle='#a8d4ed';c.lineWidth=5;c.beginPath();c.moveTo(-31,-87);c.quadraticCurveTo(0,-79,32,-87);c.stroke();path(c,[[-12,-47],[12,-47],[0,-37]],'#a8cce1');}
  else {ellipse(c,-10,-78,9,5,'#ffffff80');}
 }else{
  if(!snow){pill(c,7,-93,26,10,5,'#a8d4ed');pill(c,12,-90,17,5,3,'#293441');}
  ellipse(c,20,-70,2,3,'#2b3538');ellipse(c,29,-59,5,3,snow?'#d6b8a8':'#dfb9ca');
  c.strokeStyle='#394247';c.lineWidth=1.8;c.beginPath();c.moveTo(21,-55);c.quadraticCurveTo(25,-52,29,-55);c.stroke();
 }
 ellipse(c,14+15*flight,-3-12*flight,9,7,snow?'#f1f6f4':'#7d8490');
 c.save();c.translate(22,-32);c.rotate(-.7*flight);ellipse(c,3,-9*flight,9,14,snow?'#ec7275':'#838995');if(snow)ellipse(c,2,-17-9*flight,6,5,'#fff8f3');c.restore();
 c.restore();
}
function portraits(){['snow','cat'].forEach(type=>{let c=$(`#${type}-portrait`).getContext('2d');c.clearRect(0,0,300,300);ellipse(c,150,267,68,12,type==='snow'?'#b8d5c655':'#a9ba8f55');drawCharacter(c,150,263,2.1,type);});}portraits();
document.querySelectorAll('[data-character]').forEach(b=>b.onclick=()=>{character=b.dataset.character;document.querySelectorAll('[data-character]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});});
function tone(freq,duration=.1){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();let o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*1.4,audio.currentTime+duration);g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
document.querySelectorAll('.sound').forEach(b=>b.onclick=()=>{sound=!sound;document.querySelectorAll('.sound').forEach(x=>{x.classList.toggle('active',sound);x.setAttribute('aria-label',sound?'关闭音效':'开启音效');});tone(500);});
$('#rules-button').onclick=()=>$('#rules').showModal();document.querySelectorAll('.dialog-close').forEach(b=>b.onclick=()=>$('#rules').close());
function readBest(){try{return Number(localStorage.getItem(`hop-best-${character}`))||0;}catch{return 0;}}
function saveBest(n){try{localStorage.setItem(`hop-best-${character}`,String(n));}catch{}}
function start(){$('#submit-score').disabled=true;saveNickname($('#nickname').value);$('#nickname').value=readNickname();cancelAnimationFrame(raf);$('#result').close();$('#home').classList.add('hidden');$('#play').classList.remove('hidden');document.body.classList.add('playing');resize();let p={x:0,y:0,r:61,index:0,item:false},next=nextPlatform(p,1);game={platforms:[p,next],index:0,x:0,y:0,score:0,combo:0,best:readBest(),state:'ready',charge:0,cameraX:0,cameraY:0,jump:null,particles:[],last:performance.now(),fall:0,runId:crypto.randomUUID(),nickname:readNickname(),character};$('#score').textContent='0';$('#best').textContent=`最佳 ${game.best}`;$('#scene-label').textContent=character==='snow'?'云宝宝 · 雪地漫游':'泰风 · 竹林漫游';$('#hint').textContent='首跳试试蓄力约 0.7 秒';$('#toast').textContent='';$('#charge-fill').style.width='0';$('#share-status').textContent='';$('#share-url').classList.add('hidden');raf=requestAnimationFrame(frame);}
$('#start').onclick=start;$('#retry').onclick=start;
function home(){cancelAnimationFrame(raf);game=null;$('#result').close();$('#play').classList.add('hidden');$('#home').classList.remove('hidden');document.body.classList.remove('playing');}$('#back').onclick=home;$('#change').onclick=home;
function resize(){let rect=$('#play').getBoundingClientRect();W=430;H=rect.height/rect.width*W;let dpr=Math.min(devicePixelRatio||1,2);canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);}window.addEventListener('resize',()=>{if(game)resize();});
function begin(){if(!game||game.state!=='ready'||document.querySelector('dialog[open]'))return;game.state='charging';game.charge=performance.now();tone(240,.07);}
function release(){if(!game||game.state!=='charging')return;let ms=performance.now()-game.charge;let from=game.platforms[game.index],to=game.platforms[game.index+1],dx=to.x-game.x,dy=to.y-game.y,len=Math.hypot(dx,dy),distance=jumpDistance(ms);game.jump={sx:game.x,sy:game.y,ex:game.x+dx/len*distance,ey:game.y+dy/len*distance,start:performance.now(),duration:520+distance*.5};game.state='jumping';$('#charge-fill').style.width='0';tone(350,.2);}
function cancelCharge(){if(game?.state==='charging'){game.state='ready';$('#charge-fill').style.width='0';}}
$('#play').addEventListener('pointerdown',e=>{if(e.target.closest('.game-top')||e.button!==0)return;e.preventDefault();$('#play').setPointerCapture(e.pointerId);begin();});$('#play').addEventListener('pointerup',release);$('#play').addEventListener('pointercancel',cancelCharge);$('#play').addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('keydown',e=>{if(e.code==='Space'&&game&&!document.querySelector('dialog[open]')){e.preventDefault();if(!e.repeat)begin();}});window.addEventListener('keyup',e=>{if(e.code==='Space')release();});window.addEventListener('blur',cancelCharge);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelCharge();});
function toast(text){clearTimeout(toastTimer);$('#toast').textContent=text;toastTimer=setTimeout(()=>{$('#toast').textContent='';},1400);}
function finish(){game.state='over';let record=game.score>game.best;if(record)saveBest(game.score);$('#final-score').textContent=game.score;$('#result-icon').textContent=character==='snow'?'♥':'🍮';$('#result-best').textContent=`${record?'新纪录！ · ':''}历史最佳 ${Math.max(game.best,game.score)}`;$('#result-message').textContent=game.score===0?'差一点点！试着调整长按时间。':'每一次起跳，都是新的开始。';$('#submit-score').disabled=!sharedEnabled||game.score===0;$('#submit-status').textContent=sharedEnabled?(game.score===0?'拿到分数后再来挑战共享榜吧。':`以「${game.nickname}」提交本次成绩`):'共享排行榜尚未启用，本次最高分已保存在此浏览器。';$('#result').showModal();tone(150,.35);}
function land(){let g=game,p=g.platforms[g.index+1];if(!landed(g.x,g.y,p)){g.state='falling';g.fall=performance.now();return;}let center=centered(g.x,g.y,p);let points=award(center,g.combo);g.combo=center?g.combo+1:0;let collect=Boolean(p.item);if(collect&&p.item){points+=3;p.item=false;}g.landTime=performance.now();g.score+=points;g.index++;g.platforms.push(nextPlatform(p,g.index+1));g.state='ready';$('#score').textContent=g.score;$('#hint').textContent=`下一站 · ${g.platforms[g.index+1].name} · 留意落脚面积`;toast(`${center?`完美 ×${g.combo}  `:''}${collect?(character==='snow'?'♥ 爱心 ':'🍮 布丁 '):''}+${points}`);for(let i=0;i<14;i++)g.particles.push({x:g.x,y:g.y,vx:(Math.random()-.5)*70,vy:-Math.random()*90,life:1});tone(center?850:600,.16);}
function platformFace(p,x,y,color){
 ctx.save();ctx.translate(x,y);ctx.scale(1,.49);ctx.rotate(p.angle||0);ctx.fillStyle=color;ctx.beginPath();
 const ry=p.ry||p.r;
 if(p.shape==='rectangle')ctx.rect(-p.r,-ry,p.r*2,ry*2);
 else if(p.shape==='diamond'){ctx.moveTo(0,-ry);ctx.lineTo(p.r,0);ctx.lineTo(0,ry);ctx.lineTo(-p.r,0);ctx.closePath();}
 else ctx.ellipse(0,0,p.r,ry,0,0,Math.PI*2);
 ctx.fill();ctx.restore();
}
function platform(p,t){
 let g=game,x=W*.5+p.x-g.cameraX,y=H*.59+p.y-g.cameraY;
 const snow=character==='snow',depth=20,target=p.index===g.index+1;
 ctx.save();ctx.shadowColor='#234e4120';ctx.shadowBlur=16;ctx.shadowOffsetY=12;
 platformFace(p,x,y+depth,snow?'#96b8bf':'#748c62');ctx.restore();
 // Stacked faces give every silhouette a solid edge, including diamonds.
 for(let d=depth-1;d>0;d-=2)platformFace(p,x,y+d,snow?'#adcbd0':'#8b9e73');
 const top=ctx.createLinearGradient(x,y-35,x,y+35);top.addColorStop(0,snow?'#ffffff':'#eff2cd');top.addColorStop(1,snow?'#dceeea':'#cbd8a1');
 platformFace(p,x,y,top);
 if(target){ctx.save();ctx.globalAlpha=.55+.15*Math.sin(t/450);ellipse(ctx,x,y,10,4.9,snow?'#aacfc5':'#9db878');ellipse(ctx,x,y,3,1.5,'#ffffff');ctx.restore();}
 else ellipse(ctx,x,y,5,2.5,snow?'#c6e0db':'#b7c98e');
 if(p.item){let float=Math.sin(t/350+p.index)*3;if(snow)heart(ctx,x,y-24+float,.85);else pudding(ctx,x,y-20+float,.9);ellipse(ctx,x,y-2,12,4,'#3f5d4010');}
 if(p.index===0){ctx.fillStyle='#8da69b';ctx.font='8px system-ui';ctx.textAlign='center';ctx.fillText('START',x,y+13);}
}
function backdrop(t){const snow=character==='snow';let grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,snow?'#edf6f5':'#edf1df');grad.addColorStop(1,snow?'#dcece9':'#dce6ca');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);if(snow){for(let i=0;i<35;i++){let x=(Math.sin(i*24)*220+240+Math.sin(t/3500+i)*7)%W,y=(i*89+t*(.005+(i%3)*.004))%H;ellipse(ctx,x,y,1.3+i%3*.45,1.3+i%3*.45,'#ffffffaa');}for(let i=0;i<5;i++){let x=i*114-10,y=H*.4+Math.sin(i*3)*H*.17;path(ctx,[[x,y-48],[x-28,y+16],[x+28,y+16]],'#c4dcce55');path(ctx,[[x,y-48],[x-19,y-3],[x+19,y-3]],'#f7fcf6aa');}}else{for(let i=0;i<9;i++){let x=i*59-20+Math.sin(i*7)*15;let y=100+Math.sin(i*21)*150;ctx.globalAlpha=.16+(i%3)*.035;ctx.strokeStyle='#618656';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,H);ctx.lineTo(x+12,y);ctx.stroke();for(let n=0;n<7;n++){let by=y+n*100;ctx.strokeStyle='#365f39';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-1,by);ctx.lineTo(x+13,by);ctx.stroke();ellipse(ctx,x+22,by+12,21,4,'#618656');ellipse(ctx,x-13,by-8,20,4,'#618656');}}ctx.globalAlpha=1;for(let i=0;i<10;i++){let x=(i*73+Math.sin(t/2000+i)*12)%W,y=(i*97+t*.012)%H;ctx.save();ctx.translate(x,y);ctx.rotate(i+t/2000);ellipse(ctx,0,0,5,1.4,'#93a67355');ctx.restore();}}}
function frame(t){if(!game)return;let g=game,dt=Math.min((t-g.last)/1000,.05);g.last=t;let lift=0,squash=1;if(g.state==='ready'&&g.landTime){let elapsed=t-g.landTime;if(elapsed<300)squash=1-Math.sin(elapsed/300*Math.PI)*.14;}if(g.state==='charging'){let f=clamp((t-g.charge)/MAX_CHARGE,0,1);squash=1-f*.28;$('#charge-fill').style.width=`${f*100}%`;$('#jump').firstChild.textContent=f===1?'蓄力已满，松手起跳 ':'按住蓄力 · 松手跳跃 ';}else $('#jump').firstChild.textContent='按住蓄力 · 松手跳跃 ';if(g.state==='jumping'){let j=g.jump,f=clamp((t-j.start)/j.duration,0,1);g.x=j.sx+(j.ex-j.sx)*f;g.y=j.sy+(j.ey-j.sy)*f;lift=Math.sin(f*Math.PI)*115;if(f===1)land();}if(g.state==='falling'){let f=clamp((t-g.fall)/650,0,1);lift=-f*f*200;squash=1-f*.2;if(f===1)finish();}
 let current=g.platforms[g.index],next=g.platforms[g.index+1];let targetX=(current.x+next.x)*.5,targetY=current.y-30;g.cameraX+=(targetX-g.cameraX)*Math.min(1,dt*4);g.cameraY+=(targetY-g.cameraY)*Math.min(1,dt*4);backdrop(t);
 g.platforms.slice(Math.max(0,g.index-3)).sort((a,b)=>a.y-b.y).forEach(p=>platform(p,t));let px=W*.5+g.x-g.cameraX,py=H*.59+g.y-g.cameraY;ellipse(ctx,px,py,19-lift*.03,7-lift*.014,'#345c4825');if(g.state==='jumping'){const j=g.jump;drawJumpCharacter(ctx,px,py-lift,.78,character,clamp((t-j.start)/j.duration,0,1),j.ex-j.sx);}else drawCharacter(ctx,px,py-lift,.78,character,squash);g.particles=g.particles.filter(p=>p.life>0);g.particles.forEach(p=>{p.life-=dt*1.3;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=160*dt;ctx.globalAlpha=Math.max(0,p.life);ellipse(ctx,W*.5+p.x-g.cameraX,H*.59+p.y-g.cameraY,3,3,character==='snow'?'#eeb3aa':'#d7b46f');ctx.globalAlpha=1;});if(g.state!=='over')raf=requestAnimationFrame(frame);}
$('#share').onclick=async()=>{let url=location.origin+location.pathname;try{await navigator.clipboard.writeText(url);$('#share-status').textContent='链接已复制，发给朋友一起挑战吧！';}catch{let input=$('#share-url');input.value=url;input.classList.remove('hidden');input.focus();input.select();$('#share-status').textContent='长按或选中上方链接复制，即可分享。';}};

$('#nickname').value=readNickname();
$('#nickname').addEventListener('change',()=>{$('#nickname').value=saveNickname($('#nickname').value);});
let rankingCharacter='snow',rankingRequest=0;
async function refreshRanking(){
 const requestId=++rankingRequest;$('#ranking-list').replaceChildren();
 $('#ranking-status').textContent=sharedEnabled?'正在加载共享排行榜…':'共享排行榜尚未启用。以下是此浏览器的最佳成绩。';
 try{
  let rows;
  if(sharedEnabled)rows=await topScores(rankingCharacter);
  else {let score=0;try{score=Number(localStorage.getItem(`hop-best-${rankingCharacter}`))||0;}catch{}rows=score?[{nickname:readNickname(),score}]:[];}
  if(requestId!==rankingRequest)return;
  if(sharedEnabled)$('#ranking-status').textContent=rows.length?'共享榜 · 最高的 20 次旅行':'还没有成绩，来做第一位旅行者吧。';
  else if(!rows.length)$('#ranking-status').textContent+=' 还没有成绩，出发试试吧！';
  for(const row of rows){const li=document.createElement('li'),name=document.createElement('span'),score=document.createElement('strong');name.textContent=cleanNickname(String(row.nickname));score.textContent=`${row.score} 分`;li.append(name,score);$('#ranking-list').append(li);}
 }catch(error){if(requestId===rankingRequest)$('#ranking-status').textContent=error.message;}
}
$('#leaderboard-button').onclick=()=>{$('#leaderboard').showModal();refreshRanking();};
$('#ranking-close').onclick=()=>{$('#leaderboard').close();rankingRequest++;};
$('#ranking-refresh').onclick=refreshRanking;
document.querySelectorAll('[data-ranking]').forEach(button=>button.onclick=()=>{rankingCharacter=button.dataset.ranking;document.querySelectorAll('[data-ranking]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));refreshRanking();});
$('#submit-score').onclick=async()=>{
 const run=game,button=$('#submit-score');if(!run||run.state!=='over'||button.disabled)return;
 button.disabled=true;$('#submit-status').textContent='正在提交…';
 try{await submitScore({id:run.runId,nickname:run.nickname,character:run.character,score:run.score});if(game===run)$('#submit-status').textContent='成绩已提交到共享排行榜！';}
 catch(error){if(game===run){$('#submit-status').textContent=error.message;button.disabled=false;}}
};
