'use strict';

const Topo = require('topo');

exports.sort = (plugins, looseTally) => {

    plugins = [].concat(plugins || []);
    looseTally = looseTally || false;

    const list = new Topo();
    const depsTally = {};
    const pluginTally = {};

    const processPlugin = (plugin) => {

        const originalPlugin = plugin;

        // Not plugin-lookin'
        if ((typeof plugin !== 'object' || plugin === null) && typeof plugin !== 'function') {
            return list.add(plugin);
        }

        if (typeof plugin === 'function' && !plugin.register) {
            plugin = { register: plugin };
        }
        else {
            plugin = Object.assign({}, plugin);
        }

        // Also not plugin-lookin'
        if (!plugin.register) {
            return list.add(plugin);
        }

        if (plugin.register.register) {
            plugin.register = plugin.register.register;
        }

        // Also also not plugin-lookin'
        if (typeof plugin.register !== 'function' ||
            !plugin.register.attributes ||
            !plugin.register.attributes.name) {

            return list.add(plugin);
        }

        // Now, this looks like a plugin registration!

        const attributes = plugin.register.attributes;
        const hodgepodging = attributes.dependencies && attributes.dependencies.hodgepodge;
        const deps = hodgepodging ? ((hodgepodging === true) ? [] : hodgepodging) : attributes.dependencies;
        const tallyable = !looseTally || hodgepodging;

        // Tally dependencies

        pluginTally[attributes.name] = true;

        if (tallyable && deps) {
            const depsList = [].concat(deps);
            for (let i = 0; i < depsList.length; ++i) {
                depsTally[depsList[i]] = true;
            }
        }

        if (hodgepodging) {
            plugin.register = Object.assign(plugin.register.bind(), plugin.register);
            plugin.register.attributes = Object.assign({}, plugin.register.attributes);
            plugin.register.attributes.dependencies = deps;
        }

        // Add plugin into the list
        list.add(hodgepodging ? plugin : originalPlugin, {
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
