var getDeps     = require("./deps");
var resolveTask = require("./resolve");
var σ           = require("highland");

function findEdges(tasks, name, stack = []) {
	if(stack.indexOf(name) !== -1) {
		throw new Error(`Circular dependency: ${stack.concat(name).join(" → ")}`);
	}

	var {spec, task} = resolveTask(tasks, name);
	var deps = getDeps(task, spec);

	return deps.fork().flatMap(
		x => findEdges(tasks, x, stack.concat(name))
	).concat(deps.map(dep => [name, dep]));
}

module.exports = function edges(tasks, start) {
	if(start) {
		return findEdges(tasks, start);
	} else {
		return σ(Object.keys(tasks)).flatMap(
			name => getDeps(tasks[name]).map(
				dep => [name, dep]
			)
		);
	}
};
