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

    const pluginPlain = { register: function () {} };

    pluginPlain.register.attributes = {
        name: 'plugin-plain',
        hodgepodge: true
    };

    pluginPlain.restore = function () {

        this.register.attributes.hodgepodge = true;
    };

    // Plugin A

    const pluginA = { register: function () {} };
    pluginA.register.attributes = {
        name: 'plugin-a',
        dependencies: ['plugin-b', 'plugin-c']
    };


    // Plugin B

    const pluginB = { register: function () {} };
    pluginB.register.attributes = {
        name: 'plugin-b',
        dependencies: 'plugin-c'
    };


    // Plugin C

    const pluginC = { register: function () {} };

    pluginC.register.attributes = {
        name: 'plugin-c',
        hodgepodge: true
    };

    pluginC.restore = function () {

        this.register.attributes.hodgepodge = true;
    };

    // Plugin D

    const pluginD = { register: function () {} };

    pluginD.register.attributes = {
        name: 'plugin-d',
        dependencies: ['plugin-a', 'plugin-b'],
        hodgepodge: true
    };

    pluginD.restore = function () {

        this.register.attributes.hodgepodge = true;
    };

    // Finally the tests

    it('consumes falsey values.', (done) => {

        expect(Hodgepodge(false)).to.equal([]);
        expect(Hodgepodge(null)).to.equal([]);
        expect(Hodgepodge(undefined)).to.equal([]);

        done();
    });

    it('consumes a plain plugin.', (done) => {

        expect(pluginPlain.register.attributes.hodgepodge).to.equal(true);
        expect(Hodgepodge(pluginPlain)).to.equal([pluginPlain]);
        expect(pluginPlain.register.attributes.hodgepodge).to.not.exist();

        pluginPlain.restore();

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

        expect(pluginPlain.register.attributes.hodgepodge).to.equal(true);
        expect(Hodgepodge([pluginPlain])).to.equal([pluginPlain]);
        expect(pluginPlain.register.attributes.hodgepodge).to.not.exist();

        pluginPlain.restore();

        done();
    });

    it('consumes a list of plugins using the function format.', (done) => {

        expect(pluginPlain.register.attributes.hodgepodge).to.equal(true);
        expect(Hodgepodge([pluginPlain.register])).to.equal([pluginPlain.register]);
        expect(pluginPlain.register.attributes.hodgepodge).to.not.exist();

        pluginPlain.restore();

        done();
    });

    it('consumes a list of plugins using the object format.', (done) => {

        const plugins = [
            {
                register: pluginPlain
            }
        ];

        expect(pluginPlain.register.attributes.hodgepodge).to.equal(true);
        expect(Hodgepodge(plugins)).to.equal(plugins);
        expect(pluginPlain.register.attributes.hodgepodge).to.not.exist();

        pluginPlain.restore();

        done();
    });

    it('eats-up the hodgepodge attribute.', (done) => {

        // The hodgepodge attribute is used in other tests to show that attributes
        // were consumed, but this is the canonical test for the hodgepodge attribute.

        expect(pluginC.register.attributes.hodgepodge).to.equal(true);

        const plugins = Hodgepodge([pluginC]);

        expect(plugins[0]).to.shallow.equal(pluginC);
        expect(plugins[0].register.attributes.hodgepodge).to.not.exist();

        pluginC.restore();

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

        expect(Hodgepodge(plugins)).to.equal([pluginC, { register: pluginB }, pluginA.register]);

        pluginC.restore();

        done();
    });

    it('throws on circular dependencies.', (done) => {

        const wantsOne = { register: function () {} };
        wantsOne.register.attributes = {
            name: 'two',
            dependencies: 'one'
        };

        const wantsTwo = { register: function () {} };
        wantsTwo.register.attributes = {
            name: 'one',
            dependencies: 'two'
        };

        const hodgepodging = () => {

            Hodgepodge([wantsOne, wantsTwo]);
        };

        expect(hodgepodging).to.throw();

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

        pluginD.restore();

        done();
    });

    it('does not throw on missing dependencies of non-hodgepodged plugins with loose tally.', (done) => {

        const hodgepodging = () => {

            Hodgepodge([pluginA, pluginC], true);
        };

        expect(hodgepodging).to.not.throw();

        pluginC.restore();

        done();
    });

});
