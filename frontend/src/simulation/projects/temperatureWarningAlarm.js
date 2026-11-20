import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'temperature-warning-alarm', no: 8, name: 'Temperature Warning Alarm (Arduino UNO)', category: 'Alarms', difficulty: 'Intermediate',
  description: 'Sound an alarm when it gets too hot.',
  objective: 'Compare a temperature with a limit and add 1 °C hysteresis so the alarm does not flicker.',
  components: ['Arduino UNO', 'LM35 temperature sensor', 'Piezo buzzer'],
  pins: { 'LM35 OUT': 'A0', BUZZER: 'D8' },
  electrical: ['LM35 gives 10 mV per °C from 5 V.', 'Piezo buzzer draws about 10 mA, safe for a UNO pin.'],
  parts: [UNO, P('t', 'lm35', 100, 'LM35'), P('bz', 'buzz', 330, 'Buzzer')],
  wires: [['uno.5V', 't.vs'], ['uno.A0', 't.out'], ['uno.GND', 't.gnd'], ['uno.D8', 'bz.p'], ['uno.GND2', 'bz.n']],
  code: `const int SENSOR_PIN = A0;
const int BUZZER_PIN = 8;
float limitC = 40.0;
bool alarmOn = false;

void setup() { pinMode(BUZZER_PIN, OUTPUT); }

void loop() {
  float c = analogRead(SENSOR_PIN) * 5000.0 / 1023.0 / 10.0;
  if (c > limitC) alarmOn = true;
  else if (c <= limitC - 1.0) alarmOn = false;   // 1 degree hysteresis
  if (alarmOn) { tone(BUZZER_PIN, 2200, 250); delay(500); }
  else noTone(BUZZER_PIN);
  delay(100);
}`,
  explain: [['c > limitC', 'Too hot: alarm starts.'], ['c <= limitC - 1.0', 'Must cool 1 °C below the limit before stopping.'], ['alarmOn', 'Remembers the alarm state between loops.']],
  sim: 'tempalarm',
  params: [{ k: 'temp', label: 'Temperature', min: 0, max: 100, step: 1, def: 25, unit: '°C' }, { k: 'thr', label: 'Alarm limit', min: 20, max: 80, step: 1, def: 40, unit: '°C' }],
  live: (o) => ({ bz: o.buzz }),
  practice: 'Wire the sensor and buzzer, then push the temperature above the limit and back down.',
  hints: ['This project joins the Temperature Monitor with a buzzer.', 'Buzzer + goes to a digital output, − to GND.', 'LM35 on A0, buzzer on D8.'],
  tests: [
    { name: 'Safe temperature: quiet', steps: [{ set: { temp: 25, thr: 40 }, wait: 200, expect: { alarm: false } }] },
    { name: 'Too hot: alarm ON', steps: [{ set: { temp: 55, thr: 40 }, wait: 200, expect: { alarm: true } }] },
    { name: 'Cools down: alarm OFF', steps: [{ set: { temp: 55, thr: 40 }, wait: 200, expect: { alarm: true } }, { set: { temp: 30 }, wait: 200, expect: { alarm: false } }] },
  ],
  completion: 'Wiring is correct and the alarm turns on and off correctly.',
};
