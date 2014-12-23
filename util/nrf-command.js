var Logger			= require('./logger');
var Nrf_scheduler	= require('./nrf-task-scheduler');

function Command(bincmd)
{
	this.cmd = bincmd;
}

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
			this.logger.log('Writing cmd to spi' + bincmd, Logger.level.debug);
			nrf_io.spi_write.call(nrf_io, bincmd, callback);
		}
	}(bincmd));
	if(data.length > 0)
		scheduler.add_task(function(data, scheduler) {
			return function(callback){
				this.logger.log('Writing data to spi' + data, Logger.level.debug);
				nrf_io.spi_transfer.call(nrf_io, data, function(trans_err, trans_data) {
					callback();
					scheduler.trans_err = trans_err;
					scheduler.trans_data = trans_data;
				});
			}
		}(data, scheduler));
	scheduler.add_task(function(callback) {
		this.logger.log('Pulling CSN high' + bincmd, Logger.level.debug);
		nrf_io.csn_hi.call(nrf_io, callback);
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

Command_executor.r_register				= new Command(parseInt('00000000', 2));
Command_executor.w_register				= new Command(parseInt('00100000', 2));
Command_executor.r_rx_payload			= new Command(parseInt('01100001', 2));
Command_executor.w_tx_payload			= new Command(parseInt('01100000', 2));
Command_executor.flush_tx				= new Command(parseInt('11100001', 2));
Command_executor.flush_rx				= new Command(parseInt('11100010', 2));
Command_executor.reuse_tx_pl			= new Command(parseInt('11100011', 2));
Command_executor.r_rx_pl_wid			= new Command(parseInt('01100000', 2));
Command_executor.w_ack_payload			= new Command(parseInt('10101000', 2));
Command_executor.w_tx_payload_no_ack	= new Command(parseInt('10110000', 2));
Command_executor.nop					= new Command(parseInt('11111111', 2));

module.exports = Command_executor;