#!/opt/node/bin/node

var Logger			= require('./util/logger');
var Nrf_register	= require('./util/nrf-register');
var Nrf_executor	= require('./util/nrf-command');
var Nrf_io			= require('./util/nrf-io');

var logger = new Logger('NRF', Logger.level.debug);
var nrf_io = new Nrf_io('GPIO25', 'GPIO22', 'GPIO27');
nrf_io.get_logger().set_devel(logger.get_devel());
var executor = new Nrf_executor(nrf_io);
executor.get_logger().set_devel(logger.get_devel());
var nrf_regset =  new Nrf_register();

var read_register = function() 
{
	var buff = new Buffer(1);
	buff.fill(0x00);
	var util = require('util');
	executor.exec(Nrf_executor.r_register, 0x05, buff, function(err, data) {
		if(err)
			console.log('Error: ' + err);
		else
			console.log('Data: ' + util.inspect(data));
	});
}

var write_register = function() 
{
	nrf_regset.rf_ch.rf_ch.set_value(15);
	var util = require('util');
	executor.exec(Nrf_executor.w_register, 0x05, nrf_regset.rf_ch.get_value(), function(err, data) {
		if(err)
			console.log('Error: ' + err);
		else
			console.log('Data: ' + util.inspect(data));
		read_register();
	});
}

nrf_io.init('/dev/spidev0.1', write_register);

