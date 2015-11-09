var pattern      = require("./pattern");
var streamCoerce = require("@quarterto/stream-coerce");

var depsStore = new WeakMap();

module.exports = function getDeps(task, spec = {}) {
	var d = depsStore.get(task);
	var deps = streamCoerce(d ? d() : []).flatMap(dep => [].concat(
		typeof dep === 'function'? dep(spec.name, spec.stem, spec)
		/* otherwise */          : dep
	));

	if(spec.stem) {
		return deps.map(d => pattern.interpolate(d, spec.stem));
	} else {
		return deps;
	}
};

module.exports.depsStore = depsStore;
