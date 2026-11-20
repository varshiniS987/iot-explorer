// Pure geometry for every virtual part. Pin: [id, label, x, y, side]
const b = (arr, x0, dx, y) => arr.map(([i, l], k) => [i, l, x0 + k * dx, y, 'b']);
const top = ['D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13','GND'].map((n, i) => [n, n, 22 + i * 21, 0, 't']);
const bot = ['3V3','5V','GND2','GND3','VIN','A0','A1','A2','A3','A4','A5'].map((n, i) => [n, n.replace(/\d$/, (d) => (n.startsWith('GND') ? '' : d)), 22 + i * 25, 190, 'b']);

export const DEFS = {
  uno: { w: 300, h: 190, name: 'Arduino', inside: true, pins: [...top, ...bot] },
  led: { w: 40, h: 80, name: 'LED', pins: b([['a', '+'], ['k', '−']], 10, 20, 80) },
  res: { w: 80, h: 24, name: 'Resistor', noLabel: true, pins: [['a', 'A', 0, 12, 'l'], ['b', 'B', 80, 12, 'r']] },
  ultra: { w: 150, h: 70, name: 'HC-SR04', pins: b([['vcc', 'VCC'], ['trig', 'TRIG'], ['echo', 'ECHO'], ['gnd', 'GND']], 21, 36, 70) },
  lm35: { w: 70, h: 80, name: 'LM35', pins: b([['vs', '+Vs'], ['out', 'OUT'], ['gnd', 'GND']], 15, 20, 80) },
  dht: { w: 70, h: 90, name: 'DHT11', pins: b([['vcc', 'VCC'], ['data', 'DATA'], ['gnd', 'GND']], 15, 20, 90) },
  ir: { w: 100, h: 80, name: 'IR Sensor', pins: b([['vcc', 'VCC'], ['gnd', 'GND'], ['out', 'OUT']], 20, 30, 80) },
  ldr: { w: 100, h: 80, name: 'LDR Module', pins: b([['vcc', 'VCC'], ['gnd', 'GND'], ['ao', 'AO']], 20, 30, 80) },
  soil: { w: 100, h: 100, name: 'Soil Sensor', pins: b([['vcc', 'VCC'], ['gnd', 'GND'], ['ao', 'AO']], 20, 30, 100) },
  buzz: { w: 60, h: 80, name: 'Buzzer', pins: b([['p', '+'], ['n', '−']], 15, 30, 80) },
  lcd: { w: 170, h: 90, name: 'LCD 16x2 I2C', pins: b([['gnd', 'GND'], ['vcc', 'VCC'], ['sda', 'SDA'], ['scl', 'SCL']], 25, 40, 90) },
  btn: { w: 60, h: 50, name: 'Push Button', pins: [['a', '1', 0, 25, 'l'], ['b', '2', 60, 25, 'r']] },
  btn3: { w: 130, h: 70, name: '3-Button Pad', pins: b([['up', 'UP'], ['dn', 'DOWN'], ['ok', 'OK'], ['gnd', 'GND']], 17, 32, 70) },
  reed: { w: 100, h: 36, name: 'Reed Switch', pins: [['a', '1', 0, 18, 'l'], ['b', '2', 100, 18, 'r']] },
  tlm: { w: 70, h: 130, name: 'Traffic LED Module', pins: b([['r', 'R'], ['y', 'Y'], ['g', 'G'], ['gnd', 'GND']], 10, 17, 130) },
  ped: { w: 56, h: 100, name: 'Pedestrian Module', pins: b([['r', 'R'], ['g', 'G'], ['gnd', 'GND']], 8, 20, 100) },
  mcp: { w: 130, h: 70, name: 'MCP41010', pins: [['cs', 'CS', 20, 70, 'b'], ['sck', 'SCK', 50, 70, 'b'], ['si', 'SI', 80, 70, 'b'], ['vss', 'VSS', 110, 70, 'b'], ['vdd', 'VDD', 20, 0, 't'], ['pa0', 'PA0', 50, 0, 't'], ['pw0', 'PW0', 80, 0, 't'], ['pb0', 'PB0', 110, 0, 't']] },
  dice: { w: 90, h: 90, name: 'LED Dice Module', pins: b([['c', 'C'], ['p1', 'P1'], ['p2', 'P2'], ['m', 'M'], ['gnd', 'GND']], 10, 17, 90) },
};

export const UNO = { id: 'uno', type: 'uno', x: 30, y: 270, label: 'Arduino UNO' };
export const P = (id, type, x, label, o = {}) => ({ id, type, x, y: o.y ?? (type === 'res' ? 146 : 170 - DEFS[type].h), label, ...o });

const find = (project, pid) => project.parts.find((p) => p.id === pid);
export function pinPos(project, full) {
  const [pid, pin] = full.split('.');
  const part = find(project, pid);
  const d = DEFS[part.type].pins.find((q) => q[0] === pin);
  return [part.x + d[2], part.y + d[3], d[4]];
}
export function pinLabel(project, full) {
  const [pid, pin] = full.split('.');
  const part = find(project, pid);
  const d = DEFS[part.type].pins.find((q) => q[0] === pin);
  return `${part.label || DEFS[part.type].name} ${d[1]}`.trim();
}
export function allPins(project) {
  return project.parts.flatMap((p) => DEFS[p.type].pins.map((q) => ({ id: `${p.id}.${q[0]}`, part: p, def: q })));
}
const dir = { t: [0, -1], b: [0, 1], l: [-1, 0], r: [1, 0] };
export function wirePath(a, b) {
  const [x1, y1, s1] = a, [x2, y2, s2] = b;
  const k = Math.max(40, Math.min(120, Math.hypot(x2 - x1, y2 - y1) / 2));
  const d1 = dir[s1], d2 = dir[s2];
  return `M${x1},${y1} C${x1 + d1[0] * k},${y1 + d1[1] * k} ${x2 + d2[0] * k},${y2 + d2[1] * k} ${x2},${y2}`;
}
const PAL = ['#22d3ee', '#a78bfa', '#facc15', '#4ade80', '#fb923c', '#f472b6'];
export function wireColor(a, b, i = 0) {
  const s = `${a} ${b}`.toLowerCase();
  if (/gnd|vss|pb0|\.k\b/.test(s)) return '#9ca3af';
  if (/5v|vcc|\.vs\b|vdd|pa0|3v3/.test(s)) return '#ef4444';
  return PAL[i % PAL.length];
}
