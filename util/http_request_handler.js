var querystring = require('querystring');

function Handler(ohc, request, response, callback)
{
	this.origin = request.connection.remoteAddress
	this.data = new Buffer(0);
	var handler = this;
	request.on('data', function(data) {
		handler.on_receive_data.call(handler, data);
	});
	request.on('end', function() {
		handler.on_end.call(handler);
	});
	this.response = response;
	this.callback = callback;
}

Handler.prototype.on_receive_data = function(data)
{
	var data_new = new Buffer(this.data.length + data.length);
	this.data.copy(data_new);
	data.copy(data_new, this.data.length);
	this.data = data_new;
}

Handler.prototype.on_end = function()
{
	this.body = new Body();
	this.body.raw = this.data;
	this.body.string = this.data.toString();
	if(typeof this.body.string == 'string')
		this.body.post = querystring.parse(this.body.string);
	this.callback(this, this.response);
}

Handler.prototype.send_response = function(data)
{
	switch(typeof data)
	{
		case 'buffer':
			this.response.writeHead(200, 'OK', {'Content-Type': 'application/octet-stream'});
			break;
		case 'string':
			this.response.writeHead(200, 'OK', {'Content-Type': 'text/html'});
			break;
		default:
			this.response.writeHead(666, 'NOPE', {'Content-Type': 'text/html'});
			this.response.end();
			return;		
	}
	this.response.write(data);
	this.response.end();
}

function Body()
{
	this.raw = undefined;
	this.string = undefined;
	this.post = new Object();
}

module.exports = Handler;
