require! {
  cobbler: './lib'
  'karma-sinon-expect'.expect
}

export
  'Cobbler':
    'task':
      'should return the result of a task': ->
        r = {}
        t = cobbler -> a: -> r
        expect t.task \a .to.be r
      'should resolve simple dependencies': ->
        r = {}
        a = expect.sinon.stub!
        a.with-args \intermediate .returns r
        t = cobbler ->
          a: @dep \b a
          b: -> 'intermediate'
        expect t.task \a .to.be r
        expect a .to.be.called-with \intermediate
      'should resolve dependency chains': ->
        a = expect.sinon.stub!
        b = expect.sinon.stub!
        a.with-args \b .returns \a
        b.with-args \c .returns \b
        t = cobbler ->
          a: @dep \b a
          b: @dep \c b
          c: -> 'c'
        expect t.task \a .to.be \a
        expect a .to.be.called-with \b
        expect b .to.be.called-with \c
      'should resolve multiple dependencies': ->
        a = expect.sinon.stub!
        a.with-args \b \c .returns \a
        t = cobbler ->
          a: @dep \b \c a
          b: -> 'b'
          c: -> 'c'
        expect t.task \a .to.be \a
        expect a .to.be.called-with \b \c
    'edges':
      'should return a list of dependency graph edges with simple deps': ->
        t = cobbler ->
          a: @dep \b ->
          b: ->
        expect t.edges! .to.eql [[\a \b]]
      'should return a list of dependency graph edges with deps chains': ->
        t = cobbler ->
          a: @dep \b ->
          b: @dep \c ->
          c: ->
        expect t.edges! .to.eql [[\a \b], [\b \c]]
      'should return a list of dependency graph edges with multiple deps': ->
        t = cobbler ->
          a: @dep \b \c ->
          b: ->
          c: ->
        expect t.edges! .to.eql [[\a \b], [\a \c]]
      'should return a minimal set of edges in case of unconnected tasks': ->
        t = cobbler ->
          a: @dep \b ->
          b: @dep \c ->
          d: @dep \c ->
          c: ->
        expect t.edges \a .to.eql [[\b \c], [\a \b]]
        expect t.edges \d .to.eql [[\d \c]]
      'should detect circular dependencies': ->
        t = cobbler ->
          a: @dep \b ->
          b: @dep \a ->
        expect (-> t.edges \a) .to.throw-error /Circular dependency: a → b → a/