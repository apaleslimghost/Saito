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
      resolved = @resolve-task t
      task = @tasks[resolved]
      args = [results[@resolve-task d] for d in task[]deps]
      results[resolved] = task ...args
    results[@resolve-task name]

  dep: (...deps, fn)->
    fn import {deps}

  resolve-task: (name)->
    | name of @tasks => name
    | find (pattern.match [name], _), (Object.keys @tasks) => that
    | pattern.match (Object.keys @tasks), name => that.pattern
    | otherwise => throw new ReferenceError "No such task #name"

  edges: (start)->
    | start? => @find-edges start
    | otherwise => [[name, dep] for name, task of @tasks for dep in task[]deps]

  find-edges: (name, stack = [])->
    throw new Error "Circular dependency: #{(stack ++ name).join ' → '}" if name in stack
    task = @tasks[@resolve-task name]
    results = task[]deps.reduce ((list, dep)~> list ++ @find-edges dep, stack ++ name), []
    results ++ [[name, dep] for dep in task[]deps]
