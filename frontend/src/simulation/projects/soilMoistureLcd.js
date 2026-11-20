import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'soil-moisture-lcd', no: 9, name: 'Soil Moisture Sensor + LCD Display (Arduino UNO)', category: 'Displays', difficulty: 'Intermediate',
  description: 'Show how wet the soil is on an LCD screen.',
  objective: 'Read an analog soil sensor and print the value and a status on a 16x2 I2C LCD.',
  components: ['Arduino UNO', 'Soil moisture sensor', '16x2 LCD with I2C backpack (address 0x27)'],
  pins: { 'Soil AO': 'A0', 'LCD SDA': 'A4', 'LCD SCL': 'A5' },
  electrical: ['Both modules run from 5 V.', 'I2C pins on the UNO are fixed: SDA = A4, SCL = A5.', 'Dry soil gives a high value (about 1023), wet soil a low one.'],
  parts: [UNO, P('s', 'soil', 60, 'Soil Sensor'), P('lcd', 'lcd', 220, 'LCD 16x2 I2C')],
  wires: [['uno.5V', 's.vcc'], ['uno.GND', 's.gnd'], ['uno.A0', 's.ao'], ['uno.5V', 'lcd.vcc'], ['uno.GND2', 'lcd.gnd'], ['uno.A4', 'lcd.sda'], ['uno.A5', 'lcd.scl']],
  code: `#include <Wire.h>
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);
const int SOIL_PIN = A0;

void setup() {
  lcd.init();
  lcd.backlight();
}

void loop() {
  int raw = analogRead(SOIL_PIN);
  int pct = constrain(map(raw, 1023, 300, 0, 100), 0, 100);
  lcd.setCursor(0, 0);
  lcd.print("Soil: "); lcd.print(pct); lcd.print("%   ");
  lcd.setCursor(0, 1);
  if (pct < 30)      lcd.print("Status: Dry    ");
  else if (pct < 60) lcd.print("Status: Moist  ");
  else               lcd.print("Status: Wet    ");
  delay(300);
}`,
  explain: [['LiquidCrystal_I2C', 'Library that talks to the LCD over 2 wires.'], ['map(raw, 1023, 300, 0, 100)', 'Converts the sensor value to 0–100 %.'], ['lcd.setCursor(col, row)', 'Chooses where the next text appears.']],
  sim: 'soil',
  params: [{ k: 'moist', label: 'Soil moisture', min: 0, max: 100, step: 1, def: 45, unit: '%' }],
  live: (o) => ({ lcd: o.lines }),
  practice: 'Wire the sensor and the LCD, then change the soil wetness and read the LCD.',
  hints: ['The LCD needs power and two I2C data wires.', 'On the UNO, I2C is on two analog pins.', 'SDA to A4, SCL to A5, sensor AO to A0.'],
  tests: [
    { name: 'Dry soil', steps: [{ set: { moist: 10 }, wait: 100, expect: { status: 'Dry' } }] },
    { name: 'Wet soil on LCD', steps: [{ set: { moist: 80 }, wait: 100, expect: { pct: [79, 81], lines: (v) => v[1].trim() === 'Status: Wet' } }] },
  ],
  completion: 'Sensor and LCD wiring is correct and the LCD shows the right result.',
};
