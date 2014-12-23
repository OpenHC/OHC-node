var Logger			= require('./logger');
var Nrf_scheduler	= require('./nrf-task-scheduler');
var util			= require('util');

function Command_executor(nrf_io)
{
	this.nrf_io = nrf_io;
	this.logger = new Logger('NRF-CMD');
}

Command_executor.prototype.exec = function(cmd, param, data, exec_callback)
{
	if(typeof param == 'undefined')
		param = 0;
	if(typeof data == 'undefined')
		data = new Buffer(0);
	var bincmd = new Buffer([(cmd | param) & 0xFF]);
	var len = data.length;
	var nrf_io = this.nrf_io;
	var scheduler = new Nrf_scheduler(this);
	scheduler.get_logger().set_devel(this.logger.get_devel());
	scheduler.add_task(function(callback) {
		this.logger.log('Pulling CSN low', Logger.level.debug);
		nrf_io.csn_lo.call(nrf_io, callback);
	});
	scheduler.add_task(function(bincmd) {
		return function(callback){
			this.logger.log('Writing cmd to spi' + util.inspect(bincmd), Logger.level.debug);
			nrf_io.spi_write.call(nrf_io, bincmd, callback);
		}
	}(bincmd));
	if(data.length > 0)
		scheduler.add_task(function(data, scheduler) {
			return function(callback){
				this.logger.log('Writing data to spi' + util.inspect(data), Logger.level.debug);
				nrf_io.spi_transfer.call(nrf_io, data, function(trans_err, trans_data) {
					callback();
					scheduler.trans_err = trans_err;
					scheduler.trans_data = trans_data;
				});
			}
		}(data, scheduler));
	scheduler.add_task(function(callback) {
		this.logger.log('Pulling CSN high', Logger.level.debug);
		nrf_io.csn_hi.call(nrf_io, callback);
	});
	scheduler.add_task(function(callback) {
		setTimeout(callback, 1);
	});
	scheduler.run(function(scheduler) {
		return function() {
			exec_callback(scheduler.trans_err, scheduler.trans_data);
		}
	}(scheduler));
}

Command_executor.prototype.get_logger = function()
{
	return this.logger;
}

Command_executor.r_register				= parseInt('00000000', 2);
Command_executor.w_register				= parseInt('00100000', 2);
Command_executor.r_rx_payload			= parseInt('01100001', 2);
Command_executor.w_tx_payload			= parseInt('01100000', 2);
Command_executor.flush_tx				= parseInt('11100001', 2);
Command_executor.flush_rx				= parseInt('11100010', 2);
Command_executor.reuse_tx_pl			= parseInt('11100011', 2);
Command_executor.r_rx_pl_wid			= parseInt('01100000', 2);
Command_executor.w_ack_payload			= parseInt('10101000', 2);
Command_executor.w_tx_payload_no_ack	= parseInt('10110000', 2);
Command_executor.nop					= parseInt('11111111', 2);

module.exports = Command_executor;