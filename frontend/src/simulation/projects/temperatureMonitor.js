import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'temperature-monitor', no: 6, name: 'Temperature Monitor (Arduino UNO)', category: 'Sensors', difficulty: 'Beginner',
  description: 'Read and show the room temperature.',
  objective: 'Convert an analog LM35 voltage into degrees Celsius.',
  components: ['Arduino UNO', 'LM35 temperature sensor'],
  pins: { '+Vs': '5V', OUT: 'A0', GND: 'GND' },
  electrical: ['LM35 works from 4–30 V, so 5 V is fine.', 'Output is 10 mV per °C: 250 mV = 25 °C.'],
  parts: [UNO, P('t', 'lm35', 150, 'LM35')],
  wires: [['uno.5V', 't.vs'], ['uno.A0', 't.out'], ['uno.GND', 't.gnd']],
  code: `const int SENSOR_PIN = A0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(SENSOR_PIN);          // 0 - 1023
  float millivolts = raw * 5000.0 / 1023.0;  // to mV
  float celsius = millivolts / 10.0;         // 10 mV per degree
  Serial.print(celsius);
  Serial.println(" C");
  delay(500);
}`,
  explain: [['analogRead()', 'Gives a number 0–1023 for 0–5 V.'], ['raw * 5000.0 / 1023.0', 'Turns the number into millivolts.'], ['millivolts / 10.0', 'The LM35 gives 10 mV for each °C.']],
  sim: 'temp',
  params: [{ k: 'temp', label: 'Room temperature', min: 0, max: 100, step: 1, def: 25, unit: '°C' }],
  live: () => ({}),
  practice: 'Wire the LM35 and check that the displayed value follows the slider.',
  hints: ['The LM35 has 3 pins: supply, output, ground.', 'The output is an analog signal.', 'OUT goes to A0.'],
  tests: [
    { name: 'Reads 25 °C', steps: [{ set: { temp: 25 }, wait: 100, expect: { reading: [24.4, 25.6] } }] },
    { name: 'Reads 80 °C', steps: [{ set: { temp: 80 }, wait: 100, expect: { reading: [79.4, 80.6] } }] },
  ],
  completion: 'Wiring is correct and the display follows the temperature.',
};
