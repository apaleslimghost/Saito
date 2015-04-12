var expect = require('expect.js');
var edges  = require('../lib/edges');
var ctx    = require('../lib/context');

describe('edges', function() {
	it('should return a list of dependency graph edges with simple deps', function() {
		expect(edges({
			a: ctx.dep('b', function(){}),
			b: function(){}
		})).to.eql([['a', 'b']]);
	});

	it('should return a list of dependency graph edges with deps chains', function() {
		expect(edges({
			a: ctx.dep('b', function(){}),
			b: ctx.dep('c', function(){}),
			c: function(){}
		})).to.eql([['a', 'b'], ['b', 'c']]);
	});

	it('should return a list of dependency graph edges with multiple deps', function() {
		expect(edges({
			a: ctx.dep('b', 'c', function(){}),
			b: function(){},
			c: function(){}
		})).to.eql([['a', 'b'], ['a', 'c']]);
	});

	it('should return a minimal set of edges in case of unconnected tasks', function() {
		var t = {
			a: ctx.dep('b', function(){}),
			b: ctx.dep('c', function(){}),
			d: ctx.dep('c', function(){}),
			c: function(){}
		};
		expect(edges(t, 'a')).to.eql([['b', 'c'], ['a', 'b']]);
		expect(edges(t, 'd')).to.eql([['d', 'c']]);
	});

	it('should detect circular dependencies', function() {
		expect(function(){
			return edges({
				a: ctx.dep('b', function(){}),
				b: ctx.dep('a', function(){})
			}, 'a');
		}).to.throwError(/Circular dependency: a → b → a/);
	});

	it('should detect transitive circular dependencies', function() {
		expect(function(){
			return edges({
				a: ctx.dep('b', function(){}),
				b: ctx.dep('c', function(){}),
				c: ctx.dep('a', function(){})
			}, 'a');
		}).to.throwError(/Circular dependency: a → b → c → a/);
	});

	it('should detect reflexive circular dependencies', function() {
		expect(function(){
			return edges({
				a: ctx.dep('a', function(){})
			}, 'a');
		}).to.throwError(/Circular dependency: a → a/);
	});
});
