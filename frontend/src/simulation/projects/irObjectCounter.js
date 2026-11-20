import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'ir-object-counter', no: 4, name: 'IR Object Counter (Arduino UNO)', category: 'Sensors', difficulty: 'Intermediate',
  description: 'Count objects as they pass in front of an IR sensor.',
  objective: 'Detect a change of state so each object is counted exactly once.',
  components: ['Arduino UNO', 'IR obstacle sensor module'],
  pins: { VCC: '5V', GND: 'GND', OUT: 'D2' },
  electrical: ['The IR module runs on 5 V.', 'OUT is LOW when an object is detected (active LOW).'],
  parts: [UNO, P('ir', 'ir', 120, 'IR Sensor')],
  wires: [['uno.5V', 'ir.vcc'], ['uno.GND', 'ir.gnd'], ['uno.D2', 'ir.out']],
  code: `const int IR_PIN = 2;
int count = 0;
bool lastDetected = false;

void setup() {
  Serial.begin(9600);
  pinMode(IR_PIN, INPUT);
}

void loop() {
  bool detected = (digitalRead(IR_PIN) == LOW);   // LOW = object present
  if (detected && !lastDetected) {                // only when it ARRIVES
    count++;
    Serial.println(count);
  }
  lastDetected = detected;
  delay(10);
}`,
  explain: [['digitalRead(IR_PIN) == LOW', 'The module pulls OUT low when it sees an object.'], ['detected && !lastDetected', 'Edge detection: counts the arrival, not every loop while the object stays in view.'], ['lastDetected', 'Remembers the previous state.']],
  sim: 'ir',
  params: [{ k: 'speed', label: 'Belt speed', min: 10, max: 60, step: 1, def: 30, unit: '%/s' }, { k: 'auto', label: 'Auto objects', type: 'toggle', def: true }, { k: 'gap', label: 'Time between objects', min: 1, max: 6, step: 1, def: 3, unit: 's' }],
  live: () => ({}),
  practice: 'Wire the IR sensor, run it and send a long object. It must count only once.',
  hints: ['The module has 3 pins: power, ground and one signal.', 'The signal pin goes to a digital input.', 'OUT goes to D2.'],
  tests: [
    { name: 'Counts one small object', steps: [{ set: { auto: false, speed: 40 }, ev: ['obj'], wait: 4000, expect: { count: 1, detected: false } }] },
    { name: 'Long object counts once', steps: [{ set: { auto: false, speed: 40 }, ev: ['long'], wait: 5000, expect: { count: 1 } }] },
    { name: 'Two objects counted twice', steps: [{ set: { auto: false, speed: 40 }, ev: ['obj'], wait: 4000, expect: { count: 1 } }, { ev: ['obj'], wait: 4000, expect: { count: 2 } }] },
  ],
  completion: 'Wiring is correct and each object is counted once.',
};
