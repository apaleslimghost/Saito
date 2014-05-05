require! {
  saito: './lib'
  './lib/pattern'
  'karma-sinon-expect'.expect
}

export
  'Saito':
    'task':
      'should return the result of a task': ->
        r = {}
        t = saito -> a: -> r
        expect t.task \a .to.be r
      'should resolve simple dependencies': ->
        r = {}
        a = expect.sinon.stub!
        a.with-args \intermediate .returns r
        t = saito ->
          a: @dep \b a
          b: -> 'intermediate'
        expect t.task \a .to.be r
        expect a .to.be.called-with \intermediate
      'should resolve dependency chains': ->
        a = expect.sinon.stub!
        b = expect.sinon.stub!
        a.with-args \b .returns \a
        b.with-args \c .returns \b
        t = saito ->
          a: @dep \b a
          b: @dep \c b
          c: -> 'c'
        expect t.task \a .to.be \a
        expect a .to.be.called-with \b
        expect b .to.be.called-with \c
      'should resolve multiple dependencies': ->
        a = expect.sinon.stub!
        a.with-args \b \c .returns \a
        t = saito ->
          a: @dep \b \c a
          b: -> 'b'
          c: -> 'c'
        expect t.task \a .to.be \a
        expect a .to.be.called-with \b \c
      'should call each dependency once': ->
        d = expect.sinon.stub!
        t = saito ->
          a: @dep \b \d ->
          b: @dep \c ->
          c: @dep \d ->
          d: d
        t.task \a
        expect d .to.be.called-once!
      'should barf on circular dependencies': ->
        d = expect.sinon.stub!
        t = saito ->
          a: @dep \b ->
          b: @dep \a ->
        expect (-> t.task \a) .to.throw-error /Circular dependency: a → b → a/
    'resolve-task':
      'should find a task with a simple name': ->
        t = saito -> a:\task
        expect t.resolve-task \a .to.be \a
      'should throw if it can\'t find a task': ->
        t = saito -> a:\task
        expect (-> t.resolve-task \b) .to.throw-error /No such task b/
    'edges':
      'should return a list of dependency graph edges with simple deps': ->
        t = saito ->
          a: @dep \b ->
          b: ->
        expect t.edges! .to.eql [[\a \b]]
      'should return a list of dependency graph edges with deps chains': ->
        t = saito ->
          a: @dep \b ->
          b: @dep \c ->
          c: ->
        expect t.edges! .to.eql [[\a \b], [\b \c]]
      'should return a list of dependency graph edges with multiple deps': ->
        t = saito ->
          a: @dep \b \c ->
          b: ->
          c: ->
        expect t.edges! .to.eql [[\a \b], [\a \c]]
      'should return a minimal set of edges in case of unconnected tasks': ->
        t = saito ->
          a: @dep \b ->
          b: @dep \c ->
          d: @dep \c ->
          c: ->
        expect t.edges \a .to.eql [[\b \c], [\a \b]]
        expect t.edges \d .to.eql [[\d \c]]
      'should detect circular dependencies': ->
        t = saito ->
          a: @dep \b ->
          b: @dep \a ->
        expect (-> t.edges \a) .to.throw-error /Circular dependency: a → b → a/
      'should detect transitive circular dependencies': ->
        t = saito ->
          a: @dep \b ->
          b: @dep \c ->
          c: @dep \a ->
        expect (-> t.edges \a) .to.throw-error /Circular dependency: a → b → c → a/
      'should detect reflexive circular dependencies': ->
        t = saito ->
          a: @dep \a ->
        expect (-> t.edges \a) .to.throw-error /Circular dependency: a → a/
    'pattern':
      'should match entire thing': ->
        expect pattern ['%'] 'a' .to.have.property \match 'a'
      'prefixes':
        'should match': ->
          expect pattern ['a%'] 'abcde' .to.have.property \match 'abcde'
        'should get the stem': ->
          expect pattern ['a%'] 'abcde' .to.have.property \stem 'bcde'
        'should save the pattern': ->
          expect pattern ['a%'] 'abcde' .to.have.property \pattern 'a%'
        'shouldn\'t match things that don\'t': ->
          expect pattern ['a%'] 'ghijk' .to.be void
        'should match the shortest stem': ->
          m = pattern [
            'a%'
            'abc%'
          ] 'abcde'
          expect m .to.have.property \match 'abcde'
          expect m .to.have.property \stem 'de'
          expect m .to.have.property \pattern 'abc%'

      'suffixes':
        'should match': ->
          expect pattern ['%e'] 'abcde' .to.have.property \match 'abcde'
        'should get the stem': ->
          expect pattern ['%e'] 'abcde' .to.have.property \stem 'abcd'
        'should save the pattern': ->
          expect pattern ['%e'] 'abcde' .to.have.property \pattern '%e'
        'shouldn\'t match things that don\'t': ->
          expect pattern ['%e'] 'ghijk' .to.be void
        'should match the shortest stem': ->
          m = pattern [
            '%e'
            '%cde'
          ] 'abcde'
          expect m .to.have.property \match 'abcde'
          expect m .to.have.property \stem 'ab'
          expect m .to.have.property \pattern '%cde'