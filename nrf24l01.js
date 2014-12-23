#!/opt/node/bin/node

var util			= require('util');

var Logger			= require('./util/logger');
var Nrf_register	= require('./util/nrf-register');
var Nrf_executor	= require('./util/nrf-command');
var Nrf_io			= require('./util/nrf-io');
var Nrf_scheduler	= require('./util/nrf-task-scheduler');

var logger = new Logger('NRF', Logger.level.debug);
var nrf_io = new Nrf_io('GPIO25', 'GPIO22', 'GPIO27');
nrf_io.get_logger().set_devel(logger.get_devel());
var executor = new Nrf_executor(nrf_io);
executor.get_logger().set_devel(logger.get_devel());
var nrf_regset =  new Nrf_register();

var read_register = function() 
{
	var util = require('util');
	executor.exec(Nrf_executor.r_register, 0x05, new Buffer(1), function(err, data) {
		if(err)
			console.log('Error: ' + err);
		else
		{
			console.log('Data: ' + util.inspect(data));
			nrf_regset.rf_ch.rf_ch.set_from_register(data);
			console.log(util.inspect(nrf_regset.rf_ch.rf_ch));
		}
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

nrf_io.init('/dev/spidev0.1', function() {
	update_all_registers(nrf_regset, function(regset) {
		console.log(get_details(regset));
	});
});

//nrf_io.init('/dev/spidev0.1', write_register);

function get_details(regset)
{
	return util.inspect(regset);
}

function update_all_registers(callback, regset)
{
	var scheduler = new Nrf_scheduler();
	scheduler.get_logger().set_devel(logger.get_devel());
	for(var key in regset)
		if(regset.hasOwnProperty(key))
		{
			var register = regset[key];
			scheduler.add_task(function(register) {
				return function(callback) {
					var buff = new Buffer(register.length);
					buff.fill(0);
					executor.exec.call(executor, Nrf_executor.r_register, register.addr, buff, function(err, data) {
						if(err)
							logger.log('Failed to update data');
						else
						{
							for(var key_ in register.fields)
								if(register.fields.hasOwnProperty(key_))
								{
									var bitfield = register.fields[key_];
									bitfield.set_from_register(data);
								}
						}
						callback();
					});
				};
			}(register));
		}
	scheduler.run(function(regset) {
		return function() {
			callback(regset);
		}
	}(regset));
}

function Nrf()
{

}