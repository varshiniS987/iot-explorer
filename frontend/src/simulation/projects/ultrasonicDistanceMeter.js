import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'ultrasonic-distance-meter', no: 1, name: 'Ultrasonic Distance Meter (Arduino UNO)', category: 'Sensors', difficulty: 'Beginner',
  description: 'Measure how far away an object is using sound waves.',
  objective: 'Learn how an HC-SR04 sensor turns echo time into a distance in centimeters.',
  components: ['Arduino UNO', 'HC-SR04 ultrasonic sensor'],
  pins: { VCC: '5V', TRIG: 'D9', ECHO: 'D10', GND: 'GND' },
  electrical: ['HC-SR04 needs 5 V and about 15 mA, so the UNO 5 V pin can power it.', 'ECHO outputs 5 V, which is safe for UNO inputs.'],
  parts: [UNO, P('hc', 'ultra', 150, 'HC-SR04')],
  wires: [['uno.5V', 'hc.vcc'], ['uno.D9', 'hc.trig'], ['uno.D10', 'hc.echo'], ['uno.GND', 'hc.gnd']],
  code: `const int TRIG_PIN = 9;
const int ECHO_PIN = 10;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);   // 10 us trigger pulse
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  float cm = duration * 0.0343 / 2;  // sound: 0.0343 cm per us, there and back

  if (duration == 0) Serial.println("Out of range");
  else { Serial.print(cm); Serial.println(" cm"); }
  delay(200);
}`,
  explain: [['digitalWrite(TRIG_PIN, HIGH)', 'A 10 microsecond pulse tells the sensor to send a sound burst.'], ['pulseIn()', 'Measures how long ECHO stays HIGH: the sound travel time.'], ['duration * 0.0343 / 2', 'Sound travels there and back, so the time is divided by 2.']],
  sim: 'ultra',
  params: [{ k: 'dist', label: 'Object distance', min: 2, max: 450, step: 1, def: 100, unit: 'cm' }],
  live: () => ({}),
  practice: 'Wire the HC-SR04 to the UNO from memory, then run it and move the object. Validate when the reading matches the distance.',
  hints: ['The sensor has 4 pins: two for power, two for signals.', 'TRIG is an output from the Arduino, ECHO is an input to the Arduino.', 'The code uses D9 for TRIG and D10 for ECHO. Power goes to 5V and GND.'],
  tests: [
    { name: 'Reads 100 cm', steps: [{ set: { dist: 100 }, wait: 100, expect: { reading: [99, 101] } }] },
    { name: 'Reads 30 cm', steps: [{ set: { dist: 30 }, wait: 100, expect: { reading: [29, 31] } }] },
    { name: 'Reports out of range', steps: [{ set: { dist: 430 }, wait: 100, expect: { reading: null } }] },
  ],
  completion: 'Wiring is correct and the reading follows the distance.',
};
