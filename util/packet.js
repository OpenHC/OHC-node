function Packet_queue()
{
	this.queue = new Array();
	this.queue_by_dev = new Object();
}

Packet_queue.prototype.push = function(dev_id, field_id, packet)
{
	this.queue.push(packet);
	if(typeof this.queue_by_dev[dev_id] == 'undefined')
		this.queue_by_dev[dev_id] = new Object();
	if(typeof this.queue_by_dev[dev_id][field_id] == 'undefined')
		this.queue_by_dev[dev_id][field_id] = new Array();
	this.queue_by_dev[dev_id][field_id].push(packet);
}

Packet_queue.prototype.next = function()
{
	return this.queue.shift();
}

Packet_queue.prototype.is_empty = function()
{
	return this.queue.length == 0;
}

Packet_queue.prototype.descramble = function()
{
	for(var dev_id in this.queue_by_dev)
		if(this.queue_by_dev.hasOwnProperty(dev_id))
			for(var field_id in this.queue_by_dev[dev_id])
				if(this.queue_by_dev[dev_id].hasOwnProperty(field_id))
				{
					var packets = this.queue_by_dev[dev_id][field_id];
					for(var i = 0; i < packets.length - 1; i++)
					{
						var packet = packets.shift();
						var index = this.queue.indexOf(packet);
						if(index >= 0)
						{
							this.queue.splice(index, 1);
						}
					}
				}
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
