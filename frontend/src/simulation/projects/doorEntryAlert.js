import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'door-entry-alert', no: 5, name: 'Door/Entry Alert (Arduino UNO)', category: 'Alarms', difficulty: 'Beginner',
  description: 'Sound a buzzer when a door is left open.',
  objective: 'Use a magnetic reed switch as a door sensor with INPUT_PULLUP.',
  components: ['Arduino UNO', 'Magnetic reed switch + magnet', 'Piezo buzzer'],
  pins: { REED: 'D2 (to GND)', BUZZER: 'D8' },
  electrical: ['INPUT_PULLUP uses the UNO internal resistor, so no external resistor is needed.', 'Door closed: magnet closes the switch, D2 reads LOW. Door open: D2 reads HIGH.'],
  parts: [UNO, P('reed', 'reed', 60, 'Reed Switch'), P('bz', 'buzz', 330, 'Buzzer')],
  wires: [['uno.D2', 'reed.a'], ['reed.b', 'uno.GND'], ['uno.D8', 'bz.p'], ['uno.GND2', 'bz.n']],
  code: `const int REED_PIN = 2;
const int BUZZER_PIN = 8;
const unsigned long DELAY_MS = 2000;   // alert after 2 s open
unsigned long openSince = 0;

void setup() {
  pinMode(REED_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
}

void loop() {
  bool open = (digitalRead(REED_PIN) == HIGH);
  if (!open) { openSince = millis(); noTone(BUZZER_PIN); }
  else if (millis() - openSince >= DELAY_MS) tone(BUZZER_PIN, 1800);
  delay(20);
}`,
  explain: [['INPUT_PULLUP', 'Keeps D2 HIGH unless the switch connects it to GND.'], ['millis()', 'Time since start, used to measure how long the door is open.'], ['tone()', 'Sounds the buzzer.']],
  sim: 'door',
  params: [{ k: 'open', label: 'Door open', type: 'toggle', def: false }, { k: 'armed', label: 'Alarm armed', type: 'toggle', def: true }, { k: 'delay', label: 'Alert delay', min: 0, max: 10, step: 1, def: 2, unit: 's' }],
  live: (o) => ({ bz: o.buzz }),
  practice: 'Wire the reed switch and buzzer, open the door and wait for the alert.',
  hints: ['The reed switch is a simple switch with two legs.', 'One leg goes to a digital input, the other to GND.', 'Reed on D2, buzzer on D8.'],
  tests: [
    { name: 'Closed door: quiet', steps: [{ wait: 3000, expect: { alarm: false } }] },
    { name: 'Open too long: alarm, then closes: stops', steps: [{ set: { open: true, delay: 2 }, wait: 3000, expect: { alarm: true } }, { set: { open: false }, wait: 100, expect: { alarm: false } }] },
    { name: 'Disarmed: stays quiet', steps: [{ set: { open: true, armed: false, delay: 1 }, wait: 2000, expect: { alarm: false } }] },
  ],
  completion: 'Wiring is correct and the alert follows the door state.',
};
