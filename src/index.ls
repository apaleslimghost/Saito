module.exports = class Cobbler
  (spec)~>
    @tasks = spec.call this

  task: (name)->
    task = @tasks[name]
    results = [@task dep for dep in task[]deps]
    task ...results

  dep: (...deps, fn)->
    fn import {deps}

  edges: (start)->
    | start? => @find-edges start
    | otherwise => [[name, dep] for name, task of @tasks for dep in task[]deps]

  find-edges: (name)->
    task = @tasks[name]
    results = task[]deps.reduce ((list, dep)~> list ++ @find-edges dep), []
    results ++ [[name, dep] for dep in task[]deps]
