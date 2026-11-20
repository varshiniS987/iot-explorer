import { pinLabel } from './partDefs.js';

export const GROUNDS = ['uno.GND', 'uno.GND2', 'uno.GND3'];

class UF {
  constructor() { this.p = {}; }
  f(x) { if (!(x in this.p)) this.p[x] = x; while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x]; } return x; }
  u(a, b) { this.p[this.f(a)] = this.f(b); }
}

// userWires: [[pinA, pinB], ...]. All Arduino GND pins are electrically one net.
export function validateWiring(project, userWires) {
  const req = new UF(), usr = new UF();
  GROUNDS.forEach((g) => { req.u(GROUNDS[0], g); usr.u(GROUNDS[0], g); });
  const required = project.wires.map((w) => [w[0], w[1]]);
  required.forEach(([a, b]) => req.u(a, b));
  userWires.forEach(([a, b]) => usr.u(a, b));
  const reqPins = new Set([...required.flat(), ...GROUNDS]);

  const errors = [];
  let satisfied = 0;
  const seen = new Set();
  for (const [a, b] of required) {
    if (usr.f(a) === usr.f(b)) { satisfied++; continue; }
    const target = a.startsWith('uno.') ? b : a;
    const msg = `Check the connection for ${pinLabel(project, target)} – it is missing or goes to the wrong place.`;
    if (!seen.has(msg)) { seen.add(msg); errors.push(msg); }
  }
  let bad = 0;
  const nets = {};
  const userPins = [...new Set(userWires.flat())];
  for (const pin of userPins) {
    if (!reqPins.has(pin)) { bad++; errors.push(`${pinLabel(project, pin)} has a wire it does not need.`); continue; }
    (nets[usr.f(pin)] ||= { groups: new Set(), pins: [] });
    nets[usr.f(pin)].groups.add(req.f(pin));
    nets[usr.f(pin)].pins.push(pin);
  }
  for (const n of Object.values(nets)) {
    if (n.groups.size > 1) {
      bad++;
      errors.push(`Possible short circuit or skipped part: these pins are joined but should not be: ${n.pins.map((p) => pinLabel(project, p)).join(', ')}.`);
    }
  }
  const total = required.length;
  return {
    ok: satisfied === total && bad === 0,
    accuracy: Math.round((100 * Math.max(0, satisfied - bad)) / total),
    satisfied, total, errors,
  };
}
