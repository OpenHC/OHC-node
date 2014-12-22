var gpiomap = [];
gpiomap[2] = 3;
gpiomap[3] = 5;
gpiomap[4] = 7;
gpiomap[14] = 8;
gpiomap[15] = 10;
gpiomap[17] = 11;
gpiomap[18] = 12;
gpiomap[27] = 13;
gpiomap[22] = 15;
gpiomap[23] = 16;
gpiomap[24] = 18;
gpiomap[10] = 19;
gpiomap[9] = 21;
gpiomap[25] = 22;
gpiomap[11] = 23;
gpiomap[8] = 24;
gpiomap[7] = 26;

var pinmap = [];
pinmap[3] = 2;
pinmap[5] = 3;
pinmap[7] = 4;
pinmap[8] = 14;
pinmap[10] = 15;
pinmap[11] = 17;
pinmap[12] = 18;
pinmap[13] = 27;
pinmap[15] = 22;
pinmap[16] = 23;
pinmap[18] = 24;
pinmap[19] = 10;
pinmap[21] = 9;
pinmap[22] = 25;
pinmap[23] = 11;
pinmap[24] = 8;
pinmap[26] = 7;

function gpio_to_pin(gpio)
{
	if(typeof gpio == 'string') //Handle 'GPIO25' etc.
		return gpio_to_pin(parseInt(gpio.match(/[0-9]+/)));
	return gpiomap[gpio];
}

function pin_to_gpio(pin)
{
	if(typeof pin == 'string') //Handle 'PIN7' etc.
		return pin_to_gpio(parseInt(pin.match(/[0-9]+/)));
	return pinmap[pin];
}

module.exports = new Object();
module.exports.gpio_to_pin = gpio_to_pin;
module.exports.pin_to_gpio = pin_to_gpio;