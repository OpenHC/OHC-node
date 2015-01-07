function Device(ohc, internal_key)
{
	this.ohc = ohc;
	this.key = internal_key;
	this.config = ohc.conf_devices[internal_key].config;
}

Device.field_types = {
	'int' = 'number',
	'float' = 'number',
	'onoff' = 'boolean',
	'bool' = 'boolean',
	'string' = 'string',
	'slider' = 'number'
};

Device.prototype.get_num_fields = function()
{
	return this.config.num_fields;
}

Device.prototype.set_field_value = function(num, value)
{
	var field = this.config[num];
	if(typeof value != Device.field_types[field.type])
		return false;
	if(typeof value != 'boolean')
	{
		if(typeof value == 'number' && (value > field.max_value || value < field.min_value))
		{
			return false;
		}
		if(typeof value == 'string' && (value.length > field.max_value || value.length < field.min_value))
		{
			return false;
		}
	}
	field.value = value;
	return true;
}

Device.prototype.commit_current_value = function()
{
	//TODO: Send value to device, fusion with nrf node required
}

Device.prototype.save_config = function()
{
	this.ohc.conf_devices[this.key].save();
}

Device.prototype.get_field_value = function(num)
{
	return this.config[num].value;
}

Device.prototype.get_field = function(num)
{
	return this.config[num];
}