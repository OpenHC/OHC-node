var Logger = function(prefix, devel)
{
	if(typeof prefix == 'undefined')
		prefix = 'log';
	this.prefix = '[' + prefix + '] ';
	if(typeof devel == 'undefined')
		devel = 0;
	this.devel = devel;
}

Logger.level = {
	error: 0,
	warning: 1,
	info: 2,
	debug: 3
	};


Logger.prototype.set_prefix = function(prefix)
{
	this.prefix = '[' + prefix + '] ';
}

Logger.prototype.get_prefix = function()
{
	return this.prefix;
}

Logger.prototype.set_devel = function(devel)
{
	this.devel = devel;
}

Logger.prototype.get_devel = function()
{
	return this.devel;
}

Logger.prototype.log = function(str, devel)
{
	if(typeof devel == 'undefined')
		devel = Logger.level.error;
	if(this.devel >= devel)
		console.log(this.prefix + str);
}

module.exports = Logger;
