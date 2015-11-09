<h1 align="center">
	<img alt="Saito" src="logo.png" width="300"><br>
	<a href="https://travis-ci.org/quarterto/Saito"><img alt="Build status" src="https://travis-ci.org/quarterto/Saito.svg?branch=master"></a>
</h1>

Make-style declarative task dependencies

Install
-------

```
npm install saito
```

Use
---

```javascript
var task = require('saito')(function () {
	return {
		'%.upper': this.dep('%.lower', (str) => str.toUpperCase()),
		'hello.lower': () => 'hello'
	}
}))

task('hello.upper').apply(x => {
	console.log(x); //⇒ HELLO
});
```

`%` wildcard dependencies are filled in with concrete values using file stems.

Licence
-------

MIT. &copy; 2015 Matt Brennan
