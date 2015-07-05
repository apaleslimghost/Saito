var util         = require("util");
var context      = require("./context");
var getDeps      = require("./deps");
var resolveTask  = require("./resolve");
var streamCoerce = require("@quarterto/stream-coerce");

function createTaskCache() {
	var cache = new Map();
	return function cachedTask(name, fn) {
		return function(...args) {
			if(cache.has(name)) {
				return cache.get(name);
			}

			var stream = streamCoerce(fn.apply(this, args));
			cache.set(name, stream.fork());
			return stream;
		};
	};
}

function run(tasks, name, cachedTask = createTaskCache()) {
	var {spec, task} = resolveTask(tasks, name);

	return getDeps(task, spec)
	.flatMap(d => run(tasks, d, cachedTask))
	.collect()
	.flatMap(depArgs => cachedTask(spec.name, task).apply({spec}, depArgs));
}

module.exports = function factory(spec) {
	var tasks = typeof spec === "function"? spec.call(context)
	          : typeof spec === "object"?   spec
	          : /* otherwise */             false;

	if(!tasks) {
		throw new TypeError(`${util.inspect(spec)} is not a valid task spec`);
	}

	return (name) => run(tasks, name);
};

util._extend(module.exports, context);
