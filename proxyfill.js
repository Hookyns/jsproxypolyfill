/**
 * Proxy polyfill which allows you to track get, set and deleteProperty, no more handlers supported
 *
 * Created by Roman Jámbor
 */

if (!!window.Proxy) {
	console.log("[WARN] Your browser doesn't support Proxy which can be important for this application. Proxy fallback exists but it may impair performance.");

	window.Proxy = (function () {
		function watch(obj, getter, setter, prop) {
			var props = prop ? [prop] : Object.getOwnPropertyNames(obj);

			for (var i = props.length - 1; i >= 0; i--) {
				(function (prop) {
					var get = function () {
						return getter(prop);
					};
					var set = function (val) {
						setter(prop, val);
					};

					if (delete obj[prop]) {
						Object.defineProperty(obj, prop, {
							get: get,
							set: set,
							enumerable: true,
							configurable: true
						});
					}
				})(props[i]);
			}
		}

		function diff(target, old) {
			var rem = [], add = [], p;

			var oldProps = Object.getOwnPropertyNames(old);
			var newProps = Object.getOwnPropertyNames(target);

			for (var i = oldProps.length - 1; i >= 0; i--) {
				p = oldProps[i];
				if (newProps.indexOf(p) == -1) {
					rem.push(p);
				}
			}

			for (i = newProps.length - 1; i >= 0; i--) {
				p = newProps[i];
				if (oldProps.indexOf(p) == -1) {
					add.push(p);
				}
			}

			return {
				removed: rem,
				added: add
			};
		}

		var strictMode = (eval("var __temp = null"), (typeof __temp === "undefined"));

		/**
		 * @param target
		 * @param handler
		 */
		return function Proxy(target, handler) {
			if (typeof handler != "object") throw new Error("Handler is not object");

			// Copy data from target to proxy
			var props = Object.getOwnPropertyNames(target);
			for (var i = props.length - 1; i >= 0; i--) {
				p = props[i];
				this[p] = target[p];
			}

			var wget = function (prop) {
				return handler.get ? handler.get(target, prop, self) : target[prop];
			};

			var wset = function (prop, val) {
				if (handler.set) {
					var ov = target[prop];
					if (handler.set(target, prop, val, self) === false && target[prop] != ov) {
						if (ov === undefined) delete target[prop]; else target[prop] = ov;
						if (strictMode) throw new TypeError("'set' on proxy: trap returned falsish for property '" + prop +"'");
					}
					if (target[prop] == undefined) delete self[prop];
				} else {
					target[prop] = val;
				}
			};

			// Watch changes on existing properties
			watch(this, wget, wset);

			var df, p, self = this, val, c;

			// Start inner interval which will do dirty object check
			setInterval(function () {
				df = diff(self, target);

				for (var i = df.added.length - 1; i >= 0; i--) {
					p = df.added[i];
					val = self[p];
					watch(self, wget, wset, p);
					wset(p, val);
				}

				for (i = df.removed.length - 1; i >= 0; i--) {
					p = df.removed[i];
					if (handler.deleteProperty) {
						val = target[p];
						c = handler.deleteProperty(target, p);
						if (c === false || target[p] == val) {
							target[p] = val;
							// create again deleted property watch
							watch(self, wget, wset, p);
						}
					} else {
						delete target[p];
					}
				}
			}, ~~window.Proxy["checkIntervalTickTime"] || 5)
		};
	})();
}
