function Device(ohc, internal_key)
{
	this.ohc = ohc;
	this.key = internal_key;
	this.config = ohc.conf_devices.config[internal_key];
	this.commit_current_value();
}

Device.field_types = Object();
Device.field_types['int'] = 'number';
Device.field_types['float'] = 'number';
Device.field_types['onoff'] = 'boolean';
Device.field_types['bool'] = 'boolean';
Device.field_types['string'] = 'string';
Device.field_types['slider'] = 'number';

Device.prototype.get_name = function()
{
	if(typeof this.config.name_custom !== 'string' || this.config.name_custom.length == 0)
	{
		return this.config.name_default;
	}
	else
	{
		return this.config.name_custom;
	}
}

Device.prototype.set_name = function(name)
{
	this.config.name_custom = name;
	this.save_config();
}

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
	this.ohc.conf_devices.save();
}

Device.prototype.get_field_value = function(num)
{
	return this.config[num].value;
}

Device.prototype.get_field = function(num)
{
	return this.config[num];
}

module.exports = Device;