#!/opt/node/bin/node

var util			= require('util');
var EventEmitter	= require('events').EventEmitter;

var Logger			= require('./util/logger');
var Nrf_register	= require('./util/nrf-register');
var Nrf_executor	= require('./util/nrf-command');
var Nrf_io			= require('./util/nrf-io');
var Nrf_scheduler	= require('./util/nrf-task-scheduler');

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
	this.nrf_io.init(spidev, callback, function(nrf) {
		return function() {
			nrf.irq_callback.call(nrf);
		}
	}(this));
}

Nrf.prototype.get_logger = function()
{
	return this.logger;
}


Nrf.prototype.get_details = function(obj)
{
	return util.inspect(obj);
}

Nrf.prototype.print_details = function(callback)
{
	this.get_all_registers(function(regset) {
		this.logger.log(this.get_details(regset));
		if(typeof callback == 'function')
			callback(regset);
	});
}

Nrf.prototype.get_all_registers = function(callback, regset)
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

Nrf.prototype.set_all_registers = function(callback, regset)
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
					this.executor.exec.call(this.executor, Nrf_executor.w_register, register.addr, register.get_value(), function(err, data) {
						if(err)
							this.logger.log('Failed to update module registers');
						callback();
					});
				}
			}(register));
		}
	scheduler.run(function(regset, nrf) {
		return function() {
			callback.call(nrf, regset);
		}
	}(regset, this));
}

Nrf.prototype.set_register = function(register, callback, regset)
{
	if(typeof regset == 'undefined')
		regset = this.nrf_regset;
	this.executor.exec.call(this.executor, Nrf_executor.w_register, register.addr, register.get_value(), function(err, data) {
		if(err)
			this.logger.log('Failed to update register');
		callback(err, data);
	});
}

Nrf.prototype.get_register = function(register, callback, regset)
{
	if(typeof regset == 'undefined')
		regset = this.nrf_regset;
	var buff = new Buffer(register.length);
	buff.fill(0);
	this.executor.exec.call(this.executor, Nrf_executor.r_register, register.addr, buff, function(err, data) {
		if(err)
			this.logger.log('Failed to update register');
		callback(err, data);
	});
}

Nrf.prototype.irq_callback = function()
{
	this.logger.log('Received IRQ', Logger.level.debug);
	
}

util.inherits(Nrf, EventEmitter);

var nrf = new Nrf();
nrf.get_logger().set_devel(Logger.level.debug);
nrf.init(function() {
	nrf.nrf_regset.rf_ch.rf_ch.set_value(0x42);
	nrf.set_register.call(nrf, nrf.nrf_regset.rf_ch, function() {
		nrf.get_register.call(nrf, nrf.nrf_regset.rf_ch, function(err, data) {
			nrf.logger.log(nrf.get_details(data));
		});
	});
});
