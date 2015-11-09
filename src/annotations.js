var {depsStore} = require("./deps");
var streamCoerce = require("@quarterto/stream-coerce");

function objDeco(fn) {
	return (obj, key, def) => {
		var v = fn(obj[key], key, obj, def);
		if(v) def.value = v;
		return def;
	};
}

exports.unObjDeco = function unObjDeco(fn) {
	return value => fn({__tmp: value}, "__tmp", {value}).value;
};

exports.dep = function dep(...deps) {
	return objDeco(fn => {
		depsStore.set(fn, () => streamCoerce(deps));
	});
};
