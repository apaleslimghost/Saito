var {depsStore} = require("./deps");

exports.dep = function(...deps) {
	return function(fn) {
		depsStore.set(fn, deps);
	};
};
