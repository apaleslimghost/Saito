var saito = require('../');
var sinon = require('sinon');
var expect = require('sinon-expect').enhance(
  require('expect.js'), sinon, 'was'
);

function nthBack(n, cb) {
  var calls = 0;
  return function() {
    if(++calls === n) {
      cb.apply(this, arguments);
    }
  };
}

exports.Saito = {
  'spec': {
    'can be a function'(done) {
      saito(() => ({
        a: () => 'a'
      }))('a').apply((x) => {
        expect(x).to.be('a');
        done();
      });
    },
    'can be a plain object'(done) {
      saito({
        a: () => 'a'
      })('a').apply((x) => {
        expect(x).to.be('a');
        done();
      });
    },
    'throws when it\'s something unexpected'() {
      expect(function() {
        saito("ohai");
      }).to.throwException(/'ohai' is not a valid task spec/);
    }
  },
  'task': {
    'should return a stream for the result of a task'(done) {
      var r = {};
      var t = saito({
        a: () => r
      });
      t('a').apply(x => {
        expect(x).to.be(r);
        done();
      });
    },
    'should resolve simple dependencies'(done) {
      var r = {};
      var a = sinon.stub();
      a.withArgs('intermediate').returns(r);
      var t = saito(function(){
        return {
          a: this.dep('b', a),
          b(){
            return 'intermediate';
          }
        };
      });
      t('a').apply(x => {
        expect(x).to.be(r);
        expect(a).was.calledWith('intermediate');
        done();
      })
    },
    'should resolve dependency chains'(done){
      var a = sinon.stub();
      var b = sinon.stub();
      a.withArgs('b').returns('a');
      b.withArgs('c').returns('b');
      var t = saito(function(){
        return {
          a: this.dep('b', a),
          b: this.dep('c', b),
          c(){
            return 'c';
          }
        };
      });
      t('a').apply(x => {
        expect(x).to.be('a');
        expect(a).was.calledWith('b');
        expect(b).was.calledWith('c');
        done();
      });
    },
    'should resolve multiple dependencies'(done){
      var a = sinon.stub();
      a.withArgs('b', 'c').returns('a');
      var t = saito(function(){
        return {
          a: this.dep('b', 'c', a),
          b(){
            return 'b';
          },
          c(){
            return 'c';
          }
        };
      });
      t('a').apply(x => {
        expect(x).to.be('a');
        expect(a).was.calledWith('b', 'c');
        done();
      });
    },
    'should call each dependency once'(done){
      var d = sinon.stub();
      var t = saito(function(){
        return {
          a: this.dep('b', 'd', function(){}),
          b: this.dep('c', function(){}),
          c: this.dep('d', function(){}),
          d: d
        };
      });
      t('a').done(() => {
        expect(d).was.calledOnce();
        done();
      });
    },
    'should barf on circular dependencies'(done){
      var d = sinon.stub();
      var t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: this.dep('a', function(){})
        };
      });
      t('a').stopOnError(e => {
        expect(e.message).to.match(/Circular dependency: a → b → a/);
        done();
      }).apply(() => {});
    },
    'should match tasks on patterns'(done){
      var t = saito(function(){
        return {
          '%.txt'(){
            return 'a';
          }
        };
      });
      t('file.txt').apply(x => {
        expect(x).to.be('a');
        done();
      });
    },
    'templates': {
      'should run tasks by filling in templates'(done){
        var t = saito(function(){
          return {
            '%.a'(){
              return 'a';
            }
          };
        });
        t('a.a').apply(x => {
          expect(x).to.be('a');
          done();
        });
      },
      'should prefer exact matches to templates'(done){
        var t = saito(function(){
          return {
            'a.a'(){
              return 'a';
            },
            '%.a'(){
              return 'b';
            }
          };
        });
        t('a.a').apply(x => {
          expect(x).to.be('a');
          done();
        });
      },
      'should do dependencies by filling in templates'(done){
        var t = saito(function(){
          return {
            'a.a'(){
              return 'a';
            },
            '%.b': this.dep('%.a', function(it){
              return it.toUpperCase();
            })
          };
        });
        t('a.b').apply(x => {
          expect(x).to.be('A');
          done();
        });
      },
      'should work out which wildcard dependency to use'(done){
        var t = saito(function(){
          return {
            'a.a'(){
              return 'a';
            },
            'b.a'(){
              return 'b';
            },
            '%.b': this.dep('%.a', function(it){
              return it.toUpperCase();
            })
          };
        });
        t('a.b').concat(t('b.b')).apply((a,b) => {
          expect(a).to.be('A');
          expect(b).to.be('B');
          done();
        })
      },
      'should fall back to wildcard if there isn\'t a specific rule'(done){
        var t = saito(function(){
          return {
            'a.a'(){
              return 'a';
            },
            '%.a'(){
              return 'b';
            }
          };
        });
        t('a.a').concat(t('b.a')).apply((a,b) => {
          expect(a).to.be('a');
          expect(b).to.be('b');
          done();
        });
      },
      'should do transitive wildcard dependencies'(done){
        var t = saito(function(){
          return {
            '%.a': this.dep('%.b', (function(it){
              return 'a' + it;
            })),
            '%.b': this.dep('%.c', function(it){
              return it.toUpperCase();
            }),
            'a.c'(){
              return 'b';
            }
          };
        });
        t('a.a').apply(x => {
          expect(x).to.be('aB');
          done();
        });
      },
      'should error if it can\'t find a concrete wildcard depencency'(done){
        var t = saito(function(){
          return {
            'a.a'(){
              return 'a';
            },
            '%.b': this.dep('%.a', function(it){
              return it.toUpperCase();
            })
          };
        });
        t('b.b').stopOnError(e => {
          expect(e.message).to.match(/No such task b.a/);
          done();
        }).apply(() => {});
      },
      'should find concretes for transitive dependencies'(done){
        var t = saito(function(){
          return {
            '%.a': this.dep('%.b', (function(it){
              return 'a' + it;
            })),
            '%.b': this.dep('%.c', function(it){
              return it.toUpperCase();
            }),
            'a.c'(){
              return 'b';
            },
            'b.c'(){
              return 'c';
            }
          };
        });

        t('a.a').concat(t('b.a')).apply((a,b) => {
          expect(a).to.be('aB');
          expect(b).to.be('aC');
          done();
        });
      },
      'dep functions': {
        'should call dep functions with helpful things'(done){
          var t = saito(function(){
            return {
              '%.a': this.dep(function(name, stem, spec) {
                expect(name).to.be('a.a');
                expect(stem).to.be('a');
                expect(spec).to.eql({
                  name: 'a.a',
                  stem: 'a',
                  pattern: '%.a'
                });
                return [];
              }, function() {
                done();
              })
            };
          });
          t('a.a').apply(() => {});
        },
        'should use dep function return'(done){
            var t = saito(function(){
              return {
                '%.a': this.dep(function(name, stem, spec) {
                  return ['%.b'];
                }, function(b) {
                  return 'a' + b;
                }),
                '%.b'() {
                  return 'b';
                }
              };
            });
            t('a.a').apply(x => {
              expect(x).to.be('ab');
              done();
            });
          }
      }
    },
    'context': {
      'should contain current spec'(done) {
        var t = saito(function() {
          return {'a'() {
            expect(this).to.have.property('spec');
            expect(this.spec).to.have.property('name', 'a');
            done();
          }};
        });

        t('a').apply(() => {});
      }
    }
  }
};
