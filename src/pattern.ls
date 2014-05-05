compile = (pattern)->
	//#{pattern.replace '%' /([^\/]+)/$}//

module.exports = (pattern, candidates)-->
	reg = compile pattern
	for path in candidates
		if path.match reg
			return match: that.0, stem: that.1