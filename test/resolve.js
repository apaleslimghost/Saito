var expect      = require('expect.js');
var resolveTask = require('../lib/resolve');

describe('resolve-task', function() {
	it('should find a task with a simple name', function(){
		var r = resolveTask({
			a: 'task'
		}, 'a');
		expect(r.spec).to.have.property('name', 'a');
		expect(r).to.have.property('task', 'task');
	});

	it('should match patterns', function(){
		expect(resolveTask({
			'%.txt': 'task'
		}, 'file.txt').spec).to.have.property('pattern', '%.txt');
	});

	it('should throw if it can\'t find a task', function(){
		expect(function(){
			return resolveTask({
				a: 'task'
			}, 'b');
		}).to.throwError(/No such task b/);
	});
});
