var gpio	= require('rpi-gpio');
var gpiomap	= require('./gpio-pinmap');
var Logger	= require('./logger');

gpio.setPollFrequency(20);

function IO()
{
	this.logger = new Logger('IO');
	this.last_state = new Object();
	this.locked = false;
}

IO.prototype.get_logger = function()
{
	return this.logger;
}

IO.prototype.write_pin = function(pin, state, callback)
{
	gpio.write(pin, state, function(err) {
		callback(err);
	});
}

IO.prototype.read_pin = function(pin, callback)
{
	gpio.read(pin, function(err, state) {
		callback(err, state);
	});
}

IO.prototype.listen_state = function(pin, state, callback)
{
	this.read_pin(pin, function(io, pin, listen_state, listen_callback) {
		return function(err, state) {
			io.last_state[pin] = state;
			setInterval(function() {
				io.read_pin(pin, function(err, state) {
					if(state != io.last_state[pin])
					{
						if(state == listen_state)
						{
							listen_callback();
							io.last_state[pin] = state;
						}
						else
							io.last_state[pin] = state;
					}

				});
			}, 50);
		}
	}(this, pin, state, callback));
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
	this.logger = new Logger('IO-CONF');
}

IO_config.prototype.get_logger = function()
{
	return this.logger;
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
		gpio.setup(io.pin, io.mode, function(io, io_config) { 
			return function(err) { 
				config.pin_setup(err, io_config, io, callback); 
			}
		}(io, this));
	}
};

IO_config.prototype.pin_setup = function(err, io_config, io, callback)
{
	if(err)
	{
		io_config.logger.log('GPIO setup failed:');
		io_config.logger.log(err);
		process.exit(-2);
	}
	else
	{
		io.ready = true;
		io_config.logger.log('GPIO' + gpiomap.pin_to_gpio(io.pin) + ' initialized: ' + io.mode, Logger.level.debug);
		var ready = true;
		for (var i = 0; i < this.ios.length; i++)
		{
			ready &= this.ios[i].ready;
		}
		if(ready)
			callback();
	}
};

IO.Pin = IO_pin;
IO.Config = IO_config;
IO.gpio_to_pin = gpiomap.gpio_to_pin;
IO.pin_to_gpio = gpiomap.pin_to_gpio;
IO.pin_mode = {
	out:	gpio.DIR_OUT,
	in:		gpio.DIR_IN
};
module.exports = IO;
