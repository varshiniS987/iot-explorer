import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'automatic-night-lamp', no: 3, name: 'Automatic Night Lamp (Arduino UNO)', category: 'Sensors', difficulty: 'Beginner',
  description: 'A lamp that switches on by itself when it gets dark.',
  objective: 'Read a light sensor (LDR) and switch an LED using a threshold.',
  components: ['Arduino UNO', 'LDR module', 'LED', '220 Ω resistor'],
  pins: { 'LDR AO': 'A0', LED: 'D8 via 220 Ω' },
  electrical: ['LED current = (5 V − 2 V) / 220 Ω ≈ 14 mA, safe for a UNO pin.', 'The LDR module has its own divider: brighter light gives a higher AO value (0–1023).'],
  parts: [UNO, P('ldr', 'ldr', 70, 'LDR Module'), P('r1', 'res', 240, 'R 220 Ω'), P('led', 'led', 380, 'LED', { color: '#facc15' })],
  wires: [['uno.5V', 'ldr.vcc'], ['uno.GND', 'ldr.gnd'], ['uno.A0', 'ldr.ao'], ['uno.D8', 'r1.a'], ['r1.b', 'led.a'], ['led.k', 'uno.GND2']],
  code: `const int LDR_PIN = A0;
const int LED_PIN = 8;
int threshold = 400;   // 0 (dark) to 1023 (bright)

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int light = analogRead(LDR_PIN);
  if (light < threshold) digitalWrite(LED_PIN, HIGH); // dark: lamp ON
  else                   digitalWrite(LED_PIN, LOW);  // bright: lamp OFF
  delay(100);
}`,
  explain: [['analogRead(A0)', 'Reads the sensor voltage as a number from 0 to 1023.'], ['threshold', 'The light level below which it counts as dark.'], ['digitalWrite(LED_PIN, HIGH)', 'Turns the LED on.']],
  sim: 'lamp',
  params: [{ k: 'light', label: 'Room brightness', min: 0, max: 100, step: 1, def: 70, unit: '%' }, { k: 'thr', label: 'Light threshold', min: 5, max: 95, step: 1, def: 40, unit: '%' }],
  live: (o) => ({ led: o.lamp }),
  practice: 'Wire the LDR module and the LED with its resistor. Lower the brightness below the threshold and the lamp must switch on.',
  hints: ['The LED must never connect straight to a pin: it needs a resistor in series.', 'The LDR AO pin is an analog signal, so use an analog input.', 'LDR on A0, resistor on D8, LED cathode (−) to GND.'],
  tests: [
    { name: 'Dark: lamp ON', steps: [{ set: { light: 10, thr: 40 }, wait: 100, expect: { lamp: true } }] },
    { name: 'Bright: lamp OFF', steps: [{ set: { light: 80, thr: 40 }, wait: 100, expect: { lamp: false } }] },
    { name: 'Threshold moves the switch point', steps: [{ set: { light: 50, thr: 70 }, wait: 100, expect: { lamp: true } }, { set: { thr: 30 }, wait: 100, expect: { lamp: false } }] },
  ],
  completion: 'Wiring is correct and the lamp follows the light threshold.',
};
