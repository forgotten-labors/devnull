/**!
 * dev/null
 * @copyright (c) 2011 Observe.it (observe.it) <arnout@observe.com>
 * MIT Licensed
 */

describe('dev/null, logger', function () {
  it('should expose the current version number', function () {
    Logger.version.should.be.a('string')
    Logger.version.should.match(/[0-9]+\.[0-9]+\.[0-9]+/)
  })

  it('should expose the logging methods', function () {
    Logger.methods.should.be.a('object')
    Logger.methods.development.should.be.a('object')
    Logger.methods.production.should.be.a('object')

    var production = Object.keys(Logger.methods.production)
      , development = Object.keys(Logger.methods.development)

    production.length.should.be.above(0)
    development.length.should.be.above(0)

    production.length.should.equal(development.length)

    production.forEach(function (key) {
      development.indexOf(key).should.be.above(-1)

      Logger.methods.production[key].should.be.a('string')
      Logger.methods.development[key].should.be.a('string')
    })
  })

  it('should expose the logging levels', function () {
    Logger.levels.should.be.a('object')

    var levels = Object.keys(Logger.levels)

    levels.length.should.be.above(0)

    levels.forEach(function (key) {
      Logger.levels[key].should.be.a('number')
    })
  })

  it('should have the same log levels as methods', function () {
    var levels = Object.keys(Logger.levels)
      , production = Object.keys(Logger.methods.production)

    levels.length.should.equal(production.length)

    levels.forEach(function (key) {
      production.indexOf(key).should.be.above(-1)
    })
  })

  describe('#initialization', function () {
    it('should not throw when constructed without arguments', function () {
      var logger = new Logger
    })

    it('should have defaults', function () {
      var logger = new Logger

      logger.should.respondTo('configure')
      logger.should.respondTo('use')
      logger.should.respondTo('has')
      logger.should.respondTo('remove')
      logger.should.respondTo('write')

      logger.env.should.be.a('string')
      logger.level.should.be.a('number')
      logger.notification.should.be.a('number')
      logger.timestamp.should.be.a('boolean')
      logger.pattern.should.be.a('string')
    })

    it('should not throw when constructed with an empty object', function () {
      var logger = new Logger({})

      logger.should.respondTo('configure')
      logger.should.respondTo('use')
      logger.should.respondTo('has')
      logger.should.respondTo('remove')
      logger.should.respondTo('write')

      logger.env.should.be.a('string')
      logger.level.should.be.a('number')
      logger.notification.should.be.a('number')
      logger.timestamp.should.be.a('boolean')
      logger.pattern.should.be.a('string')
    })

    it('should override the defaults with a config object', function () {
      var logger = new Logger({
          level: 1
        , notification: 0
        , pattern: 'pew pew'
      })

      logger.level.should.equal(1)
      logger.notification.should.equal(0)
      logger.pattern.should.equal('pew pew')
    })

    it('should not override the methods with a config object', function () {
      var logger = new Logger({ use: 'pewpew' })

      logger.should.respondTo('use')
    })

    it('should not introduce new properties with a config object', function () {
      var logger = new Logger({
          level: 0
        , introduced: true
        , pattern: 'pew pew'
      })

      logger.level.should.equal(0)
      logger.pattern.should.equal('pew pew')

      require('should').not.exist(logger.introduced)
    })

    it('should have the same log methods as levels', function () {
      var logger = new Logger
        , levels = Object.keys(Logger.levels)
        , asserts = 0

      levels.forEach(function (key) {
        logger.should.respondTo(key)
        ++asserts
      })

      asserts.should.be.above(2)
    })
  })

  describe('#configure', function () {
    it('no evenironment var should always trigger the callback', function () {
      var logger = new Logger
        , asserts = 0

      logger.configure.should.be.a('function')
      logger.configure(function () {
        ++asserts
        this.should.equal(logger)
      })

      asserts.should.equal(1)
    })

    it('should trigger callback for all environments and production', function () {
      var logger = new Logger
        , asserts = 0

      logger.env.should.be.a('string')
      logger.env = 'production'

      logger.configure(function () {
        ++asserts
        this.should.equal(logger)
      })

      logger.configure('production', function () {
        ++asserts
        this.should.equal(logger)
      })

      logger.configure('invalid', function () {
        should.fail('should not run')
      })

      asserts.should.equal(2)
    })

    it('should return a logger instance with no arguments are passed', function () {
      var logger = new Logger
        , configure = logger.configure()

      configure.should.equal(logger)
    })

    it('should return a logger instance', function (){
      var logger = new Logger
        , configure = logger.configure(function () {})

      configure.should.equal(logger)
    })
  })

  describe('#use', function () {
    it('should execute the given function', function () {
      var logger = new Logger({ base:false })
        , transport = fixtures.transport()
        , asserts = 0

      transport.on('initialize', function () {
        ++asserts
      })

      logger.use(transport.dummy)

      asserts.should.equal(1)
    })

    it('should executed function should receive arguments', function () {
      var logger = new Logger({ base:false })
        , transport = fixtures.transport()
        , asserts = 0

      transport.on('initialize', function (self, options) {
        ++asserts

        self.should.equal(logger)
        options.foo.should.equal('bar')
      })

      logger.use(transport.dummy, { foo:'bar' })

      asserts.should.equal(1)
    })

    it('should add the transport to the transports array', function () {
      var logger = new Logger({ base:false })
        , transport = fixtures.transport()
        , asserts = 0

      transport.on('initialize', function () {
        ++asserts
      })

      logger.transports.length.should.equal(0)
      logger.use(transport.dummy)
      logger.transports.length.should.equal(1)

      asserts.should.equal(1)
    })

    it('should create a new instance of the function', function () {
      var logger = new Logger({ base:false })
        , transport = fixtures.transport()
        , asserts = 0

      transport.on('initialize', function () {
        ++asserts
      })

      logger.use(transport.dummy)
      logger.transports[0].should.be.an.instanceof(transport.dummy)

      asserts.should.equal(1)
    })

    it('should only add functions', function () {
      var logger = new Logger({ base:false })

      logger.transports.length.should.equal(0)

      logger.use('string')
      logger.transports.length.should.equal(0)

      logger.use({})
      logger.transports.length.should.equal(0)

      logger.use([])
      logger.transports.length.should.equal(0)

      logger.use(1337)
      logger.transports.length.should.equal(0)

      logger.use(new Date)
      logger.transports.length.should.equal(0)

      logger.use(/regexp/)
      logger.transports.length.should.equal(0)
    })

    it('should return a logger instance', function () {
      var logger = new Logger({ base:false })
        , use = logger.use(function () {})

      use.should.equal(logger)
    })
  })

  describe('#has', function () {
    it('should return a boolean for failures', function () {
      var logger = new Logger({ base:false })

      logger.has('a').should.be.a('boolean')
      logger.has('b').should.be.false
    })

    it('should not throw without when called without arguments', function () {
      var logger = new Logger({ base:false })

      logger.has().should.be.a('boolean')
    })

    it('should return the found instance', function () {
      var logger = new Logger({ base:false })
        , transport = fixtures.transport()

      logger.use(transport.dummy)
      logger.has(transport.dummy).should.be.an.instanceof(transport.dummy)
    })

    it('should return the found match, if it equals the argument', function () {
      var logger = new Logger({ base:false })
        , dummy = function () {}

      logger.transports.push(dummy)
      logger.has(dummy).should.equal(dummy)
    })
  })

  describe('#remove', function () {
    it('should call the .destroy method of the instance', function () {
      var logger = new Logger({ base:false })
        , transport = fixtures.transport()
        , asserts = 0

      transport.on('close', function () {
        ++asserts
      })

      logger.use(transport.dummy)
      logger.remove(transport.dummy)

      asserts.should.equal(1)
    })

    it('should remove the transport from the transports array', function () {
      var logger = new Logger({ base:false })
        , transport = fixtures.transport()
        , asserts = 0

      transport.on('close', function () {
        ++asserts
      })

      logger.use(transport.dummy)
      logger.transports.length.should.equal(1)

      var rm = logger.remove(transport.dummy)
      logger.transports.length.should.equal(0)

      rm.should.equal(logger)
      asserts.should.equal(1)
    })

    it('should return a logger instance when nothing is found', function () {
      var logger = new Logger({ base:false })

      logger.remove().should.equal(logger)
    })

    it('should only remove the given logger instance', function () {
      var logger = new Logger
        , transport = fixtures.transport()
        , base = require('../transports/stream')

      logger.transports.length.should.equal(1)

      logger.use(transport.dummy)
      logger.transports.length.should.equal(2)

      logger.remove(transport.dummy)
      logger.transports.length.should.equal(1)
      logger.transports.pop().should.be.an.instanceof(base)
    })
  })

  describe('#stamp', function () {
    it('should not generate a timestamp when disabled', function () {
      var logger = new Logger({ timestamp: false })

      logger.stamp().should.be.a('string')
      logger.stamp().should.equal('')
    })

    it('should default to today when called without arguments', function () {
      var logger = new Logger({ pattern: '{FullYear}{Date}'})
        , today = new Date

      logger.stamp().should.be.a('string')
      logger.stamp().should.equal(today.getFullYear() + '' + today.getDate())
    })

    it('should also execute date methods instead of patterns', function () {
      var logger = new Logger({ pattern: '{toLocaleDateString}' })
        , now = new Date

      logger.stamp(now).should.equal(now.toLocaleDateString())
    })

    it('should pad the values based on the pattern', function () {
      var logger = new Logger({ pattern: '{Date:10}' })
        , date = new Date(2011, 06, 05)

      logger.stamp(date).should.equal('0000000005')
    })

    it('should increase month by 1', function () {
      var logger = new Logger({ pattern: '{Month}' })
        , date = new Date(2011, 6, 12)

      logger.stamp(date).should.equal('7')
    })

    it('should just non template tags', function () {
      var logger = new Logger({ pattern: 'hello <b>world</b> its {FullYear}'})
        , date = new Date

      logger.stamp(date).should.equal('hello <b>world</b> its ' + date.getFullYear())
    })
  })
})
