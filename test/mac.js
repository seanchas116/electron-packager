var exec = require('child_process').exec
var fs = require('fs')
var path = require('path')

var packager = require('..')
var test = require('tape')
var waterfall = require('run-waterfall')

var config = require('./config.json')
var util = require('./util')
var plist = require('plist')

var baseOpts = {
  name: 'basicTest',
  dir: path.join(__dirname, 'fixtures', 'basic'),
  version: config.version,
  arch: 'x64',
  platform: 'darwin'
}

function createIconTest (icon, iconPath) {
  return function (t) {
    t.timeoutAfter(config.timeout)

    var opts = Object.create(baseOpts)
    opts.icon = icon

    var resourcesPath

    waterfall([
      function (cb) {
        packager(opts, cb)
      }, function (paths, cb) {
        resourcesPath = path.join(paths[0], util.generateResourcesPath(opts))
        fs.stat(resourcesPath, cb)
      }, function (stats, cb) {
        t.true(stats.isDirectory(), 'The output directory should contain the expected resources subdirectory')
        util.areFilesEqual(iconPath, path.join(resourcesPath, 'atom.icns'), cb)
      }, function (equal, cb) {
        t.true(equal, 'atom.icns should be identical to the specified icon file')
        cb()
      }
    ], function (err) {
      t.end(err)
    })
  }
}

function createAppVersionTest (appVersion, buildVersion) {
  return function (t) {
    t.timeoutAfter(config.timeout)

    var plistPath
    var opts = Object.create(baseOpts)
    opts['app-version'] = opts['build-version'] = appVersion

    if (buildVersion) {
      opts['build-version'] = buildVersion
    }

    waterfall([
      function (cb) {
        packager(opts, cb)
      }, function (paths, cb) {
        plistPath = path.join(paths[0], opts.name + '.app', 'Contents', 'Info.plist')
        fs.stat(plistPath, cb)
      }, function (stats, cb) {
        t.true(stats.isFile(), 'The expected Info.plist file should exist')
        fs.readFile(plistPath, 'utf8', cb)
      }, function (file, cb) {
        var obj = plist.parse(file)
        t.equal(obj.CFBundleVersion, opts['build-version'], 'CFBundleVersion should reflect build-version')
        t.equal(obj.CFBundleShortVersionString, opts['app-version'], 'CFBundleShortVersionString should reflect app-version')
        cb()
      }
    ], function (err) {
      t.end(err)
    })
  }
}

function createHelperInfoTest (helperBundleId) {
  return function (t) {
    t.timeoutAfter(config.timeout)

    var opts = Object.create(baseOpts)
    opts['helper-bundle-id'] = helperBundleId

    var frameworksPath
    var plistPath

    waterfall([
      function (cb) {
        packager(opts, cb)
      }, function (paths, cb) {
        frameworksPath = path.join(paths[0], opts.name + '.app', 'Contents', 'Frameworks')
        plistPath = path.join(frameworksPath, opts.name + ' Helper.app', 'Contents', 'Info.plist')
        fs.stat(plistPath, cb)
      }, function (stats, cb) {
        t.true(stats.isFile(), 'The Helper Info.plist file should exist')
        fs.readFile(plistPath, 'utf8', cb)
      }, function (file, cb) {
        var obj = plist.parse(file)
        var helperName = opts.name + ' Helper'
        t.equal(obj.CFBundleIdentifier, opts['helper-bundle-id'], 'Helper CFBundleIdentifier should reflect helper-bundle-id')
        t.equal(obj.CFBundleName, helperName, 'Helper CFBundleName should reflect name')
        t.equal(obj.CFBundleDisplayName, helperName, 'Helper CFBundleDisplayName should reflect name')
        t.equal(obj.CFBundleExecutable, helperName, 'Helper CFBundleExecutable should reflect helper app name')

        plistPath = path.join(frameworksPath, opts.name + ' Helper EH.app', 'Contents', 'Info.plist')
        fs.stat(plistPath, cb)
      }, function (stats, cb) {
        t.true(stats.isFile(), 'The Helper EH Info.plist file should exist')
        fs.readFile(plistPath, 'utf8', cb)
      }, function (file, cb) {
        var obj = plist.parse(file)
        var helperName = opts.name + ' Helper EH'
        t.equal(obj.CFBundleIdentifier, opts['helper-bundle-id'] + '.EH', 'Helper EH CFBundleIdentifier should reflect helper-bundle-id')
        t.equal(obj.CFBundleName, helperName, 'Helper EH CFBundleName should reflect name')
        t.equal(obj.CFBundleDisplayName, helperName, 'Helper EH CFBundleDisplayName should reflect name')
        t.equal(obj.CFBundleExecutable, helperName, 'Helper EH CFBundleExecutable should reflect helper app name')

        plistPath = path.join(frameworksPath, opts.name + ' Helper NP.app', 'Contents', 'Info.plist')
        fs.stat(plistPath, cb)
      }, function (stats, cb) {
        t.true(stats.isFile(), 'The Helper NP Info.plist file should exist')
        fs.readFile(plistPath, 'utf8', cb)
      }, function (file, cb) {
        var obj = plist.parse(file)
        var helperName = opts.name + ' Helper NP'
        t.equal(obj.CFBundleIdentifier, opts['helper-bundle-id'] + '.NP', 'Helper NP CFBundleIdentifier should reflect helper-bundle-id')
        t.equal(obj.CFBundleName, helperName, 'Helper NP CFBundleName should reflect name')
        t.equal(obj.CFBundleDisplayName, helperName, 'Helper NP CFBundleDisplayName should reflect name')
        t.equal(obj.CFBundleExecutable, helperName, 'Helper NP CFBundleExecutable should reflect helper app name')
        cb()
      },
    ], function (err) {
      t.end(err)
    })
  }
}

function createAppCategoryTypeTest (appCategoryType) {
  return function (t) {
    t.timeoutAfter(config.timeout)

    var plistPath
    var opts = Object.create(baseOpts)
    opts['app-category-type'] = appCategoryType

    waterfall([
      function (cb) {
        packager(opts, cb)
      }, function (paths, cb) {
        plistPath = path.join(paths[0], opts.name + '.app', 'Contents', 'Info.plist')
        fs.stat(plistPath, cb)
      }, function (stats, cb) {
        t.true(stats.isFile(), 'The expected Info.plist file should exist')
        fs.readFile(plistPath, 'utf8', cb)
      }, function (file, cb) {
        var obj = plist.parse(file)
        t.equal(obj.LSApplicationCategoryType, opts['app-category-type'], 'LSApplicationCategoryType should reflect opts.["app-category-type"]')
        cb()
      }
    ], function (err) {
      t.end(err)
    })
  }
}

util.setup()
test('helper app paths test', function (t) {
  t.timeoutAfter(config.timeout)

  function getHelperExecutablePath (helperName) {
    return path.join(helperName + '.app', 'Contents', 'MacOS', helperName)
  }

  var opts = Object.create(baseOpts)
  var frameworksPath

  waterfall([
    function (cb) {
      packager(opts, cb)
    }, function (paths, cb) {
      frameworksPath = path.join(paths[0], opts.name + '.app', 'Contents', 'Frameworks')
      // main Helper.app is already tested in basic test suite; test its executable and the other helpers
      fs.stat(path.join(frameworksPath, getHelperExecutablePath(opts.name + ' Helper')), cb)
    }, function (stats, cb) {
      t.true(stats.isFile(), 'The Helper.app executable should reflect opts.name')
      fs.stat(path.join(frameworksPath, opts.name + ' Helper EH.app'), cb)
    }, function (stats, cb) {
      t.true(stats.isDirectory(), 'The Helper EH.app should reflect opts.name')
      fs.stat(path.join(frameworksPath, getHelperExecutablePath(opts.name + ' Helper EH')), cb)
    }, function (stats, cb) {
      t.true(stats.isFile(), 'The Helper EH.app executable should reflect opts.name')
      fs.stat(path.join(frameworksPath, opts.name + ' Helper NP.app'), cb)
    }, function (stats, cb) {
      t.true(stats.isDirectory(), 'The Helper NP.app should reflect opts.name')
      fs.stat(path.join(frameworksPath, getHelperExecutablePath(opts.name + ' Helper NP')), cb)
    }, function (stats, cb) {
      t.true(stats.isFile(), 'The Helper NP.app executable should reflect opts.name')
      cb()
    }
  ], function (err) {
    t.end(err)
  })
})
util.teardown()

var iconBase = path.join(__dirname, 'fixtures', 'monochrome')
var icnsPath = iconBase + '.icns'
util.setup()
test('icon test: .icns specified', createIconTest(icnsPath, icnsPath))
util.teardown()

util.setup()
test('icon test: .ico specified (should replace with .icns)', createIconTest(iconBase + '.ico', icnsPath))
util.teardown()

util.setup()
test('icon test: basename only (should add .icns)', createIconTest(iconBase, icnsPath))
util.teardown()

util.setup()
test('codesign test', function (t) {
  t.timeoutAfter(config.timeout)

  var opts = Object.create(baseOpts)
  opts.sign = '-' // Ad-hoc

  var appPath

  waterfall([
    function (cb) {
      packager(opts, cb)
    }, function (paths, cb) {
      appPath = path.join(paths[0], opts.name + '.app')
      fs.stat(appPath, cb)
    }, function (stats, cb) {
      t.true(stats.isDirectory(), 'The expected .app directory should exist')
      exec('codesign --verify --deep ' + appPath, cb)
    }, function (stdout, stderr, cb) {
      t.pass('codesign should verify successfully')
      cb()
    }
  ], function (err) {
    var notFound = err && err.code === 127
    if (notFound) console.log('codesign not installed; skipped')
    t.end(notFound ? null : err)
  })
})
util.teardown()

util.setup()
test('app and build version test', createAppVersionTest('1.1.0', '1.1.0.1234'))
util.teardown()

util.setup()
test('app version test', createAppVersionTest('1.1.0'))
util.teardown()

util.setup()
test('app categoryType test', createAppCategoryTypeTest('public.app-category.developer-tools'))
util.teardown()

util.setup()
test('helper info test', createHelperInfoTest('org.test.basic-test.helper'))
util.teardown()
