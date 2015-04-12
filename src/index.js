var toposort    = require("toposort");
var util        = require("util");
var context     = require("./context");
var getDeps     = require("./deps");
var resolveTask = require("./resolve");
var edges       = require("./edges");

function run(tasks, name) {
	var results = {};
	var order = toposort(edges(tasks, name)).reverse();

	(order.length ? order : [name]).forEach((t, i, order) => {
		var {spec, task} = resolveTask(tasks, t);
		var args = getDeps(task, spec).map(d => {
			return results[resolveTask(tasks, d).spec.name];
		});

		var context = {
			spec,
			order,
			parent: order[i - 1],
			previous: order.slice(0, i),
			next: order.slice(i + 1)
		};

		results[spec.name] = task.apply(context, args);
	});

	return results[resolveTask(tasks, name).spec.name];
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
