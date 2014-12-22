#!/opt/node/bin/node

Buffer.prototype.bshiftr = function(num, resize)
{
	if(typeof resize == 'undefined')
		resize = false;
	var byte_offset = Math.floor(num / 8);
	var buff = new Buffer(this.length + (resize ? byte_offset : 0));
	buff.fill(0);
	if(num % 8 == 0)
	{
		this.copy(buff, byte_offset, 0, this.length);
	}
	else
	{
		for(var i = 0; i < this.length * 8; i++) //Calculate new position for each bit
		{
			var byte_num = Math.floor(i / 8);
			var bit_num = i % 8;
			var source_bit = this[byte_num] >> bit_num;
			var offset_byte_num = Math.floor((i + num) / 8);
			if(offset_byte_num >= buff.length)
				break;
			var offset_bit_num = (i + num) % 8;
			if(source_bit == 1)
				buff[offset_byte_num] |= (1 << offset_bit_num);
			else
				buff[offset_byte_num] &= ~(1 << offset_bit_num);
		}
	}
	return buff;
}

Buffer.prototype.bshiftl = function(num, resize)
{
	var byte_offset = Math.floor(num / 8);
	var buff = new Buffer(this.length - (resize ? byte_offset : 0));
	buff.fill(0);
	if(num % 8 == 0)
	{
		this.copy(buff, 0, byte_offset, this.length);
	}
	else
	{
		for(var i = 0; i < this.length * 8; i++) //Calculate new position for each bit
		{
			var byte_num = Math.floor(i / 8);
			var bit_num = i % 8;
			var source_bit = this[byte_num] >> bit_num;
			var offset_byte_num = Math.floor((i - num) / 8);
			var offset_bit_num = (i - num) % 8;
			if(offset_byte_num < 0)
				continue;
			if(source_bit == 1)
				buff[offset_byte_num] |= (1 << offset_bit_num);
			else
				buff[offset_byte_num] &= ~(1 << offset_bit_num);
		}
	}
	return buff;
}


function dec2Bin(dec)
{
    if(dec >= 0)
    {
        return dec.toString(2);
    }
    else
    {
        return (~dec).toString(2);
    }
}

var b = new Buffer(4);
b[0] = 1;
b[1] = 1;
b[2] = 1;
b[3] = 1;

var buff = b.bshiftl(1, true);

for(var i = 0; i < buff.length; i++)
{
	console.log(i.toString() + ': 0b' + dec2Bin(buff[i]));
}