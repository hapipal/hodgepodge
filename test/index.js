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

    // Plugin A

    var pluginA = function () {};
    pluginA.attributes = {
        name: 'plugin-a',
        dependencies: ['plugin-b', 'plugin-c']
    };


    // Plugin B

    var pluginB = function () {};
    pluginB.attributes = {
        name: 'plugin-b',
        hodgepodge: true,
        dependencies: 'plugin-c'
    };

    pluginB.restore = function () {

        this.attributes.hodgepodge = true;
    };


    // Plugin C

    var pluginC = function () {};

    pluginC.attributes = {
        name: 'plugin-c'
    };


    // Finally the tests

    it('consumes falsey values.', function (done) {

        expect(Hodgepodge(false)).to.deep.equal([]);
        expect(Hodgepodge(null)).to.deep.equal([]);
        expect(Hodgepodge(undefined)).to.deep.equal([]);

        done();
    });

    it('consumes a plain plugin.', function (done) {

        expect(Hodgepodge(pluginA)).to.deep.equal([pluginA]);

        done();
    });

    it('consumes unfamiliar objects.', function (done) {

        var ufos = [
            1,
            'two',
            { three: 3 }
        ];

        var degenerates = [
            function () {}
        ];

        expect(Hodgepodge(ufos)).to.deep.equal(ufos);
        expect(Hodgepodge(degenerates)).to.deep.equal(degenerates);
        expect(Hodgepodge(1)).to.deep.equal([1]);

        done();
    });

    it('consumes a list of plugins using the function format.', function (done) {

        expect(Hodgepodge([pluginA])).to.deep.equal([pluginA]);

        done();
    });

    it('consumes a list of plugins using the object format.', function (done) {

        var plugins = [
            {
                register: pluginA,
                options: {}
            }
        ];

        expect(Hodgepodge(plugins)).to.deep.equal(plugins);

        done();
    });

    it('eats-up the hodgepodge attribute.', function (done) {

        expect(pluginB.attributes.hodgepodge).to.equal(true);

        var plugins = Hodgepodge([pluginB]);

        expect(plugins[0]).to.equal(pluginB);
        expect(plugins[0].attributes.hodgepodge).to.not.exist();

        pluginB.restore();

        done();
    });

    it('reorders a list of plugins, respecting their dependencies.', function (done) {

        var plugins = [pluginA, pluginB, pluginC];

        expect(Hodgepodge(plugins)).to.deep.equal([pluginC, pluginB, pluginA]);

        pluginB.restore();

        done();
    });

    it('throws on circular dependencies.', function (done) {


        var wantsOne = function () {};
        wantsOne.attributes = {
            name: 'two',
            dependencies: 'one'
        };

        var wantsTwo = function () {};
        wantsTwo.attributes = {
            name: 'one',
            dependencies: 'two'
        };

        var hodgepodging = function () {

            Hodgepodge([wantsOne, wantsTwo]);
        };

        expect(hodgepodging).to.throw();

        done();
    });

});
