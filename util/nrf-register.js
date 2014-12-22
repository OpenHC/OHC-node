require('./buffer')

function Register(addr, fields, length)
{
	this.addr = addr;
	if(typeof fields == 'undefined')
		fields = {};
	this.fields = fields;
	this.recalc_fields();
	if(typeof length == 'undefined')
		length = 1;
	this.length = length;
}

Register.prototype.recalc_fields = function()
{
	for(var key in this.fields)
		if(this.fields.hasOwnProperty(key))
			this[key] = this.fields[key];
}

Register.prototype.get_value = function()
{
	var value = new Buffer(this.length);
	value.fill(0);
	for(var i = 0; i < this.value.length; i++)
	{
		for(var j = 0; j < this.fields.length; j++)
		{
			var field_val = this.fields[j].get_value();
			if(field_val.length > i)
			{
				value[i] |= field_val[i];
			}
		}
	}
	return value;
}

function Bitfield(begin, end, value) //Index starts @ 0!
{
	this.begin = begin;
	this.end = end;
	this.first_byte = Math.floor(this.begin / 8);
	this.last_byte = Math.floor(this.end / 8);
	this.value = new Buffer(this.last_byte + 1);
	if(typeof value != 'undefined')
		this.set_value(value);
	else
		this.value.fill(0);
}

Bitfield.prototype.set_value = function(value)
{
	if(typeof value == 'number')
	{
		var actual_val = (value << this.begin) & ((2 << this.end) - 1);
		for (var i = 0; i < this.value.length; i++)
		{
			this.value[i] = (this.actual_val >> i) & 0xFF;
		}
	}
	else
	{
		this.value = value.bshiftr(this.begin);
	}
}

Bitfield.prototype.get_value = function()
{
	return this.value;
}

var registers = new Object();
registers.setup			= new Register(0x00, 
	{
		prim_rx:		new Bitfield(0, 0),
		pwr_up:			new Bitfield(1, 1),
		crco: 			new Bitfield(2, 2),
		en_crc:			new Bitfield(3, 3, 1),
		mask_max_rt:	new Bitfield(4, 4),
		mask_tx_ds:		new Bitfield(5, 5),
		mask_rx_dr:		new Bitfield(6, 6),
		reserved:		new Bitfield(7, 7)
	});
registers.en_aa			= new Register(0x01, 
	{
		enaa_p0:		new Bitfield(0, 0, 1),
		enaa_p1:		new Bitfield(1, 1, 1),
		enaa_p2: 		new Bitfield(2, 2, 1),
		enaa_p3:		new Bitfield(3, 3, 1),
		enaa_p4:		new Bitfield(4, 4, 1),
		enaa_p5:		new Bitfield(5, 5, 1),
		reserved:		new Bitfield(6, 7)
	});
registers.en_rxaddr		= new Register(0x02, 
	{
		erx_p0:			new Bitfield(0, 0, 1),
		erx_p1:			new Bitfield(1, 1, 1),
		erx_p2: 		new Bitfield(2, 2),
		erx_p3:			new Bitfield(3, 3),
		erx_p4:			new Bitfield(4, 4),
		erx_p5:			new Bitfield(5, 5),
		reserved:		new Bitfield(6, 7)
	});
registers.setp_aw		= new Register(0x03, 
	{
		aw:				new Bitfield(0, 1, 3),
		reserved:		new Bitfield(2, 7)
	});
registers.setup_retr	= new Register(0x04, 
	{
		arc:			new Bitfield(0, 3, 3),
		ard:			new Bitfield(4, 7)
	});
registers.rf_ch			= 0x05;
registers.rf_setup		= 0x06;
registers.status		= 0x07;
registers.observe_tx	= 0x08;
registers.rpd			= 0x09;
registers.rx_addr_p0	= 0x0A;
registers.rx_addr_p1	= 0x0B;
registers.rx_addr_p2	= 0x0C;
registers.rx_addr_p3	= 0x0D;
registers.rx_addr_p4	= 0x0E;
registers.rx_addr_p5	= 0x0F;
registers.tx_addr		= 0x10;
registers.rx_pw_p0		= 0x11;
registers.rx_pw_p1		= 0x12;
registers.rx_pw_p2		= 0x13;
registers.rx_pw_p3		= 0x14;
registers.rx_pw_p4		= 0x15;
registers.rx_pw_p5		= 0x16;
registers.fifo_status	= 0x17;
registers.dynpd			= 0x1C;
registers.feature		= 0x1D;

module.exports = registers;