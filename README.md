# hodgepodge

Resolving hapi plugin dependencies since 2015

[![Build Status](https://travis-ci.org/hapipal/hodgepodge.svg?branch=master)](https://travis-ci.org/hapipal/hodgepodge) [![Coverage Status](https://coveralls.io/repos/hapipal/hodgepodge/badge.svg?branch=master&service=github)](https://coveralls.io/github/hapipal/hodgepodge?branch=master)

Lead Maintainer - [Devin Ivy](https://github.com/devinivy)

## Usage
> See also the [API Reference](API.md)
>
> This version of hodgepodge is for **hapi v17+**

When you declare dependencies on a hapi plugin, whether by [`server.dependency()`](https://github.com/hapijs/hapi/blob/master/API.md#server.dependency()) or by the [`dependencies` plugin property](https://github.com/hapijs/hapi/blob/master/API.md#plugins), hapi does not actually defer plugin registration to resolve those dependencies.  It just assures that those dependencies exist at the time the server is initialized.  Hodgepodge actually reorders your plugin registrations so that they occur in an order that respects their dependencies, simply by paying attention to their listed `dependencies`.

> **Note**
>
> It's suggested to use hodgepodge only when it's really necessary– ideally plugin registration order should not matter.  You may, for example, utilize the [`once` plugin registration option](https://github.com/hapijs/hapi/blob/master/API.md#server.register()) or
[`once`/`multiple` plugin properties](https://github.com/hapijs/hapi/blob/master/API.md#plugins) so that plugins may simply be registered by every other plugin that depends on them.
>
> See ["Handling plugin dependencies"](https://hapipal.com/best-practices/handling-plugin-dependencies) for an in-depth look at taming inter-plugin dependencies.

```js
const Hodgepodge = require('hodgepodge');

(async () => {

    const plugins = Hodgepodge.sort([
        pluginA, // pluginA.dependencies === 'pluginB'
        pluginB
    ]);

    // Now plugins looks like [pluginB, pluginA]
    // This ordering respects pluginA's dependency on pluginB

    await server.register(plugins);
})();
```

### More
In a sense this is an alternative to the [`server.dependency(deps, [after])`](https://github.com/hapijs/hapi/blob/master/API.md#server.dependency()) [pattern](API.md#without-hodgepodge), which some find to be clunky.  In contrast to use of `server.dependency()`'s `after` callback, dependencies are dealt with at the time of plugin registration rather than during server initialization (during [`onPreStart`](https://github.com/hapijs/hapi/blob/master/API.md#server.ext())).

Due to this core difference in timing, it may be required that your plugin be registered using hodgepodge to ensure that plugin dependencies are resolved in time for the plugin to be used.  In order to enforce this, wrap your plugin's `dependencies` in an object with a single property `hodgepodge`.  When hodgepodge passes over your plugin, it will unwrap this property; but if hodgepodge is not used to register your plugin, hapi will fail when it tries to register your plugin because `{ hodgepodge: [] }` is an invalid `dependencies` plugin property.  This is by design, in case you want to enforce registration of your plugin using hodgepodge.  If you do this, remember that hodgepodge is then a `peerDependency` of your project!

Hodgepodge throws an exception when there are circular dependencies, or if dependencies will otherwise not be met during registration.

### Limitations
Because hodgepodge reorders serial plugin registrations rather than deferring plugin registration until dependencies are met, hodgepodge can only resolve dependencies among plugins that are registered at the same time.
