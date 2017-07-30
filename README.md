# JS Proxy polyfill
Back compatibility for JS Proxy class (IE9+)

This polyfill is limited just to **get**, **set** and **deleteProperty** handlers.

Changes of existing properties are tracked thanks to Object.defineProperty(), but deletation and creation of new properties is checked by internal interval which tick each 5 ms in default and compare whole registered object if there is something additional or something miss. This is quite dirty job but it's working and it's just for old browsers.

You can change default interval time by declaring **_proxyfillCheckIntervalTickTime** before Proxyfill script.

There is one limitation and it's deletation of just created property which will not be catched cuz of interval.
eg.
```
var proxy = new Proxy({}, { ... });
proxy.newProperty = true;
delete proxy.newProperty;
```
In this case, creation and deletation isn't catched.
