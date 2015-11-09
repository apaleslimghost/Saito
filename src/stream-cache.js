var streamCoerce = require('@quarterto/stream-coerce');

module.exports = function createStreamCache() {
	var cache = new Map();
	return function cachedStreamFn(name, fn) {
		return function(...args) {
			if(cache.has(name)) {
				return streamCoerce(cache.get(name));
			}

			var stream = streamCoerce(fn.apply(this, args));
			var values = [];
			cache.set(name, values);
			return stream.doto(v => values.push(v));
		};
	};
};
