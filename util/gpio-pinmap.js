var gpio_to_pin = [];
gpio_to_pin[2] = 3;
gpio_to_pin[3] = 5;
gpio_to_pin[4] = 7;
gpio_to_pin[14] = 8;
gpio_to_pin[15] = 10;
gpio_to_pin[17] = 11;
gpio_to_pin[18] = 12;
gpio_to_pin[27] = 13;
gpio_to_pin[22] = 15;
gpio_to_pin[23] = 16;
gpio_to_pin[24] = 18;
gpio_to_pin[10] = 19;
gpio_to_pin[9] = 21;
gpio_to_pin[25] = 22;
gpio_to_pin[11] = 23;
gpio_to_pin[8] = 24;
gpio_to_pin[7] = 26;

var pin_to_gpio = [];
pin_to_gpio[3] = 2;
pin_to_gpio[5] = 3;
pin_to_gpio[7] = 4;
pin_to_gpio[8] = 14;
pin_to_gpio[10] = 15;
pin_to_gpio[11] = 17;
pin_to_gpio[12] = 18;
pin_to_gpio[13] = 27;
pin_to_gpio[15] = 22;
pin_to_gpio[16] = 23;
pin_to_gpio[18] = 24;
pin_to_gpio[19] = 10;
pin_to_gpio[21] = 9;
pin_to_gpio[22] = 25;
pin_to_gpio[23] = 11;
pin_to_gpio[24] = 8;
pin_to_gpio[26] = 7;

module.exports = new Object();

module.exports.gpio_to_pin = function(gpio)
{
	return gpio_to_pin[gpio];
}

module.exports.pin_to_gpio = function(pin)
{
	return pin_to_gpio[pin];
}
