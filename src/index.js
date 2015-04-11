/* jshint esnext: true, undef: true, node: true */
var toposort = require("toposort");
var pattern  = require("./pattern");
var iter     = require("es6-iterator");
var Symbol   = require("es6-symbol");
var {
	concatMap, find
} = require("data.array");

class Saito {
	constructor(spec) {
		this.tasks = spec.call(this);
	}

	task(name) {
		var results = {};
		var order = toposort(this.edges(name)).reverse();
		for(let t of iter(order.length ? order : [name])) {
			let spec = this.resolveTask(t);
			let task = this.getTask(spec);
			let args = this.getDeps(task, spec).map(d => {
				return results[this.resolveTask(d).name];
			});

			results[spec.name] = task(...args);
		}

		return results[this.resolveTask(name).name];
	}

	dep(...deps) {
		var fn = deps.pop();
		fn.deps = deps;
		return fn;
	}

	resolveTask(name) {
		var task;

		if(name in this.tasks) {
			return {name};
		}

		task = find(pattern.match([name]), Object.keys(this.tasks));
		if(task.isJust) {
			return {name: task.get()};
		}

		task = pattern.match(Object.keys(this.tasks), name);
		if(task) {
			return task;
		}

		throw new ReferenceError(`No such task ${name}`);
	}

	getTask({pattern, name}) {
		return this.tasks[pattern || name];
	}

	getDeps(task, spec = {}) {
		var deps = task.deps || [];

		if(spec.stem) {
			return deps.map(d => pattern.interpolate(d, spec.stem));
		} else {
			return deps;
		}
	}

	edges(start) {
		if(start) {
			return this.findEdges(start);
		} else {
			return concatMap(name => {
				return this.getDeps(this.tasks[name]).map(dep => {
					return [name, dep];
				});
			}, Object.keys(this.tasks));
		}
	}

	findEdges(name, stack = []) {
		if(stack.indexOf(name) !== -1) {
			throw new Error(`Circular dependency: ${stack.concat(name).join(" → ")}`);
		}

		var spec = this.resolveTask(name);
		var task = this.getTask(spec);
		var deps = this.getDeps(task, spec);

		return concatMap(
			x => this.findEdges(x, stack.concat(name)),
			deps
		).concat(deps.map(dep => [name, dep]));
	}
}

module.exports = function factory(spec) {
	return new Saito(spec);
};
