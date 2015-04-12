var anns = require("./annotations");

module.exports = {
	dep(...deps) {
		var fn = deps.pop();
		anns.unObjDeco(anns.dep(...deps))(fn);
		return fn;
	}
};
