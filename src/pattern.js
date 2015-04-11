/* jshint esnext: true, node: true */
var {sortBy, concatMap} = require("data.array");
var curry = require("curry");

function compile(pattern) {
	return new RegExp(pattern.replace('%', '(.+)'));
}

var shortestStem = xs => sortBy(s => s.stem.length, xs)[0];

exports.match = curry(function _match(patterns, path) {
	return shortestStem(concatMap(pattern => {
		var match = path.match(compile(pattern));
		return match ? [{
			name: match[0],
			stem: match[1],
			pattern
		}] : [];
	}, patterns));
});

exports.interpolate = curry(function _interpolate(pattern, value) {
	return pattern.replace('%', value);
});
