var Topo = require('topo');

module.exports = function (plugins) {

    var list = new Topo();

    plugins = [].concat(plugins || []);

    var processPlugin = function (plugin) {

        var pluginFn;
        var attributes = {};

        // Best guess at where to find the actual plugin defintion
        if (typeof plugin === 'object' && plugin.register) {
            pluginFn = plugin;
        }

        // If this looks like a proper plugin defintion, give it the treatment
        if (typeof pluginFn === 'function' &&
            pluginFn.attributes) {

            attributes = pluginFn.attributes;

            // Consume the hodgepodge attribute
            delete attributes.hodgepodge;
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

    return list.nodes;
};
