var Topo = require('topo');

module.exports = function (plugins) {

    var list = new Topo();

    plugins = [].concat(plugins || []);

    var depsTally = {};
    var pluginTally = {};

    var processPlugin = function (plugin) {

        var pluginFn;
        var attributes = {};

        // Best guess at where to find the actual plugin defintion
        if (typeof plugin === 'object' && plugin.register) {

            if (typeof plugin.register === 'object' && plugin.register.register) {
                pluginFn = plugin.register.register;
            } else {
                pluginFn = plugin.register;
            }

        } else {
            pluginFn = plugin;
        }

        // If this looks like a proper plugin defintion, give it the treatment
        if (typeof pluginFn === 'function') {

            attributes = pluginFn.attributes || {};

            // Consume the hodgepodge attribute
            delete attributes.hodgepodge;
        }

        // Tally dependencies

        if (attributes.dependencies) {
            var deps = [].concat(attributes.dependencies);
            for (var i = 0; i < deps.length; ++i) {
                depsTally[deps[i]] = true;
            }
        }

        if (attributes.name) {
            pluginTally[attributes.name] = true;
        }

        // Add plugin into the list
        list.add(plugin, {
            after: attributes.dependencies,
            group: attributes.name
        });

    };

    // Process each plugin into the list
    for (var i = 0; i < plugins.length; ++i) {
        processPlugin(plugins[i]);
    }

    // Ensure all dependencies are present

    var pluginNames = Object.keys(pluginTally);
    var missingDeps = Object.keys(depsTally).filter(function (depName) {

        return !~pluginNames.indexOf(depName);
    });

    if (missingDeps.length) {

        throw new Error('Missing dependencies: ' + missingDeps.join(', ') + '.');
    }

    return list.nodes;
};
