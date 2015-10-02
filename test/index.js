// Load modules

var Lab = require('lab');
var Code = require('code');
var Hodgepodge = require('..');

// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('Hodgepodge', function () {

    // Plain plugin

    var pluginPlain = { register: function () {} };

    pluginPlain.register.attributes = {
        name: 'plugin-plain',
        hodgepodge: true
    };

    pluginPlain.restore = function () {

        this.register.attributes.hodgepodge = true;
    };

    // Plugin A

    var pluginA = { register: function () {} };
    pluginA.register.attributes = {
        name: 'plugin-a',
        dependencies: ['plugin-b', 'plugin-c']
    };


    // Plugin B

    var pluginB = { register: function () {} };
    pluginB.register.attributes = {
        name: 'plugin-b',
        dependencies: 'plugin-c'
    };


    // Plugin C

    var pluginC = { register: function () {} };

    pluginC.register.attributes = {
        name: 'plugin-c',
        hodgepodge: true
    };

    pluginC.restore = function () {

        this.register.attributes.hodgepodge = true;
    };

    // Plugin D

    var pluginD = { register: function () {} };

    pluginD.register.attributes = {
        name: 'plugin-d',
        dependencies: ['plugin-a', 'plugin-b'],
        hodgepodge: true
    };

    pluginD.restore = function () {

        this.register.attributes.hodgepodge = true;
    };

    // Finally the tests

    it('consumes falsey values.', function (done) {

        expect(Hodgepodge(false)).to.deep.equal([]);
        expect(Hodgepodge(null)).to.deep.equal([]);
        expect(Hodgepodge(undefined)).to.deep.equal([]);

        done();
    });

    it('consumes a plain plugin.', function (done) {

        expect(pluginPlain.register.attributes.hodgepodge).to.equal(true);
        expect(Hodgepodge(pluginPlain)).to.deep.equal([pluginPlain]);
        expect(pluginPlain.register.attributes.hodgepodge).to.not.exist();

        pluginPlain.restore();

        done();
    });

    it('consumes unfamiliar objects.', function (done) {

        var ufos = [
            1,
            'two',
            { three: 3 }
        ];

        var degenerates = [
            { register: function () {} }
        ];

        expect(Hodgepodge(ufos)).to.deep.equal(ufos);
        expect(Hodgepodge(degenerates)).to.deep.equal(degenerates);
        expect(Hodgepodge(1)).to.deep.equal([1]);

        done();
    });

    it('consumes a list of plugins using the register/function format.', function (done) {

        expect(pluginPlain.register.attributes.hodgepodge).to.equal(true);
        expect(Hodgepodge([pluginPlain])).to.deep.equal([pluginPlain]);
        expect(pluginPlain.register.attributes.hodgepodge).to.not.exist();

        pluginPlain.restore();

        done();
    });

    it('consumes a list of plugins using the function format.', function (done) {

        expect(pluginPlain.register.attributes.hodgepodge).to.equal(true);
        expect(Hodgepodge([pluginPlain.register])).to.deep.equal([pluginPlain.register]);
        expect(pluginPlain.register.attributes.hodgepodge).to.not.exist();

        pluginPlain.restore();

        done();
    });

    it('consumes a list of plugins using the object format.', function (done) {

        var plugins = [
            {
                register: pluginPlain
            }
        ];

        expect(pluginPlain.register.attributes.hodgepodge).to.equal(true);
        expect(Hodgepodge(plugins)).to.deep.equal(plugins);
        expect(pluginPlain.register.attributes.hodgepodge).to.not.exist();

        pluginPlain.restore();

        done();
    });

    it('eats-up the hodgepodge attribute.', function (done) {

        // The hodgepodge attribute is used in other tests to show that attributes
        // were consumed, but this is the canonical test for the hodgepodge attribute.

        expect(pluginC.register.attributes.hodgepodge).to.equal(true);

        var plugins = Hodgepodge([pluginC]);

        expect(plugins[0]).to.equal(pluginC);
        expect(plugins[0].register.attributes.hodgepodge).to.not.exist();

        pluginC.restore();

        done();
    });

    it('reorders a list of plugins, respecting their dependencies.', function (done) {

        var plugins = [
            pluginA.register,
            {
                register: pluginB
            },
            pluginC
        ];

        expect(Hodgepodge(plugins)).to.deep.equal([pluginC, { register: pluginB }, pluginA.register]);

        pluginC.restore();

        done();
    });

    it('throws on circular dependencies.', function (done) {

        var wantsOne = { register: function () {} };
        wantsOne.register.attributes = {
            name: 'two',
            dependencies: 'one'
        };

        var wantsTwo = { register: function () {} };
        wantsTwo.register.attributes = {
            name: 'one',
            dependencies: 'two'
        };

        var hodgepodging = function () {

            Hodgepodge([wantsOne, wantsTwo]);
        };

        expect(hodgepodging).to.throw();

        done();
    });

    it('throws on missing dependencies without loose tally.', function (done) {

        var hodgepodging = function () {

            Hodgepodge([pluginA, pluginB]);
        };

        expect(hodgepodging).to.throw('Missing dependencies: plugin-c.');

        done();
    });

    it('throws on missing dependencies only of hodgepodged plugins with loose tally.', function (done) {

        var hodgepodging = function () {

            Hodgepodge([pluginB, pluginD], true);
        };

        expect(hodgepodging).to.throw('Missing dependencies: plugin-a.');

        pluginD.restore();

        done();
    });

    it('does not throw on missing dependencies of non-hodgepodged plugins with loose tally.', function (done) {

        var hodgepodging = function () {

            Hodgepodge([pluginA, pluginC], true);
        };

        expect(hodgepodging).to.not.throw();

        pluginC.restore();

        done();
    });

});
