import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'parking-distance-alert', no: 2, name: 'Parking Distance Alert (Arduino UNO)', category: 'Alarms', difficulty: 'Beginner',
  description: 'Beep faster as a car gets closer to an obstacle.',
  objective: 'Combine an ultrasonic sensor and a buzzer to build a parking assistant.',
  components: ['Arduino UNO', 'HC-SR04 ultrasonic sensor', 'Piezo buzzer'],
  pins: { TRIG: 'D9', ECHO: 'D10', BUZZER: 'D8', GND: 'GND' },
  electrical: ['A small piezo buzzer draws about 10 mA, within the UNO pin limit (20 mA). For loud buzzers use a transistor.', 'HC-SR04 is powered from 5 V.'],
  parts: [UNO, P('hc', 'ultra', 90, 'HC-SR04'), P('bz', 'buzz', 330, 'Buzzer')],
  wires: [['uno.5V', 'hc.vcc'], ['uno.D9', 'hc.trig'], ['uno.D10', 'hc.echo'], ['uno.GND', 'hc.gnd'], ['uno.D8', 'bz.p'], ['uno.GND2', 'bz.n']],
  code: `const int TRIG_PIN = 9;
const int ECHO_PIN = 10;
const int BUZZER_PIN = 8;

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
}

float readCm() {
  digitalWrite(TRIG_PIN, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long d = pulseIn(ECHO_PIN, HIGH, 30000);
  return d == 0 ? 999 : d * 0.0343 / 2;
}

void loop() {
  float cm = readCm();
  if (cm > 100)      noTone(BUZZER_PIN);                    // safe
  else if (cm > 50)  { tone(BUZZER_PIN, 2000, 120); delay(800); } // slow beeps
  else if (cm > 20)  { tone(BUZZER_PIN, 2000, 120); delay(300); } // fast beeps
  else               tone(BUZZER_PIN, 2500);                // STOP: steady tone
  delay(50);
}`,
  explain: [['readCm()', 'Same distance measurement as the Distance Meter.'], ['tone(pin, freq, ms)', 'Plays a square wave on the buzzer.'], ['if / else if', 'Closer distance picks a faster warning.']],
  sim: 'parking',
  params: [{ k: 'dist', label: 'Car to obstacle', min: 2, max: 200, step: 1, def: 150, unit: 'cm' }],
  live: (o) => ({ bz: o.buzz }),
  practice: 'Wire the sensor and buzzer, then drag the car closer and watch the warning change.',
  hints: ['This build is the Distance Meter plus a buzzer.', 'A buzzer has + and − legs. + goes to a digital pin, − to ground.', 'The code uses D8 for the buzzer.'],
  tests: [
    { name: 'Far away: silent', steps: [{ set: { dist: 150 }, wait: 300, expect: { zone: 'safe', buzz: false } }] },
    { name: 'Medium distance: slow beeps', steps: [{ set: { dist: 70 }, wait: 100, expect: { zone: 'caution' } }] },
    { name: 'Close: fast beeps', steps: [{ set: { dist: 35 }, wait: 100, expect: { zone: 'warning' } }] },
    { name: 'Very close: steady tone', steps: [{ set: { dist: 10 }, wait: 300, expect: { zone: 'stop', buzz: true } }] },
  ],
  completion: 'Wiring is correct and the alarm response changes with distance.',
};
