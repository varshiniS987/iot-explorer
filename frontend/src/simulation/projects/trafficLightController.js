import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'traffic-light-controller', no: 13, name: 'Traffic Light Controller (Arduino UNO)', category: 'Lights', difficulty: 'Beginner',
  description: 'Run red, green and yellow lights in a timed cycle.',
  objective: 'Use digitalWrite() and delay() to run a traffic light sequence.',
  components: ['Arduino UNO', 'Traffic light LED module (R, Y, G)'],
  pins: { RED: 'D8', YELLOW: 'D9', GREEN: 'D10' },
  electrical: ['The module has a 220 Ω resistor on each LED (about 14 mA), so it connects directly to UNO pins.'],
  parts: [UNO, P('t', 'tlm', 150, 'Traffic Light')],
  wires: [['uno.D8', 't.r'], ['uno.D9', 't.y'], ['uno.D10', 't.g'], ['uno.GND', 't.gnd']],
  code: `const int RED = 8, YELLOW = 9, GREEN = 10;

void setup() {
  pinMode(RED, OUTPUT);
  pinMode(YELLOW, OUTPUT);
  pinMode(GREEN, OUTPUT);
}

void show(int pin, int ms) {
  digitalWrite(RED, LOW); digitalWrite(YELLOW, LOW); digitalWrite(GREEN, LOW);
  digitalWrite(pin, HIGH);
  delay(ms);
}

void loop() {
  show(RED, 5000);
  show(GREEN, 5000);
  show(YELLOW, 2000);
}`,
  explain: [['show(pin, ms)', 'Turns all lights off, then one on for a time.'], ['RED → GREEN → YELLOW', 'Yellow warns that red is coming.'], ['delay(ms)', 'Waits while the light stays on.']],
  sim: 'traffic',
  params: [{ k: 'red', label: 'Red time', min: 3, max: 10, step: 1, def: 5, unit: 's' }, { k: 'green', label: 'Green time', min: 3, max: 10, step: 1, def: 5, unit: 's' }],
  live: (o) => ({ t: { r: o.r, y: o.y, g: o.g } }),
  practice: 'Wire the three lights and ground, then Start the sequence.',
  hints: ['The module has 3 light pins and one ground.', 'Each light pin needs its own Arduino pin.', 'Red D8, Yellow D9, Green D10, plus GND.'],
  tests: [
    { name: 'Starts on red', steps: [{ wait: 500, expect: { r: true, exclusive: true } }] },
    { name: 'Red, green, yellow, red', steps: [{ wait: 500, expect: { r: true } }, { wait: 5000, expect: { g: true } }, { wait: 5000, expect: { y: true } }, { wait: 2000, expect: { r: true, exclusive: true } }] },
  ],
  completion: 'Wiring is correct and the sequence runs in order.',
};
