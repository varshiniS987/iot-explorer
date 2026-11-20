import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'electronic-reaction-timer', no: 16, name: 'Electronic Reaction Timer (Arduino UNO)', category: 'Games', difficulty: 'Intermediate',
  description: 'Test how fast you can press a button after an LED lights.',
  objective: 'Measure time with millis() and handle early presses.',
  components: ['Arduino UNO', 'LED', '220 Ω resistor', 'Push button'],
  pins: { LED: 'D8 via 220 Ω', BUTTON: 'D2 (to GND)' },
  electrical: ['LED current = (5 V − 2 V) / 220 Ω ≈ 14 mA.', 'Button uses INPUT_PULLUP.'],
  parts: [UNO, P('r1', 'res', 60, 'R 220 Ω'), P('led', 'led', 200, 'LED', { color: '#22c55e' }), P('b', 'btn', 330, 'Push Button')],
  wires: [['uno.D8', 'r1.a'], ['r1.b', 'led.a'], ['led.k', 'uno.GND'], ['uno.D2', 'b.a'], ['b.b', 'uno.GND2']],
  code: `const int LED_PIN = 8, BTN_PIN = 2;

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BTN_PIN, INPUT_PULLUP);
  randomSeed(analogRead(A0));
}

void loop() {
  digitalWrite(LED_PIN, LOW);
  unsigned long wait = random(2000, 5000);       // random delay
  unsigned long start = millis();
  while (millis() - start < wait) {
    if (digitalRead(BTN_PIN) == LOW) {           // pressed too early
      Serial.println("Too early!");
      delay(1500);
      return;
    }
  }
  digitalWrite(LED_PIN, HIGH);
  unsigned long ledOn = millis();
  while (digitalRead(BTN_PIN) == HIGH);          // wait for press
  Serial.print(millis() - ledOn); Serial.println(" ms");
  digitalWrite(LED_PIN, LOW);
  delay(2000);
}`,
  explain: [['random(2000, 5000)', 'A surprise wait of 2–5 seconds.'], ['millis() - ledOn', 'Reaction time in milliseconds.'], ['Too early!', 'Pressing before the LED cancels the round.']],
  sim: 'react',
  params: [{ k: 'delay', label: 'Fixed delay (0 = random)', min: 0, max: 5000, step: 500, def: 0, unit: 'ms' }],
  live: (o) => ({ led: o.led }),
  practice: 'Wire the LED with its resistor and the button, then test your reaction speed.',
  hints: ['The LED needs a resistor in series.', 'The button goes between an input pin and ground.', 'LED on D8 via resistor, button on D2.'],
  tests: [
    { name: 'LED turns on after the delay and time is measured', steps: [{ set: { delay: 2000 }, wait: 2500, expect: { state: 'go', led: true } }, { hold: ['btn', 100], expect: { state: 'result', rt: [450, 700] } }] },
    { name: 'Early press is detected', steps: [{ set: { delay: 3000 }, hold: ['btn', 100], expect: { state: 'early', led: false } }] },
  ],
  completion: 'Wiring is correct and reaction time is measured.',
};
