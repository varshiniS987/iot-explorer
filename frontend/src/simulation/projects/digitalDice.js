import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'digital-dice', no: 17, name: 'Digital Dice (Arduino UNO)', category: 'Games', difficulty: 'Intermediate',
  description: 'Press a button to roll a random number from 1 to 6.',
  objective: 'Generate random numbers and show them with LEDs arranged like dice dots.',
  components: ['Arduino UNO', 'LED dice module (7 LEDs on 4 pins)', 'Push button'],
  pins: { 'C (center)': 'D3', 'P1 (corners)': 'D4', 'P2 (corners)': 'D5', 'M (sides)': 'D6', BUTTON: 'D2' },
  electrical: ['LEDs are grouped in pairs so 4 pins show all 6 faces.', 'Each LED group has a 220 Ω resistor on the module.', 'Button uses INPUT_PULLUP.'],
  parts: [UNO, P('d', 'dice', 120, 'Dice Module'), P('b', 'btn', 330, 'Push Button')],
  wires: [['uno.D3', 'd.c'], ['uno.D4', 'd.p1'], ['uno.D5', 'd.p2'], ['uno.D6', 'd.m'], ['uno.GND', 'd.gnd'], ['uno.D2', 'b.a'], ['b.b', 'uno.GND2']],
  code: `const int BTN = 2;
const int C = 3, P1 = 4, P2 = 5, M = 6;
//                 C  P1 P2 M
const byte FACE[7][4] = {
  {0,0,0,0}, {1,0,0,0}, {0,1,0,0}, {1,1,0,0},
  {0,1,1,0}, {1,1,1,0}, {0,1,1,1}
};

void show(int n) {
  digitalWrite(C,  FACE[n][0]); digitalWrite(P1, FACE[n][1]);
  digitalWrite(P2, FACE[n][2]); digitalWrite(M,  FACE[n][3]);
}

void setup() {
  for (int p = 3; p <= 6; p++) pinMode(p, OUTPUT);
  pinMode(BTN, INPUT_PULLUP);
  randomSeed(analogRead(A0));
}

void loop() {
  if (digitalRead(BTN) == LOW) {
    for (int i = 0; i < 10; i++) { show(random(1, 7)); delay(100); }  // roll animation
    show(random(1, 7));                                               // final result
    while (digitalRead(BTN) == LOW);
  }
}`,
  explain: [['FACE[n]', 'Which LED groups are on for each number.'], ['random(1, 7)', 'A random whole number from 1 to 6.'], ['for loop with delay', 'Flashes random faces to look like rolling.']],
  sim: 'dice',
  params: [{ k: 'roll', label: 'Roll time', min: 0.5, max: 3, step: 0.1, def: 1.2, unit: 's' }],
  live: (o) => ({ d: o.leds }),
  practice: 'Wire the dice module and button, then roll the dice.',
  hints: ['The dice module has 4 LED pins and a ground.', 'The button goes between a digital input and ground.', 'LEDs on D3–D6, button on D2.'],
  tests: [
    { name: 'Rolls then shows 1–6 with matching LEDs', steps: [{ hold: ['btn', 100], wait: 300, expect: { rolling: true } }, { wait: 1500, expect: { rolling: false, value: (v) => v >= 1 && v <= 6, ledsOk: true } }] },
  ],
  completion: 'Wiring is correct and the dice shows a valid face.',
};
