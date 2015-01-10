var fs = require('fs');

function Config(file)
{
	this.file = file;
	if(!fs.existsSync(file))
	{
		this.fwrite(file, JSON.stringify(new Object()));
	}
	this.config = JSON.parse(this.fread(file));
}

Config.prototype.save = function()
{
	this.fwrite(this.file, JSON.stringify(this.config));
}

Config.prototype.fwrite = function(file, str)
{
	fs.writeFileSync(file, str, {mdoe: 0640});
}

Config.prototype.fread = function(file, str)
{
	return fs.readFileSync(file, {encoding: "utf8"});
}

module.exports = Config;
