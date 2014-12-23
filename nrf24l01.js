#!/opt/node/bin/node

var util			= require('util');

var Logger			= require('./util/logger');
var Nrf_register	= require('./util/nrf-register');
var Nrf_executor	= require('./util/nrf-command');
var Nrf_io			= require('./util/nrf-io');
var Nrf_scheduler	= require('./util/nrf-task-scheduler');


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

function Nrf()
{
	this.logger = new Logger('NRF');
}

Nrf.prototype.init = function(callback, spidev, gpio_ce, gpio_csn, gpio_irq)
{
	if(typeof spidev == 'undefined')
		spidev = '/dev/spidev0.1';
	if(typeof gpio_ce == 'undefined')
		gpio_ce = 'GPIO25';
	if(typeof gpio_csn == 'undefined')
		gpio_csn = 'GPIO22';
	if(typeof gpio_irq == 'undefined')
		gpio_irq = 'GPIO27';

	this.nrf_io = new Nrf_io(gpio_ce, gpio_csn, gpio_irq);
	this.nrf_io.get_logger().set_devel(this.logger.get_devel());
	this.executor = new Nrf_executor(this.nrf_io);
	this.executor.get_logger().set_devel(this.logger.get_devel());
	this.nrf_regset =  new Nrf_register();
	this.nrf_io.init(spidev, callback);
}

Nrf.prototype.get_logger = function()
{
	return this.logger;
}


Nrf.prototype.get_details = function(obj)
{
	return util.inspect(obj);
}

Nrf.prototype.print_details = function()
{
	this.update_all_registers(function(regset) {
		this.logger.log(this.get_details(regset));
	});
}

Nrf.prototype.update_all_registers = function(callback, regset)
{
	if(typeof regset == 'undefined')
		regset = this.nrf_regset;
	var scheduler = new Nrf_scheduler(this);
	scheduler.get_logger().set_devel(this.logger.get_devel());
	for(var key in regset)
		if(regset.hasOwnProperty(key))
		{
			var register = regset[key];
			scheduler.add_task(function(register) {
				return function(callback) {
					var buff = new Buffer(register.length);
					buff.fill(0);
					this.executor.exec.call(this.executor, Nrf_executor.r_register, register.addr, buff, function(err, data) {
						if(err)
							this.logger.log('Failed to update data');
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
	scheduler.run(function(regset, nrf) {
		return function() {
			callback.call(nrf, regset);
		}
	}(regset, this));
}

var nrf = new Nrf();
nrf.get_logger().set_devel(Logger.level.debug);
nrf.init(function() {
	nrf.print_details.call(nrf);
});
