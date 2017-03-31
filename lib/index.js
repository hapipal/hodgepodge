'use strict';

const Topo = require('topo');

const internals = {};

module.exports = (plugins, looseTally) => {

    plugins = [].concat(plugins || []);
    looseTally = looseTally || false;

    const list = new Topo();
    const depsTally = {};
    const pluginTally = {};

    const processPlugin = (plugin) => {

        let pluginFn;
        let hodgepodging = false;
        let deps;
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
            hodgepodging = attributes.dependencies && attributes.dependencies.hodgepodge;
            deps = hodgepodging ? ((hodgepodging === true) ? [] : hodgepodging) : attributes.dependencies;
            tallyable = tallyable || hodgepodging;
        }

        // Tally dependencies

        if (tallyable && deps) {
            const depsList = [].concat(deps);
            for (let i = 0; i < depsList.length; ++i) {
                depsTally[depsList[i]] = true;
            }
        }

        if (attributes.name) {
            pluginTally[attributes.name] = true;
        }

        // Add plugin into the list
        list.add(hodgepodging ? internals.makePlugin(pluginFn, deps) : plugin, {
            after: deps,
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

// Makes plain plugin from a hodgepodging plugin-func
internals.makePlugin = (pluginFn, deps) => {

    const plugin = pluginFn.bind();
    plugin.attributes = Object.assign({}, pluginFn.attributes);
    plugin.attributes.dependencies = deps;

    return plugin;
};
