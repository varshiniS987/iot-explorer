import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'humidity-monitor', no: 7, name: 'Humidity Monitor (Arduino UNO)', category: 'Sensors', difficulty: 'Beginner',
  description: 'Measure how humid the air is, in percent.',
  objective: 'Use a DHT11 digital sensor and its library to read relative humidity.',
  components: ['Arduino UNO', 'DHT11 sensor module'],
  pins: { VCC: '5V', DATA: 'D2', GND: 'GND' },
  electrical: ['DHT11 runs on 3.3–5 V. The 3-pin module has the 10 kΩ pull-up on DATA built in.', 'It can only be read once every 2 seconds.'],
  parts: [UNO, P('d', 'dht', 150, 'DHT11')],
  wires: [['uno.5V', 'd.vcc'], ['uno.D2', 'd.data'], ['uno.GND', 'd.gnd']],
  code: `#include <DHT.h>          // Adafruit "DHT sensor library"
#define DHT_PIN 2
DHT dht(DHT_PIN, DHT11);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  float h = dht.readHumidity();
  if (isnan(h)) { Serial.println("Sensor error"); }
  else { Serial.print(h); Serial.println(" %"); }
  delay(2000);               // DHT11 needs 2 s between readings
}`,
  explain: [['DHT dht(2, DHT11)', 'Creates the sensor object on pin 2.'], ['readHumidity()', 'Returns relative humidity in %.'], ['delay(2000)', 'The sensor is slow: one reading every 2 s.']],
  sim: 'hum',
  params: [{ k: 'hum', label: 'Air humidity', min: 20, max: 90, step: 1, def: 50, unit: '%' }, { k: 'temp', label: 'Air temperature', min: 0, max: 50, step: 1, def: 25, unit: '°C' }],
  live: () => ({}),
  practice: 'Wire the DHT11, move the humidity slider and wait for the next reading.',
  hints: ['The module has power, ground and one data pin.', 'DATA is a digital signal.', 'DATA goes to D2.'],
  tests: [
    { name: 'Reads 65 %', steps: [{ set: { hum: 65 }, wait: 2500, expect: { hum: 65 } }] },
    { name: 'Reads 30 %', steps: [{ set: { hum: 30 }, wait: 2500, expect: { hum: 30 } }] },
  ],
  completion: 'Wiring is correct and humidity readings update.',
};
