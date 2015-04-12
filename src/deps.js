var WeakMap     = require("es6-weak-map");
var pattern     = require("./pattern");
var {concatMap} = require("data.array");

var depsStore = exports.depsStore = new WeakMap();

exports.getDeps = function getDeps(task, spec = {}) {
	var deps = concatMap(dep => [].concat(
		typeof dep === 'function'? dep(spec.name, spec.stem, spec)
		/* otherwise */          : dep
	), depsStore.get(task) || []);

	if(spec.stem) {
		return deps.map(d => pattern.interpolate(d, spec.stem));
	} else {
		return deps;
	}
};
