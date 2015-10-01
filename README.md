# hodgepodge

Resolving hapi plugin dependencies since 2015

[![Build Status](https://travis-ci.org/devinivy/hodgepodge.svg?branch=master)](https://travis-ci.org/devinivy/hodgepodge)

## The Basics
When you declare dependencies on a hapi plugin, whether by `server.dependency()` or by the `dependencies` attribute, hapi does not actually defer plugin registration to resolve those dependencies in time.  It just assures that those dependencies exist at the time the server is initialized.  Hodgepodge actually reorders your plugin registrations so that they occur in an order that respects their dependencies, simply by paying attention to their `dependencies` attributes.

### More
In a sense this is an alternative to the `server.dependency(deps, [after])` pattern, which some find to be clunky.  In contrast to use of `server.dependency()`'s `after` callback, dependencies are dealt with at the time of plugin registration rather than during server initialization (during `onPreStart`).

Due to this core difference in timing, it may be required that your plugin be registered using hodgepodge to ensure that plugin dependencies are resolved in time for the plugin to be used.  In order to enforce this, add `hodgepodge: true` to your plugin attributes.  When hodgepodge passes over your plugin, it will remove this attribute; but if hodgepodge is not used to register your plugin, hapi will fail when it tries to register your plugin because `hodgepodge` is an invalid attribute.  This is by design, in case you want to enforce registration of your plugin using hodgepodge.  If you do this, remember that hodgepodge is then a `peerDependency` of your project!

Hodgepodge throws an exception when there are circular dependencies, or if dependencies will otherwise not be met during registration.

## Usage

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
  dependencies: ['vision'], // Hodgepodge enforces this when the plugin is registered
  hodgepodge: true // Ensure this plugin is registered with hodgepodge (optional)
};

```

#### Without hodgepodge
Here's what the clunkier (but steadfast!) `server.dependency(deps, [after])` patterns looks like,
```js
// Life without hodgepodge

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

### Registering plugins
Hodgepodge accepts and understands any plugin registration format that you would normally pass to `server.register()`.
```js
var Hodgepodge = require('hodgepodge');

var plugins = Hodgepodge([
  require('my-plugin'),         // May require john-does-plugin be registered first
  require('john-does-plugin'),  // May require don-moes-plugin be registered first
  require('don-moes-plugin')
]);

server.register(plugins, function (err) {
    if (err) {
        console.error('Failed to load a plugin:', err);
    }
});
```
