module.exports = class Cobbler
  (spec)~>
    @tasks = spec.call this

  task: (name)->
    task = @tasks[name]
    results = [@task dep for dep in task[]deps]
    task ...results

  dep: (deps, fn)->
    deps = [] ++ deps
    fn import {deps}