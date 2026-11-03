import {leaderboardConfig as config} from './leaderboard-config.js';
export const sharedEnabled=Boolean(config.url&&config.publicKey);
export function cleanNickname(value){return Array.from(value.trim().replace(/[\u0000-\u001f\u007f]/g,'')).slice(0,16).join('')||'快乐旅人';}
export function readNickname(){try{return cleanNickname(localStorage.getItem('hop-nickname')||'');}catch{return '快乐旅人';}}
export function saveNickname(value){const name=cleanNickname(value);try{localStorage.setItem('hop-nickname',name);}catch{}return name;}
async function request(path,options={}){
 if(!sharedEnabled)throw new Error('共享排行榜尚未启用');
 const response=await fetch(`${config.url.replace(/\/$/,'')}/rest/v1/${path}`,{...options,headers:{apikey:config.publicKey,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error('排行榜暂时连接不上，请稍后重试');
 return response.status===204?null:response.json();
}
export function topScores(character){return request(`hop_scores?select=nickname,score&character=eq.${encodeURIComponent(character)}&order=score.desc,created_at.asc&limit=20`);}
export function submitScore(run){return request('rpc/submit_hop_score',{method:'POST',body:JSON.stringify({run_id:run.id,player_name:run.nickname,player_character:run.character,player_score:run.score})});}
