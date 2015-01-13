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
	EventEmitter.call(this);
	this.transmitting = false;
}

util.inherits(Nrf, EventEmitter);

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

Nrf.prototype.is_transmitting = function()
{
	return this.transmitting;
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
			scheduler.add_task(function(register, nrf) {
				return function(callback) {
					var buff = new Buffer(register.length);
					buff.fill(0);
					this.executor.exec.call(this.executor, Nrf_executor.r_register, register.addr, buff, function(err, data) {
						if(err)
							nrf.logger.log('Failed to update data');
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
			}(register, this));
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
			scheduler.add_task(function(register, nrf) {
				return function(callback) {
					this.executor.exec.call(this.executor, Nrf_executor.w_register, register.addr, register.get_value(), function(err, data) {
						if(err)
							nrf.logger.log('Failed to update module registers');
						callback();
					});
				}
			}(register, this));
		}
	scheduler.run(function(regset, nrf) {
		return function() {
			callback.call(nrf, regset);
		}
	}(regset, this));
}

Nrf.prototype.set_register = function(register, callback)
{
	this.executor.exec.call(this.executor, Nrf_executor.w_register, register.addr, register.get_value(), function(nrf) {
		return function(err, data) {
			if(err)
				nrf.logger.log('Failed to update register');
			callback(err, data);
		}
	}(this));
}

Nrf.prototype.get_register = function(register, callback)
{
	var buff = new Buffer(register.length);
	buff.fill(0);
	this.executor.exec.call(this.executor, Nrf_executor.r_register, register.addr, buff, function(nrf) {
		return function(err, data) {
			if(err)
				nrf.logger.log('Failed to update register');
			else
				register.set_value(data);
			callback(err, data);
		}
	}(this));
}

Nrf.prototype.irq_callback = function()
{
	this.logger.log('Received IRQ', Logger.level.debug);
	var buff = new Buffer(1);
	buff.fill(0);
	this.get_register(this.nrf_regset.status, function(nrf) {
		return function(err, data) {
			if(err)
				nrf.logger.log('Failed to get status');
			else
			{
				if(!nrf.emit('irq', nrf.nrf_regset.status))
				{
					nrf.clear_irq_flags();
				}
				nrf.transmitting = false;
			}
		}
	}(this));
}

Nrf.prototype.clear_irq_flags = function(callback)
{
	var regmap = new Nrf_register();
	regmap.status.rx_dr.set_value(1);
	regmap.status.tx_ds.set_value(1);
	regmap.status.max_rt.set_value(1);
	this.set_register(regmap.status, function(nrf) {
		return function() {
			nrf.get_register.call(nrf, nrf.nrf_regset.status, function(err, data) {
				if(callback)
					callback(err, data);
			});
		}
	}(this));
}

Nrf.prototype.init_module = function(callback)
{
	this.nrf_regset = new Nrf_register();
	this.nrf_regset.config.crco.set_value(1);
	this.nrf_regset.config.en_crc.set_value(1);
	this.nrf_regset.rf_setup.rf_dr_high.set_value(0);
	this.nrf_regset.rx_pw_p0.rx_pw_p0.set_value(32);
	this.nrf_regset.rx_pw_p1.rx_pw_p1.set_value(32);
	this.nrf_regset.setup_retr.ard.set_value(15);
	var scheduler = new Nrf_scheduler(this);
	scheduler.get_logger().set_devel(this.logger.get_devel());
	scheduler.add_task(function(callback) {
		this.set_all_registers(callback);
	});
	scheduler.add_task(function(callback) {
		this.flush_rx(callback);
	});
	scheduler.add_task(function(callback) {
		this.flush_tx(callback);
	});
	scheduler.add_task(function(callback) {
		this.clear_irq_flags(callback);
	});
	scheduler.run(function() {
		callback.call(this);
	});
}

Nrf.prototype.init_rx = function(callback)
{
	this.nrf_regset.config.prim_rx.set_value(1);
	this.nrf_regset.config.pwr_up.set_value(1);
	var scheduler = new Nrf_scheduler(this);
	scheduler.get_logger().set_devel(this.logger.get_devel());
	scheduler.add_task(function(callback) {
		this.set_register(this.nrf_regset.config, callback);
	});
	scheduler.add_task(function(callback) {
		this.nrf_io.ce_hi(callback);
	});
	scheduler.run(callback);
}

Nrf.prototype.init_tx = function(callback)
{
	this.nrf_regset.config.prim_rx.set_value(0);
	this.nrf_regset.config.pwr_up.set_value(1);
	var scheduler = new Nrf_scheduler(this);
	scheduler.get_logger().set_devel(this.logger.get_devel());
	scheduler.add_task(function(callback) {
		this.set_register(this.nrf_regset.config, callback);
	});
	scheduler.add_task(function(callback) {
		this.nrf_io.ce_hi(callback);
	});
	scheduler.run(callback);
}

Nrf.prototype.flush_rx = function(callback)
{
	this.executor.exec.call(this.executor, Nrf_executor.flush_rx, 0, undefined, function(err, data) {
		callback(err, data);
	});	
}

Nrf.prototype.flush_tx = function(callback)
{
	this.executor.exec.call(this.executor, Nrf_executor.flush_tx, 0, undefined, function(err, data) {
		callback(err, data);
	});	
}

Nrf.prototype.set_channel = function(channel, callback)
{
	this.nrf_regset.rf_ch.rf_ch.set_value(channel);
	this.set_register(this.nrf_regset.rf_ch, callback);
}

Nrf.prototype.set_tx_address = function(address, callback)
{
	this.nrf_regset.tx_addr.tx_addr.set_value(address);
	this.set_register(this.nrf_regset.tx_addr, callback);
}

Nrf.prototype.set_rx_address = function(address, callback, pipe)
{
	if(typeof pipe == 'undefined')
		pipe = 0;
	if(pipe == 0)
	{
		this.nrf_regset.rx_addr_p0.rx_addr_p0.set_value(address);
		this.set_register(this.nrf_regset.rx_addr_p0, callback);
	}
	else if(pipe == 1)
	{
		this.nrf_regset.rx_addr_p1.rx_addr_p1.set_value(address);
		this.set_register(this.nrf_regset.rx_addr_p1, callback);
	}
	else if(pipe == 2)
	{
		this.nrf_regset.rx_addr_p2.rx_addr_p2.set_value(address);
		this.set_register(this.nrf_regset.rx_addr_p2, callback);
	}
	else if(pipe == 3)
	{
		this.nrf_regset.rx_addr_p3.rx_addr_p3.set_value(address);
		this.set_register(this.nrf_regset.rx_addr_p3, callback);
	}
	else if(pipe == 4)
	{
		this.nrf_regset.rx_addr_p4.rx_addr_p4.set_value(address);
		this.set_register(this.nrf_regset.rx_addr_p4, callback);
	}
	else if(pipe == 5)
	{
		this.nrf_regset.rx_addr_p5.rx_addr_p5.set_value(address);
		this.set_register(this.nrf_regset.rx_addr_p5, callback);
	}
}

Nrf.prototype.set_payload_width = function(callback, pipe, width)
{
	if(typeof width == 'undefined')
		width = 32;
	if(typeof pipe == 'undefined')
		pipe = 0;
	if(pipe == 0)
	{
		this.nrf_regset.rx_pw_p0.rx_pw_p0.set_value(width);
		this.set_register(this.nrf_regset.rx_pw_p0, callback);
	}
	else if(pipe == 1)
	{
		this.nrf_regset.rx_pw_p1.rx_pw_p1.set_value(width);
		this.set_register(this.nrf_regset.rx_pw_p1, callback);
	}
	else if(pipe == 2)
	{
		this.nrf_regset.rx_pw_p2.rx_pw_p2.set_value(width);
		this.set_register(this.nrf_regset.rx_pw_p2, callback);
	}
	else if(pipe == 3)
	{
		this.nrf_regset.rx_pw_p3.rx_pw_p3.set_value(width);
		this.set_register(this.nrf_regset.rx_pw_p3, callback);
	}
	else if(pipe == 4)
	{
		this.nrf_regset.rx_pw_p4.rx_pw_p4.set_value(width);
		this.set_register(this.nrf_regset.rx_pw_p4, callback);
	}
	else if(pipe == 5)
	{
		this.nrf_regset.rx_pw_p5.rx_pw_p5.set_value(width);
		this.set_register(this.nrf_regset.rx_pw_p5, callback);
	}
}

Nrf.prototype.send_data = function(data, callback)
{
	this.transmitting = true;
	if(typeof callback != 'function')
		callback = function() { };
	var scheduler = new Nrf_scheduler(this);
	scheduler.get_logger().set_devel(this.logger.get_devel());
	scheduler.add_task(function(callback) {
		this.nrf_io.ce_lo(callback);
	});
	scheduler.add_task(function(callback) {
		this.init_tx(callback);
	}); 	
	scheduler.add_task(function(nrf) {
		return function(callback) {
			this.executor.exec.call(this.executor, Nrf_executor.w_tx_payload, 0, data, function(err, data) {
				if(err)
					nrf.logger.log('Failed to write tx payload');
				else
					nrf.logger.log('Wrote tx payload ' + data.length + ' bytes', Logger.level.debug);
				callback();
			});
		};
	}(this));	
	scheduler.add_task(function(callback) {
		this.nrf_io.ce_hi(callback);
	});
	scheduler.add_task(function(callback) {
		this.nrf_io.ce_lo(callback);
	});
	scheduler.run(callback);
}

module.exports = Nrf;
