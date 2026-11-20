import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'push-button-counter', no: 11, name: 'Push Button Counter (Arduino UNO)', category: 'Controllers', difficulty: 'Beginner',
  description: 'Count how many times a button is pressed.',
  objective: 'Use INPUT_PULLUP, edge detection and debouncing to count each press once.',
  components: ['Arduino UNO', 'Push button'],
  pins: { BUTTON: 'D2 (other leg to GND)' },
  electrical: ['INPUT_PULLUP means no external resistor is needed.', 'Pressed = LOW, released = HIGH.', 'Real buttons bounce: one press makes several fast on/off flickers.'],
  parts: [UNO, P('b', 'btn', 150, 'Push Button')],
  wires: [['uno.D2', 'b.a'], ['b.b', 'uno.GND']],
  code: `const int BTN_PIN = 2;
int count = 0;
int lastState = HIGH;
unsigned long lastChange = 0;

void setup() {
  Serial.begin(9600);
  pinMode(BTN_PIN, INPUT_PULLUP);
}

void loop() {
  int state = digitalRead(BTN_PIN);
  if (state != lastState && millis() - lastChange > 50) {  // debounce 50 ms
    lastChange = millis();
    if (state == LOW) {            // only on the press, not the release
      count++;
      Serial.println(count);
    }
  }
  lastState = state;
}`,
  explain: [['INPUT_PULLUP', 'Internal resistor holds the pin HIGH until pressed.'], ['millis() - lastChange > 50', 'Ignores flickers shorter than 50 ms (debounce).'], ['state == LOW', 'Counts only when the button goes down.']],
  sim: 'btn',
  params: [{ k: 'debounce', label: 'Debounce ON', type: 'toggle', def: true }],
  live: (o) => ({ b: o.pressed }),
  practice: 'Wire the button, press it in the simulation and check that each press adds exactly 1.',
  hints: ['A button is a switch with two legs.', 'One leg goes to the input pin, the other to ground.', 'Button between D2 and GND.'],
  tests: [
    { name: 'One press adds 1', steps: [{ hold: ['btn', 200], expect: { count: 1 } }] },
    { name: 'Two presses add 2', steps: [{ hold: ['btn', 200] }, { wait: 100 }, { hold: ['btn', 200], expect: { count: 2 } }] },
    { name: 'Without debounce bounces are counted', steps: [{ set: { debounce: false }, hold: ['btn', 200], expect: { count: [3, 7] } }] },
  ],
  completion: 'Wiring is correct and every press counts once.',
};
