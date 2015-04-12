var {find}  = require("data.array");
var pattern = require("./pattern");

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

function getTask(tasks, {pattern, name}) {
	return tasks[pattern || name];
}

module.exports = function resolveTask(tasks, name) {
	var spec = resolveSpec(tasks, name);
	return {spec, task: getTask(tasks, spec)};
};
