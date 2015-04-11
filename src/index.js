/* jshint esnext: true, undef: true, node: true */
var toposort = require("toposort");
var pattern  = require("./pattern");
var iter     = require("es6-iterator");
var Symbol   = require("es6-symbol");
var {
	concatMap, find
} = require("data.array");

function resolveTask(tasks, name) {
	var task;

	if(name in tasks) {
		return {name};
	}

	task = find(pattern.match([name]), Object.keys(tasks));
	if(task.isJust) {
		return {name: task.get()};
	}

	task = pattern.match(Object.keys(tasks), name);
	if(task) {
		return task;
	}

	throw new ReferenceError(`No such task ${name}`);
}

function getTask(tasks, {pattern, name}) {
	return tasks[pattern || name];
}

function getDeps(task, spec = {}) {
	var deps = task.deps || [];

	if(spec.stem) {
		return deps.map(d => pattern.interpolate(d, spec.stem));
	} else {
		return deps;
	}
}

function findEdges(tasks, name, stack = []) {
	if(stack.indexOf(name) !== -1) {
		throw new Error(`Circular dependency: ${stack.concat(name).join(" → ")}`);
	}

	var spec = resolveTask(tasks, name);
	var task = getTask(tasks, spec);
	var deps = getDeps(task, spec);

	return concatMap(
		x => findEdges(tasks, x, stack.concat(name)),
		deps
	).concat(deps.map(dep => [name, dep]));
}

function edges(tasks, start) {
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

function task(tasks, name) {
	var results = {};
	var order = toposort(edges(tasks, name)).reverse();

	for(let t of iter(order.length ? order : [name])) {
		let spec = resolveTask(tasks, t);
		let taskFn = getTask(tasks, spec);
		let args = getDeps(taskFn, spec).map(d => {
			return results[resolveTask(tasks, d).name];
		});

		results[spec.name] = taskFn(...args);
	}

	return results[resolveTask(tasks, name).name];
}

module.exports = function factory(spec) {
	var tasks = spec.call({
		dep(...deps) {
			var fn = deps.pop();
			fn.deps = deps;
			return fn;
		}
	});

	return {
		task: (name) => task(tasks, name),
		resolveTask: (name) => resolveTask(tasks, name),
		edges: (start) => edges(tasks, start)
	};
};
