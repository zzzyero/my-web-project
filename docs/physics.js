export const MAX_CHARGE = 1400;
export function jumpDistance(ms) { return 20 + Math.min(Math.max(ms, 0), MAX_CHARGE) * .19; }
export function landed(x,y,p) { return ((x-p.x)/p.r)**2 + ((y-p.y)/(p.r*.49))**2 <= 1; }
export function award(center,combo) { return center ? 2 * (combo+1) : 1; }
