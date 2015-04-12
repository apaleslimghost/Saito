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
    'can be a function': function() {
      expect(saito(function() {
        return {a: function() { return 'a'; }};
      })('a')).to.be('a');
    },
    'can be a plain object': function() {
      expect(saito({
        a: function() { return 'a'; }
      })('a')).to.be('a');
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
      expect(t('a')).to.be(r);
    },
    'should resolve simple dependencies': function(){
      var r = {};
      var a = sinon.stub();
      a.withArgs('intermediate').returns(r);
      var t = saito(function(){
        return {
          a: this.dep('b', a),
          b: function(){
            return 'intermediate';
          }
        };
      });
      expect(t('a')).to.be(r);
      expect(a).was.calledWith('intermediate');
    },
    'should resolve dependency chains': function(){
      var a = sinon.stub();
      var b = sinon.stub();
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
      expect(t('a')).to.be('a');
      expect(a).was.calledWith('b');
      expect(b).was.calledWith('c');
    },
    'should resolve multiple dependencies': function(){
      var a = sinon.stub();
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
      expect(t('a')).to.be('a');
      expect(a).was.calledWith('b', 'c');
    },
    'should call each dependency once': function(){
      var d = sinon.stub();
      var t = saito(function(){
        return {
          a: this.dep('b', 'd', function(){}),
          b: this.dep('c', function(){}),
          c: this.dep('d', function(){}),
          d: d
        };
      });
      t('a');
      expect(d).was.calledOnce();
    },
    'should barf on circular dependencies': function(){
      var d = sinon.stub();
      var t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: this.dep('a', function(){})
        };
      });
      expect(function(){
        return t('a');
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
      expect(t('file.txt')).to.be('a');
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
        expect(t('a.a')).to.be('a');
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
        expect(t('a.a')).to.be('a');
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
        expect(t('a.b')).to.be('A');
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
        expect(t('a.b')).to.be('A');
        expect(t('b.b')).to.be('B');
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
        expect(t('a.a')).to.be('a');
        expect(t('b.a')).to.be('b');
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
        expect(t('a.a')).to.be('aB');
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
          return t('b.a');
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
        expect(t('a.a')).to.be('aB');
        expect(t('b.a')).to.be('aC');
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
          t('a.a');
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
            expect(t('a.a')).to.be('ab');
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

        t('a');
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
        t('a');
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
        t('a');
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
        t('a');
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
        t('a');
      }
    }
  }
};
