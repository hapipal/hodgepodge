# hodgepodge

Resolving hapi plugin dependencies since 2015

[![Build Status](https://travis-ci.org/devinivy/hodgepodge.svg?branch=master)](https://travis-ci.org/devinivy/hodgepodge) [![Coverage Status](https://coveralls.io/repos/devinivy/hodgepodge/badge.svg?branch=master&service=github)](https://coveralls.io/github/devinivy/hodgepodge?branch=master)

## The Basics
```js
const Hodgepodge = require('hodgepodge');

const plugins = Hodgepodge.sort([
    pluginA, // pluginA.register.attributes.dependencies === 'pluginB'
    pluginB
]);

// Now plugins looks like [pluginB, pluginA]
// This ordering respects pluginA's dependency on pluginB

server.register(plugins, function (err) {/* ... */});
```
When you declare dependencies on a hapi plugin, whether by [`server.register()`](http://hapijs.com/api#serverregisterplugins-options-callback) or by the `dependencies` attribute, hapi does not actually defer plugin registration to resolve those dependencies in time.  It just assures that those dependencies exist at the time the server is initialized.  Hodgepodge actually reorders your plugin registrations so that they occur in an order that respects their dependencies, simply by paying attention to their `dependencies` attributes.

### More
In a sense this is an alternative to the [`server.dependency(deps, [after])`](http://hapijs.com/api#serverdependencydependencies-after) pattern, which some find to be clunky.  In contrast to use of [`server.dependency()`](http://hapijs.com/api#serverdependencydependencies-after)'s `after` callback, dependencies are dealt with at the time of plugin registration rather than during server initialization (during `onPreStart`).

Due to this core difference in timing, it may be required that your plugin be registered using hodgepodge to ensure that plugin dependencies are resolved in time for the plugin to be used.  In order to enforce this, wrap your plugin's `attributes.dependencies` in an object with a single property `hodgepodge`.  When hodgepodge passes over your plugin, it will unwrap this property; but if hodgepodge is not used to register your plugin, hapi will fail when it tries to register your plugin because `{ hodgepodge: [] }` is an invalid `dependencies` attribute.  This is by design, in case you want to enforce registration of your plugin using hodgepodge.  If you do this, remember that hodgepodge is then a `peerDependency` of your project!

Hodgepodge throws an exception when there are circular dependencies, or if dependencies will otherwise not be met during registration.

### Limitations
Because hodgepodge reorders serial plugin registrations rather than deferring plugin registration until dependencies are met, hodgepodge can only resolve dependencies among plugins that are registered at the same time.


## Usage

### Registering plugins
Hodgepodge accepts and understands any plugin registration format that you would normally pass to [`server.register()`](http://hapijs.com/api#serverregisterplugins-options-callback).  It returns an array of the reordered plugin registrations.
```js
const Hodgepodge = require('hodgepodge');

const plugins = Hodgepodge.sort([
    require('my-plugin'),         // Requires john-does-plugin be registered first
    require('john-does-plugin'),  // Requires don-moes-plugin be registered first
    require('don-moes-plugin')
]);

// Registers don-moes-plugin, john-does-plugin, then my-plugin
server.register(plugins, function (err) {
    if (err) {
        console.error('Failed to load a plugin:', err);
    }
});
```

### Writing a plugin

#### With hodgepodge
Here's what plugin authorship looks like assuming use of hodgepodge,
```js
// Life with hodgepodge

exports.register = function (server, options, next) {

    // Requires vision
    server.views(/* ... */);

    return next();
};

exports.register.attributes = {
    name: 'my-plugin',
    dependencies: ['vision']  // Hodgepodge enforces this dependency when the plugin is registered
    // dependencies: { hodgepodge: ['vision'] }
    // The commented line above would additionally ensure
    // this plugin is registered with hodgepodge (optional)
};

```

#### Without hodgepodge
Here's what the clunkier (but steadfast!) [`server.dependency(deps, [after])`](http://hapijs.com/api#serverdependencydependencies-after) pattern looks like,
```js
// Life without hodgepodge

const internals = {};

exports.register = function (server, options, next) {

    server.dependency(['vision'], internals.register(options));

    return next();
};

exports.register.attributes = {
    name: 'my-plugin'
};

internals.register = function (options) {

    return (server, next) {

        // Requires vision
        server.views(/* ... */);

        return next();
    };
};
```


## API

### `Hodgepodge.sort(plugins, [looseTally])`
A function that returns an array of reordered hapi `plugins` to respect their `dependencies` attributes where,
  - `plugins` - a mixed value, typically a mixed array, of hapi plugin registrations as would be passed to hapi's [`server.register()`](http://hapijs.com/api#serverregisterplugins-options-callback).  This argument permissively accepts all values so that hapi can handle plugin formatting errors.
  - `looseTally` - a boolean value defaulting to `false` that, when `true`, only requires that hapi plugins with a `dependencies.hodgepodge` attribute present have their dependencies fully satisfied in the list of `plugins`.  This may be desirable when plugins without `dependencies.hodgepodge` have had their dependencies satisfied from prior plugin registrations or otherwise do not want to rely on hodgepodge for dependency resolution.  The name of the option refers to keeping a "loose tally" of missing dependencies.

`Hodgepodge.sort()` will unwrap the `dependencies` attribute of all plugins in the `plugins` list that wrap their dependencies using `dependencies.hodgepodge`.  This can be leveraged in a plugin to require that hodgepodge be used to register it; otherwise vanilla plugin registration would fail since `{ hodgepodge: [] }` is not a valid `dependencies` attribute value.  For example, a plugin with attributes,
```js
plugin.attributes = {
    name: 'my-plugin',
    dependencies: { hodgepodge: ['some-dep'] }
};
```

will be "unwrapped" to effectively use the following _valid_ attributes,
```js
plugin.attributes = {
    name: 'my-plugin',
    dependencies: ['some-dep']
};
```

`Hodgepodge.sort()` throws an exception when there are circular dependencies.  It also throws an exception when there are missing dependencies in the list of `plugins`, differing in behavior based upon `looseTally`.
