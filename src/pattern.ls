compile = (pattern)->
	//#{pattern.replace '%' /(.+)/$}//

sort-by = (comp, arr)-->
	arr.sort (a,b)->
		(comp b) - (comp a)
last = (.[it.length - 1])
filter = (f,a)--> a.filter f

shortest-stem = last . (sort-by (.stem.length)) . filter (?)

exports.match = (patterns, path)-->
	shortest-stem patterns.map (pattern)-> {
		name: that.0
		stem: that.1
		pattern
	} if path.match compile pattern

exports.interpolate = (pattern, value)-->
	pattern.replace '%' value
