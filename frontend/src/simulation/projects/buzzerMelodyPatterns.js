import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'buzzer-melody-patterns', no: 12, name: 'Buzzer Melody/Beep Patterns (Arduino UNO)', category: 'Alarms', difficulty: 'Beginner',
  description: 'Play different beep patterns on a buzzer.',
  objective: 'Use tone() with frequencies and delays to create original beep patterns.',
  components: ['Arduino UNO', 'Piezo buzzer'],
  pins: { BUZZER: 'D8' },
  electrical: ['A small piezo buzzer draws about 10 mA, safe for a UNO pin.', 'tone() makes a square wave: higher frequency = higher pitch.'],
  parts: [UNO, P('bz', 'buzz', 200, 'Buzzer')],
  wires: [['uno.D8', 'bz.p'], ['bz.n', 'uno.GND']],
  code: `const int BUZZER_PIN = 8;
// {frequency in Hz, duration in ms}; 0 Hz = silence
int rising[][2] = { {400,200}, {600,200}, {800,200}, {1000,200}, {0,600} };

void play(int pattern[][2], int steps) {
  for (int i = 0; i < steps; i++) {
    if (pattern[i][0] > 0) tone(BUZZER_PIN, pattern[i][0]);
    else noTone(BUZZER_PIN);
    delay(pattern[i][1]);
  }
  noTone(BUZZER_PIN);
}

void setup() { pinMode(BUZZER_PIN, OUTPUT); }

void loop() {
  play(rising, 5);   // try other patterns here
}`,
  explain: [['tone(pin, freq)', 'Starts a tone at the given frequency.'], ['{400,200}', 'One note: 400 Hz for 200 ms.'], ['noTone()', 'Stops the sound.']],
  sim: 'melody',
  params: [{ k: 'pat', label: 'Pattern', type: 'select', options: ['Single beep', 'Triple beep', 'Rising tones', 'Doorbell'], def: 0 }],
  live: (o) => ({ bz: o.buzz }),
  practice: 'Wire the buzzer, pick a pattern and press Run.',
  hints: ['A buzzer has + and − legs.', '+ goes to a digital output pin.', 'Buzzer + on D8, − on GND.'],
  tests: [
    { name: 'Single beep timing', steps: [{ set: { pat: 0 }, wait: 100, expect: { buzz: true, freq: 2000 } }, { wait: 100, expect: { buzz: false } }] },
    { name: 'Rising tones change frequency', steps: [{ set: { pat: 2 }, wait: 100, expect: { freq: 400 } }, { wait: 200, expect: { freq: 600 } }] },
  ],
  completion: 'Wiring is correct and the patterns play with the right timing.',
};
