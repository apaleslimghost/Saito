var expect  = require('expect.js');
var pattern = require('../lib/pattern');

describe('pattern', function() {
	it('should match entire thing', function(){
		expect(pattern.match(['%'], 'a')).to.have.property('name', 'a');
	});

	describe('prefixes', function() {
		it('should match', function() {
			expect(pattern.match(['a%'], 'abcde')).to.have.property('name', 'abcde');
		});

		it('should get the stem', function() {
			expect(pattern.match(['a%'], 'abcde')).to.have.property('stem', 'bcde');
		});

		it('should save the pattern', function() {
			expect(pattern.match(['a%'], 'abcde')).to.have.property('pattern', 'a%');
		});

		it('shouldn\'t match things that don\'t', function() {
			expect(pattern.match(['a%'], 'ghijk')).to.be(void 8);
		});

		it('should match the shortest stem', function() {
			var m = pattern.match(['a%', 'abc%'], 'abcde');
			expect(m).to.have.property('name', 'abcde');
			expect(m).to.have.property('stem', 'de');
			expect(m).to.have.property('pattern', 'abc%');
		});
	});

	describe('suffixes', function() {
		it('should match', function() {
			expect(pattern.match(['%e'], 'abcde')).to.have.property('name', 'abcde');
		});

		it('should get the stem', function() {
			expect(pattern.match(['%e'], 'abcde')).to.have.property('stem', 'abcd');
		});

		it('should save the pattern', function() {
			expect(pattern.match(['%e'], 'abcde')).to.have.property('pattern', '%e');
		});

		it('shouldn\'t match things that don\'t', function() {
			expect(pattern.match(['%e'], 'ghijk')).to.be(void 8);
		});

		it('should match the shortest stem', function() {
			var m = pattern.match(['%e', '%cde'], 'abcde');
			expect(m).to.have.property('name', 'abcde');
			expect(m).to.have.property('stem', 'ab');
			expect(m).to.have.property('pattern', '%cde');
		});
	});

	describe('middleixes', function() {
		it('should match', function() {
			expect(pattern.match(['a%e'], 'abcde')).to.have.property('name', 'abcde');
		});

		it('should get the stem', function() {
			expect(pattern.match(['a%e'], 'abcde')).to.have.property('stem', 'bcd');
		});

		it('should save the pattern', function() {
			expect(pattern.match(['a%e'], 'abcde')).to.have.property('pattern', 'a%e');
		});

		it('shouldn\'t match things that don\'t', function() {
			expect(pattern.match(['a%e'], 'ghijk')).to.be(void 8);
		});

		it('should match the shortest stem', function() {
			var m = pattern.match(['a%e', 'ab%de'], 'abcde');
			expect(m).to.have.property('name', 'abcde');
			expect(m).to.have.property('stem', 'c');
			expect(m).to.have.property('pattern', 'ab%de');
		});
	});

	describe('slashes', function() {
		it('should match', function() {
			var m = pattern.match(['src/%.js'], 'src/foo/bar.js');
			expect(m).to.have.property('name', 'src/foo/bar.js');
			expect(m).to.have.property('stem', 'foo/bar');
			expect(m).to.have.property('pattern', 'src/%.js');
		});
	});

	describe('interpolate', function() {
		it('should put a thing where the percent is', function() {
			expect(pattern.interpolate('%', 'a')).to.be('a');
		});

		it('should do prefixes', function() {
			expect(pattern.interpolate('a%', 'a')).to.be('aa');
		});

		it('should do suffixes', function() {
			expect(pattern.interpolate('%a', 'a')).to.be('aa');
		});
	});
});
