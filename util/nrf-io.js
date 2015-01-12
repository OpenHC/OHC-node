var spi		= require('pi-spi');
var IO		= require('./io');
var Logger	= require('./logger');
var Nrf_cmd = require('./nrf-command');

function Nrf_io(pin_ce, pin_csn, pin_irq)
{
	this.logger = new Logger('NRF-IO');
	this.io = new IO();

	this.CE = IO.gpio_to_pin(pin_ce);
	this.CSN = IO.gpio_to_pin(pin_csn);
	this.IRQ = IO.gpio_to_pin(pin_irq);
 }

 Nrf_io.prototype.init = function(spi_dev, callback, irq_callback)
 {
 	this.irq_callback = irq_callback;
	this.spi = spi.initialize(spi_dev);
	this.spi.clockSpeed(500000);
	this.logger.log('SPI initialized', Logger.level.info);

	var ioready = false;

	var ioconf = new IO.Config();
	ioconf.get_logger().set_devel(this.logger.get_devel());
	ioconf.add_pin(this.CE, IO.pin_mode.out);
	ioconf.add_pin(this.CSN, IO.pin_mode.out);
	ioconf.add_pin(this.IRQ, IO.pin_mode.in);
	ioconf.apply(function(nrf_io) {
		return function() {
			ioready = true;
			nrf_io.logger.log("GPIO setup sucessful", Logger.level.info);
			nrf_io.io.listen_state(nrf_io.IRQ, false, function() {
				nrf_io.irq.call(nrf_io);
			});
			if(typeof callback == 'function')
				callback();
		};
	}(this));
}

Nrf_io.prototype.ce_hi = function(callback)
{
	this.io.write_pin(this.CE, true, function() {
		if(typeof callback != 'undefined')
			callback();
	});
}

Nrf_io.prototype.ce_lo = function(callback)
{
	this.io.write_pin(this.CE, false, function() {
		if(typeof callback != 'undefined')
			callback();
	});
}

Nrf_io.prototype.csn_hi = function(callback)
{
	this.io.write_pin(this.CSN, true, function() {
		if(typeof callback != 'undefined')
			callback();
	});
}

Nrf_io.prototype.csn_lo = function(callback)
{
	this.io.write_pin(this.CSN, false, function() {
		if(typeof callback != 'undefined')
			callback();
	});
}

Nrf_io.prototype.irq = function()
{
	this.logger.log('IRQ', Logger.level.debug);
	this.irq_callback();
}

Nrf_io.prototype.get_logger = function()
{
	return this.logger;
}

Nrf_io.prototype.spi_write = function(buff, callback)
{
	this.spi.write(buff, callback);
}

Nrf_io.prototype.spi_read = function(length, callback)
{
	this.spi.read(length, callback);
}

Nrf_io.prototype.spi_transfer = function(buff, callback) //Simple synchronus transfer, returns as many bytes as put in
{
	this.spi.transfer(buff, buff.length, function(err, data) {
		callback(err, data);
	});
}

module.exports = Nrf_io;
