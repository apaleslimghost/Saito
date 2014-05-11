require! {
  toposort
  './pattern'
}

find = (f,a)--> a.filter f .0
flat-map = (f, xs)--> xs.reduce ((a,x)-> a ++ f x), []
map = (f, xs)--> flat-map (-> [f it]), xs

module.exports = class Saito
  (spec)~>
    @tasks = spec.call this

  task: (name)->
    results = {}
    order = toposort @edges name .reverse!
    for t in (if order.length then order else [name])
      spec = @resolve-task t
      task = @get-task spec
      args = [results[@resolve-task d .name] for d in @get-deps task, spec]
      results[spec.name] = task ...args
    results[@resolve-task name .name]

  dep: (...deps, fn)->
    fn import {deps}

  resolve-task: (name)->
    | name of @tasks => {name}
    | find (pattern.match [name]), (Object.keys @tasks) => name: that
    | pattern.match (Object.keys @tasks), name => that
    | otherwise => throw new ReferenceError "No such task #name"

  get-task: ({pattern, name})->
    @tasks[pattern ? name]

  get-deps: (task, spec = {})->
    f = if spec.stem then map pattern.interpolate _, that else -> it
    f task[]deps

  edges: (start)->
    | start? => @find-edges start
    | otherwise => [[name, dep] for name, task of @tasks for dep in @get-deps task]

  find-edges: (name, stack = [])->
    throw new Error "Circular dependency: #{(stack ++ name).join ' → '}" if name in stack
    spec = @resolve-task name
    task = @get-task spec
    collect-deps = flat-map @find-edges _, stack ++ name
    (collect-deps @get-deps task, spec) ++ [[name, dep] for dep in @get-deps task, spec]
