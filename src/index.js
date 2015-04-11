/* jshint esnext: true, undef: true, node: true */
var toposort = require("toposort");
var pattern  = require("./pattern");
var iter     = require("es6-iterator");
var Symbol   = require("es6-symbol");
var WeakMap  = require("es6-weak-map");
var {concatMap, find} = require("data.array");
var util     = require("util");

var depsStore = new WeakMap();

function resolveSpec(tasks, name) {
	if(name in tasks) {
		return {name};
	}

	var maybeName = find(pattern.match([name]), Object.keys(tasks));
	if(maybeName.isJust) {
		return {name: maybeName.get()};
	}

	var spec = pattern.match(Object.keys(tasks), name);
	if(spec) return spec;

	throw new ReferenceError(`No such task ${name}`);
}

function resolveTask(tasks, name) {
	var spec = resolveSpec(tasks, name);
	return {spec, task: getTask(tasks, spec)};
}

function getTask(tasks, {pattern, name}) {
	return tasks[pattern || name];
}

function getDeps(task, spec = {}) {
	var deps = depsStore.get(task) || [];

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

	var {spec, task} = resolveTask(tasks, name);
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
	var tasks = spec.call({
		dep(...deps) {
			var fn = deps.pop();
			depsStore.set(fn, deps);
			return fn;
		}
	});

	return {
		task: util.deprecate((name) => run(tasks, name), 'task has been renamed run'),
		run: (name) => run(tasks, name),
		resolveTask: (name) => resolveTask(tasks, name),
		edges: (start) => edges(tasks, start)
	};
};
