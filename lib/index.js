'use strict';

const Topo = require('topo');

module.exports = (plugins, looseTally) => {

    plugins = [].concat(plugins || []);
    looseTally = looseTally || false;

    const list = new Topo();
    const depsTally = {};
    const pluginTally = {};

    const processPlugin = (plugin) => {

        let pluginFn;
        let attributes = {};
        let tallyable = !looseTally;

        // Best guess at where to find the actual plugin defintion
        if (typeof plugin === 'object' && plugin.register) {
            if (typeof plugin.register === 'object' && plugin.register.register) {
                pluginFn = plugin.register.register;
            }
            else {
                pluginFn = plugin.register;
            }
        }
        else {
            pluginFn = plugin;
        }

        // If this looks like a proper plugin defintion, give it the treatment
        if (typeof pluginFn === 'function') {

            attributes = pluginFn.attributes || {};
            tallyable = tallyable || attributes.hasOwnProperty('hodgepodge');

            // Consume the hodgepodge attribute
            delete attributes.hodgepodge;
        }

        // Tally dependencies

        if (tallyable && attributes.dependencies) {
            const deps = [].concat(attributes.dependencies);
            for (let i = 0; i < deps.length; ++i) {
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
    for (let i = 0; i < plugins.length; ++i) {
        processPlugin(plugins[i]);
    }

    // Ensure all dependencies are present

    const pluginNames = Object.keys(pluginTally);
    const missingDeps = Object.keys(depsTally).filter((depName) => {

        return !~pluginNames.indexOf(depName);
    });

    if (missingDeps.length) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}.`);
    }

    return list.nodes;
};
