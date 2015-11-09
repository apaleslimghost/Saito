var util         = require("util");
var context      = require("./context");
var getDeps      = require("./deps");
var resolveTask  = require("./resolve");
var createStreamCache = require('./stream-cache');

function run(tasks, name, cachedTask = createStreamCache(), stack = []) {
	var {spec, task} = resolveTask(tasks, name);
	if(~stack.indexOf(spec.name)) throw new Error(`Circular dependency: ${stack.concat(spec.name).join(' → ')}`);

	return getDeps(task, spec)
	.flatMap(d => run(tasks, d, cachedTask, stack.concat(spec.name)))
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
