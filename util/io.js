var gpio	= require('rpi-gpio');
var gpiomap	= require('./gpio-pinmap');
var Logger	= require('./logger');

var logger  = new Logger('IO');
logger.set_prefix('IO');

function get_logger()
{
	return logger;
}

function write_pin(pin, state, callback)
{
	gpio.write(pin, state, function(err) {
		callback(err);
	});
}

function read_pin(pin, callback)
{
	gpio.read(pin, function(err, state) {
		callback(err, state);
	});
}

function listen_change(pin, callback)
{
	gpio.on('change', function(pin_, state) {
			if(pin_ == pin)
				callback(state);
	});
}

function listen_state(pin, state, callback)
{
	gpio.on('change', function(pin_, state_) {
			if(pin_ == pin && state_ == state)
				callback();
	});
}

function IO_pin(pin, mode)
{
	this.pin = pin;
	this.mode = mode;
	this.ready = false;
}

IO_pin.prototype.copy = function()
{
	return new IO_pin(this.pin, this.mode);
}

function IO_config()
{
	this.ios = [];
}

IO_config.prototype.add_pin = function(pin, mode)
{
	this.ios.push(new IO_pin(pin, mode));
};

IO_config.prototype.apply = function(callback)
{
	for (var i = 0; i < this.ios.length; i++)
	{
		var io = this.ios[i];
		var config = this;
		gpio.setup(io.pin, io.mode, function(io) { return function(err) { config.pin_setup(err, io, callback); }}(io));
	}
};

IO_config.prototype.pin_setup = function(err, io, callback)
{
	if(err)
	{
		logger.log('GPIO setup failed:');
		logger.log(err);
		process.exit(-2);
	}
	else
	{
		io.ready = true;
		logger.log('GPIO' + gpiomap.pin_to_gpio(io.pin) + ' initialized: ' + io.mode, Logger.level.debug);
		var ready = true;
		for (var i = 0; i < this.ios.length; i++)
		{
			ready &= this.ios[i].ready;
		}
		if(ready)
			callback();
	}
};

module.exports = Object();
module.exports.IO_pin = IO_pin;
module.exports.IO_config = IO_config;
module.exports.get_logger = get_logger;
module.exports.gpio_to_pin = gpiomap.gpio_to_pin;
module.exports.pin_to_gpio = gpiomap.pin_to_gpio;
module.exports.pin_mode = new Object();
module.exports.pin_mode.in = gpio.DIR_IN;
module.exports.pin_mode.out = gpio.DIR_OUT;
module.exports.listen_state = listen_state;
module.exports.listen_change = listen_change;
module.exports.write_pin = write_pin;
module.exports.read_pin = read_pin;