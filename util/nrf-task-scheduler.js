var Logger = require('./logger');

function Scheduler(env)
{
	this.logger = new Logger('NRF-SCHED');
	if(typeof env == 'undefined')
		env = this;
	this.env = env;
	this.tasks = [];
}

Scheduler.prototype.add_task = function(func)
{
	this.logger.log('Task added', Logger.level.debug);
	this.tasks.push(func);
}

Scheduler.prototype.run = function(callback)
{
	this.logger.log('Scheduler started', Logger.level.debug);
	this.callback = callback;
	this.run_next();
}

Scheduler.prototype.run_next = function()
{
	this.logger.log('Task completed', Logger.level.debug);
	if(this.tasks.length > 0)
		this.tasks.shift().call(this.env, function(scheduler) {
			return function() {
				scheduler.run_next.call(scheduler); //Ensure correct scope
			}
		}(this));
	else
	{
		this.callback.call(this.env);
		this.logger.log('Scheduler execution finished', Logger.level.debug);
	}
}

Scheduler.prototype.get_logger = function()
{
	return this.logger;
}

module.exports = Scheduler;