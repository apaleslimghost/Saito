require! {
  toposort
  './pattern'
}

find = (f,a)--> a.filter f .0

module.exports = class Saito
  (spec)~>
    @tasks = spec.call this

  task: (name)->
    results = {}
    order = toposort @edges name .reverse!
    for t in (if order.length then order else [name])
      {name: resolved} = @resolve-task t
      task = @tasks[resolved]
      args = [results[@resolve-task d .name] for d in @get-deps task]
      results[resolved] = task ...args
    results[@resolve-task name .name]

  dep: (...deps, fn)->
    fn import {deps}

  resolve-task: (name)->
    | name of @tasks => {name}
    | find (pattern.match [name]), (Object.keys @tasks) => name: that
    | pattern.match (Object.keys @tasks), name => name: that.pattern
    | otherwise => throw new ReferenceError "No such task #name"

  get-task: ({name})->
    @tasks[name]

  get-deps: (task)->
    task[]deps

  edges: (start)->
    | start? => @find-edges start
    | otherwise => [[name, dep] for name, task of @tasks for dep in @get-deps task]

  find-edges: (name, stack = [])->
    throw new Error "Circular dependency: #{(stack ++ name).join ' → '}" if name in stack
    task = @get-task @resolve-task name
    results = @get-deps task .reduce ((list, dep)~> list ++ @find-edges dep, stack ++ name), []
    results ++ [[name, dep] for dep in @get-deps task]
