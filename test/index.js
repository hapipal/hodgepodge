'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
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

    // Finally the tests

    it('consumes falsey values.', (done) => {

        expect(Hodgepodge(false)).to.equal([]);
        expect(Hodgepodge(null)).to.equal([]);
        expect(Hodgepodge(undefined)).to.equal([]);

        done();
    });

    it('consumes a plain plugin.', (done) => {

        expect(pluginPlain.register.attributes.dependencies.hodgepodge).to.exist();

        const hodgepodged = Hodgepodge(pluginPlain);

        expect(hodgepodged).to.have.length(1);
        expect(hodgepodged[0]).to.be.a.function();
        expect(hodgepodged[0]()).to.equal('plain');
        expect(hodgepodged[0].attributes.dependencies).to.equal([]);

        done();
    });

    it('consumes unfamiliar objects.', (done) => {

        const ufos = [
            1,
            'two',
            { three: 3 }
        ];

        const degenerates = [
            { register: function () {} }
        ];

        expect(Hodgepodge(ufos)).to.equal(ufos);
        expect(Hodgepodge(degenerates)).to.equal(degenerates);
        expect(Hodgepodge(1)).to.equal([1]);

        done();
    });

    it('consumes a list of plugins using the register/function format.', (done) => {

        expect(pluginPlain.register.attributes.dependencies.hodgepodge).to.equal(true);

        const hodgepodged = Hodgepodge([pluginPlain]);

        expect(hodgepodged).to.have.length(1);
        expect(hodgepodged[0]).to.be.a.function();
        expect(hodgepodged[0]()).to.equal('plain');
        expect(hodgepodged[0].attributes.dependencies).to.equal([]);

        done();
    });

    it('consumes a list of plugins using the function format.', (done) => {

        expect(pluginPlain.register.attributes.dependencies.hodgepodge).to.equal(true);

        const hodgepodged = Hodgepodge([pluginPlain.register]);

        expect(hodgepodged).to.have.length(1);
        expect(hodgepodged[0]).to.be.a.function();
        expect(hodgepodged[0]()).to.equal('plain');
        expect(hodgepodged[0].attributes.dependencies).to.equal([]);

        done();
    });

    it('consumes a list of plugins using the object format.', (done) => {

        expect(pluginPlain.register.attributes.dependencies.hodgepodge).to.equal(true);

        const hodgepodged = Hodgepodge([{ register: pluginPlain }]);

        expect(hodgepodged).to.have.length(1);
        expect(hodgepodged[0]).to.be.a.function();
        expect(hodgepodged[0]()).to.equal('plain');
        expect(hodgepodged[0].attributes.dependencies).to.equal([]);

        done();
    });

    it('reorders a list of plugins, respecting their dependencies.', (done) => {

        const plugins = [
            pluginA.register,
            {
                register: pluginB
            },
            pluginC
        ];

        const hodgepodged = Hodgepodge(plugins);

        expect(hodgepodged).to.have.length(3);

        expect(hodgepodged[0]).to.be.a.function();
        expect(hodgepodged[0]()).to.equal('C');
        expect(hodgepodged[0].attributes).to.not.shallow.equal(pluginC.attributes);
        expect(hodgepodged[0].attributes).to.equal({
            name: 'plugin-c',
            dependencies: []
        });

        // Not hodgepodging– passthrough
        expect(hodgepodged[1]).to.shallow.equal(plugins[1]);
        expect(hodgepodged[1].register).to.shallow.equal(pluginB);
        expect(hodgepodged[1].register.register.attributes).to.shallow.equal(pluginB.register.attributes);
        expect(hodgepodged[1].register.register.attributes).to.equal({
            name: 'plugin-b',
            dependencies: 'plugin-c'
        });

        expect(hodgepodged[2]).to.be.a.function();
        expect(hodgepodged[2]()).to.equal('A');
        expect(hodgepodged[2].attributes).to.not.shallow.equal(pluginA.attributes);
        expect(hodgepodged[2].attributes).to.equal({
            name: 'plugin-a',
            dependencies: ['plugin-b', 'plugin-c']
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

            Hodgepodge([wantsOne, wantsTwo]);
        };

        expect(hodgepodging).to.throw('Invalid dependencies');

        done();
    });

    it('throws on missing dependencies without loose tally.', (done) => {

        const hodgepodging = () => {

            Hodgepodge([pluginA, pluginB]);
        };

        expect(hodgepodging).to.throw('Missing dependencies: plugin-c.');

        done();
    });

    it('throws on missing dependencies only of hodgepodged plugins with loose tally.', (done) => {

        const hodgepodging = () => {

            Hodgepodge([pluginB, pluginD], true);
        };

        expect(hodgepodging).to.throw('Missing dependencies: plugin-a.');

        done();
    });

    it('does not throw on missing dependencies of non-hodgepodged plugins with loose tally.', (done) => {

        const hodgepodging = () => {

            Hodgepodge([pluginA, pluginC], true);
        };

        expect(hodgepodging).to.not.throw();

        done();
    });
});
