<h1 align="center">
	<img alt="Saito" src="logo.png" width="300"><br>
	<a href="https://travis-ci.org/quarterto/Saito"><img alt="Build status" src="https://travis-ci.org/quarterto/Saito.svg?branch=master"></a>
</h1>

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

MIT. &copy; 2015 Matt Brennan
