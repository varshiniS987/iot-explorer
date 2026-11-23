/** One 3D image for each of the 30 learning topics (files are in public/components). */
export const TOPIC_IMAGES: Record<number, string> = {
  1: 'arduino-uno.png', 2: 'ultrasonic.svg', 3: 'ir.svg', 4: 'temp.png', 5: 'dht11.png', 6: 'ldr.png', 7: 'soil.png', 8: 'lcd.png', 9: 'pot.png', 10: 'buttons.png',
  11: 'buzzer.png', 12: 'leds.png', 13: 'resistors.png', 14: 'servo.png', 15: 'relay.png', 16: 'hc05.png', 17: 'gsm.png', 18: 'sim.png', 19: 'lora.png', 20: 'xbee.png',
  21: 'esp8266.png', 22: 'gateway.png', 23: 'breadboard.png', 24: 'jumper-wires.svg', 25: 'usb.png', 26: 'psu.png', 27: 'demo-load.png', 28: 'antenna.png', 29: 'level-shifter.svg', 30: 'smartphone.svg',
};
export const topicImage = (id: number) => `/components/${TOPIC_IMAGES[id] ?? 'arduino-uno.png'}`;