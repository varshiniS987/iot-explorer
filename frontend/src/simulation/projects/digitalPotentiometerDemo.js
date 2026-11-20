import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'digital-potentiometer-demo', no: 10, name: 'Digital Potentiometer Demo (Arduino UNO)', category: 'Controllers', difficulty: 'Advanced',
  description: 'Control a resistance with code using an SPI chip.',
  objective: 'Send SPI commands to an MCP41010 (10 kΩ, 256 steps) and watch the wiper voltage change.',
  components: ['Arduino UNO', 'MCP41010 digital potentiometer (DIP-8)'],
  pins: { CS: 'D10', SCK: 'D13', SI: 'D11', 'PW0 (wiper)': 'A0' },
  electrical: ['MCP41010 selected: 10 kΩ, 256 taps, SPI, powered from 5 V.', 'PA0 to 5 V and PB0 to GND make the wiper a voltage divider (0–5 V).', 'Wiper current must stay under about 1 mA: read it with the high-impedance analog input only.'],
  parts: [UNO, P('m', 'mcp', 150, 'MCP41010')],
  wires: [['uno.D10', 'm.cs'], ['uno.D13', 'm.sck'], ['uno.D11', 'm.si'], ['uno.GND', 'm.vss'], ['uno.5V', 'm.vdd'], ['uno.5V', 'm.pa0'], ['uno.GND2', 'm.pb0'], ['uno.A0', 'm.pw0']],
  code: `#include <SPI.h>
const int CS_PIN = 10;

void setPot(byte value) {
  digitalWrite(CS_PIN, LOW);
  SPI.transfer(0x11);          // command: write data to pot 0
  SPI.transfer(value);         // wiper position 0-255
  digitalWrite(CS_PIN, HIGH);
}

void setup() {
  Serial.begin(9600);
  pinMode(CS_PIN, OUTPUT);
  digitalWrite(CS_PIN, HIGH);
  SPI.begin();                 // SCK = D13, MOSI (SI) = D11
}

void loop() {
  for (int v = 0; v <= 255; v += 51) {
    setPot(v);
    delay(300);
    Serial.println(analogRead(A0) * 5.0 / 1023.0);   // wiper voltage
  }
}`,
  explain: [['digitalWrite(CS_PIN, LOW)', 'Selects the chip: CS is active LOW.'], ['SPI.transfer(0x11)', 'Command byte: write to potentiometer 0.'], ['SPI.transfer(value)', 'Sets the wiper from 0 to 255.']],
  sim: 'digipot',
  params: [{ k: 'wiper', label: 'Wiper position', min: 0, max: 255, step: 1, def: 128, unit: '' }],
  live: () => ({}),
  practice: 'Wire the SPI lines, power and the three potentiometer terminals. Then move the wiper and check the voltage.',
  hints: ['Four wires carry SPI: CS, SCK and SI plus power and ground.', 'PA0 and PB0 are the two ends of the resistor; PW0 is the wiper.', 'Put PA0 on 5V, PB0 on GND and read PW0 on A0. CS = D10, SCK = D13, SI = D11.'],
  tests: [
    { name: 'Mid position about 2.5 V', steps: [{ set: { wiper: 128 }, wait: 100, expect: { vout: [2.45, 2.55], cmd: '0x11 0x80' } }] },
    { name: 'Zero is about 0 V', steps: [{ set: { wiper: 0 }, wait: 100, expect: { vout: [0, 0.02] } }] },
    { name: 'Max is about 5 V', steps: [{ set: { wiper: 255 }, wait: 100, expect: { vout: [4.9, 5] } }] },
  ],
  completion: 'SPI wiring is correct and the output voltage follows the commands.',
};
