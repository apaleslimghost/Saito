module.exports = class Cobbler
  (spec)~>
    @tasks = spec.call this

  task: (name)->
    @tasks[name]!