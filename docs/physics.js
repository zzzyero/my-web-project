export const MAX_CHARGE = 1000;
export function jumpDistance(ms) { return 20 + Math.min(Math.max(ms, 0), MAX_CHARGE) * .27; }
// Canvas and collision use the same top face, including its rotation.
export function platformPoint(x,y,p) {
 const angle=p.angle||0,dx=x-p.x,dy=(y-p.y)/.49;
 return {x:(dx*Math.cos(angle)+dy*Math.sin(angle))/p.r,y:(-dx*Math.sin(angle)+dy*Math.cos(angle))/(p.ry||p.r)};
}
export function landed(x,y,p) {
 const q=platformPoint(x,y,p),a=Math.abs(q.x),b=Math.abs(q.y);
 if(p.shape==='diamond')return a+b<=1;
 if(p.shape==='rectangle')return a<=1&&b<=1;
 return a*a+b*b<=1;
}
export function centered(x,y,p) {const q=platformPoint(x,y,p);return Math.hypot(q.x,q.y)<.26;}
export function award(center,combo) { return center ? 2 * (combo+1) : 1; }
const faces=[
 {shape:'ellipse',name:'圆台',width:1,depth:1},
 {shape:'rectangle',name:'宽台',width:1.18,depth:.85},
 {shape:'ellipse',name:'窄台',width:.72,depth:1.08},
 {shape:'diamond',name:'菱形台',width:1.06,depth:1.06},
 {shape:'rectangle',name:'长台',width:.78,depth:1.16}
];
export function nextPlatform(p,index,random=Math.random) {
 const choices=faces.filter(f=>f.name!==p.name);
 const face=index===1?faces[0]:choices[Math.floor(random()*choices.length)];
 const size=(index===1?45:Math.max(26,43-index*.48))*(.92+random()*.16);
 const distance=index===1?158:130+random()*95;
 const dir=random()>.5?1:-1;
 return {x:p.x+dir*.84*distance,y:p.y-.543*distance,r:size*face.width,ry:size*face.depth,shape:face.shape,name:face.name,angle:index<2?0:(random()-.5)*.7,index,item:true};
}
