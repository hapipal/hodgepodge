# hodgepodge

Resolving hapi plugin dependencies since 2015

[![Build Status](https://travis-ci.org/devinivy/hodgepodge.svg?branch=master)](https://travis-ci.org/devinivy/hodgepodge) [![Coverage Status](https://coveralls.io/repos/devinivy/hodgepodge/badge.svg?branch=master&service=github)](https://coveralls.io/github/devinivy/hodgepodge?branch=master)

## Usage
> See also the [API Reference](API.md)

When you declare dependencies on a hapi plugin, whether by [`server.register()`](http://hapijs.com/api#serverregisterplugins-options-callback) or by the `dependencies` attribute, hapi does not actually defer plugin registration to resolve those dependencies in time.  It just assures that those dependencies exist at the time the server is initialized.  Hodgepodge actually reorders your plugin registrations so that they occur in an order that respects their dependencies, simply by paying attention to their `dependencies` attributes.

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

### More
In a sense this is an alternative to the [`server.dependency(deps, [after])`](http://hapijs.com/api#serverdependencydependencies-after) [pattern](API.md#without-hodgepodge), which some find to be clunky.  In contrast to use of [`server.dependency()`](http://hapijs.com/api#serverdependencydependencies-after)'s `after` callback, dependencies are dealt with at the time of plugin registration rather than during server initialization (during `onPreStart`).

Due to this core difference in timing, it may be required that your plugin be registered using hodgepodge to ensure that plugin dependencies are resolved in time for the plugin to be used.  In order to enforce this, wrap your plugin's `attributes.dependencies` in an object with a single property `hodgepodge`.  When hodgepodge passes over your plugin, it will unwrap this property; but if hodgepodge is not used to register your plugin, hapi will fail when it tries to register your plugin because `{ hodgepodge: [] }` is an invalid `dependencies` attribute.  This is by design, in case you want to enforce registration of your plugin using hodgepodge.  If you do this, remember that hodgepodge is then a `peerDependency` of your project!

Hodgepodge throws an exception when there are circular dependencies, or if dependencies will otherwise not be met during registration.

### Limitations
Because hodgepodge reorders serial plugin registrations rather than deferring plugin registration until dependencies are met, hodgepodge can only resolve dependencies among plugins that are registered at the same time.
