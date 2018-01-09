# API Reference

## Interface

### `Hodgepodge.sort(plugins, [looseTally])`
A function that returns an array of reordered hapi `plugins` to respect their [`dependencies` properties](https://github.com/hapijs/hapi/blob/master/API.md#plugins),
  - `plugins` - a mixed value, typically a mixed array, of hapi plugin registrations as would be passed to [`server.register()`](https://github.com/hapijs/hapi/blob/master/API.md#server.register()).  This argument permissively accepts all values so that hapi can handle plugin formatting errors.
  - `looseTally` - a boolean value defaulting to `false` that, when `true`, only requires that hapi plugins with a `dependencies.hodgepodge` property present have their dependencies fully satisfied in the list of `plugins`.  This may be desirable when plugins without `dependencies.hodgepodge` have had their dependencies satisfied from prior plugin registrations or otherwise do not want to rely on hodgepodge for dependency resolution.  The name of the option refers to keeping a "loose tally" of missing dependencies.

`Hodgepodge.sort()` will unwrap the [`dependencies` property](https://github.com/hapijs/hapi/blob/master/API.md#plugins) of all plugins in the `plugins` list that wrap their dependencies using `dependencies.hodgepodge`.  This can be leveraged in a plugin to require that hodgepodge be used to register it; otherwise vanilla plugin registration would fail since `{ hodgepodge: [] }` is not a valid plugin `dependencies` value.  For example, a plugin as such,
```js
const plugin = {
    register() {/* ... */},
    name: 'my-plugin',
    dependencies: { hodgepodge: ['some-dep'] }
};
```

will be "unwrapped" to effectively use the following _valid_ format,
```js
const plugin = {
    register() {/* ... */},
    name: 'my-plugin',
    dependencies: ['some-dep']
};
```

`Hodgepodge.sort()` throws an exception when there are circular dependencies.  It also throws an exception when there are missing dependencies in the list of `plugins`, differing in behavior based upon `looseTally`.


## Examples

### Registering plugins
Hodgepodge accepts and understands any plugin registration format that you would normally pass to [`server.register()`](https://github.com/hapijs/hapi/blob/master/API.md#server.register()).  It returns an array of the reordered plugin registrations.
```js
const Hodgepodge = require('hodgepodge');

(async () => {

    const plugins = Hodgepodge.sort([
        require('my-plugin'),         // Requires john-does-plugin be registered first
        require('john-does-plugin'),  // Requires don-moes-plugin be registered first
        require('don-moes-plugin')
    ]);

    // Registers don-moes-plugin, john-does-plugin, then my-plugin
    await server.register(plugins);
})();
```

### Writing a plugin

#### With hodgepodge
Here's what plugin authorship looks like assuming use of hodgepodge,
```js
// Life with hodgepodge

module.exports = {
    register(server) {

        // Requires vision
        server.views(/* ... */);
    },
    name: 'my-plugin',
    dependencies: ['vision']  // Hodgepodge enforces this dependency when the plugin is registered
    // dependencies: { hodgepodge: ['vision'] }
    // The commented line above would additionally ensure
    // this plugin is registered with hodgepodge (optional)
};
```

#### Without hodgepodge
Here's what the clunkier (but steadfast!) [`server.dependency(deps, [after])`](https://github.com/hapijs/hapi/blob/master/API.md#server.dependency()) pattern looks like,
```js
// Life without hodgepodge

const internals = {};

module.exports = {
    name: 'my-plugin',
    register(server) {

        server.dependency(['vision'], internals.register(options));
    }
};

internals.register = (options) => {

    return (server) => {

        // Requires vision
        server.views(/* ... */);
    };
};
```
