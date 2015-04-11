var saito = require('./lib');
var pattern = require('./lib/pattern');
var expect = require('karma-sinon-expect').expect;

exports.Saito = {
  'task': {
    'should return the result of a task': function(){
      var r, t;
      r = {};
      t = saito(function(){
        return {
          a: function(){
            return r;
          }
        };
      });
      return expect(t.task('a')).to.be(r);
    },
    'should resolve simple dependencies': function(){
      var r, a, t;
      r = {};
      a = expect.sinon.stub();
      a.withArgs('intermediate').returns(r);
      t = saito(function(){
        return {
          a: this.dep('b', a),
          b: function(){
            return 'intermediate';
          }
        };
      });
      expect(t.task('a')).to.be(r);
      return expect(a).to.be.calledWith('intermediate');
    },
    'should resolve dependency chains': function(){
      var a, b, t;
      a = expect.sinon.stub();
      b = expect.sinon.stub();
      a.withArgs('b').returns('a');
      b.withArgs('c').returns('b');
      t = saito(function(){
        return {
          a: this.dep('b', a),
          b: this.dep('c', b),
          c: function(){
            return 'c';
          }
        };
      });
      expect(t.task('a')).to.be('a');
      expect(a).to.be.calledWith('b');
      return expect(b).to.be.calledWith('c');
    },
    'should resolve multiple dependencies': function(){
      var a, t;
      a = expect.sinon.stub();
      a.withArgs('b', 'c').returns('a');
      t = saito(function(){
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
      expect(t.task('a')).to.be('a');
      return expect(a).to.be.calledWith('b', 'c');
    },
    'should call each dependency once': function(){
      var d, t;
      d = expect.sinon.stub();
      t = saito(function(){
        return {
          a: this.dep('b', 'd', function(){}),
          b: this.dep('c', function(){}),
          c: this.dep('d', function(){}),
          d: d
        };
      });
      t.task('a');
      return expect(d).to.be.calledOnce();
    },
    'should barf on circular dependencies': function(){
      var d, t;
      d = expect.sinon.stub();
      t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: this.dep('a', function(){})
        };
      });
      return expect(function(){
        return t.task('a');
      }).to.throwError(/Circular dependency: a → b → a/);
    },
    'should match tasks on patterns': function(){
      var t;
      t = saito(function(){
        return {
          '%.txt': function(){
            return 'a';
          }
        };
      });
      return expect(t.task('file.txt')).to.be('a');
    },
    'templates': {
      'should run tasks by filling in templates': function(){
        var t;
        t = saito(function(){
          return {
            '%.a': function(){
              return 'a';
            }
          };
        });
        return expect(t.task('a.a')).to.be('a');
      },
      'should prefer exact matches to templates': function(){
        var t;
        t = saito(function(){
          return {
            'a.a': function(){
              return 'a';
            },
            '%.a': function(){
              return 'b';
            }
          };
        });
        return expect(t.task('a.a')).to.be('a');
      },
      'should do dependencies by filling in templates': function(){
        var t;
        t = saito(function(){
          return {
            'a.a': function(){
              return 'a';
            },
            '%.b': this.dep('%.a', function(it){
              return it.toUpperCase();
            })
          };
        });
        return expect(t.task('a.b')).to.be('A');
      },
      'should work out which wildcard dependency to use': function(){
        var t;
        t = saito(function(){
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
        expect(t.task('a.b')).to.be('A');
        return expect(t.task('b.b')).to.be('B');
      },
      'should fall back to wildcard if there isn\'t a specific rule': function(){
        var t;
        t = saito(function(){
          return {
            'a.a': function(){
              return 'a';
            },
            '%.a': function(){
              return 'b';
            }
          };
        });
        expect(t.task('a.a')).to.be('a');
        return expect(t.task('b.a')).to.be('b');
      },
      'should do transitive wildcard dependencies': function(){
        var t;
        t = saito(function(){
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
        return expect(t.task('a.a')).to.be('aB');
      },
      'should error if it can\'t find a concrete wildcard depencency': function(){
        var t;
        t = saito(function(){
          return {
            'a.a': function(){
              return 'a';
            },
            '%.b': this.dep('%.a', function(it){
              return it.toUpperCase();
            })
          };
        });
        return expect(function(){
          return t.task('b.a');
        }).to.throwError('No such task b.a');
      },
      'should find concretes for transitive dependencies': function(){
        var t;
        t = saito(function(){
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
        expect(t.task('a.a')).to.be('aB');
        return expect(t.task('b.a')).to.be('aC');
      }
    }
  },
  'resolve-task': {
    'should find a task with a simple name': function(){
      var t;
      t = saito(function(){
        return {
          a: 'task'
        };
      });
      return expect(t.resolveTask('a')).to.eql({
        name: 'a'
      });
    },
    'should match patterns': function(){
      var t;
      t = saito(function(){
        return {
          '%.txt': 'task'
        };
      });
      return expect(t.resolveTask('file.txt')).to.have.property('pattern', '%.txt');
    },
    'should throw if it can\'t find a task': function(){
      var t;
      t = saito(function(){
        return {
          a: 'task'
        };
      });
      return expect(function(){
        return t.resolveTask('b');
      }).to.throwError(/No such task b/);
    }
  },
  'edges': {
    'should return a list of dependency graph edges with simple deps': function(){
      var t;
      t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: function(){}
        };
      });
      return expect(t.edges()).to.eql([['a', 'b']]);
    },
    'should return a list of dependency graph edges with deps chains': function(){
      var t;
      t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: this.dep('c', function(){}),
          c: function(){}
        };
      });
      return expect(t.edges()).to.eql([['a', 'b'], ['b', 'c']]);
    },
    'should return a list of dependency graph edges with multiple deps': function(){
      var t;
      t = saito(function(){
        return {
          a: this.dep('b', 'c', function(){}),
          b: function(){},
          c: function(){}
        };
      });
      return expect(t.edges()).to.eql([['a', 'b'], ['a', 'c']]);
    },
    'should return a minimal set of edges in case of unconnected tasks': function(){
      var t;
      t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: this.dep('c', function(){}),
          d: this.dep('c', function(){}),
          c: function(){}
        };
      });
      expect(t.edges('a')).to.eql([['b', 'c'], ['a', 'b']]);
      return expect(t.edges('d')).to.eql([['d', 'c']]);
    },
    'should detect circular dependencies': function(){
      var t;
      t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: this.dep('a', function(){})
        };
      });
      return expect(function(){
        return t.edges('a');
      }).to.throwError(/Circular dependency: a → b → a/);
    },
    'should detect transitive circular dependencies': function(){
      var t;
      t = saito(function(){
        return {
          a: this.dep('b', function(){}),
          b: this.dep('c', function(){}),
          c: this.dep('a', function(){})
        };
      });
      return expect(function(){
        return t.edges('a');
      }).to.throwError(/Circular dependency: a → b → c → a/);
    },
    'should detect reflexive circular dependencies': function(){
      var t;
      t = saito(function(){
        return {
          a: this.dep('a', function(){})
        };
      });
      return expect(function(){
        return t.edges('a');
      }).to.throwError(/Circular dependency: a → a/);
    }
  },
  'pattern': {
    'should match entire thing': function(){
      return expect(pattern.match(['%'], 'a')).to.have.property('name', 'a');
    },
    'prefixes': {
      'should match': function(){
        return expect(pattern.match(['a%'], 'abcde')).to.have.property('name', 'abcde');
      },
      'should get the stem': function(){
        return expect(pattern.match(['a%'], 'abcde')).to.have.property('stem', 'bcde');
      },
      'should save the pattern': function(){
        return expect(pattern.match(['a%'], 'abcde')).to.have.property('pattern', 'a%');
      },
      'shouldn\'t match things that don\'t': function(){
        return expect(pattern.match(['a%'], 'ghijk')).to.be(void 8);
      },
      'should match the shortest stem': function(){
        var m;
        m = pattern.match(['a%', 'abc%'], 'abcde');
        expect(m).to.have.property('name', 'abcde');
        expect(m).to.have.property('stem', 'de');
        return expect(m).to.have.property('pattern', 'abc%');
      }
    },
    'suffixes': {
      'should match': function(){
        return expect(pattern.match(['%e'], 'abcde')).to.have.property('name', 'abcde');
      },
      'should get the stem': function(){
        return expect(pattern.match(['%e'], 'abcde')).to.have.property('stem', 'abcd');
      },
      'should save the pattern': function(){
        return expect(pattern.match(['%e'], 'abcde')).to.have.property('pattern', '%e');
      },
      'shouldn\'t match things that don\'t': function(){
        return expect(pattern.match(['%e'], 'ghijk')).to.be(void 8);
      },
      'should match the shortest stem': function(){
        var m;
        m = pattern.match(['%e', '%cde'], 'abcde');
        expect(m).to.have.property('name', 'abcde');
        expect(m).to.have.property('stem', 'ab');
        return expect(m).to.have.property('pattern', '%cde');
      }
    },
    'middleixes': {
      'should match': function(){
        return expect(pattern.match(['a%e'], 'abcde')).to.have.property('name', 'abcde');
      },
      'should get the stem': function(){
        return expect(pattern.match(['a%e'], 'abcde')).to.have.property('stem', 'bcd');
      },
      'should save the pattern': function(){
        return expect(pattern.match(['a%e'], 'abcde')).to.have.property('pattern', 'a%e');
      },
      'shouldn\'t match things that don\'t': function(){
        return expect(pattern.match(['a%e'], 'ghijk')).to.be(void 8);
      },
      'should match the shortest stem': function(){
        var m;
        m = pattern.match(['a%e', 'ab%de'], 'abcde');
        expect(m).to.have.property('name', 'abcde');
        expect(m).to.have.property('stem', 'c');
        return expect(m).to.have.property('pattern', 'ab%de');
      }
    },
    'slashes': {
      'should match': function(){
        var m;
        m = pattern.match(['src/%.js'], 'src/foo/bar.js');
        expect(m).to.have.property('name', 'src/foo/bar.js');
        expect(m).to.have.property('stem', 'foo/bar');
        return expect(m).to.have.property('pattern', 'src/%.js');
      }
    },
    'interpolate': function(){
      return {
        'should put a thing where the percent is': function(){
          return expect(pattern.interpolate('%', 'a')).to.be('a');
        },
        'should do prefixes': function(){
          return expect(pattern.interpolate('a%', 'a')).to.be('aa');
        },
        'should do suffixes': function(){
          return expect(pattern.interpolate('%a', 'a')).to.be('aa');
        }
      };
    }
  }
};
