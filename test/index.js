'use strict';

// Load modules

const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const Somever = require('@hapi/somever');
const Hodgepodge = require('..');

const Hapi = Somever.match(process.version, '>=12') ? require('@hapi/hapi-19') : require('@hapi/hapi');

// Test shortcuts

const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Hodgepodge', () => {

    // Plain plugin

    const pluginPlain = {
        name: 'plugin-plain',
        dependencies: { hodgepodge: true },
        register: () => 'plain'
    };

    // Plugin A

    const pluginA = {
        name: 'plugin-a',
        dependencies: ['plugin-b', 'plugin-c'],
        register: () => 'A'
    };

    // Plugin B

    const pluginB = {
        name: 'plugin-b',
        dependencies: 'plugin-c',
        register: () => 'B'
    };

    // Plugin C

    const pluginC = {
        pkg: { name: 'plugin-c' },
        dependencies: { hodgepodge: true },
        register: () => 'C'
    };

    // Plugin D

    const pluginD = {
        name: 'plugin-d',
        dependencies: { hodgepodge: ['plugin-a', 'plugin-b'] },
        register: () => 'D'
    };

    // Plugin E

    const pluginE = {
        name: 'plugin-e',
        register: () => 'E'
    };

    // Finally the tests

    it('consumes falsey values.', () => {

        expect(Hodgepodge.sort(false)).to.equal([]);
        expect(Hodgepodge.sort(null)).to.equal([]);
        expect(Hodgepodge.sort(undefined)).to.equal([]);
    });

    it('consumes a plain plugin.', () => {

        expect(pluginPlain.dependencies.hodgepodge).to.exist();

        const hodgepodged = Hodgepodge.sort(pluginPlain);

        const [
            { plugin: { register, ...attributes } },
            ...others
        ] = hodgepodged;

        expect(others).to.have.length(0);
        expect(register()).to.equal('plain');
        expect(attributes).to.equal({
            name: 'plugin-plain',
            dependencies: []
        });
    });

    it('consumes unfamiliar objects.', () => {

        const ufos = [
            1,
            'two',
            { three: 3 },
            null
        ];

        expect(Hodgepodge.sort(ufos)).to.equal(ufos);

        const degenerates = [
            {   // No registration function
                register: 2,
                name: 'plugin-name',
                dependencies: { hodgepodge: true }
            },
            {   // No name
                register: () => null,
                dependencies: { hodgepodge: true }
            },
            {   // No name from pkg
                register: () => null,
                dependencies: { hodgepodge: true },
                pkg: {}
            },
            {   // No plugin.plugin
                plugin: {}
            }
        ];

        const [X, Y, Z, W, ...others] = Hodgepodge.sort(degenerates);

        expect(others).to.have.length(0);
        expect([X, Y, Z, W]).to.equal(degenerates);
        expect(X).to.equal(degenerates[0]);
        expect(Y).to.equal(degenerates[1]);
        expect(Z).to.equal(degenerates[2]);
        expect(W).to.equal(degenerates[3]);

        expect(Hodgepodge.sort(1)).to.equal([1]);
    });

    it('consumes a list of plugins using the { register } format.', () => {

        expect(pluginPlain.dependencies.hodgepodge).to.equal(true);

        const hodgepodged = Hodgepodge.sort([pluginPlain]);

        const [
            { plugin: { register, ...attributes } },
            ...others
        ] = hodgepodged;

        expect(others).to.have.length(0);
        expect(register()).to.equal('plain');
        expect(attributes).to.equal({
            name: 'plugin-plain',
            dependencies: []
        });
    });

    it('consumes a list of plugins using the { plugin, options } format.', () => {

        expect(pluginPlain.dependencies.hodgepodge).to.equal(true);

        const options = {};
        const hodgepodged = Hodgepodge.sort([{ plugin: pluginPlain, options }]);

        const [
            { plugin: { register, ...attributes }, options: opts },
            ...others
        ] = hodgepodged;

        expect(others).to.have.length(0);
        expect(opts).to.shallow.equal(options);
        expect(register()).to.equal('plain');
        expect(attributes).to.equal({
            name: 'plugin-plain',
            dependencies: []
        });
    });

    it('consumes a list of plugins using the { plugin: { plugin }, options } format.', () => {

        expect(pluginPlain.dependencies.hodgepodge).to.equal(true);

        const options = {};
        const hodgepodged = Hodgepodge.sort([{ plugin: { plugin: pluginPlain }, options }]);

        const [
            { plugin: { register, ...attributes }, options: opts },
            ...others
        ] = hodgepodged;

        expect(others).to.have.length(0);
        expect(opts).to.shallow.equal(options);
        expect(register()).to.equal('plain');
        expect(attributes).to.equal({
            name: 'plugin-plain',
            dependencies: []
        });
    });

    it('reorders a list of plugins, respecting their dependencies.', () => {

        const plugins = [
            pluginA,
            {
                plugin: pluginB,
                options: { do: 'something' }
            },
            pluginC,
            {
                plugin: { plugin: pluginE },
                options: { do: 'something-else' }
            }
        ];

        const [C, B, A, E, ...others] = Hodgepodge.sort(plugins);

        expect(others).to.have.length(0);

        expect(C).to.equal({
            plugin: {
                register: pluginC.register,
                pkg: { name: 'plugin-c' },
                dependencies: []
            }
        });

        expect(C.plugin.register()).to.equal('C');
        expect(C).to.not.shallow.equal(plugins[2]);
        expect(C.plugin).to.not.shallow.equal(plugins[2].plugin);

        // Not hodgepodging– passthrough

        expect(B).to.equal({
            plugin: {
                register: pluginB.register,
                name: 'plugin-b',
                dependencies: 'plugin-c'
            },
            options: { do: 'something' }
        });

        expect(B.plugin.register()).to.equal('B');
        expect(B).to.shallow.equal(plugins[1]);
        expect(B.plugin).to.shallow.equal(plugins[1].plugin);
        expect(B.options).to.shallow.equal(plugins[1].options);

        // Not hodgepodging– passthrough

        expect(A).to.equal({
            register: pluginA.register,
            name: 'plugin-a',
            dependencies: ['plugin-b', 'plugin-c']
        });

        expect(A.register()).to.equal('A');
        expect(A).to.shallow.equal(plugins[0]);

        // Not hodgepodging– passthrough

        expect(E).to.equal({
            plugin: {
                plugin: {
                    register: pluginE.register,
                    name: 'plugin-e'
                }
            },
            options: { do: 'something-else' }
        });

        expect(E.plugin.plugin.register()).to.equal('E');
        expect(E).to.shallow.equal(plugins[3]);
        expect(E.plugin).to.shallow.equal(plugins[3].plugin);
        expect(E.plugin.plugin).to.shallow.equal(plugins[3].plugin.plugin);
        expect(E.options).to.shallow.equal(plugins[3].options);
    });

    it('throws on circular dependencies.', () => {

        const wantsOne = {
            name: 'two',
            dependencies: 'one',
            register: () => true
        };

        const wantsTwo = {
            name: 'one',
            dependencies: 'two',
            register: () => true
        };

        const hodgepodging = () => {

            Hodgepodge.sort([wantsOne, wantsTwo]);
        };

        expect(hodgepodging).to.throw();
    });

    it('throws on missing dependencies without loose tally.', () => {

        const hodgepodging = () => {

            Hodgepodge.sort([pluginA, pluginB]);
        };

        expect(hodgepodging).to.throw('Missing dependencies: plugin-c.');
    });

    it('throws on missing dependencies only of hodgepodged plugins with loose tally.', () => {

        const hodgepodging = () => {

            Hodgepodge.sort([pluginB, pluginD], true);
        };

        expect(hodgepodging).to.throw('Missing dependencies: plugin-a.');
    });

    it('does not throw on missing dependencies of non-hodgepodged plugins with loose tally.', () => {

        const hodgepodging = () => {

            Hodgepodge.sort([pluginA, pluginC], true);
        };

        expect(hodgepodging).to.not.throw();
    });

    it('hodgepodging plugin causes server.register() to throw unless used with hodgepodge.', async () => {

        const server = Hapi.server();

        const plugin = {
            name: 'hodgepodging',
            dependencies: { hodgepodge: true },
            register() {}
        };

        await expect(server.register(plugin)).to.reject(/^Invalid plugin options/);

        await server.register(Hodgepodge.sort(plugin));

        expect(server.registrations.hodgepodging).to.exist();
    });
});
