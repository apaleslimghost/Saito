Saito [![Build Status](https://travis-ci.org/quarterto/Saito.svg?branch=master)](https://travis-ci.org/quarterto/Saito)
=====

Declarative task dependencies

Install
-------

```
npm install saito
```

Use
---

```javascript
var env = require('saito')(function () {
	return {
		'%.upper': this.dep('%.lower', (str) => str.toUpperCase()),
		'hello.lower': () => 'hello'
	}
}))

env.task('hello.upper') //⇒ HELLO
```

Saito builds a DAG of task dependencies, toposorts them and runs tasks in order. `%` wildcard dependencies are filled in with concrete values using file stems.

Licence
-------

MIT. &copy; 2014 Matt Brennan
