var {depsStore} = require("./deps");

function objDeco(fn) {
	return function(obj, key, def) {
		var v = fn(obj[key], key, obj, def);
		if(v) def.value = v;
		return def;
	};
}

exports.unObjDeco = function unObjDeco(fn) {
	return function(value) {
		return fn({__tmp: value}, "__tmp", {value}).value;
	};
};

exports.dep = function dep(...deps) {
	return objDeco(function depDeco(fn) {
		var current = depsStore.get(fn) || [];
		depsStore.set(fn, current.concat(deps));
	});
};
