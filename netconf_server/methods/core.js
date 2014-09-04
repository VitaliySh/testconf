var fs = require('fs');
var json_path = require('JSONPath')
var config = require('../../core/config')
var debug = require('../../core/debug')
var netconf = require('../../core/netconf')

var rpc_methods = {}

module.exports = rpc_methods

rpc_methods["get"] = function(oin, res)
{
	res({"data" : ''})
}

rpc_methods["get-config"] = function(oin, res)
{
	res({"data" : ''})
}

rpc_methods["edit-config"] = function(oin, res)
{
	var configs = oin["config"][0]
	for (c in configs)
	{
		var method = null
		try
		{
			// TODO: trigger reload when needed
			delete require.cache[__dirname + "/" + c + ".js"]
			method = require(config.server_methods_dir + c + ".js")["edit-config"]
			method["paths"].length
		}
		catch(e)
		{
			debug.write(e, true)

			return res(netconf.rpc_error("rcp method '" + c + "' not found ", "operation-not-supported"))
		}

		debug.write(JSON.stringify(configs[c]))

		method.paths.forEach(function(path)
		{
			var res = json_path.eval(configs[c], path.path)
			if (res.length && path.method)
			{
				var rc = path.method(res)
				if (rc.code)
					return res(netconf.rpc_error(rc.msg, "operation-failed"))
			}
		})
	}

	res({"ok" : ''})
}

rpc_methods["kill-session"] = function(oin, res)
{
	res({"ok" : ''})
}

rpc_methods["close-session"] = function(oin, res)
{
	res({"ok" : ''})
}

rpc_methods["lock"] = function(oin, res)
{
	res({"ok" : ''})
}

rpc_methods["unlock"] = function(oin, res)
{
	res({"ok" : ''})
}

rpc_methods["get-schema"] = function(oin, response)
{
	if (typeof oin.identifier === 'undefined')
		return self.emit('error', 'schema identifier missing')

	var file_name = config.yang_dir + oin.identifier
	var format = 'yang'

	if (typeof oin.version !== 'undefined')
		file_name += "@" + oin.version

	if (typeof oin.format !== 'undefined')
	{
		if (oin.format != 'yang')
			return self.emit('error', 'get-schema: only "yang" format supported')
	}

	file_name += "." + format

	fs.readFile(file_name, 'utf8', function(error, file) {
	if (error)
		return self.emit('error', error)

		var o_data = {"data" : {}}
		o_data.data['_'] = file
		o_data.data['$'] = { "xmlns": "urn:ietf:params:xml:ns:yang:ietf-netconf-monitoring"}

		response(o_data)
	});
}
