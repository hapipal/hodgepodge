# hodgepodge

Registering hapi plugins in order since 2015

## The Basics
When you declare dependencies on a hapi plugin, whether by `server.dependency()` or by the `dependencies` attribute, hapi does not actually defer plugin registration to resolve those dependencies in time.

### More
Hodgepodge receives a list of hapi plugin registrations, and reorders the registrations based upon the plugins' `dependencies` attributes so that dependencies are resolved by virtue of convenient ordering.  In a sense this is an alternative to the `server.dependency(deps, [after])` pattern, which some find to be clunky.  In contrast to use of `server.dependency()`'s `after` callback, dependencies are dealt with at the time of plugin registration rather than during server initialization (during `onPreStart`).
