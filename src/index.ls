module.exports = class Cobbler
  (spec)~>
    @tasks = spec.call this

  task: (name)->
    task = @tasks[name]
    results = [@task dep for dep in task[]deps]
    task ...results

  dep: (...deps, fn)->
    fn import {deps}

  edges: ->
    [[name, dep] for name, task of @tasks for dep in task[]deps]