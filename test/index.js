'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Hodgepodge = require('..');

// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Hodgepodge', () => {

    // Plain plugin

    const pluginPlain = { register: () => 'plain' };

    pluginPlain.register.attributes = {
        name: 'plugin-plain',
        dependencies: { hodgepodge: true }
    };

    // Plugin A

    const pluginA = { register: () => 'A' };
    pluginA.register.attributes = {
        name: 'plugin-a',
        dependencies: ['plugin-b', 'plugin-c']
    };

    // Plugin B

    const pluginB = { register: () => 'B' };
    pluginB.register.attributes = {
        name: 'plugin-b',
        dependencies: 'plugin-c'
    };

    // Plugin C

    const pluginC = { register: () => 'C' };
    pluginC.register.attributes = {
        name: 'plugin-c',
        dependencies: { hodgepodge: true }
    };

    // Plugin D

    const pluginD = { register: () => 'D' };

    pluginD.register.attributes = {
        name: 'plugin-d',
        dependencies: { hodgepodge: ['plugin-a', 'plugin-b'] }
    };

    // Plugin E

    const pluginE = { register: () => 'E' };

    pluginE.register.attributes = {
        name: 'plugin-e'
    };

    // Finally the tests

    it('consumes falsey values.', (done) => {

        expect(Hodgepodge.sort(false)).to.equal([]);
        expect(Hodgepodge.sort(null)).to.equal([]);
        expect(Hodgepodge.sort(undefined)).to.equal([]);

        done();
    });

    it('consumes a plain plugin.', (done) => {

        expect(pluginPlain.register.attributes.dependencies.hodgepodge).to.exist();

        const hodgepodged = Hodgepodge.sort(pluginPlain);

        expect(hodgepodged).to.have.length(1);
        expect(hodgepodged[0].register).to.be.a.function();
        expect(hodgepodged[0].register()).to.equal('plain');
        expect(hodgepodged[0].register.attributes).to.equal({
            name: 'plugin-plain',
            dependencies: []
        });

        done();
    });

    it('consumes unfamiliar objects.', (done) => {

        const ufos = [
            1,
            'two',
            { three: 3 },
            null
        ];

        const degenerates = [
            { register: 2 },                                // No plugin function
            { register: function () {} },                   // No attributes
            { register: function () {}, attributes: {} }    // No name
        ];

        expect(Hodgepodge.sort(ufos)).to.equal(ufos);
        expect(Hodgepodge.sort(degenerates)).to.equal(degenerates);
        expect(Hodgepodge.sort(1)).to.equal([1]);

        done();
    });

    it('consumes a list of plugins using the register/function format.', (done) => {

        expect(pluginPlain.register.attributes.dependencies.hodgepodge).to.equal(true);

        const hodgepodged = Hodgepodge.sort([pluginPlain]);

        expect(hodgepodged).to.have.length(1);
        expect(hodgepodged[0].register).to.be.a.function();
        expect(hodgepodged[0].register()).to.equal('plain');
        expect(hodgepodged[0].register.attributes).to.equal({
            name: 'plugin-plain',
            dependencies: []
        });

        done();
    });

    it('consumes a list of plugins using the function format.', (done) => {

        expect(pluginPlain.register.attributes.dependencies.hodgepodge).to.equal(true);

        const hodgepodged = Hodgepodge.sort([pluginPlain.register]);

        expect(hodgepodged).to.have.length(1);
        expect(hodgepodged[0].register).to.be.a.function();
        expect(hodgepodged[0].register()).to.equal('plain');
        expect(hodgepodged[0].register.attributes).to.equal({
            name: 'plugin-plain',
            dependencies: []
        });

        done();
    });

    it('consumes a list of plugins using the object format.', (done) => {

        expect(pluginPlain.register.attributes.dependencies.hodgepodge).to.equal(true);

        const hodgepodged = Hodgepodge.sort([{ register: pluginPlain }]);

        expect(hodgepodged).to.have.length(1);
        expect(hodgepodged[0].register).to.be.a.function();
        expect(hodgepodged[0].register()).to.equal('plain');
        expect(hodgepodged[0].register.attributes).to.equal({
            name: 'plugin-plain',
            dependencies: []
        });

        done();
    });

    it('reorders a list of plugins, respecting their dependencies.', (done) => {

        const plugins = [
            pluginA.register,
            {
                register: pluginB,
                options: { do: 'something' }
            },
            pluginC,
            {
                register: pluginE.register,
                options: { do: 'something-else' }
            }
        ];

        const hodgepodged = Hodgepodge.sort(plugins);

        expect(hodgepodged).to.have.length(4);

        expect(hodgepodged[0].register).to.be.a.function();
        expect(hodgepodged[0].register()).to.equal('C');
        expect(hodgepodged[0].register.attributes).to.not.shallow.equal(pluginC.attributes);
        expect(hodgepodged[0].register.attributes).to.equal({
            name: 'plugin-c',
            dependencies: []
        });

        // Not hodgepodging– passthrough

        expect(hodgepodged[1]).to.shallow.equal(plugins[1]);
        expect(hodgepodged[1].options).to.shallow.equal(plugins[1].options);
        expect(hodgepodged[1].options).to.equal({ do: 'something' });
        expect(hodgepodged[1].register).to.shallow.equal(pluginB);
        expect(hodgepodged[1].register.register.attributes).to.shallow.equal(pluginB.register.attributes);
        expect(hodgepodged[1].register.register.attributes).to.equal({
            name: 'plugin-b',
            dependencies: 'plugin-c'
        });

        // Not hodgepodging– passthrough

        expect(hodgepodged[2]).to.be.a.function();
        expect(hodgepodged[2]()).to.equal('A');
        expect(hodgepodged[2].attributes).to.not.shallow.equal(pluginA.attributes);
        expect(hodgepodged[2].attributes).to.equal({
            name: 'plugin-a',
            dependencies: ['plugin-b', 'plugin-c']
        });

        // Not hodgepodging– passthrough

        expect(hodgepodged[3]).to.shallow.equal(plugins[3]);
        expect(hodgepodged[3].options).to.shallow.equal(plugins[3].options);
        expect(hodgepodged[3].options).to.equal({ do: 'something-else' });
        expect(hodgepodged[3].register).to.shallow.equal(pluginE.register);
        expect(hodgepodged[3].register.attributes).to.shallow.equal(pluginE.register.attributes);
        expect(hodgepodged[3].register.attributes).to.equal({
            name: 'plugin-e'
        });

        done();
    });

    it('throws on circular dependencies.', (done) => {

        const wantsOne = { register: () => true };
        wantsOne.register.attributes = {
            name: 'two',
            dependencies: 'one'
        };

        const wantsTwo = { register: () => true };
        wantsTwo.register.attributes = {
            name: 'one',
            dependencies: 'two'
        };

        const hodgepodging = () => {

            Hodgepodge.sort([wantsOne, wantsTwo]);
        };

        expect(hodgepodging).to.throw();

        done();
    });

    it('throws on missing dependencies without loose tally.', (done) => {

        const hodgepodging = () => {

            Hodgepodge.sort([pluginA, pluginB]);
        };

        expect(hodgepodging).to.throw('Missing dependencies: plugin-c.');

        done();
    });

    it('throws on missing dependencies only of hodgepodged plugins with loose tally.', (done) => {

        const hodgepodging = () => {

            Hodgepodge.sort([pluginB, pluginD], true);
        };

        expect(hodgepodging).to.throw('Missing dependencies: plugin-a.');

        done();
    });

    it('does not throw on missing dependencies of non-hodgepodged plugins with loose tally.', (done) => {

        const hodgepodging = () => {

            Hodgepodge.sort([pluginA, pluginC], true);
        };

        expect(hodgepodging).to.not.throw();

        done();
    });

    it('hodgepodging plugin causes server.register() to throw unless used with hodgepodge.', (done) => {

        const server = new Hapi.Server();
        server.connection();

        const plugin = (srv, opt, next) => next();
        plugin.attributes = {
            name: 'hodgepodging',
            dependencies: { hodgepodge: true }
        };

        expect(() => server.register(plugin, () => true)).to.throw(/^Invalid plugin options/);

        server.register(Hodgepodge.sort(plugin), (err) => {

            expect(err).to.not.exist();

            expect(server.registrations.hodgepodging).to.exist();
            done();
        });
    });
});
