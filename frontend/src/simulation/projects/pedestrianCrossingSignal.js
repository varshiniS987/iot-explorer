import { P, UNO } from '../utils/partDefs.js';
export default {
  id: 'pedestrian-crossing-signal', no: 14, name: 'Pedestrian Crossing Signal (Arduino UNO)', category: 'Lights', difficulty: 'Intermediate',
  description: 'A push button that stops cars so people can cross.',
  objective: 'Build a state machine with a button request, timed phases and safe signals.',
  components: ['Arduino UNO', 'Traffic light LED module', 'Pedestrian LED module (R, G)', 'Push button'],
  pins: { 'CAR R/Y/G': 'D8/D9/D10', 'PED R/G': 'D11/D12', BUTTON: 'D2' },
  electrical: ['Both LED modules have 220 Ω resistors on board.', 'Button uses INPUT_PULLUP.'],
  parts: [UNO, P('car', 'tlm', 340, 'Car Lights'), P('ped', 'ped', 440, 'Pedestrian'), P('b', 'btn', 530, 'Push Button')],
  wires: [['uno.D8', 'car.r'], ['uno.D9', 'car.y'], ['uno.D10', 'car.g'], ['uno.GND', 'car.gnd'], ['uno.D11', 'ped.r'], ['uno.D12', 'ped.g'], ['uno.GND2', 'ped.gnd'], ['uno.D2', 'b.a'], ['b.b', 'uno.GND3']],
  code: `const int CAR_R = 8, CAR_Y = 9, CAR_G = 10;
const int PED_R = 11, PED_G = 12, BTN = 2;
bool requested = false;

void lights(int cr, int cy, int cg, int pr, int pg) {
  digitalWrite(CAR_R, cr); digitalWrite(CAR_Y, cy); digitalWrite(CAR_G, cg);
  digitalWrite(PED_R, pr); digitalWrite(PED_G, pg);
}

void setup() {
  for (int p = 8; p <= 12; p++) pinMode(p, OUTPUT);
  pinMode(BTN, INPUT_PULLUP);
}

void loop() {
  lights(0, 0, 1, 1, 0);                         // cars go, people wait
  if (digitalRead(BTN) == LOW) requested = true;
  if (requested) {
    delay(3000);                                 // minimum green
    lights(0, 1, 0, 1, 0); delay(2000);          // cars slow
    lights(1, 0, 0, 0, 1); delay(5000);          // people cross
    for (int i = 0; i < 4; i++) {                // warning flashes
      lights(1, 0, 0, 1, 0); delay(250);
      lights(1, 0, 0, 0, 0); delay(250);
    }
    requested = false;
  }
}`,
  explain: [['requested', 'Remembers that someone pressed the button.'], ['lights(cr, cy, cg, pr, pg)', 'Sets all five lights in one call.'], ['delay()', 'Controls how long each phase lasts.']],
  sim: 'ped',
  params: [{ k: 'walk', label: 'Walk time', min: 3, max: 10, step: 1, def: 5, unit: 's' }],
  live: (o) => ({ car: o.car, ped: o.ped }),
  practice: 'Wire both light modules and the button. Press the button and check that cars and people are never green together.',
  hints: ['Count the pins: 3 car lights, 2 pedestrian lights, 1 button.', 'Every module needs a ground connection.', 'Car D8-D10, pedestrian D11-D12, button D2 to GND.'],
  tests: [
    { name: 'Cars go by default', steps: [{ wait: 200, expect: { state: 'carGreen', carG: true, safe: true } }] },
    { name: 'Button starts a safe crossing', steps: [{ hold: ['btn', 150], wait: 500, expect: { requested: true, state: 'carGreen' } }, { wait: 3000, expect: { state: 'carYellow' } }, { wait: 2000, expect: { state: 'walk', pedG: true, carG: false, safe: true } }, { wait: 5000, expect: { state: 'clear' } }, { wait: 2000, expect: { state: 'carGreen', requested: false } }] },
  ],
  completion: 'Wiring is correct and the crossing sequence is safe.',
};
