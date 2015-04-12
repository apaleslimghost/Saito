var {depsStore} = require("./deps");

exports.dep = function(...deps) {
	return function(fn) {
		var current = depsStore.get(fn) || [];
		depsStore.set(fn, current.concat(deps));
	};
};
