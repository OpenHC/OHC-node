function Packet_queue()
{
	this.queue = new Array();
}

Packet_queue.prototype.push = function(packet)
{
	this.queue.push(packet);
}

Packet_queue.prototype.next = function()
{
	return this.queue.shift();
}

Packet_queue.prototype.is_empty = function()
{
	return this.queue.length == 0;
}

function Packet(address, data)
{
	this.address = address;
	this.data = data;
}

module.exports = {
	Packet : Packet,
	Packet_queue : Packet_queue
};