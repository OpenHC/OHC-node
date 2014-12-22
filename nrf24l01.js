#!/opt/node/bin/node

var Logger		= require('./util/logger');
var Nrf_reg_set	= require('./util/nrf-register');
var Nrf_cmd		= require('./util/nrf-command');
var Nrf_io		= require('./util/nrf-io');

var logger = new Logger('NRF', Logger.level.debug);
var nrf_io = new Nrf_io('GPIO25', 'GPIO22', 'GPIO27');
nrf_io.get_logger().set_devel(logger.get_devel());
nrf_io.init('/dev/spidev0.1');
var util = require('util');
console.log(util.inspect(nrf_io));