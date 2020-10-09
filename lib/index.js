'use strict';

const Topo = require('@hapi/topo');

const internals = {};

exports.sort = (plugins, looseTally) => {

    plugins = [].concat(plugins || []);
    looseTally = looseTally || false;

    const list = new Topo.Sorter();
    const depsTally = {};
    const pluginTally = {};

    const processPlugin = (item) => {

        const originalItem = item;
        item = internals.normalizePlugin(item);

        if (item === internals.NOT_A_PLUGIN) {
            return list.add(originalItem);
        }

        const name = item.plugin.name || (item.plugin.pkg && item.plugin.pkg.name);

        if (!name) {
            return list.add(originalItem);
        }

        // Now, this looks like a plugin registration item!

        const hodgepodging = item.plugin.dependencies && item.plugin.dependencies.hodgepodge;
        const deps = hodgepodging ? ((hodgepodging === true) ? [] : hodgepodging) : item.plugin.dependencies;
        const tallyable = !looseTally || hodgepodging;

        // Tally dependencies

        pluginTally[name] = true;

        if (tallyable && deps) {
            [].concat(deps).forEach((dep) => {

                depsTally[dep] = true;
            });
        }

        if (hodgepodging) {
            item = {
                ...item,
                plugin: {
                    ...item.plugin,
                    dependencies: deps
                }
            };
        }

        // Add plugin into the list
        list.add(hodgepodging ? item : originalItem, {
            after: deps,
            group: name
        });
    };

    // Process each plugin into the list
    plugins.forEach(processPlugin);

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

// In,
// { register, ...attributes }
// { plugin: { register, ...attributes }, options, once, routes }
// { plugin: { plugin: { register, ...attributes } }, options, once, routes }
//
// Out,
// { plugin: { register, ...attributes }, options, once, routes }

internals.normalizePlugin = (item) => {

    if (!item) {
        return internals.NOT_A_PLUGIN;
    }
    else if (!item.plugin) {
        item = { plugin: item };
    }
    else if (!item.plugin.register) {
        const { plugin, ...opts } = item;
        item = { plugin: plugin.plugin, ...opts };
    }

    if (!item.plugin || typeof item.plugin.register !== 'function') {
        return internals.NOT_A_PLUGIN;
    }

    return item;
};

internals.NOT_A_PLUGIN = 'not-a-plugin';
