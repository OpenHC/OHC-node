#!/opt/node/bin/node

var spi			= require('pi-spi');
var Logger		= require('./util/logger');
var io			= require('./util/io');
var registers	= require('./util/nrf-register');

function irq()
{
	logger.log('IRQ', Logger.level.debug);
	//Do irq stuff here 
}

var logger = new Logger('NRF', Logger.level.debug);
io.get_logger().set_devel(logger.get_devel());
var CE = io.gpio_to_pin(25);
var CSN = io.gpio_to_pin(22);
var IRQ = io.gpio_to_pin(27);

var ioready = false;

spi = spi.initialize('/dev/spidev0.1');

logger.log('SPI initialized', Logger.level.info);

var ioconf = new io.IO_config();
ioconf.add_pin(CE, io.pin_mode.out);
ioconf.add_pin(CSN, io.pin_mode.out);
ioconf.add_pin(IRQ, io.pin_mode.in);
ioconf.apply(function() {
	ioready = true;
	logger.log("GPIO setup sucessful", Logger.level.info);
	io.listen_state(IRQ, false, function() {
		IRQ();
	});
});

var util = require('util');

console.log(util.inspect(registers));