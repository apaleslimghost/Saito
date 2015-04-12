var {concatMap} = require("data.array");
var getDeps     = require("./deps");
var resolveTask = require("./resolve");

function findEdges(tasks, name, stack = []) {
	if(stack.indexOf(name) !== -1) {
		throw new Error(`Circular dependency: ${stack.concat(name).join(" → ")}`);
	}

	var {spec, task} = resolveTask(tasks, name);
	var deps = getDeps(task, spec);

	return concatMap(
		x => findEdges(tasks, x, stack.concat(name)),
		deps
	).concat(deps.map(dep => [name, dep]));
}

module.exports = function edges(tasks, start) {
	if(start) {
		return findEdges(tasks, start);
	} else {
		return concatMap(name => {
			return getDeps(tasks[name]).map(dep => {
				return [name, dep];
			});
		}, Object.keys(tasks));
	}
}
