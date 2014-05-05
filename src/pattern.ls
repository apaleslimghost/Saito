compile = (pattern)->
	//#{pattern.replace '%' /([^\/]+)/$}//

module.exports = (patterns, path)-->
	for pattern in patterns
		reg = compile pattern
		if path.match reg
			return match: that.0, stem: that.1