import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'lcd-menu-system', no: 15, name: 'LCD Menu System (Arduino UNO)', category: 'Displays', difficulty: 'Advanced',
  description: 'Browse a menu on an LCD using three buttons.',
  objective: 'Use UP, DOWN and OK buttons to move through menu items and show a value.',
  components: ['Arduino UNO', '16x2 LCD with I2C backpack', '3-button pad'],
  pins: { 'LCD SDA/SCL': 'A4/A5', UP: 'D2', DOWN: 'D3', OK: 'D4' },
  electrical: ['LCD I2C pins on the UNO are fixed: SDA = A4, SCL = A5.', 'Buttons use INPUT_PULLUP and connect to the shared GND.'],
  parts: [UNO, P('lcd', 'lcd', 60, 'LCD 16x2 I2C'), P('pad', 'btn3', 340, '3-Button Pad')],
  wires: [['uno.5V', 'lcd.vcc'], ['uno.GND', 'lcd.gnd'], ['uno.A4', 'lcd.sda'], ['uno.A5', 'lcd.scl'], ['uno.D2', 'pad.up'], ['uno.D3', 'pad.dn'], ['uno.D4', 'pad.ok'], ['uno.GND2', 'pad.gnd']],
  code: `#include <Wire.h>
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);
const char* items[] = {"Temperature", "Humidity", "Light", "About"};
int index = 0;
bool detail = false;

bool pressed(int pin) {
  if (digitalRead(pin) == LOW) { delay(40); while (digitalRead(pin) == LOW); return true; }
  return false;
}

void draw() {
  lcd.clear();
  if (!detail) { lcd.print("== MENU =="); lcd.setCursor(0, 1); lcd.print("> "); lcd.print(items[index]); }
  else { lcd.print(items[index]); lcd.setCursor(0, 1); lcd.print("Value here"); }
}

void setup() {
  pinMode(2, INPUT_PULLUP); pinMode(3, INPUT_PULLUP); pinMode(4, INPUT_PULLUP);
  lcd.init(); lcd.backlight(); draw();
}

void loop() {
  if (!detail && pressed(2)) { index = (index + 3) % 4; draw(); }
  if (!detail && pressed(3)) { index = (index + 1) % 4; draw(); }
  if (pressed(4)) { detail = !detail; draw(); }
}`,
  explain: [['items[]', 'The menu text.'], ['index', 'Which item is selected.'], ['pressed(pin)', 'Waits out bounce and the release so one press is one event.']],
  sim: 'menu',
  params: [{ k: 'temp', label: 'Sample temperature', min: 0, max: 50, step: 1, def: 25, unit: '°C' }, { k: 'hum', label: 'Sample humidity', min: 20, max: 90, step: 1, def: 60, unit: '%' }, { k: 'light', label: 'Sample light', min: 0, max: 100, step: 1, def: 70, unit: '%' }],
  live: (o) => ({ lcd: o.lines }),
  practice: 'Wire the LCD and all three buttons, then use DOWN and OK in the simulation.',
  hints: ['The LCD needs 4 wires. The pad needs 4 wires.', 'Each button needs its own pin; they share ground.', 'UP D2, DOWN D3, OK D4, LCD on A4 and A5.'],
  tests: [
    { name: 'DOWN moves to Humidity', steps: [{ ev: ['down'], wait: 100, expect: { idx: 1, line2: '> Humidity' } }] },
    { name: 'OK opens and closes details', steps: [{ ev: ['down'], wait: 100 }, { ev: ['ok'], wait: 100, expect: { screen: 'detail', line2: '60 %' } }, { ev: ['ok'], wait: 100, expect: { screen: 'menu' } }] },
    { name: 'UP wraps around', steps: [{ ev: ['up'], wait: 100, expect: { idx: 3 } }] },
  ],
  completion: 'Wiring is correct and menu navigation works.',
};
