var saito = require('./lib');
var pattern = require('./lib/pattern');
var expect = require('karma-sinon-expect').expect;

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
    'can be a function': function() {
      expect(saito(function() {
        return {a: function() { return 'a'; }};
      }).run('a')).to.be('a');
    },
    'can be a plain object': function() {
      expect(saito({
        a: function() { return 'a'; }
      }).run('a')).to.be('a');
    },
    'throws when it\'s something unexpected': function() {
      expect(function() {
        saito("ohai");
      }).to.throwException(/'ohai' is not a valid task spec/);
    }
  },
  'task': {
    'should return the result of a task': function(){
      var r = {};
      var t = saito(function(){
        return {
          a: function(){
            return r;
          }
        };
      });
      expect(t.run('a')).to.be(r);
    },
    'should resolve simple dependencies': function(){
      var r = {};
      var a = expect.sinon.stub();
      a.withArgs('intermediate').returns(r);
      var t = saito(function(){
        return {
          a: this.dep('b', a),
          b: function(){
            return 'intermediate';
          }
        };
      });
      expect(t.run('a')).to.be(r);
      expect(a).to.be.calledWith('intermediate');
    },
    'should resolve dependency chains': function(){
      var a = expect.sinon.stub();
      var b = expect.sinon.stub();
      a.withArgs('b').returns('a');
      b.withArgs('c').returns('b');
      var t = saito(function(){
        return {
          a: this.dep('b', a),
          b: this.dep('c', b),
          c: function(){
            return 'c';
          }
        };
      });
      expect(t.run('a')).to.be('a');
      expect(a).to.be.calledWith('b');
      expect(b).to.be.calledWith('c');
    },
    'should resolve multiple dependencies': function(){
      var a = expect.sinon.stub();
      a.withArgs('b', 'c').returns('a');
      var t = saito(function(){
        return {
          a: this.dep('b', 'c', a),
          b: function(){
            return 'b';
          },
          c: function(){
            return 'c';
          }
        };
      });
      expect(t.run('a')).to.be('a');
      expect(a).to.be.calledWith('b', 'c');
    },
    'should call each dependency once': function(){
      var d = expect.sinon.stub();
      var t = saito(function(){
        return {
          a: this.dep('b', 'd', function(){}),
          b: this.dep('c', function(){}),
          c: this.dep('d', function(){}),
          d: d
        };
      });
      t.run('a');
      expect(d).to.be.calledOnce();
    },
    'should barf on circular dependencies': function(){
      var d = expect.sinon.stub();
      var t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: this.dep('a', function(){})
        };
      });
      expect(function(){
        return t.run('a');
      }).to.throwError(/Circular dependency: a → b → a/);
    },
    'should match tasks on patterns': function(){
      var t = saito(function(){
        return {
          '%.txt': function(){
            return 'a';
          }
        };
      });
      expect(t.run('file.txt')).to.be('a');
    },
    'templates': {
      'should run tasks by filling in templates': function(){
        var t = saito(function(){
          return {
            '%.a': function(){
              return 'a';
            }
          };
        });
        expect(t.run('a.a')).to.be('a');
      },
      'should prefer exact matches to templates': function(){
        var t = saito(function(){
          return {
            'a.a': function(){
              return 'a';
            },
            '%.a': function(){
              return 'b';
            }
          };
        });
        expect(t.run('a.a')).to.be('a');
      },
      'should do dependencies by filling in templates': function(){
        var t = saito(function(){
          return {
            'a.a': function(){
              return 'a';
            },
            '%.b': this.dep('%.a', function(it){
              return it.toUpperCase();
            })
          };
        });
        expect(t.run('a.b')).to.be('A');
      },
      'should work out which wildcard dependency to use': function(){
        var t = saito(function(){
          return {
            'a.a': function(){
              return 'a';
            },
            'b.a': function(){
              return 'b';
            },
            '%.b': this.dep('%.a', function(it){
              return it.toUpperCase();
            })
          };
        });
        expect(t.run('a.b')).to.be('A');
        expect(t.run('b.b')).to.be('B');
      },
      'should fall back to wildcard if there isn\'t a specific rule': function(){
        var t = saito(function(){
          return {
            'a.a': function(){
              return 'a';
            },
            '%.a': function(){
              return 'b';
            }
          };
        });
        expect(t.run('a.a')).to.be('a');
        expect(t.run('b.a')).to.be('b');
      },
      'should do transitive wildcard dependencies': function(){
        var t = saito(function(){
          return {
            '%.a': this.dep('%.b', (function(it){
              return 'a' + it;
            })),
            '%.b': this.dep('%.c', function(it){
              return it.toUpperCase();
            }),
            'a.c': function(){
              return 'b';
            }
          };
        });
        expect(t.run('a.a')).to.be('aB');
      },
      'should error if it can\'t find a concrete wildcard depencency': function(){
        var t = saito(function(){
          return {
            'a.a': function(){
              return 'a';
            },
            '%.b': this.dep('%.a', function(it){
              return it.toUpperCase();
            })
          };
        });
        expect(function(){
          return t.run('b.a');
        }).to.throwError('No such task b.a');
      },
      'should find concretes for transitive dependencies': function(){
        var t = saito(function(){
          return {
            '%.a': this.dep('%.b', (function(it){
              return 'a' + it;
            })),
            '%.b': this.dep('%.c', function(it){
              return it.toUpperCase();
            }),
            'a.c': function(){
              return 'b';
            },
            'b.c': function(){
              return 'c';
            }
          };
        });
        expect(t.run('a.a')).to.be('aB');
        expect(t.run('b.a')).to.be('aC');
      },
      'dep functions': {
        'should call dep functions with helpful things': function(done){
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
          t.run('a.a');
        },
        'should use dep function return': function(){
            var t = saito(function(){
              return {
                '%.a': this.dep(function(name, stem, spec) {
                  return ['%.b'];
                }, function(b) {
                  return 'a' + b;
                }),
                '%.b': function() {
                  return 'b';
                }
              };
            });
            expect(t.run('a.a')).to.be('ab');
          }
      }
    },
    'context': {
      'should contain current spec': function(done) {
        var t = saito(function() {
          return {'a': function() {
            expect(this).to.have.property('spec');
            expect(this.spec).to.have.property('name', 'a');
            done();
          }};
        });

        t.run('a');
      },
      'should contain full task order': function(done) {
        var t = saito(function() {
          return {
            'a': this.dep('b', function() {
              expect(this).to.have.property('order');
              expect(this.order).to.eql(['b', 'a']);
              done();
            }),
            'b': function() {}
          };
        });
        t.run('a');
      },
      'should contain parent task': function(done) {
        var t = saito(function() {
          return {
            'a': this.dep('b', function() {
              expect(this).to.have.property('parent', 'b');
              done();
            }),
            'b': function() {}
          };
        });
        t.run('a');
      },
      'should contain remaining tasks': function(done) {
        var thrice = nthBack(3, done);
        var t = saito(function() {
          return {
            'a': this.dep('b', function() {
              expect(this.next).to.eql([]);
              thrice();
            }),
            'b': this.dep('c', function() {
              expect(this.next).to.eql(['a']);
              thrice();
            }),
            'c': function() {
              expect(this.next).to.eql(['b', 'a']);
              thrice();
            }
          };
        });
        t.run('a');
      },
      'should contain previous tasks': function(done) {
        var thrice = nthBack(3, done);
        var t = saito(function() {
          return {
            'a': this.dep('b', function() {
              expect(this.previous).to.eql(['c', 'b']);
              thrice();
            }),
            'b': this.dep('c', function() {
              expect(this.previous).to.eql(['c']);
              thrice();
            }),
            'c': function() {
              expect(this.previous).to.eql([]);
              thrice();
            }
          };
        });
        t.run('a');
      }
    }
  },
  'resolve-task': {
    'should find a task with a simple name': function(){
      var t = saito(function(){
        return {
          a: 'task'
        };
      });

      var r = t.resolveTask('a');
      expect(r.spec).to.have.property('name', 'a');
      expect(r).to.have.property('task', 'task');
    },
    'should match patterns': function(){
      var t = saito(function(){
        return {
          '%.txt': 'task'
        };
      });
      expect(t.resolveTask('file.txt').spec).to.have.property('pattern', '%.txt');
    },
    'should throw if it can\'t find a task': function(){
      var t = saito(function(){
        return {
          a: 'task'
        };
      });
      expect(function(){
        return t.resolveTask('b');
      }).to.throwError(/No such task b/);
    }
  },
  'edges': {
    'should return a list of dependency graph edges with simple deps': function(){
      var t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: function(){}
        };
      });
      expect(t.edges()).to.eql([['a', 'b']]);
    },
    'should return a list of dependency graph edges with deps chains': function(){
      var t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: this.dep('c', function(){}),
          c: function(){}
        };
      });
      expect(t.edges()).to.eql([['a', 'b'], ['b', 'c']]);
    },
    'should return a list of dependency graph edges with multiple deps': function(){
      var t = saito(function(){
        return {
          a: this.dep('b', 'c', function(){}),
          b: function(){},
          c: function(){}
        };
      });
      expect(t.edges()).to.eql([['a', 'b'], ['a', 'c']]);
    },
    'should return a minimal set of edges in case of unconnected tasks': function(){
      var t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: this.dep('c', function(){}),
          d: this.dep('c', function(){}),
          c: function(){}
        };
      });
      expect(t.edges('a')).to.eql([['b', 'c'], ['a', 'b']]);
      expect(t.edges('d')).to.eql([['d', 'c']]);
    },
    'should detect circular dependencies': function(){
      var t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: this.dep('a', function(){})
        };
      });
      expect(function(){
        return t.edges('a');
      }).to.throwError(/Circular dependency: a → b → a/);
    },
    'should detect transitive circular dependencies': function(){
      var t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: this.dep('c', function(){}),
          c: this.dep('a', function(){})
        };
      });
      expect(function(){
        return t.edges('a');
      }).to.throwError(/Circular dependency: a → b → c → a/);
    },
    'should detect reflexive circular dependencies': function(){
      var t = saito(function(){
        return {
          a: this.dep('a', function(){})
        };
      });
      expect(function(){
        return t.edges('a');
      }).to.throwError(/Circular dependency: a → a/);
    }
  },
  'pattern': {
    'should match entire thing': function(){
      expect(pattern.match(['%'], 'a')).to.have.property('name', 'a');
    },
    'prefixes': {
      'should match': function(){
        expect(pattern.match(['a%'], 'abcde')).to.have.property('name', 'abcde');
      },
      'should get the stem': function(){
        expect(pattern.match(['a%'], 'abcde')).to.have.property('stem', 'bcde');
      },
      'should save the pattern': function(){
        expect(pattern.match(['a%'], 'abcde')).to.have.property('pattern', 'a%');
      },
      'shouldn\'t match things that don\'t': function(){
        expect(pattern.match(['a%'], 'ghijk')).to.be(void 8);
      },
      'should match the shortest stem': function(){
        var m = pattern.match(['a%', 'abc%'], 'abcde');
        expect(m).to.have.property('name', 'abcde');
        expect(m).to.have.property('stem', 'de');
        expect(m).to.have.property('pattern', 'abc%');
      }
    },
    'suffixes': {
      'should match': function(){
        expect(pattern.match(['%e'], 'abcde')).to.have.property('name', 'abcde');
      },
      'should get the stem': function(){
        expect(pattern.match(['%e'], 'abcde')).to.have.property('stem', 'abcd');
      },
      'should save the pattern': function(){
        expect(pattern.match(['%e'], 'abcde')).to.have.property('pattern', '%e');
      },
      'shouldn\'t match things that don\'t': function(){
        expect(pattern.match(['%e'], 'ghijk')).to.be(void 8);
      },
      'should match the shortest stem': function(){
        var m = pattern.match(['%e', '%cde'], 'abcde');
        expect(m).to.have.property('name', 'abcde');
        expect(m).to.have.property('stem', 'ab');
        expect(m).to.have.property('pattern', '%cde');
      }
    },
    'middleixes': {
      'should match': function(){
        expect(pattern.match(['a%e'], 'abcde')).to.have.property('name', 'abcde');
      },
      'should get the stem': function(){
        expect(pattern.match(['a%e'], 'abcde')).to.have.property('stem', 'bcd');
      },
      'should save the pattern': function(){
        expect(pattern.match(['a%e'], 'abcde')).to.have.property('pattern', 'a%e');
      },
      'shouldn\'t match things that don\'t': function(){
        expect(pattern.match(['a%e'], 'ghijk')).to.be(void 8);
      },
      'should match the shortest stem': function(){
        var m = pattern.match(['a%e', 'ab%de'], 'abcde');
        expect(m).to.have.property('name', 'abcde');
        expect(m).to.have.property('stem', 'c');
        expect(m).to.have.property('pattern', 'ab%de');
      }
    },
    'slashes': {
      'should match': function(){
        var m = pattern.match(['src/%.js'], 'src/foo/bar.js');
        expect(m).to.have.property('name', 'src/foo/bar.js');
        expect(m).to.have.property('stem', 'foo/bar');
        expect(m).to.have.property('pattern', 'src/%.js');
      }
    },
    'interpolate': function(){
      return {
        'should put a thing where the percent is': function(){
          expect(pattern.interpolate('%', 'a')).to.be('a');
        },
        'should do prefixes': function(){
          expect(pattern.interpolate('a%', 'a')).to.be('aa');
        },
        'should do suffixes': function(){
          expect(pattern.interpolate('%a', 'a')).to.be('aa');
        }
      };
    }
  }
};
