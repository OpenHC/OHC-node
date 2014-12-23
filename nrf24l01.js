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
var read_register = function() 
{
	var buff = new Buffer(1);
	buff.fill(0);
	var util = require('util');
	executor.exec(Nrf_executor.r_register, 0x05, buff, function(err, data) {
		if(err)
			console.log('Error: ' + err);
		else
			console.log('Data: ' + util.inspect(data));
	});
}
nrf_io.init('/dev/spidev0.1', read_register);

