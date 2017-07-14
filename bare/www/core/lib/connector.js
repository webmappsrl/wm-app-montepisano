! function(e) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
    else if ("function" == typeof define && define.amd) define([], e);
    else {
        var t;
        "undefined" != typeof window ? t = window : "undefined" != typeof global ? t = global : "undefined" != typeof self && (t = self), t.io = e()
    }
}(function() {
    var e, t, n;
    return function r(e, t, n) {
        function i(o, u) {
            if (!t[o]) {
                if (!e[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (s) return s(o, !0);
                    throw new Error("Cannot find module '" + o + "'")
                }
                var f = t[o] = {
                    exports: {}
                };
                e[o][0].call(f.exports, function(t) {
                    var n = e[o][1][t];
                    return i(n ? n : t)
                }, f, f.exports, r, e, t, n)
            }
            return t[o].exports
        }
        var s = typeof require == "function" && require;
        for (var o = 0; o < n.length; o++) i(n[o]);
        return i
    }({
        1: [function(e, t, n) {
            t.exports = e("./lib/")
        }, {
            "./lib/": 2
        }],
        2: [function(e, t, n) {
            function a(e, t) {
                typeof e == "object" && (t = e, e = undefined), t = t || {};
                var n = r(e),
                    i = n.source,
                    a = n.id,
                    f;
                return t.forceNew || t["force new connection"] || !1 === t.multiplex ? (o("ignoring socket cache for %s", i), f = s(i, t)) : (u[a] || (o("new io instance for %s", i), u[a] = s(i, t)), f = u[a]), f.socket(n.path)
            }
            var r = e("./url"),
                i = e("socket.io-parser"),
                s = e("./manager"),
                o = e("debug")("socket.io-client");
            t.exports = n = a;
            var u = n.managers = {};
            n.protocol = i.protocol, n.connect = a, n.Manager = e("./manager"), n.Socket = e("./socket")
        }, {
            "./manager": 3,
            "./socket": 5,
            "./url": 6,
            debug: 9,
            "socket.io-parser": 43
        }],
        3: [function(e, t, n) {
            function p(e, t) {
                if (!(this instanceof p)) return new p(e, t);
                e && "object" == typeof e && (t = e, e = undefined), t = t || {}, t.path = t.path || "/socket.io", this.nsps = {}, this.subs = [], this.opts = t, this.reconnection(t.reconnection !== !1), this.reconnectionAttempts(t.reconnectionAttempts || Infinity), this.reconnectionDelay(t.reconnectionDelay || 1e3), this.reconnectionDelayMax(t.reconnectionDelayMax || 5e3), this.timeout(null == t.timeout ? 2e4 : t.timeout), this.readyState = "closed", this.uri = e, this.connected = [], this.attempts = 0, this.encoding = !1, this.packetBuffer = [], this.encoder = new u.Encoder, this.decoder = new u.Decoder, this.autoConnect = t.autoConnect !== !1, this.autoConnect && this.open()
            }
            var r = e("./url"),
                i = e("engine.io-client"),
                s = e("./socket"),
                o = e("component-emitter"),
                u = e("socket.io-parser"),
                a = e("./on"),
                f = e("component-bind"),
                l = e("object-component"),
                c = e("debug")("socket.io-client:manager"),
                h = e("indexof");
            t.exports = p, p.prototype.emitAll = function() {
                this.emit.apply(this, arguments);
                for (var e in this.nsps) this.nsps[e].emit.apply(this.nsps[e], arguments)
            }, o(p.prototype), p.prototype.reconnection = function(e) {
                return arguments.length ? (this._reconnection = !!e, this) : this._reconnection
            }, p.prototype.reconnectionAttempts = function(e) {
                return arguments.length ? (this._reconnectionAttempts = e, this) : this._reconnectionAttempts
            }, p.prototype.reconnectionDelay = function(e) {
                return arguments.length ? (this._reconnectionDelay = e, this) : this._reconnectionDelay
            }, p.prototype.reconnectionDelayMax = function(e) {
                return arguments.length ? (this._reconnectionDelayMax = e, this) : this._reconnectionDelayMax
            }, p.prototype.timeout = function(e) {
                return arguments.length ? (this._timeout = e, this) : this._timeout
            }, p.prototype.maybeReconnectOnOpen = function() {
                !this.openReconnect && !this.reconnecting && this._reconnection && this.attempts === 0 && (this.openReconnect = !0, this.reconnect())
            }, p.prototype.open = p.prototype.connect = function(e) {
                c("readyState %s", this.readyState);
                if (~this.readyState.indexOf("open")) return this;
                c("opening %s", this.uri), this.engine = i(this.uri, this.opts);
                var t = this.engine,
                    n = this;
                this.readyState = "opening", this.skipReconnect = !1;
                var r = a(t, "open", function() {
                        n.onopen(), e && e()
                    }),
                    s = a(t, "error", function(t) {
                        c("connect_error"), n.cleanup(), n.readyState = "closed", n.emitAll("connect_error", t);
                        if (e) {
                            var r = new Error("Connection error");
                            r.data = t, e(r)
                        }
                        n.maybeReconnectOnOpen()
                    });
                if (!1 !== this._timeout) {
                    var o = this._timeout;
                    c("connect attempt will timeout after %d", o);
                    var u = setTimeout(function() {
                        c("connect attempt timed out after %d", o), r.destroy(), t.close(), t.emit("error", "timeout"), n.emitAll("connect_timeout", o)
                    }, o);
                    this.subs.push({
                        destroy: function() {
                            clearTimeout(u)
                        }
                    })
                }
                return this.subs.push(r), this.subs.push(s), this
            }, p.prototype.onopen = function() {
                c("open"), this.cleanup(), this.readyState = "open", this.emit("open");
                var e = this.engine;
                this.subs.push(a(e, "data", f(this, "ondata"))), this.subs.push(a(this.decoder, "decoded", f(this, "ondecoded"))), this.subs.push(a(e, "error", f(this, "onerror"))), this.subs.push(a(e, "close", f(this, "onclose")))
            }, p.prototype.ondata = function(e) {
                this.decoder.add(e)
            }, p.prototype.ondecoded = function(e) {
                this.emit("packet", e)
            }, p.prototype.onerror = function(e) {
                c("error", e), this.emitAll("error", e)
            }, p.prototype.socket = function(e) {
                var t = this.nsps[e];
                if (!t) {
                    t = new s(this, e), this.nsps[e] = t;
                    var n = this;
                    t.on("connect", function() {
                        ~h(n.connected, t) || n.connected.push(t)
                    })
                }
                return t
            }, p.prototype.destroy = function(e) {
                var t = h(this.connected, e);
                ~t && this.connected.splice(t, 1);
                if (this.connected.length) return;
                this.close()
            }, p.prototype.packet = function(e) {
                c("writing packet %j", e);
                var t = this;
                t.encoding ? t.packetBuffer.push(e) : (t.encoding = !0, this.encoder.encode(e, function(e) {
                    for (var n = 0; n < e.length; n++) t.engine.write(e[n]);
                    t.encoding = !1, t.processPacketQueue()
                }))
            }, p.prototype.processPacketQueue = function() {
                if (this.packetBuffer.length > 0 && !this.encoding) {
                    var e = this.packetBuffer.shift();
                    this.packet(e)
                }
            }, p.prototype.cleanup = function() {
                var e;
                while (e = this.subs.shift()) e.destroy();
                this.packetBuffer = [], this.encoding = !1, this.decoder.destroy()
            }, p.prototype.close = p.prototype.disconnect = function() {
                this.skipReconnect = !0, this.readyState = "closed", this.engine && this.engine.close()
            }, p.prototype.onclose = function(e) {
                c("close"), this.cleanup(), this.readyState = "closed", this.emit("close", e), this._reconnection && !this.skipReconnect && this.reconnect()
            }, p.prototype.reconnect = function() {
                if (this.reconnecting || this.skipReconnect) return this;
                var e = this;
                this.attempts++;
                if (this.attempts > this._reconnectionAttempts) c("reconnect failed"), this.emitAll("reconnect_failed"), this.reconnecting = !1;
                else {
                    var t = this.attempts * this.reconnectionDelay();
                    t = Math.min(t, this.reconnectionDelayMax()), c("will wait %dms before reconnect attempt", t), this.reconnecting = !0;
                    var n = setTimeout(function() {
                        if (e.skipReconnect) return;
                        c("attempting reconnect"), e.emitAll("reconnect_attempt", e.attempts), e.emitAll("reconnecting", e.attempts);
                        if (e.skipReconnect) return;
                        e.open(function(t) {
                            t ? (c("reconnect attempt error"), e.reconnecting = !1, e.reconnect(), e.emitAll("reconnect_error", t.data)) : (c("reconnect success"), e.onreconnect())
                        })
                    }, t);
                    this.subs.push({
                        destroy: function() {
                            clearTimeout(n)
                        }
                    })
                }
            }, p.prototype.onreconnect = function() {
                var e = this.attempts;
                this.attempts = 0, this.reconnecting = !1, this.emitAll("reconnect", e)
            }
        }, {
            "./on": 4,
            "./socket": 5,
            "./url": 6,
            "component-bind": 7,
            "component-emitter": 8,
            debug: 9,
            "engine.io-client": 10,
            indexof: 39,
            "object-component": 40,
            "socket.io-parser": 43
        }],
        4: [function(e, t, n) {
            function r(e, t, n) {
                return e.on(t, n), {
                    destroy: function() {
                        e.removeListener(t, n)
                    }
                }
            }
            t.exports = r
        }, {}],
        5: [function(e, t, n) {
            function h(e, t) {
                this.io = e, this.nsp = t, this.json = this, this.ids = 0, this.acks = {}, this.io.autoConnect && this.open(), this.receiveBuffer = [], this.sendBuffer = [], this.connected = !1, this.disconnected = !0
            }
            var r = e("socket.io-parser"),
                i = e("component-emitter"),
                s = e("to-array"),
                o = e("./on"),
                u = e("component-bind"),
                a = e("debug")("socket.io-client:socket"),
                f = e("has-binary");
            t.exports = n = h;
            var l = {
                    connect: 1,
                    connect_error: 1,
                    connect_timeout: 1,
                    disconnect: 1,
                    error: 1,
                    reconnect: 1,
                    reconnect_attempt: 1,
                    reconnect_failed: 1,
                    reconnect_error: 1,
                    reconnecting: 1
                },
                c = i.prototype.emit;
            i(h.prototype), h.prototype.subEvents = function() {
                if (this.subs) return;
                var e = this.io;
                this.subs = [o(e, "open", u(this, "onopen")), o(e, "packet", u(this, "onpacket")), o(e, "close", u(this, "onclose"))]
            }, h.prototype.open = h.prototype.connect = function() {
                return this.connected ? this : (this.subEvents(), this.io.open(), "open" == this.io.readyState && this.onopen(), this)
            }, h.prototype.send = function() {
                var e = s(arguments);
                return e.unshift("message"), this.emit.apply(this, e), this
            }, h.prototype.emit = function(e) {
                if (l.hasOwnProperty(e)) return c.apply(this, arguments), this;
                var t = s(arguments),
                    n = r.EVENT;
                f(t) && (n = r.BINARY_EVENT);
                var i = {
                    type: n,
                    data: t
                };
                return "function" == typeof t[t.length - 1] && (a("emitting packet with ack id %d", this.ids), this.acks[this.ids] = t.pop(), i.id = this.ids++), this.connected ? this.packet(i) : this.sendBuffer.push(i), this
            }, h.prototype.packet = function(e) {
                e.nsp = this.nsp, this.io.packet(e)
            }, h.prototype.onopen = function() {
                a("transport is open - connecting"), "/" != this.nsp && this.packet({
                    type: r.CONNECT
                })
            }, h.prototype.onclose = function(e) {
                a("close (%s)", e), this.connected = !1, this.disconnected = !0, this.emit("disconnect", e)
            }, h.prototype.onpacket = function(e) {
                if (e.nsp != this.nsp) return;
                switch (e.type) {
                    case r.CONNECT:
                        this.onconnect();
                        break;
                    case r.EVENT:
                        this.onevent(e);
                        break;
                    case r.BINARY_EVENT:
                        this.onevent(e);
                        break;
                    case r.ACK:
                        this.onack(e);
                        break;
                    case r.BINARY_ACK:
                        this.onack(e);
                        break;
                    case r.DISCONNECT:
                        this.ondisconnect();
                        break;
                    case r.ERROR:
                        this.emit("error", e.data)
                }
            }, h.prototype.onevent = function(e) {
                var t = e.data || [];
                a("emitting event %j", t), null != e.id && (a("attaching ack callback to event"), t.push(this.ack(e.id))), this.connected ? c.apply(this, t) : this.receiveBuffer.push(t)
            }, h.prototype.ack = function(e) {
                var t = this,
                    n = !1;
                return function() {
                    if (n) return;
                    n = !0;
                    var i = s(arguments);
                    a("sending ack %j", i);
                    var o = f(i) ? r.BINARY_ACK : r.ACK;
                    t.packet({
                        type: o,
                        id: e,
                        data: i
                    })
                }
            }, h.prototype.onack = function(e) {
                a("calling ack %s with %j", e.id, e.data);
                var t = this.acks[e.id];
                t.apply(this, e.data), delete this.acks[e.id]
            }, h.prototype.onconnect = function() {
                this.connected = !0, this.disconnected = !1, this.emit("connect"), this.emitBuffered()
            }, h.prototype.emitBuffered = function() {
                var e;
                for (e = 0; e < this.receiveBuffer.length; e++) c.apply(this, this.receiveBuffer[e]);
                this.receiveBuffer = [];
                for (e = 0; e < this.sendBuffer.length; e++) this.packet(this.sendBuffer[e]);
                this.sendBuffer = []
            }, h.prototype.ondisconnect = function() {
                a("server disconnect (%s)", this.nsp), this.destroy(), this.onclose("io server disconnect")
            }, h.prototype.destroy = function() {
                if (this.subs) {
                    for (var e = 0; e < this.subs.length; e++) this.subs[e].destroy();
                    this.subs = null
                }
                this.io.destroy(this)
            }, h.prototype.close = h.prototype.disconnect = function() {
                return this.connected && (a("performing disconnect (%s)", this.nsp), this.packet({
                    type: r.DISCONNECT
                })), this.destroy(), this.connected && this.onclose("io client disconnect"), this
            }
        }, {
            "./on": 4,
            "component-bind": 7,
            "component-emitter": 8,
            debug: 9,
            "has-binary": 35,
            "socket.io-parser": 43,
            "to-array": 47
        }],
        6: [function(e, t, n) {
            (function(n) {
                function s(e, t) {
                    var s = e,
                        t = t || n.location;
                    return null == e && (e = t.protocol + "//" + t.hostname), "string" == typeof e && ("/" == e.charAt(0) && ("/" == e.charAt(1) ? e = t.protocol + e : e = t.hostname + e), /^(https?|wss?):\/\//.test(e) || (i("protocol-less url %s", e), "undefined" != typeof t ? e = t.protocol + "//" + e : e = "https://" + e), i("parse %s", e), s = r(e)), s.port || (/^(http|ws)$/.test(s.protocol) ? s.port = "80" : /^(http|ws)s$/.test(s.protocol) && (s.port = "443")), s.path = s.path || "/", s.id = s.protocol + "://" + s.host + ":" + s.port, s.href = s.protocol + "://" + s.host + (t && t.port == s.port ? "" : ":" + s.port), s
                }
                var r = e("parseuri"),
                    i = e("debug")("socket.io-client:url");
                t.exports = s
            }).call(this, typeof self != "undefined" ? self : typeof window != "undefined" ? window : {})
        }, {
            debug: 9,
            parseuri: 41
        }],
        7: [function(e, t, n) {
            var r = [].slice;
            t.exports = function(e, t) {
                "string" == typeof t && (t = e[t]);
                if ("function" != typeof t) throw new Error("bind() requires a function");
                var n = r.call(arguments, 2);
                return function() {
                    return t.apply(e, n.concat(r.call(arguments)))
                }
            }
        }, {}],
        8: [function(e, t, n) {
            function r(e) {
                if (e) return i(e)
            }

            function i(e) {
                for (var t in r.prototype) e[t] = r.prototype[t];
                return e
            }
            t.exports = r, r.prototype.on = r.prototype.addEventListener = function(e, t) {
                return this._callbacks = this._callbacks || {}, (this._callbacks[e] = this._callbacks[e] || []).push(t), this
            }, r.prototype.once = function(e, t) {
                function r() {
                    n.off(e, r), t.apply(this, arguments)
                }
                var n = this;
                return this._callbacks = this._callbacks || {}, r.fn = t, this.on(e, r), this
            }, r.prototype.off = r.prototype.removeListener = r.prototype.removeAllListeners = r.prototype.removeEventListener = function(e, t) {
                this._callbacks = this._callbacks || {};
                if (0 == arguments.length) return this._callbacks = {}, this;
                var n = this._callbacks[e];
                if (!n) return this;
                if (1 == arguments.length) return delete this._callbacks[e], this;
                var r;
                for (var i = 0; i < n.length; i++) {
                    r = n[i];
                    if (r === t || r.fn === t) {
                        n.splice(i, 1);
                        break
                    }
                }
                return this
            }, r.prototype.emit = function(e) {
                this._callbacks = this._callbacks || {};
                var t = [].slice.call(arguments, 1),
                    n = this._callbacks[e];
                if (n) {
                    n = n.slice(0);
                    for (var r = 0, i = n.length; r < i; ++r) n[r].apply(this, t)
                }
                return this
            }, r.prototype.listeners = function(e) {
                return this._callbacks = this._callbacks || {}, this._callbacks[e] || []
            }, r.prototype.hasListeners = function(e) {
                return !!this.listeners(e).length
            }
        }, {}],
        9: [function(e, t, n) {
            function r(e) {
                return r.enabled(e) ? function(t) {
                    t = i(t);
                    var n = new Date,
                        s = n - (r[e] || n);
                    r[e] = n, t = e + " " + t + " +" + r.humanize(s), window.console && console.log && Function.prototype.apply.call(console.log, console, arguments)
                } : function() {}
            }

            function i(e) {
                return e instanceof Error ? e.stack || e.message : e
            }
            t.exports = r, r.names = [], r.skips = [], r.enable = function(e) {
                try {
                    localStorage.debug = e
                } catch (t) {}
                var n = (e || "").split(/[\s,]+/),
                    i = n.length;
                for (var s = 0; s < i; s++) e = n[s].replace("*", ".*?"), e[0] === "-" ? r.skips.push(new RegExp("^" + e.substr(1) + "$")) : r.names.push(new RegExp("^" + e + "$"))
            }, r.disable = function() {
                r.enable("")
            }, r.humanize = function(e) {
                var t = 1e3,
                    n = 6e4,
                    r = 60 * n;
                return e >= r ? (e / r).toFixed(1) + "h" : e >= n ? (e / n).toFixed(1) + "m" : e >= t ? (e / t | 0) + "s" : e + "ms"
            }, r.enabled = function(e) {
                for (var t = 0, n = r.skips.length; t < n; t++)
                    if (r.skips[t].test(e)) return !1;
                for (var t = 0, n = r.names.length; t < n; t++)
                    if (r.names[t].test(e)) return !0;
                return !1
            };
            try {
                window.localStorage && r.enable(localStorage.debug)
            } catch (s) {}
        }, {}],
        10: [function(e, t, n) {
            t.exports = e("./lib/")
        }, {
            "./lib/": 11
        }],
        11: [function(e, t, n) {
            t.exports = e("./socket"), t.exports.parser = e("engine.io-parser")
        }, {
            "./socket": 12,
            "engine.io-parser": 24
        }],
        12: [function(e, t, n) {
            (function(n) {
                function c() {}

                function h(e, t) {
                    if (!(this instanceof h)) return new h(e, t);
                    t = t || {}, e && "object" == typeof e && (t = e, e = null), e && (e = a(e), t.host = e.host, t.secure = e.protocol == "https" || e.protocol == "wss", t.port = e.port, e.query && (t.query = e.query)), this.secure = null != t.secure ? t.secure : n.location && "https:" == location.protocol;
                    if (t.host) {
                        var r = t.host.split(":");
                        t.hostname = r.shift(), r.length && (t.port = r.pop())
                    }
                    this.agent = t.agent || !1, this.hostname = t.hostname || (n.location ? location.hostname : "localhost"), this.port = t.port || (n.location && location.port ? location.port : this.secure ? 443 : 80), this.query = t.query || {}, "string" == typeof this.query && (this.query = l.decode(this.query)), this.upgrade = !1 !== t.upgrade, this.path = (t.path || "/engine.io").replace(/\/$/, "") + "/", this.forceJSONP = !!t.forceJSONP, this.jsonp = !1 !== t.jsonp, this.forceBase64 = !!t.forceBase64, this.enablesXDR = !!t.enablesXDR, this.timestampParam = t.timestampParam || "t", this.timestampRequests = t.timestampRequests, this.transports = t.transports || ["polling", "websocket"], this.readyState = "", this.writeBuffer = [], this.callbackBuffer = [], this.policyPort = t.policyPort || 843, this.rememberUpgrade = t.rememberUpgrade || !1, this.open(), this.binaryType = null, this.onlyBinaryUpgrades = t.onlyBinaryUpgrades
                }

                function p(e) {
                    var t = {};
                    for (var n in e) e.hasOwnProperty(n) && (t[n] = e[n]);
                    return t
                }
                var r = e("./transports"),
                    i = e("component-emitter"),
                    s = e("debug")("engine.io-client:socket"),
                    o = e("indexof"),
                    u = e("engine.io-parser"),
                    a = e("parseuri"),
                    f = e("parsejson"),
                    l = e("parseqs");
                t.exports = h, h.priorWebsocketSuccess = !1, i(h.prototype), h.protocol = u.protocol, h.Socket = h, h.Transport = e("./transport"), h.transports = e("./transports"), h.parser = e("engine.io-parser"), h.prototype.createTransport = function(e) {
                    s('creating transport "%s"', e);
                    var t = p(this.query);
                    t.EIO = u.protocol, t.transport = e, this.id && (t.sid = this.id);
                    var n = new r[e]({
                        agent: this.agent,
                        hostname: this.hostname,
                        port: this.port,
                        secure: this.secure,
                        path: this.path,
                        query: t,
                        forceJSONP: this.forceJSONP,
                        jsonp: this.jsonp,
                        forceBase64: this.forceBase64,
                        enablesXDR: this.enablesXDR,
                        timestampRequests: this.timestampRequests,
                        timestampParam: this.timestampParam,
                        policyPort: this.policyPort,
                        socket: this
                    });
                    return n
                }, h.prototype.open = function() {
                    var e;
                    if (this.rememberUpgrade && h.priorWebsocketSuccess && this.transports.indexOf("websocket") != -1) e = "websocket";
                    else {
                        if (0 == this.transports.length) {
                            var t = this;
                            setTimeout(function() {
                                t.emit("error", "No transports available")
                            }, 0);
                            return
                        }
                        e = this.transports[0]
                    }
                    this.readyState = "opening";
                    var e;
                    try {
                        e = this.createTransport(e)
                    } catch (n) {
                        this.transports.shift(), this.open();
                        return
                    }
                    e.open(), this.setTransport(e)
                }, h.prototype.setTransport = function(e) {
                    s("setting transport %s", e.name);
                    var t = this;
                    this.transport && (s("clearing existing transport %s", this.transport.name), this.transport.removeAllListeners()), this.transport = e, e.on("drain", function() {
                        t.onDrain()
                    }).on("packet", function(e) {
                        t.onPacket(e)
                    }).on("error", function(e) {
                        t.onError(e)
                    }).on("close", function() {
                        t.onClose("transport close")
                    })
                }, h.prototype.probe = function(e) {
                    function i() {
                        if (r.onlyBinaryUpgrades) {
                            var i = !this.supportsBinary && r.transport.supportsBinary;
                            n = n || i
                        }
                        if (n) return;
                        s('probe transport "%s" opened', e), t.send([{
                            type: "ping",
                            data: "probe"
                        }]), t.once("packet", function(i) {
                            if (n) return;
                            if ("pong" == i.type && "probe" == i.data) {
                                s('probe transport "%s" pong', e), r.upgrading = !0, r.emit("upgrading", t);
                                if (!t) return;
                                h.priorWebsocketSuccess = "websocket" == t.name, s('pausing current transport "%s"', r.transport.name), r.transport.pause(function() {
                                    if (n) return;
                                    if ("closed" == r.readyState) return;
                                    s("changing transport and sending upgrade packet"), c(), r.setTransport(t), t.send([{
                                        type: "upgrade"
                                    }]), r.emit("upgrade", t), t = null, r.upgrading = !1, r.flush()
                                })
                            } else {
                                s('probe transport "%s" failed', e);
                                var o = new Error("probe error");
                                o.transport = t.name, r.emit("upgradeError", o)
                            }
                        })
                    }

                    function o() {
                        if (n) return;
                        n = !0, c(), t.close(), t = null
                    }

                    function u(n) {
                        var i = new Error("probe error: " + n);
                        i.transport = t.name, o(), s('probe transport "%s" failed because of error: %s', e, n), r.emit("upgradeError", i)
                    }

                    function a() {
                        u("transport closed")
                    }

                    function f() {
                        u("socket closed")
                    }

                    function l(e) {
                        t && e.name != t.name && (s('"%s" works - aborting "%s"', e.name, t.name), o())
                    }

                    function c() {
                        t.removeListener("open", i), t.removeListener("error", u), t.removeListener("close", a), r.removeListener("close", f), r.removeListener("upgrading", l)
                    }
                    s('probing transport "%s"', e);
                    var t = this.createTransport(e, {
                            probe: 1
                        }),
                        n = !1,
                        r = this;
                    h.priorWebsocketSuccess = !1, t.once("open", i), t.once("error", u), t.once("close", a), this.once("close", f), this.once("upgrading", l), t.open()
                }, h.prototype.onOpen = function() {
                    s("socket open"), this.readyState = "open", h.priorWebsocketSuccess = "websocket" == this.transport.name, this.emit("open"), this.flush();
                    if ("open" == this.readyState && this.upgrade && this.transport.pause) {
                        s("starting upgrade probes");
                        for (var e = 0, t = this.upgrades.length; e < t; e++) this.probe(this.upgrades[e])
                    }
                }, h.prototype.onPacket = function(e) {
                    if ("opening" == this.readyState || "open" == this.readyState) {
                        s('socket receive: type "%s", data "%s"', e.type, e.data), this.emit("packet", e), this.emit("heartbeat");
                        switch (e.type) {
                            case "open":
                                this.onHandshake(f(e.data));
                                break;
                            case "pong":
                                this.setPing();
                                break;
                            case "error":
                                var t = new Error("server error");
                                t.code = e.data, this.emit("error", t);
                                break;
                            case "message":
                                this.emit("data", e.data), this.emit("message", e.data)
                        }
                    } else s('packet received with socket readyState "%s"', this.readyState)
                }, h.prototype.onHandshake = function(e) {
                    this.emit("handshake", e), this.id = e.sid, this.transport.query.sid = e.sid, this.upgrades = this.filterUpgrades(e.upgrades), this.pingInterval = e.pingInterval, this.pingTimeout = e.pingTimeout, this.onOpen();
                    if ("closed" == this.readyState) return;
                    this.setPing(), this.removeListener("heartbeat", this.onHeartbeat), this.on("heartbeat", this.onHeartbeat)
                }, h.prototype.onHeartbeat = function(e) {
                    clearTimeout(this.pingTimeoutTimer);
                    var t = this;
                    t.pingTimeoutTimer = setTimeout(function() {
                        if ("closed" == t.readyState) return;
                        t.onClose("ping timeout")
                    }, e || t.pingInterval + t.pingTimeout)
                }, h.prototype.setPing = function() {
                    var e = this;
                    clearTimeout(e.pingIntervalTimer), e.pingIntervalTimer = setTimeout(function() {
                        s("writing ping packet - expecting pong within %sms", e.pingTimeout), e.ping(), e.onHeartbeat(e.pingTimeout)
                    }, e.pingInterval)
                }, h.prototype.ping = function() {
                    this.sendPacket("ping")
                }, h.prototype.onDrain = function() {
                    for (var e = 0; e < this.prevBufferLen; e++) this.callbackBuffer[e] && this.callbackBuffer[e]();
                    this.writeBuffer.splice(0, this.prevBufferLen), this.callbackBuffer.splice(0, this.prevBufferLen), this.prevBufferLen = 0, this.writeBuffer.length == 0 ? this.emit("drain") : this.flush()
                }, h.prototype.flush = function() {
                    "closed" != this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length && (s("flushing %d packets in socket", this.writeBuffer.length), this.transport.send(this.writeBuffer), this.prevBufferLen = this.writeBuffer.length, this.emit("flush"))
                }, h.prototype.write = h.prototype.send = function(e, t) {
                    return this.sendPacket("message", e, t), this
                }, h.prototype.sendPacket = function(e, t, n) {
                    if ("closing" == this.readyState || "closed" == this.readyState) return;
                    var r = {
                        type: e,
                        data: t
                    };
                    this.emit("packetCreate", r), this.writeBuffer.push(r), this.callbackBuffer.push(n), this.flush()
                }, h.prototype.close = function() {
                    if ("opening" == this.readyState || "open" == this.readyState) {
                        this.readyState = "closing";
                        var e = this;

                        function t() {
                            e.onClose("forced close"), s("socket closing - telling transport to close"), e.transport.close()
                        }

                        function n() {
                            e.removeListener("upgrade", n), e.removeListener("upgradeError", n), t()
                        }

                        function r() {
                            e.once("upgrade", n), e.once("upgradeError", n)
                        }
                        this.writeBuffer.length ? this.once("drain", function() {
                            this.upgrading ? r() : t()
                        }) : this.upgrading ? r() : t()
                    }
                    return this
                }, h.prototype.onError = function(e) {
                    s("socket error %j", e), h.priorWebsocketSuccess = !1, this.emit("error", e), this.onClose("transport error", e)
                }, h.prototype.onClose = function(e, t) {
                    if ("opening" == this.readyState || "open" == this.readyState || "closing" == this.readyState) {
                        s('socket close with reason: "%s"', e);
                        var n = this;
                        clearTimeout(this.pingIntervalTimer), clearTimeout(this.pingTimeoutTimer), setTimeout(function() {
                            n.writeBuffer = [], n.callbackBuffer = [], n.prevBufferLen = 0
                        }, 0), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), this.readyState = "closed", this.id = null, this.emit("close", e, t)
                    }
                }, h.prototype.filterUpgrades = function(e) {
                    var t = [];
                    for (var n = 0, r = e.length; n < r; n++) ~o(this.transports, e[n]) && t.push(e[n]);
                    return t
                }
            }).call(this, typeof self != "undefined" ? self : typeof window != "undefined" ? window : {})
        }, {
            "./transport": 13,
            "./transports": 14,
            "component-emitter": 8,
            debug: 21,
            "engine.io-parser": 24,
            indexof: 39,
            parsejson: 31,
            parseqs: 32,
            parseuri: 33
        }],
        13: [function(e, t, n) {
            function s(e) {
                this.path = e.path, this.hostname = e.hostname, this.port = e.port, this.secure = e.secure, this.query = e.query, this.timestampParam = e.timestampParam, this.timestampRequests = e.timestampRequests, this.readyState = "", this.agent = e.agent || !1, this.socket = e.socket, this.enablesXDR = e.enablesXDR
            }
            var r = e("engine.io-parser"),
                i = e("component-emitter");
            t.exports = s, i(s.prototype), s.timestamps = 0, s.prototype.onError = function(e, t) {
                var n = new Error(e);
                return n.type = "TransportError", n.description = t, this.emit("error", n), this
            }, s.prototype.open = function() {
                if ("closed" == this.readyState || "" == this.readyState) this.readyState = "opening", this.doOpen();
                return this
            }, s.prototype.close = function() {
                if ("opening" == this.readyState || "open" == this.readyState) this.doClose(), this.onClose();
                return this
            }, s.prototype.send = function(e) {
                if ("open" != this.readyState) throw new Error("Transport not open");
                this.write(e)
            }, s.prototype.onOpen = function() {
                this.readyState = "open", this.writable = !0, this.emit("open")
            }, s.prototype.onData = function(e) {
                var t = r.decodePacket(e, this.socket.binaryType);
                this.onPacket(t)
            }, s.prototype.onPacket = function(e) {
                this.emit("packet", e)
            }, s.prototype.onClose = function() {
                this.readyState = "closed", this.emit("close")
            }
        }, {
            "component-emitter": 8,
            "engine.io-parser": 24
        }],
        14: [function(e, t, n) {
            (function(t) {
                function u(e) {
                    var n, o = !1,
                        u = !1,
                        a = !1 !== e.jsonp;
                    if (t.location) {
                        var f = "https:" == location.protocol,
                            l = location.port;
                        l || (l = f ? 443 : 80), o = e.hostname != location.hostname || l != e.port, u = e.secure != f
                    }
                    e.xdomain = o, e.xscheme = u, n = new r(e);
                    if ("open" in n && !e.forceJSONP) return new i(e);
                    if (!a) throw new Error("JSONP disabled");
                    return new s(e)
                }
                var r = e("xmlhttprequest"),
                    i = e("./polling-xhr"),
                    s = e("./polling-jsonp"),
                    o = e("./websocket");
                n.polling = u, n.websocket = o
            }).call(this, typeof self != "undefined" ? self : typeof window != "undefined" ? window : {})
        }, {
            "./polling-jsonp": 15,
            "./polling-xhr": 16,
            "./websocket": 18,
            xmlhttprequest: 19
        }],
        15: [function(e, t, n) {
            (function(n) {
                function f() {}

                function l(e) {
                    r.call(this, e), this.query = this.query || {}, u || (n.___eio || (n.___eio = []), u = n.___eio), this.index = u.length;
                    var t = this;
                    u.push(function(e) {
                        t.onData(e)
                    }), this.query.j = this.index, n.document && n.addEventListener && n.addEventListener("beforeunload", function() {
                        t.script && (t.script.onerror = f)
                    }, !1)
                }
                var r = e("./polling"),
                    i = e("component-inherit");
                t.exports = l;
                var s = /\n/g,
                    o = /\\n/g,
                    u, a = 0;
                i(l, r), l.prototype.supportsBinary = !1, l.prototype.doClose = function() {
                    this.script && (this.script.parentNode.removeChild(this.script), this.script = null), this.form && (this.form.parentNode.removeChild(this.form), this.form = null, this.iframe = null), r.prototype.doClose.call(this)
                }, l.prototype.doPoll = function() {
                    var e = this,
                        t = document.createElement("script");
                    this.script && (this.script.parentNode.removeChild(this.script), this.script = null), t.async = !0, t.src = this.uri(), t.onerror = function(t) {
                        e.onError("jsonp poll error", t)
                    };
                    var n = document.getElementsByTagName("script")[0];
                    n.parentNode.insertBefore(t, n), this.script = t;
                    var r = "undefined" != typeof navigator && /gecko/i.test(navigator.userAgent);
                    r && setTimeout(function() {
                        var e = document.createElement("iframe");
                        document.body.appendChild(e), document.body.removeChild(e)
                    }, 100)
                }, l.prototype.doWrite = function(e, t) {
                    function f() {
                        l(), t()
                    }

                    function l() {
                        if (n.iframe) try {
                            n.form.removeChild(n.iframe)
                        } catch (e) {
                            n.onError("jsonp polling iframe removal error", e)
                        }
                        try {
                            var t = '<iframe src="javascript:0" name="' + n.iframeId + '">';
                            a = document.createElement(t)
                        } catch (e) {
                            a = document.createElement("iframe"), a.name = n.iframeId, a.src = "javascript:0"
                        }
                        a.id = n.iframeId, n.form.appendChild(a), n.iframe = a
                    }
                    var n = this;
                    if (!this.form) {
                        var r = document.createElement("form"),
                            i = document.createElement("textarea"),
                            u = this.iframeId = "eio_iframe_" + this.index,
                            a;
                        r.className = "socketio", r.style.position = "absolute", r.style.top = "-1000px", r.style.left = "-1000px", r.target = u, r.method = "POST", r.setAttribute("accept-charset", "utf-8"), i.name = "d", r.appendChild(i), document.body.appendChild(r), this.form = r, this.area = i
                    }
                    this.form.action = this.uri(), l(), e = e.replace(o, "\\\n"), this.area.value = e.replace(s, "\\n");
                    try {
                        this.form.submit()
                    } catch (c) {}
                    this.iframe.attachEvent ? this.iframe.onreadystatechange = function() {
                        n.iframe.readyState == "complete" && f()
                    } : this.iframe.onload = f
                }
            }).call(this, typeof self != "undefined" ? self : typeof window != "undefined" ? window : {})
        }, {
            "./polling": 17,
            "component-inherit": 20
        }],
        16: [function(e, t, n) {
            (function(n) {
                function a() {}

                function f(e) {
                    i.call(this, e);
                    if (n.location) {
                        var t = "https:" == location.protocol,
                            r = location.port;
                        r || (r = t ? 443 : 80), this.xd = e.hostname != n.location.hostname || r != e.port, this.xs = e.secure != t
                    }
                }

                function l(e) {
                    this.method = e.method || "GET", this.uri = e.uri, this.xd = !!e.xd, this.xs = !!e.xs, this.async = !1 !== e.async, this.data = undefined != e.data ? e.data : null, this.agent = e.agent, this.isBinary = e.isBinary, this.supportsBinary = e.supportsBinary, this.enablesXDR = e.enablesXDR, this.create()
                }

                function c() {
                    for (var e in l.requests) l.requests.hasOwnProperty(e) && l.requests[e].abort()
                }
                var r = e("xmlhttprequest"),
                    i = e("./polling"),
                    s = e("component-emitter"),
                    o = e("component-inherit"),
                    u = e("debug")("engine.io-client:polling-xhr");
                t.exports = f, t.exports.Request = l, o(f, i), f.prototype.supportsBinary = !0, f.prototype.request = function(e) {
                    return e = e || {}, e.uri = this.uri(), e.xd = this.xd, e.xs = this.xs, e.agent = this.agent || !1, e.supportsBinary = this.supportsBinary, e.enablesXDR = this.enablesXDR, new l(e)
                }, f.prototype.doWrite = function(e, t) {
                    var n = typeof e != "string" && e !== undefined,
                        r = this.request({
                            method: "POST",
                            data: e,
                            isBinary: n
                        }),
                        i = this;
                    r.on("success", t), r.on("error", function(e) {
                        i.onError("xhr post error", e)
                    }), this.sendXhr = r
                }, f.prototype.doPoll = function() {
                    u("xhr poll");
                    var e = this.request(),
                        t = this;
                    e.on("data", function(e) {
                        t.onData(e)
                    }), e.on("error", function(e) {
                        t.onError("xhr poll error", e)
                    }), this.pollXhr = e
                }, s(l.prototype), l.prototype.create = function() {
                    var e = this.xhr = new r({
                            agent: this.agent,
                            xdomain: this.xd,
                            xscheme: this.xs,
                            enablesXDR: this.enablesXDR
                        }),
                        t = this;
                    try {
                        u("xhr open %s: %s", this.method, this.uri), e.open(this.method, this.uri, this.async), this.supportsBinary && (e.responseType = "arraybuffer");
                        if ("POST" == this.method) try {
                            this.isBinary ? e.setRequestHeader("Content-type", "application/octet-stream") : e.setRequestHeader("Content-type", "text/plain;charset=UTF-8")
                        } catch (i) {}
                        "withCredentials" in e && (e.withCredentials = !0), this.hasXDR() ? (e.onload = function() {
                            t.onLoad()
                        }, e.onerror = function() {
                            t.onError(e.responseText)
                        }) : e.onreadystatechange = function() {
                            if (4 != e.readyState) return;
                            200 == e.status || 1223 == e.status ? t.onLoad() : setTimeout(function() {
                                t.onError(e.status)
                            }, 0)
                        }, u("xhr data %s", this.data), e.send(this.data)
                    } catch (i) {
                        setTimeout(function() {
                            t.onError(i)
                        }, 0);
                        return
                    }
                    n.document && (this.index = l.requestsCount++, l.requests[this.index] = this)
                }, l.prototype.onSuccess = function() {
                    this.emit("success"), this.cleanup()
                }, l.prototype.onData = function(e) {
                    this.emit("data", e), this.onSuccess()
                }, l.prototype.onError = function(e) {
                    this.emit("error", e), this.cleanup()
                }, l.prototype.cleanup = function() {
                    if ("undefined" == typeof this.xhr || null === this.xhr) return;
                    this.hasXDR() ? this.xhr.onload = this.xhr.onerror = a : this.xhr.onreadystatechange = a;
                    try {
                        this.xhr.abort()
                    } catch (e) {}
                    n.document && delete l.requests[this.index], this.xhr = null
                }, l.prototype.onLoad = function() {
                    var e;
                    try {
                        var t;
                        try {
                            t = this.xhr.getResponseHeader("Content-Type").split(";")[0]
                        } catch (n) {}
                        t === "application/octet-stream" ? e = this.xhr.response : this.supportsBinary ? e = "ok" : e = this.xhr.responseText
                    } catch (n) {
                        this.onError(n)
                    }
                    null != e && this.onData(e)
                }, l.prototype.hasXDR = function() {
                    return "undefined" != typeof n.XDomainRequest && !this.xs && this.enablesXDR
                }, l.prototype.abort = function() {
                    this.cleanup()
                }, n.document && (l.requestsCount = 0, l.requests = {}, n.attachEvent ? n.attachEvent("onunload", c) : n.addEventListener && n.addEventListener("beforeunload", c, !1))
            }).call(this, typeof self != "undefined" ? self : typeof window != "undefined" ? window : {})
        }, {
            "./polling": 17,
            "component-emitter": 8,
            "component-inherit": 20,
            debug: 21,
            xmlhttprequest: 19
        }],
        17: [function(e, t, n) {
            function f(e) {
                var t = e && e.forceBase64;
                if (!a || t) this.supportsBinary = !1;
                r.call(this, e)
            }
            var r = e("../transport"),
                i = e("parseqs"),
                s = e("engine.io-parser"),
                o = e("component-inherit"),
                u = e("debug")("engine.io-client:polling");
            t.exports = f;
            var a = function() {
                var t = e("xmlhttprequest"),
                    n = new t({
                        xdomain: !1
                    });
                return null != n.responseType
            }();
            o(f, r), f.prototype.name = "polling", f.prototype.doOpen = function() {
                this.poll()
            }, f.prototype.pause = function(e) {
                function r() {
                    u("paused"), n.readyState = "paused", e()
                }
                var t = 0,
                    n = this;
                this.readyState = "pausing";
                if (this.polling || !this.writable) {
                    var i = 0;
                    this.polling && (u("we are currently polling - waiting to pause"), i++, this.once("pollComplete", function() {
                        u("pre-pause polling complete"), --i || r()
                    })), this.writable || (u("we are currently writing - waiting to pause"), i++, this.once("drain", function() {
                        u("pre-pause writing complete"), --i || r()
                    }))
                } else r()
            }, f.prototype.poll = function() {
                u("polling"), this.polling = !0, this.doPoll(), this.emit("poll")
            }, f.prototype.onData = function(e) {
                var t = this;
                u("polling got data %s", e);
                var n = function(e, n, r) {
                    "opening" == t.readyState && t.onOpen();
                    if ("close" == e.type) return t.onClose(), !1;
                    t.onPacket(e)
                };
                s.decodePayload(e, this.socket.binaryType, n), "closed" != this.readyState && (this.polling = !1, this.emit("pollComplete"), "open" == this.readyState ? this.poll() : u('ignoring poll - transport state "%s"', this.readyState))
            }, f.prototype.doClose = function() {
                function t() {
                    u("writing close packet"), e.write([{
                        type: "close"
                    }])
                }
                var e = this;
                "open" == this.readyState ? (u("transport open - closing"), t()) : (u("transport not open - deferring close"), this.once("open", t))
            }, f.prototype.write = function(e) {
                var t = this;
                this.writable = !1;
                var n = function() {
                        t.writable = !0, t.emit("drain")
                    },
                    t = this;
                s.encodePayload(e, this.supportsBinary, function(e) {
                    t.doWrite(e, n)
                })
            }, f.prototype.uri = function() {
                var e = this.query || {},
                    t = this.secure ? "https" : "http",
                    n = "";
                return !1 !== this.timestampRequests && (e[this.timestampParam] = +(new Date) + "-" + r.timestamps++), !this.supportsBinary && !e.sid && (e.b64 = 1), e = i.encode(e), this.port && ("https" == t && this.port != 443 || "http" == t && this.port != 80) && (n = ":" + this.port), e.length && (e = "?" + e), t + "://" + this.hostname + n + this.path + e
            }
        }, {
            "../transport": 13,
            "component-inherit": 20,
            debug: 21,
            "engine.io-parser": 24,
            parseqs: 32,
            xmlhttprequest: 19
        }],
        18: [function(e, t, n) {
            function f(e) {
                var t = e && e.forceBase64;
                t && (this.supportsBinary = !1), r.call(this, e)
            }
            var r = e("../transport"),
                i = e("engine.io-parser"),
                s = e("parseqs"),
                o = e("component-inherit"),
                u = e("debug")("engine.io-client:websocket"),
                a = e("ws");
            t.exports = f, o(f, r), f.prototype.name = "websocket", f.prototype.supportsBinary = !0, f.prototype.doOpen = function() {
                if (!this.check()) return;
                var e = this,
                    t = this.uri(),
                    n = void 0,
                    r = {
                        agent: this.agent
                    };
                this.ws = new a(t, n, r), this.ws.binaryType === undefined && (this.supportsBinary = !1), this.ws.binaryType = "arraybuffer", this.addEventListeners()
            }, f.prototype.addEventListeners = function() {
                var e = this;
                this.ws.onopen = function() {
                    e.onOpen()
                }, this.ws.onclose = function() {
                    e.onClose()
                }, this.ws.onmessage = function(t) {
                    e.onData(t.data)
                }, this.ws.onerror = function(t) {
                    e.onError("websocket error", t)
                }
            }, "undefined" != typeof navigator && /iPad|iPhone|iPod/i.test(navigator.userAgent) && (f.prototype.onData = function(e) {
                var t = this;
                setTimeout(function() {
                    r.prototype.onData.call(t, e)
                }, 0)
            }), f.prototype.write = function(e) {
                function s() {
                    t.writable = !0, t.emit("drain")
                }
                var t = this;
                this.writable = !1;
                for (var n = 0, r = e.length; n < r; n++) i.encodePacket(e[n], this.supportsBinary, function(e) {
                    try {
                        t.ws.send(e)
                    } catch (n) {
                        u("websocket closed before onclose event")
                    }
                });
                setTimeout(s, 0)
            }, f.prototype.onClose = function() {
                r.prototype.onClose.call(this)
            }, f.prototype.doClose = function() {
                typeof this.ws != "undefined" && this.ws.close()
            }, f.prototype.uri = function() {
                var e = this.query || {},
                    t = this.secure ? "wss" : "ws",
                    n = "";
                return this.port && ("wss" == t && this.port != 443 || "ws" == t && this.port != 80) && (n = ":" + this.port), this.timestampRequests && (e[this.timestampParam] = +(new Date)), this.supportsBinary || (e.b64 = 1), e = s.encode(e), e.length && (e = "?" + e), t + "://" + this.hostname + n + this.path + e
            }, f.prototype.check = function() {
                return !!a && !("__initialize" in a && this.name === f.prototype.name)
            }
        }, {
            "../transport": 13,
            "component-inherit": 20,
            debug: 21,
            "engine.io-parser": 24,
            parseqs: 32,
            ws: 34
        }],
        19: [function(e, t, n) {
            var r = e("has-cors");
            t.exports = function(e) {
                var t = e.xdomain,
                    n = e.xscheme,
                    i = e.enablesXDR;
                try {
                    if ("undefined" != typeof XMLHttpRequest && (!t || r)) return new XMLHttpRequest
                } catch (s) {}
                try {
                    if ("undefined" != typeof XDomainRequest && !n && i) return new XDomainRequest
                } catch (s) {}
                if (!t) try {
                    return new ActiveXObject("Microsoft.XMLHTTP")
                } catch (s) {}
            }
        }, {
            "has-cors": 37
        }],
        20: [function(e, t, n) {
            t.exports = function(e, t) {
                var n = function() {};
                n.prototype = t.prototype, e.prototype = new n, e.prototype.constructor = e
            }
        }, {}],
        21: [function(e, t, n) {
            function r() {
                return "WebkitAppearance" in document.documentElement.style || window.console && (console.firebug || console.exception && console.table) || navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31
            }

            function i() {
                var e = arguments,
                    t = this.useColors;
                e[0] = (t ? "%c" : "") + this.namespace + (t ? " %c" : " ") + e[0] + (t ? "%c " : " ") + "+" + n.humanize(this.diff);
                if (!t) return e;
                var r = "color: " + this.color;
                e = [e[0], r, "color: inherit"].concat(Array.prototype.slice.call(e, 1));
                var i = 0,
                    s = 0;
                return e[0].replace(/%[a-z%]/g, function(e) {
                    if ("%" === e) return;
                    i++, "%c" === e && (s = i)
                }), e.splice(s, 0, r), e
            }

            function s() {
                return "object" == typeof console && "function" == typeof console.log && Function.prototype.apply.call(console.log, console, arguments)
            }

            function o(e) {
                try {
                    null == e ? localStorage.removeItem("debug") : localStorage.debug = e
                } catch (t) {}
            }

            function u() {
                var e;
                try {
                    e = localStorage.debug
                } catch (t) {}
                return e
            }
            n = t.exports = e("./debug"), n.log = s, n.formatArgs = i, n.save = o, n.load = u, n.useColors = r, n.colors = ["lightseagreen", "forestgreen", "goldenrod", "dodgerblue", "darkorchid", "crimson"], n.formatters.j = function(e) {
                return JSON.stringify(e)
            }, n.enable(u())
        }, {
            "./debug": 22
        }],
        22: [function(e, t, n) {
            function s() {
                return n.colors[r++ % n.colors.length]
            }

            function o(e) {
                function t() {}

                function r() {
                    var e = r,
                        t = +(new Date),
                        o = t - (i || t);
                    e.diff = o, e.prev = i, e.curr = t, i = t, null == e.useColors && (e.useColors = n.useColors()), null == e.color && e.useColors && (e.color = s());
                    var u = Array.prototype.slice.call(arguments);
                    u[0] = n.coerce(u[0]), "string" != typeof u[0] && (u = ["%o"].concat(u));
                    var a = 0;
                    u[0] = u[0].replace(/%([a-z%])/g, function(t, r) {
                        if (t === "%") return t;
                        a++;
                        var i = n.formatters[r];
                        if ("function" == typeof i) {
                            var s = u[a];
                            t = i.call(e, s), u.splice(a, 1), a--
                        }
                        return t
                    }), "function" == typeof n.formatArgs && (u = n.formatArgs.apply(e, u));
                    var f = r.log || n.log || console.log.bind(console);
                    f.apply(e, u)
                }
                t.enabled = !1, r.enabled = !0;
                var o = n.enabled(e) ? r : t;
                return o.namespace = e, o
            }

            function u(e) {
                n.save(e);
                var t = (e || "").split(/[\s,]+/),
                    r = t.length;
                for (var i = 0; i < r; i++) {
                    if (!t[i]) continue;
                    e = t[i].replace(/\*/g, ".*?"), e[0] === "-" ? n.skips.push(new RegExp("^" + e.substr(1) + "$")) : n.names.push(new RegExp("^" + e + "$"))
                }
            }

            function a() {
                n.enable("")
            }

            function f(e) {
                var t, r;
                for (t = 0, r = n.skips.length; t < r; t++)
                    if (n.skips[t].test(e)) return !1;
                for (t = 0, r = n.names.length; t < r; t++)
                    if (n.names[t].test(e)) return !0;
                return !1
            }

            function l(e) {
                return e instanceof Error ? e.stack || e.message : e
            }
            n = t.exports = o, n.coerce = l, n.disable = a, n.enable = u, n.enabled = f, n.humanize = e("ms"), n.names = [], n.skips = [], n.formatters = {};
            var r = 0,
                i
        }, {
            ms: 23
        }],
        23: [function(e, t, n) {
            function a(e) {
                var t = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(e);
                if (!t) return;
                var n = parseFloat(t[1]),
                    a = (t[2] || "ms").toLowerCase();
                switch (a) {
                    case "years":
                    case "year":
                    case "y":
                        return n * u;
                    case "days":
                    case "day":
                    case "d":
                        return n * o;
                    case "hours":
                    case "hour":
                    case "h":
                        return n * s;
                    case "minutes":
                    case "minute":
                    case "m":
                        return n * i;
                    case "seconds":
                    case "second":
                    case "s":
                        return n * r;
                    case "ms":
                        return n
                }
            }

            function f(e) {
                return e >= o ? Math.round(e / o) + "d" : e >= s ? Math.round(e / s) + "h" : e >= i ? Math.round(e / i) + "m" : e >= r ? Math.round(e / r) + "s" : e + "ms"
            }

            function l(e) {
                return c(e, o, "day") || c(e, s, "hour") || c(e, i, "minute") || c(e, r, "second") || e + " ms"
            }

            function c(e, t, n) {
                if (e < t) return;
                return e < t * 1.5 ? Math.floor(e / t) + " " + n : Math.ceil(e / t) + " " + n + "s"
            }
            var r = 1e3,
                i = r * 60,
                s = i * 60,
                o = s * 24,
                u = o * 365.25;
            t.exports = function(e, t) {
                return t = t || {}, "string" == typeof e ? a(e) : t.long ? l(e) : f(e)
            }
        }, {}],
        24: [function(e, t, n) {
            (function(t) {
                function p(e, t, r) {
                    if (!t) return n.encodeBase64Packet(e, r);
                    var i = e.data,
                        s = new Uint8Array(i),
                        o = new Uint8Array(1 + i.byteLength);
                    o[0] = f[e.type];
                    for (var u = 0; u < s.length; u++) o[u + 1] = s[u];
                    return r(o.buffer)
                }

                function d(e, t, r) {
                    if (!t) return n.encodeBase64Packet(e, r);
                    var i = new FileReader;
                    return i.onload = function() {
                        e.data = i.result, n.encodePacket(e, t, !0, r)
                    }, i.readAsArrayBuffer(e.data)
                }

                function v(e, t, r) {
                    if (!t) return n.encodeBase64Packet(e, r);
                    if (a) return d(e, t, r);
                    var i = new Uint8Array(1);
                    i[0] = f[e.type];
                    var s = new h([i.buffer, e.data]);
                    return r(s)
                }

                function m(e, t, n) {
                    var r = new Array(e.length),
                        i = o(e.length, n),
                        s = function(e, n, i) {
                            t(n, function(t, n) {
                                r[e] = n, i(t, r)
                            })
                        };
                    for (var u = 0; u < e.length; u++) s(u, e[u], i)
                }
                var r = e("./keys"),
                    i = e("arraybuffer.slice"),
                    s = e("base64-arraybuffer"),
                    o = e("after"),
                    u = e("utf8"),
                    a = navigator.userAgent.match(/Android/i);
                n.protocol = 3;
                var f = n.packets = {
                        open: 0,
                        close: 1,
                        ping: 2,
                        pong: 3,
                        message: 4,
                        upgrade: 5,
                        noop: 6
                    },
                    l = r(f),
                    c = {
                        type: "error",
                        data: "parser error"
                    },
                    h = e("blob");
                n.encodePacket = function(e, n, r, i) {
                    "function" == typeof n && (i = n, n = !1), "function" == typeof r && (i = r, r = null);
                    var s = e.data === undefined ? undefined : e.data.buffer || e.data;
                    if (t.ArrayBuffer && s instanceof ArrayBuffer) return p(e, n, i);
                    if (h && s instanceof t.Blob) return v(e, n, i);
                    var o = f[e.type];
                    return undefined !== e.data && (o += r ? u.encode(String(e.data)) : String(e.data)), i("" + o)
                }, n.encodeBase64Packet = function(e, r) {
                    var i = "b" + n.packets[e.type];
                    if (h && e.data instanceof h) {
                        var s = new FileReader;
                        return s.onload = function() {
                            var e = s.result.split(",")[1];
                            r(i + e)
                        }, s.readAsDataURL(e.data)
                    }
                    var o;
                    try {
                        o = String.fromCharCode.apply(null, new Uint8Array(e.data))
                    } catch (u) {
                        var a = new Uint8Array(e.data),
                            f = new Array(a.length);
                        for (var l = 0; l < a.length; l++) f[l] = a[l];
                        o = String.fromCharCode.apply(null, f)
                    }
                    return i += t.btoa(o), r(i)
                }, n.decodePacket = function(e, t, r) {
                    if (typeof e == "string" || e === undefined) {
                        if (e.charAt(0) == "b") return n.decodeBase64Packet(e.substr(1), t);
                        if (r) try {
                            e = u.decode(e)
                        } catch (s) {
                            return c
                        }
                        var o = e.charAt(0);
                        return Number(o) != o || !l[o] ? c : e.length > 1 ? {
                            type: l[o],
                            data: e.substring(1)
                        } : {
                            type: l[o]
                        }
                    }
                    var a = new Uint8Array(e),
                        o = a[0],
                        f = i(e, 1);
                    return h && t === "blob" && (f = new h([f])), {
                        type: l[o],
                        data: f
                    }
                }, n.decodeBase64Packet = function(e, n) {
                    var r = l[e.charAt(0)];
                    if (!t.ArrayBuffer) return {
                        type: r,
                        data: {
                            base64: !0,
                            data: e.substr(1)
                        }
                    };
                    var i = s.decode(e.substr(1));
                    return n === "blob" && h && (i = new h([i])), {
                        type: r,
                        data: i
                    }
                }, n.encodePayload = function(e, t, r) {
                    function i(e) {
                        return e.length + ":" + e
                    }

                    function s(e, r) {
                        n.encodePacket(e, t, !0, function(e) {
                            r(null, i(e))
                        })
                    }
                    typeof t == "function" && (r = t, t = null);
                    if (t) return h && !a ? n.encodePayloadAsBlob(e, r) : n.encodePayloadAsArrayBuffer(e, r);
                    if (!e.length) return r("0:");
                    m(e, s, function(e, t) {
                        return r(t.join(""))
                    })
                }, n.decodePayload = function(e, t, r) {
                    if (typeof e != "string") return n.decodePayloadAsBinary(e, t, r);
                    typeof t == "function" && (r = t, t = null);
                    var i;
                    if (e == "") return r(c, 0, 1);
                    var s = "",
                        o, u;
                    for (var a = 0, f = e.length; a < f; a++) {
                        var l = e.charAt(a);
                        if (":" != l) s += l;
                        else {
                            if ("" == s || s != (o = Number(s))) return r(c, 0, 1);
                            u = e.substr(a + 1, o);
                            if (s != u.length) return r(c, 0, 1);
                            if (u.length) {
                                i = n.decodePacket(u, t, !0);
                                if (c.type == i.type && c.data == i.data) return r(c, 0, 1);
                                var h = r(i, a + o, f);
                                if (!1 === h) return
                            }
                            a += o, s = ""
                        }
                    }
                    if (s != "") return r(c, 0, 1)
                }, n.encodePayloadAsArrayBuffer = function(e, t) {
                    function r(e, t) {
                        n.encodePacket(e, !0, !0, function(e) {
                            return t(null, e)
                        })
                    }
                    if (!e.length) return t(new ArrayBuffer(0));
                    m(e, r, function(e, n) {
                        var r = n.reduce(function(e, t) {
                                var n;
                                return typeof t == "string" ? n = t.length : n = t.byteLength, e + n.toString().length + n + 2
                            }, 0),
                            i = new Uint8Array(r),
                            s = 0;
                        return n.forEach(function(e) {
                            var t = typeof e == "string",
                                n = e;
                            if (t) {
                                var r = new Uint8Array(e.length);
                                for (var o = 0; o < e.length; o++) r[o] = e.charCodeAt(o);
                                n = r.buffer
                            }
                            t ? i[s++] = 0 : i[s++] = 1;
                            var u = n.byteLength.toString();
                            for (var o = 0; o < u.length; o++) i[s++] = parseInt(u[o]);
                            i[s++] = 255;
                            var r = new Uint8Array(n);
                            for (var o = 0; o < r.length; o++) i[s++] = r[o]
                        }), t(i.buffer)
                    })
                }, n.encodePayloadAsBlob = function(e, t) {
                    function r(e, t) {
                        n.encodePacket(e, !0, !0, function(e) {
                            var n = new Uint8Array(1);
                            n[0] = 1;
                            if (typeof e == "string") {
                                var r = new Uint8Array(e.length);
                                for (var i = 0; i < e.length; i++) r[i] = e.charCodeAt(i);
                                e = r.buffer, n[0] = 0
                            }
                            var s = e instanceof ArrayBuffer ? e.byteLength : e.size,
                                o = s.toString(),
                                u = new Uint8Array(o.length + 1);
                            for (var i = 0; i < o.length; i++) u[i] = parseInt(o[i]);
                            u[o.length] = 255;
                            if (h) {
                                var a = new h([n.buffer, u.buffer, e]);
                                t(null, a)
                            }
                        })
                    }
                    m(e, r, function(e, n) {
                        return t(new h(n))
                    })
                }, n.decodePayloadAsBinary = function(e, t, r) {
                    typeof t == "function" && (r = t, t = null);
                    var s = e,
                        o = [],
                        u = !1;
                    while (s.byteLength > 0) {
                        var a = new Uint8Array(s),
                            f = a[0] === 0,
                            l = "";
                        for (var h = 1;; h++) {
                            if (a[h] == 255) break;
                            if (l.length > 310) {
                                u = !0;
                                break
                            }
                            l += a[h]
                        }
                        if (u) return r(c, 0, 1);
                        s = i(s, 2 + l.length), l = parseInt(l);
                        var p = i(s, 0, l);
                        if (f) try {
                            p = String.fromCharCode.apply(null, new Uint8Array(p))
                        } catch (d) {
                            var v = new Uint8Array(p);
                            p = "";
                            for (var h = 0; h < v.length; h++) p += String.fromCharCode(v[h])
                        }
                        o.push(p), s = i(s, l)
                    }
                    var m = o.length;
                    o.forEach(function(e, i) {
                        r(n.decodePacket(e, t, !0), i, m)
                    })
                }
            }).call(this, typeof self != "undefined" ? self : typeof window != "undefined" ? window : {})
        }, {
            "./keys": 25,
            after: 26,
            "arraybuffer.slice": 27,
            "base64-arraybuffer": 28,
            blob: 29,
            utf8: 30
        }],
        25: [function(e, t, n) {
            t.exports = Object.keys || function(t) {
                var n = [],
                    r = Object.prototype.hasOwnProperty;
                for (var i in t) r.call(t, i) && n.push(i);
                return n
            }
        }, {}],
        26: [function(e, t, n) {
            function r(e, t, n) {
                function s(e, i) {
                    if (s.count <= 0) throw new Error("after called too many times");
                    --s.count, e ? (r = !0, t(e), t = n) : s.count === 0 && !r && t(null, i)
                }
                var r = !1;
                return n = n || i, s.count = e, e === 0 ? t() : s
            }

            function i() {}
            t.exports = r
        }, {}],
        27: [function(e, t, n) {
            t.exports = function(e, t, n) {
                var r = e.byteLength;
                t = t || 0, n = n || r;
                if (e.slice) return e.slice(t, n);
                t < 0 && (t += r), n < 0 && (n += r), n > r && (n = r);
                if (t >= r || t >= n || r === 0) return new ArrayBuffer(0);
                var i = new Uint8Array(e),
                    s = new Uint8Array(n - t);
                for (var o = t, u = 0; o < n; o++, u++) s[u] = i[o];
                return s.buffer
            }
        }, {}],
        28: [function(e, t, n) {
            (function(e) {
                "use strict";
                n.encode = function(t) {
                    var n = new Uint8Array(t),
                        r, i = n.length,
                        s = "";
                    for (r = 0; r < i; r += 3) s += e[n[r] >> 2], s += e[(n[r] & 3) << 4 | n[r + 1] >> 4], s += e[(n[r + 1] & 15) << 2 | n[r + 2] >> 6], s += e[n[r + 2] & 63];
                    return i % 3 === 2 ? s = s.substring(0, s.length - 1) + "=" : i % 3 === 1 && (s = s.substring(0, s.length - 2) + "=="), s
                }, n.decode = function(t) {
                    var n = t.length * .75,
                        r = t.length,
                        i, s = 0,
                        o, u, a, f;
                    t[t.length - 1] === "=" && (n--, t[t.length - 2] === "=" && n--);
                    var l = new ArrayBuffer(n),
                        c = new Uint8Array(l);
                    for (i = 0; i < r; i += 4) o = e.indexOf(t[i]), u = e.indexOf(t[i + 1]), a = e.indexOf(t[i + 2]), f = e.indexOf(t[i + 3]), c[s++] = o << 2 | u >> 4, c[s++] = (u & 15) << 4 | a >> 2, c[s++] = (a & 3) << 6 | f & 63;
                    return l
                }
            })("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/")
        }, {}],
        29: [function(e, t, n) {
            (function(e) {
                function s(e, t) {
                    t = t || {};
                    var r = new n;
                    for (var i = 0; i < e.length; i++) r.append(e[i]);
                    return t.type ? r.getBlob(t.type) : r.getBlob()
                }
                var n = e.BlobBuilder || e.WebKitBlobBuilder || e.MSBlobBuilder || e.MozBlobBuilder,
                    r = function() {
                        try {
                            var e = new Blob(["hi"]);
                            return e.size == 2
                        } catch (t) {
                            return !1
                        }
                    }(),
                    i = n && n.prototype.append && n.prototype.getBlob;
                t.exports = function() {
                    return r ? e.Blob : i ? s : undefined
                }()
            }).call(this, typeof self != "undefined" ? self : typeof window != "undefined" ? window : {})
        }, {}],
        30: [function(t, n, r) {
            (function(t) {
                (function(i) {
                    function f(e) {
                        var t = [],
                            n = 0,
                            r = e.length,
                            i, s;
                        while (n < r) i = e.charCodeAt(n++), i >= 55296 && i <= 56319 && n < r ? (s = e.charCodeAt(n++), (s & 64512) == 56320 ? t.push(((i & 1023) << 10) + (s & 1023) + 65536) : (t.push(i), n--)) : t.push(i);
                        return t
                    }

                    function l(e) {
                        var t = e.length,
                            n = -1,
                            r, i = "";
                        while (++n < t) r = e[n], r > 65535 && (r -= 65536, i += a(r >>> 10 & 1023 | 55296), r = 56320 | r & 1023), i += a(r);
                        return i
                    }

                    function c(e, t) {
                        return a(e >> t & 63 | 128)
                    }

                    function h(e) {
                        if ((e & 4294967168) == 0) return a(e);
                        var t = "";
                        return (e & 4294965248) == 0 ? t = a(e >> 6 & 31 | 192) : (e & 4294901760) == 0 ? (t = a(e >> 12 & 15 | 224), t += c(e, 6)) : (e & 4292870144) == 0 && (t = a(e >> 18 & 7 | 240), t += c(e, 12), t += c(e, 6)), t += a(e & 63 | 128), t
                    }

                    function p(e) {
                        var t = f(e),
                            n = t.length,
                            r = -1,
                            i, s = "";
                        while (++r < n) i = t[r], s += h(i);
                        return s
                    }

                    function d() {
                        if (y >= g) throw Error("Invalid byte index");
                        var e = m[y] & 255;
                        y++;
                        if ((e & 192) == 128) return e & 63;
                        throw Error("Invalid continuation byte")
                    }

                    function v() {
                        var e, t, n, r, i;
                        if (y > g) throw Error("Invalid byte index");
                        if (y == g) return !1;
                        e = m[y] & 255, y++;
                        if ((e & 128) == 0) return e;
                        if ((e & 224) == 192) {
                            var t = d();
                            i = (e & 31) << 6 | t;
                            if (i >= 128) return i;
                            throw Error("Invalid continuation byte")
                        }
                        if ((e & 240) == 224) {
                            t = d(), n = d(), i = (e & 15) << 12 | t << 6 | n;
                            if (i >= 2048) return i;
                            throw Error("Invalid continuation byte")
                        }
                        if ((e & 248) == 240) {
                            t = d(), n = d(), r = d(), i = (e & 15) << 18 | t << 12 | n << 6 | r;
                            if (i >= 65536 && i <= 1114111) return i
                        }
                        throw Error("Invalid UTF-8 detected")
                    }

                    function b(e) {
                        m = f(e), g = m.length, y = 0;
                        var t = [],
                            n;
                        while ((n = v()) !== !1) t.push(n);
                        return l(t)
                    }
                    var s = typeof r == "object" && r,
                        o = typeof n == "object" && n && n.exports == s && n,
                        u = typeof t == "object" && t;
                    if (u.global === u || u.window === u) i = u;
                    var a = String.fromCharCode,
                        m, g, y, w = {
                            version: "2.0.0",
                            encode: p,
                            decode: b
                        };
                    if (typeof e == "function" && typeof e.amd == "object" && e.amd) e(function() {
                        return w
                    });
                    else if (s && !s.nodeType)
                        if (o) o.exports = w;
                        else {
                            var E = {},
                                S = E.hasOwnProperty;
                            for (var x in w) S.call(w, x) && (s[x] = w[x])
                        }
                    else i.utf8 = w
                })(this)
            }).call(this, typeof self != "undefined" ? self : typeof window != "undefined" ? window : {})
        }, {}],
        31: [function(e, t, n) {
            (function(e) {
                var n = /^[\],:{}\s]*$/,
                    r = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
                    i = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
                    s = /(?:^|:|,)(?:\s*\[)+/g,
                    o = /^\s+/,
                    u = /\s+$/;
                t.exports = function(a) {
                    if ("string" != typeof a || !a) return null;
                    a = a.replace(o, "").replace(u, "");
                    if (e.JSON && JSON.parse) return JSON.parse(a);
                    if (n.test(a.replace(r, "@").replace(i, "]").replace(s, ""))) return (new Function("return " + a))()
                }
            }).call(this, typeof self != "undefined" ? self : typeof window != "undefined" ? window : {})
        }, {}],
        32: [function(e, t, n) {
            n.encode = function(e) {
                var t = "";
                for (var n in e) e.hasOwnProperty(n) && (t.length && (t += "&"), t += encodeURIComponent(n) + "=" + encodeURIComponent(e[n]));
                return t
            }, n.decode = function(e) {
                var t = {},
                    n = e.split("&");
                for (var r = 0, i = n.length; r < i; r++) {
                    var s = n[r].split("=");
                    t[decodeURIComponent(s[0])] = decodeURIComponent(s[1])
                }
                return t
            }
        }, {}],
        33: [function(e, t, n) {
            var r = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
                i = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"];
            t.exports = function(t) {
                var n = t,
                    s = t.indexOf("["),
                    o = t.indexOf("]");
                s != -1 && o != -1 && (t = t.substring(0, s) + t.substring(s, o).replace(/:/g, ";") + t.substring(o, t.length));
                var u = r.exec(t || ""),
                    a = {},
                    f = 14;
                while (f--) a[i[f]] = u[f] || "";
                return s != -1 && o != -1 && (a.source = n, a.host = a.host.substring(1, a.host.length - 1).replace(/;/g, ":"), a.authority = a.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), a.ipv6uri = !0), a
            }
        }, {}],
        34: [function(e, t, n) {
            function s(e, t, n) {
                var r;
                return t ? r = new i(e, t) : r = new i(e), r
            }
            var r = function() {
                    return this
                }(),
                i = r.WebSocket || r.MozWebSocket;
            t.exports = i ? s : null, i && (s.prototype = i.prototype)
        }, {}],
        35: [function(e, t, n) {
            (function(n) {
                function i(e) {
                    function t(e) {
                        if (!e) return !1;
                        if (n.Buffer && n.Buffer.isBuffer(e) || n.ArrayBuffer && e instanceof ArrayBuffer || n.Blob && e instanceof Blob || n.File && e instanceof File) return !0;
                        if (r(e)) {
                            for (var i = 0; i < e.length; i++)
                                if (t(e[i])) return !0
                        } else if (e && "object" == typeof e) {
                            e.toJSON && (e = e.toJSON());
                            for (var s in e)
                                if (e.hasOwnProperty(s) && t(e[s])) return !0
                        }
                        return !1
                    }
                    return t(e)
                }
                var r = e("isarray");
                t.exports = i
            }).call(this, typeof self != "undefined" ? self : typeof window != "undefined" ? window : {})
        }, {
            isarray: 36
        }],
        36: [function(e, t, n) {
            t.exports = Array.isArray || function(e) {
                return Object.prototype.toString.call(e) == "[object Array]"
            }
        }, {}],
        37: [function(e, t, n) {
            var r = e("global");
            try {
                t.exports = "XMLHttpRequest" in r && "withCredentials" in new r.XMLHttpRequest
            } catch (i) {
                t.exports = !1
            }
        }, {
            global: 38
        }],
        38: [function(e, t, n) {
            t.exports = function() {
                return this
            }()
        }, {}],
        39: [function(e, t, n) {
            var r = [].indexOf;
            t.exports = function(e, t) {
                if (r) return e.indexOf(t);
                for (var n = 0; n < e.length; ++n)
                    if (e[n] === t) return n;
                return -1
            }
        }, {}],
        40: [function(e, t, n) {
            var r = Object.prototype.hasOwnProperty;
            n.keys = Object.keys || function(e) {
                var t = [];
                for (var n in e) r.call(e, n) && t.push(n);
                return t
            }, n.values = function(e) {
                var t = [];
                for (var n in e) r.call(e, n) && t.push(e[n]);
                return t
            }, n.merge = function(e, t) {
                for (var n in t) r.call(t, n) && (e[n] = t[n]);
                return e
            }, n.length = function(e) {
                return n.keys(e).length
            }, n.isEmpty = function(e) {
                return 0 == n.length(e)
            }
        }, {}],
        41: [function(e, t, n) {
            var r = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
                i = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"];
            t.exports = function(t) {
                var n = r.exec(t || ""),
                    s = {},
                    o = 14;
                while (o--) s[i[o]] = n[o] || "";
                return s
            }
        }, {}],
        42: [function(e, t, n) {
            (function(t) {
                var r = e("isarray"),
                    i = e("./is-buffer");
                n.deconstructPacket = function(e) {
                    function s(e) {
                        if (!e) return e;
                        if (i(e)) {
                            var n = {
                                _placeholder: !0,
                                num: t.length
                            };
                            return t.push(e), n
                        }
                        if (r(e)) {
                            var o = new Array(e.length);
                            for (var u = 0; u < e.length; u++) o[u] = s(e[u]);
                            return o
                        }
                        if ("object" != typeof e || e instanceof Date) return e;
                        var o = {};
                        for (var a in e) o[a] = s(e[a]);
                        return o
                    }
                    var t = [],
                        n = e.data,
                        o = e;
                    return o.data = s(n), o.attachments = t.length, {
                        packet: o,
                        buffers: t
                    }
                }, n.reconstructPacket = function(e, t) {
                    function i(e) {
                        if (e && e._placeholder) {
                            var n = t[e.num];
                            return n
                        }
                        if (r(e)) {
                            for (var s = 0; s < e.length; s++) e[s] = i(e[s]);
                            return e
                        }
                        if (e && "object" == typeof e) {
                            for (var o in e) e[o] = i(e[o]);
                            return e
                        }
                        return e
                    }
                    var n = 0;
                    return e.data = i(e.data), e.attachments = undefined, e
                }, n.removeBlobs = function(e, n) {
                    function s(e, a, f) {
                        if (!e) return e;
                        if (t.Blob && e instanceof Blob || t.File && e instanceof File) {
                            o++;
                            var l = new FileReader;
                            l.onload = function() {
                                f ? f[a] = this.result : u = this.result, --o || n(u)
                            }, l.readAsArrayBuffer(e)
                        } else if (r(e))
                            for (var c = 0; c < e.length; c++) s(e[c], c, e);
                        else if (e && "object" == typeof e && !i(e))
                            for (var h in e) s(e[h], h, e)
                    }
                    var o = 0,
                        u = e;
                    s(u), o || n(u)
                }
            }).call(this, typeof self != "undefined" ? self : typeof window != "undefined" ? window : {})
        }, {
            "./is-buffer": 44,
            isarray: 45
        }],
        43: [function(e, t, n) {
            function f() {}

            function l(e) {
                var t = "",
                    s = !1;
                t += e.type;
                if (n.BINARY_EVENT == e.type || n.BINARY_ACK == e.type) t += e.attachments, t += "-";
                return e.nsp && "/" != e.nsp && (s = !0, t += e.nsp), null != e.id && (s && (t += ",", s = !1), t += e.id), null != e.data && (s && (t += ","), t += i.stringify(e.data)), r("encoded %j as %s", e, t), t
            }

            function c(e, t) {
                function n(e) {
                    var n = u.deconstructPacket(e),
                        r = l(n.packet),
                        i = n.buffers;
                    i.unshift(r), t(i)
                }
                u.removeBlobs(e, n)
            }

            function h() {
                this.reconstructor = null
            }

            function p(e) {
                var t = {},
                    s = 0;
                t.type = Number(e.charAt(0));
                if (null == n.types[t.type]) return v();
                if (n.BINARY_EVENT == t.type || n.BINARY_ACK == t.type) {
                    t.attachments = "";
                    while (e.charAt(++s) != "-") t.attachments += e.charAt(s);
                    t.attachments = Number(t.attachments)
                }
                if ("/" == e.charAt(s + 1)) {
                    t.nsp = "";
                    while (++s) {
                        var o = e.charAt(s);
                        if ("," == o) break;
                        t.nsp += o;
                        if (s + 1 == e.length) break
                    }
                } else t.nsp = "/";
                var u = e.charAt(s + 1);
                if ("" != u && Number(u) == u) {
                    t.id = "";
                    while (++s) {
                        var o = e.charAt(s);
                        if (null == o || Number(o) != o) {
                            --s;
                            break
                        }
                        t.id += e.charAt(s);
                        if (s + 1 == e.length) break
                    }
                    t.id = Number(t.id)
                }
                if (e.charAt(++s)) try {
                    t.data = i.parse(e.substr(s))
                } catch (a) {
                    return v()
                }
                return r("decoded %s as %j", e, t), t
            }

            function d(e) {
                this.reconPack = e, this.buffers = []
            }

            function v(e) {
                return {
                    type: n.ERROR,
                    data: "parser error"
                }
            }
            var r = e("debug")("socket.io-parser"),
                i = e("json3"),
                s = e("isarray"),
                o = e("component-emitter"),
                u = e("./binary"),
                a = e("./is-buffer");
            n.protocol = 4, n.types = ["CONNECT", "DISCONNECT", "EVENT", "BINARY_EVENT", "ACK", "BINARY_ACK", "ERROR"], n.CONNECT = 0, n.DISCONNECT = 1, n.EVENT = 2, n.ACK = 3, n.ERROR = 4, n.BINARY_EVENT = 5, n.BINARY_ACK = 6, n.Encoder = f, n.Decoder = h, f.prototype.encode = function(e, t) {
                r("encoding packet %j", e);
                if (n.BINARY_EVENT == e.type || n.BINARY_ACK == e.type) c(e, t);
                else {
                    var i = l(e);
                    t([i])
                }
            }, o(h.prototype), h.prototype.add = function(e) {
                var t;
                if ("string" == typeof e) t = p(e), n.BINARY_EVENT == t.type || n.BINARY_ACK == t.type ? (this.reconstructor = new d(t), this.reconstructor.reconPack.attachments == 0 && this.emit("decoded", t)) : this.emit("decoded", t);
                else {
                    if (!a(e) && !e.base64) throw new Error("Unknown type: " + e);
                    if (!this.reconstructor) throw new Error("got binary data when not reconstructing a packet");
                    t = this.reconstructor.takeBinaryData(e), t && (this.reconstructor = null, this.emit("decoded", t))
                }
            }, h.prototype.destroy = function() {
                this.reconstructor && this.reconstructor.finishedReconstruction()
            }, d.prototype.takeBinaryData = function(e) {
                this.buffers.push(e);
                if (this.buffers.length == this.reconPack.attachments) {
                    var t = u.reconstructPacket(this.reconPack, this.buffers);
                    return this.finishedReconstruction(), t
                }
                return null
            }, d.prototype.finishedReconstruction = function() {
                this.reconPack = null, this.buffers = []
            }
        }, {
            "./binary": 42,
            "./is-buffer": 44,
            "component-emitter": 8,
            debug: 9,
            isarray: 45,
            json3: 46
        }],
        44: [function(e, t, n) {
            (function(e) {
                function n(t) {
                    return e.Buffer && e.Buffer.isBuffer(t) || e.ArrayBuffer && t instanceof ArrayBuffer
                }
                t.exports = n
            }).call(this, typeof self != "undefined" ? self : typeof window != "undefined" ? window : {})
        }, {}],
        45: [function(e, t, n) {
            t.exports = e(36)
        }, {}],
        46: [function(t, n, r) {
            (function(t) {
                function h(e) {
                    if (h[e] !== o) return h[e];
                    var t;
                    if (e == "bug-string-char-index") t = "a" [0] != "a";
                    else if (e == "json") t = h("json-stringify") && h("json-parse");
                    else {
                        var r, i = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
                        if (e == "json-stringify") {
                            var s = f.stringify,
                                u = typeof s == "function" && l;
                            if (u) {
                                (r = function() {
                                    return 1
                                }).toJSON = r;
                                try {
                                    u = s(0) === "0" && s(new Number) === "0" && s(new String) == '""' && s(n) === o && s(o) === o && s() === o && s(r) === "1" && s([r]) == "[1]" && s([o]) == "[null]" && s(null) == "null" && s([o, n, null]) == "[null,null,null]" && s({
                                        a: [r, true, false, null, "\0\b\n\f\r    "]
                                    }) == i && s(null, r) === "1" && s([1, 2], null, 1) == "[\n 1,\n 2\n]" && s(new Date(-864e13)) == '"-271821-04-20T00:00:00.000Z"' && s(new Date(864e13)) == '"+275760-09-13T00:00:00.000Z"' && s(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' && s(new Date(-1)) == '"1969-12-31T23:59:59.999Z"'
                                } catch (a) {
                                    u = !1
                                }
                            }
                            t = u
                        }
                        if (e == "json-parse") {
                            var c = f.parse;
                            if (typeof c == "function") try {
                                if (c("0") === 0 && !c(!1)) {
                                    r = c(i);
                                    var p = r["a"].length == 5 && r.a[0] === 1;
                                    if (p) {
                                        try {
                                            p = !c('"    "')
                                        } catch (a) {}
                                        if (p) try {
                                            p = c("01") !== 1
                                        } catch (a) {}
                                        if (p) try {
                                            p = c("1.") !== 1
                                        } catch (a) {}
                                    }
                                }
                            } catch (a) {
                                p = !1
                            }
                            t = p
                        }
                    }
                    return h[e] = !!t
                }
                var n = {}.toString,
                    i, s, o, u = typeof e == "function" && e.amd,
                    a = typeof JSON == "object" && JSON,
                    f = typeof r == "object" && r && !r.nodeType && r;
                f && a ? (f.stringify = a.stringify, f.parse = a.parse) : f = t.JSON = a || {};
                var l = new Date(-0xc782b5b800cec);
                try {
                    l = l.getUTCFullYear() == -109252 && l.getUTCMonth() === 0 && l.getUTCDate() === 1 && l.getUTCHours() == 10 && l.getUTCMinutes() == 37 && l.getUTCSeconds() == 6 && l.getUTCMilliseconds() == 708
                } catch (c) {}
                if (!h("json")) {
                    var p = "[object Function]",
                        d = "[object Date]",
                        v = "[object Number]",
                        m = "[object String]",
                        g = "[object Array]",
                        y = "[object Boolean]",
                        b = h("bug-string-char-index");
                    if (!l) var w = Math.floor,
                        E = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
                        S = function(e, t) {
                            return E[t] + 365 * (e - 1970) + w((e - 1969 + (t = +(t > 1))) / 4) - w((e - 1901 + t) / 100) + w((e - 1601 + t) / 400)
                        };
                    (i = {}.hasOwnProperty) || (i = function(e) {
                        var t = {},
                            r;
                        return (t.__proto__ = null, t.__proto__ = {
                            toString: 1
                        }, t).toString != n ? i = function(e) {
                            var t = this.__proto__,
                                n = e in (this.__proto__ = null, this);
                            return this.__proto__ = t, n
                        } : (r = t.constructor, i = function(e) {
                            var t = (this.constructor || r).prototype;
                            return e in this && !(e in t && this[e] === t[e])
                        }), t = null, i.call(this, e)
                    });
                    var x = {
                            "boolean": 1,
                            number: 1,
                            string: 1,
                            "undefined": 1
                        },
                        T = function(e, t) {
                            var n = typeof e[t];
                            return n == "object" ? !!e[t] : !x[n]
                        };
                    s = function(e, t) {
                        var r = 0,
                            o, u, a;
                        (o = function() {
                            this.valueOf = 0
                        }).prototype.valueOf = 0, u = new o;
                        for (a in u) i.call(u, a) && r++;
                        return o = u = null, r ? r == 2 ? s = function(e, t) {
                            var r = {},
                                s = n.call(e) == p,
                                o;
                            for (o in e)(!s || o != "prototype") && !i.call(r, o) && (r[o] = 1) && i.call(e, o) && t(o)
                        } : s = function(e, t) {
                            var r = n.call(e) == p,
                                s, o;
                            for (s in e)(!r || s != "prototype") && i.call(e, s) && !(o = s === "constructor") && t(s);
                            (o || i.call(e, s = "constructor")) && t(s)
                        } : (u = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"], s = function(e, t) {
                            var r = n.call(e) == p,
                                s, o, a = !r && typeof e.constructor != "function" && T(e, "hasOwnProperty") ? e.hasOwnProperty : i;
                            for (s in e)(!r || s != "prototype") && a.call(e, s) && t(s);
                            for (o = u.length; s = u[--o]; a.call(e, s) && t(s));
                        }), s(e, t)
                    };
                    if (!h("json-stringify")) {
                        var N = {
                                92: "\\\\",
                                34: '\\"',
                                8: "\\b",
                                12: "\\f",
                                10: "\\n",
                                13: "\\r",
                                9: "\\t"
                            },
                            C = "000000",
                            k = function(e, t) {
                                return (C + (t || 0)).slice(-e)
                            },
                            L = "\\u00",
                            A = function(e) {
                                var t = '"',
                                    n = 0,
                                    r = e.length,
                                    i = r > 10 && b,
                                    s;
                                i && (s = e.split(""));
                                for (; n < r; n++) {
                                    var o = e.charCodeAt(n);
                                    switch (o) {
                                        case 8:
                                        case 9:
                                        case 10:
                                        case 12:
                                        case 13:
                                        case 34:
                                        case 92:
                                            t += N[o];
                                            break;
                                        default:
                                            if (o < 32) {
                                                t += L + k(2, o.toString(16));
                                                break
                                            }
                                            t += i ? s[n] : b ? e.charAt(n) : e[n]
                                    }
                                }
                                return t + '"'
                            },
                            O = function(e, t, r, u, a, f, l) {
                                var c, h, p, b, E, x, T, N, C, L, M, _, D, P, H, B;
                                try {
                                    c = t[e]
                                } catch (j) {}
                                if (typeof c == "object" && c) {
                                    h = n.call(c);
                                    if (h == d && !i.call(c, "toJSON"))
                                        if (c > -1 / 0 && c < 1 / 0) {
                                            if (S) {
                                                E = w(c / 864e5);
                                                for (p = w(E / 365.2425) + 1970 - 1; S(p + 1, 0) <= E; p++);
                                                for (b = w((E - S(p, 0)) / 30.42); S(p, b + 1) <= E; b++);
                                                E = 1 + E - S(p, b), x = (c % 864e5 + 864e5) % 864e5, T = w(x / 36e5) % 24, N = w(x / 6e4) % 60, C = w(x / 1e3) % 60, L = x % 1e3
                                            } else p = c.getUTCFullYear(), b = c.getUTCMonth(), E = c.getUTCDate(), T = c.getUTCHours(), N = c.getUTCMinutes(), C = c.getUTCSeconds(), L = c.getUTCMilliseconds();
                                            c = (p <= 0 || p >= 1e4 ? (p < 0 ? "-" : "+") + k(6, p < 0 ? -p : p) : k(4, p)) + "-" + k(2, b + 1) + "-" + k(2, E) + "T" + k(2, T) + ":" + k(2, N) + ":" + k(2, C) + "." + k(3, L) + "Z"
                                        } else c = null;
                                    else typeof c.toJSON == "function" && (h != v && h != m && h != g || i.call(c, "toJSON")) && (c = c.toJSON(e))
                                }
                                r && (c = r.call(t, e, c));
                                if (c === null) return "null";
                                h = n.call(c);
                                if (h == y) return "" + c;
                                if (h == v) return c > -1 / 0 && c < 1 / 0 ? "" + c : "null";
                                if (h == m) return A("" + c);
                                if (typeof c == "object") {
                                    for (P = l.length; P--;)
                                        if (l[P] === c) throw TypeError();
                                    l.push(c), M = [], H = f, f += a;
                                    if (h == g) {
                                        for (D = 0, P = c.length; D < P; D++) _ = O(D, c, r, u, a, f, l), M.push(_ === o ? "null" : _);
                                        B = M.length ? a ? "[\n" + f + M.join(",\n" + f) + "\n" + H + "]" : "[" + M.join(",") + "]" : "[]"
                                    } else s(u || c, function(e) {
                                        var t = O(e, c, r, u, a, f, l);
                                        t !== o && M.push(A(e) + ":" + (a ? " " : "") + t)
                                    }), B = M.length ? a ? "{\n" + f + M.join(",\n" + f) + "\n" + H + "}" : "{" + M.join(",") + "}" : "{}";
                                    return l.pop(), B
                                }
                            };
                        f.stringify = function(e, t, r) {
                            var i, s, o, u;
                            if (typeof t == "function" || typeof t == "object" && t)
                                if ((u = n.call(t)) == p) s = t;
                                else if (u == g) {
                                o = {};
                                for (var a = 0, f = t.length, l; a < f; l = t[a++], (u = n.call(l), u == m || u == v) && (o[l] = 1));
                            }
                            if (r)
                                if ((u = n.call(r)) == v) {
                                    if ((r -= r % 1) > 0)
                                        for (i = "", r > 10 && (r = 10); i.length < r; i += " ");
                                } else u == m && (i = r.length <= 10 ? r : r.slice(0, 10));
                            return O("", (l = {}, l[""] = e, l), s, o, i, "", [])
                        }
                    }
                    if (!h("json-parse")) {
                        var M = String.fromCharCode,
                            _ = {
                                92: "\\",
                                34: '"',
                                47: "/",
                                98: "\b",
                                116: "    ",
                                110: "\n",
                                102: "\f",
                                114: "\r"
                            },
                            D, P, H = function() {
                                throw D = P = null, SyntaxError()
                            },
                            B = function() {
                                var e = P,
                                    t = e.length,
                                    n, r, i, s, o;
                                while (D < t) {
                                    o = e.charCodeAt(D);
                                    switch (o) {
                                        case 9:
                                        case 10:
                                        case 13:
                                        case 32:
                                            D++;
                                            break;
                                        case 123:
                                        case 125:
                                        case 91:
                                        case 93:
                                        case 58:
                                        case 44:
                                            return n = b ? e.charAt(D) : e[D], D++, n;
                                        case 34:
                                            for (n = "@", D++; D < t;) {
                                                o = e.charCodeAt(D);
                                                if (o < 32) H();
                                                else if (o == 92) {
                                                    o = e.charCodeAt(++D);
                                                    switch (o) {
                                                        case 92:
                                                        case 34:
                                                        case 47:
                                                        case 98:
                                                        case 116:
                                                        case 110:
                                                        case 102:
                                                        case 114:
                                                            n += _[o], D++;
                                                            break;
                                                        case 117:
                                                            r = ++D;
                                                            for (i = D + 4; D < i; D++) o = e.charCodeAt(D), o >= 48 && o <= 57 || o >= 97 && o <= 102 || o >= 65 && o <= 70 || H();
                                                            n += M("0x" + e.slice(r, D));
                                                            break;
                                                        default:
                                                            H()
                                                    }
                                                } else {
                                                    if (o == 34) break;
                                                    o = e.charCodeAt(D), r = D;
                                                    while (o >= 32 && o != 92 && o != 34) o = e.charCodeAt(++D);
                                                    n += e.slice(r, D)
                                                }
                                            }
                                            if (e.charCodeAt(D) == 34) return D++, n;
                                            H();
                                        default:
                                            r = D, o == 45 && (s = !0, o = e.charCodeAt(++D));
                                            if (o >= 48 && o <= 57) {
                                                o == 48 && (o = e.charCodeAt(D + 1), o >= 48 && o <= 57) && H(), s = !1;
                                                for (; D < t && (o = e.charCodeAt(D), o >= 48 && o <= 57); D++);
                                                if (e.charCodeAt(D) == 46) {
                                                    i = ++D;
                                                    for (; i < t && (o = e.charCodeAt(i), o >= 48 && o <= 57); i++);
                                                    i == D && H(), D = i
                                                }
                                                o = e.charCodeAt(D);
                                                if (o == 101 || o == 69) {
                                                    o = e.charCodeAt(++D), (o == 43 || o == 45) && D++;
                                                    for (i = D; i < t && (o = e.charCodeAt(i), o >= 48 && o <= 57); i++);
                                                    i == D && H(), D = i
                                                }
                                                return +e.slice(r, D)
                                            }
                                            s && H();
                                            if (e.slice(D, D + 4) == "true") return D += 4, !0;
                                            if (e.slice(D, D + 5) == "false") return D += 5, !1;
                                            if (e.slice(D, D + 4) == "null") return D += 4, null;
                                            H()
                                    }
                                }
                                return "$"
                            },
                            j = function(e) {
                                var t, n;
                                e == "$" && H();
                                if (typeof e == "string") {
                                    if ((b ? e.charAt(0) : e[0]) == "@") return e.slice(1);
                                    if (e == "[") {
                                        t = [];
                                        for (;; n || (n = !0)) {
                                            e = B();
                                            if (e == "]") break;
                                            n && (e == "," ? (e = B(), e == "]" && H()) : H()), e == "," && H(), t.push(j(e))
                                        }
                                        return t
                                    }
                                    if (e == "{") {
                                        t = {};
                                        for (;; n || (n = !0)) {
                                            e = B();
                                            if (e == "}") break;
                                            n && (e == "," ? (e = B(), e == "}" && H()) : H()), (e == "," || typeof e != "string" || (b ? e.charAt(0) : e[0]) != "@" || B() != ":") && H(), t[e.slice(1)] = j(B())
                                        }
                                        return t
                                    }
                                    H()
                                }
                                return e
                            },
                            F = function(e, t, n) {
                                var r = I(e, t, n);
                                r === o ? delete e[t] : e[t] = r
                            },
                            I = function(e, t, r) {
                                var i = e[t],
                                    o;
                                if (typeof i == "object" && i)
                                    if (n.call(i) == g)
                                        for (o = i.length; o--;) F(i, o, r);
                                    else s(i, function(e) {
                                        F(i, e, r)
                                    });
                                return r.call(e, t, i)
                            };
                        f.parse = function(e, t) {
                            var r, i;
                            return D = 0, P = "" + e, r = j(B()), B() != "$" && H(), D = P = null, t && n.call(t) == p ? I((i = {}, i[""] = r, i), "", t) : r
                        }
                    }
                }
                u && e(function() {
                    return f
                })
            })(this)
        }, {}],
        47: [function(e, t, n) {
            function r(e, t) {
                var n = [];
                t = t || 0;
                for (var r = t || 0; r < e.length; r++) n[r - t] = e[r];
                return n
            }
            t.exports = r
        }, {}]
    }, {}, [1])(1)
});
if (!window.console) var console = {};
(function(root, console) {
    "use strict";

    function askChannel(e) {
        e = e || "";
        var t = prompt(e + "Enter Channel to using on Console.Re/Your-Channel-Name", "Your-Channel-Name");
        if (t && t !== null && t !== "Your-Channel-Name") return t;
        askChannel("Please ")
    }

    function getCaller(e) {
        e = e || 7;
        var t = printStackTrace(),
            n = t[e],
            r;
        return n !== undefined ? (r = n.match(/^.*([\/<][^\/>]*>?):(\d*):(\d*)?$/), r === null && (r = n.match(/^.*([\/<][^\/>]*>?):(\d*)?$/))) : (r[1] = "", r[2] = "0", r[3] = "0"), {
            file: r ? r[1] : "",
            line: r ? r[2] : "0",
            col: r ? r[3] : "0"
        }
    }

    function getWindowSize() {
        var e = document.width || window.outerWidth || document.documentElement.clientWidth,
            t = document.height || window.outerHeight || document.documentElement.clientHeight;
        return "Window Size: [number]" + e + "px[/number] by [number]" + t + "px[/number]"
    }

    function getOtherTypes(t) {
        var e, o = "";
        try {
            e = eval(t), e === !0 ? o = "[booltrue]true[/booltrue]" : e === !1 ? o = "[boolfalse]false[/boolfalse]" : !isNaN(parseFloat(e)) && isFinite(e) ? o = "[number]" + e + "[/number]" : typeof e == "number" ? o = "[number][Number][/number]" : typeof e == "string" ? o = '"String"' : typeof e == "function" ? o = "[Function]" : e.nodeType ? o = "<" + e.nodeName + " Element>" : typeof e == "object" ? (o = "{Object}", isArray(e) && (o = "[Array]")) : o = "[color=red]undefined[/color]"
        } catch (err) {
            o = "[color=red]" + err + "[/color]"
        }
        return o
    }

    function getType(e) {
        var t = "";
        if (typeof e != "string") return getOtherTypes(e);
        try {
            var n = JSON.parse(e);
            typeof n == "object" ? (t = "{Object}", isArray(n) && (t = "[Array]")) : t = getOtherTypes(e)
        } catch (r) {
            t = getOtherTypes(e)
        }
        return t
    }

    function replaceWithNum(e) {
        var t = "" + e;
        return t.replace(/([0-9]+)(px|em||)/g, "[number]$1$2[/number]")
    }

    function getSize(e) {
        var t, n;
        return e ? (t = getStyle(e, "width"), n = getStyle(e, "height"), "[number]" + t + "[/number]" + " by " + "[number]" + n + "[/number]") : ""
    }

    function getStyle(e, t) {
        if (e) {
            if (e.currentStyle) return e.currentStyle[t];
            if (window.getComputedStyle) return document.defaultView.getComputedStyle(e, null).getPropertyValue(t)
        }
    }

    function stringify(e, t, n) {
        if (typeof e != "object") return e;
        var r = [],
            i = [],
            s, o, u = {},
            a = "",
            f = "",
            l, c = JSON.stringify(e, function(e, c) {
                if (!c) return c;
                if (c.nodeType) {
                    c.id && (a = c.id), c.className && (f = c.className);
                    if (t === "size") return "[tag]<" + c.nodeName + ">[/tag] " + getSize(c);
                    if (t === "css") {
                        if (isArray(n)) return n.forEach(function(e) {
                            u[e] = replaceWithNum(getStyle(c, e))
                        }), u;
                        if (n) return l = " " + n + ":" + getStyle(c, n) + ";", a && (a = " [attr]id=[/attr][string]'" + a + "'[/string]"), f && (f = " [attr]class=[/attr][string]'" + f + "'[/string]"), "[tag]<" + c.nodeName + "" + a + "" + f + ">[/tag]" + replaceWithNum(l)
                    } else u.element = c.nodeName, a && (u.id = a), f && (u["class"] = f), u.visible = VISIBILITY.isVisible(c), u.size = getSize(c), u.html = c.outerHTML;
                    return u
                }
                if (c.window && c.window == c.window.window) return "{Window Object}";
                if (typeof c == "function") return "[Function]";
                if (typeof c == "object" && c !== null) {
                    c.length && (s = Array.prototype.slice.call(c)).length === c.length && (c = s), o = r.indexOf(c);
                    if (o !== -1) return "[ Circular {" + (i[o] || "root") + "} ]";
                    r.push(c), i.push(e)
                }
                return c
            });
        return c
    }

    function handleError(e, t, n) {
        if (!t && e.indexOf("Script error") === 0 && n === 0) return;
        var r = new RegExp(window.location.origin, "g");
        t = t.replace(r, ""), console.re.error("[color=red]" + e + "[/color] in [i]" + t + "[/i] Line: [b]" + n + "[/b]")
    }
    var chost = "console.re",
        cport = location.protocol === "http:" ? "80" : "443",
        name = "toServerRe",
        channel;
    cport = document.getElementById("consolerescript").getAttribute("data-port") || cport, Array.prototype.indexOf || (Array.prototype.indexOf = function(e, t) {
        t == null ? t = 0 : t < 0 && (t = Math.max(0, this.length + t));
        for (var n = t, r = this.length; n < r; n++)
            if (this[n] === e) return n;
        return -1
    }), Array.prototype.forEach || (Array.prototype.forEach = function(e, t) {
        var n, r;
        for (n = 0, r = this.length; n < r; ++n) n in this && e.call(t, this[n], n, this)
    });
    var isArray = Array.isArray || function(e) {
        return Object.prototype.toString.call(e) === "[object Array]"
    };
    window.location.origin || (window.location.origin = window.location.protocol + "//" + window.location.host), window.consolere === undefined || window.consolere.channel === "YOUR-CHANNEL-NAME" ? channel = document.getElementById("consolerescript").getAttribute("data-channel") || "" : channel = window.consolere.channel || "", channel || (channel = askChannel()), root[name] = function() {
        function a(n, r, i, s) {
            t = s || getCaller();
            if ((!r.length || u.indexOf(n) === -1) && n !== "command") return;
            o.client && f.apply(null, arguments), o.server && l.apply(null, arguments);
            if (!e) return o.connect()
        }

        function f(e, t) {
            e = e === "trace" ? "debug" : e;
            if (console.log) {
                var n = t.toString().replace(/\[(\w+)[^w]*?](.*?)\[\/\1]/g, "$2");
                // Function.prototype.apply.call(console.log, console, ["console.re [" + e + "]"].concat(n))
            }
        }

        function l(s, o, u) {
            var a, f, l, c, h, p = "";
            u = u || "", typeof o == "object" && !o.length ? a = o : (s == "command" && (p = u), a = {
                command: p,
                channel: channel,
                browser: browser,
                level: s,
                args: o,
                caller: t
            }), u === "css" ? (h = o[o.length - 1], isArray(h) || "string" == typeof h ? o.pop() : u = "") : u === "count" ? (f = o.toString(), isNaN(r[f]) ? r[f] = 1 : r[f]++, o.push(r[f])) : u === "time" ? (l = o.toString(), i[l] = (new Date).getTime(), o.push("[white]started[/white]")) : u === "timeEnd" && (l = o.toString(), c = (new Date).getTime() - i[l], isNaN(c) ? o.push("[white]not started[/white]") : o.push("[white]ends[/white] in [number]" + c + "[/number] ms"));
            for (var d = 0; d < o.length; d++) o[d] = stringify(o[d], u, h);
            e ? (n.length && v(n), e.emit(name, a)) : n.push([s, a])
        }

        function p(e) {
            return function() {
                return o._dispatch(e, [].slice.call(arguments)), this
            }
        }

        function d() {
            e && e.emit("channel", channel), v(n)
        }

        function v(e) {
            var t = null;
            while (t = e.shift()) l.apply(null, t)
        }
        var e, t = [],
            n = [],
            r = [],
            i = [],
            s = !1,
            o = {
                client: !0,
                server: !0,
                loaded: !1
            },
            u = ["trace", "debug", "info", "log", "warn", "error", "size", "test", "assert", "count", "css", "media", "time", "time", "command"];
        for (var c = 0, h; c < u.length; c++) h = u[c], o[h] = p(h);
        return o.connect = function(t) {
            if (root.io) {
                chost == "console.re" && (cport = "443");
                if (cport == "443" || cport == "https") chost = "https://" + chost;
                e = root.io.connect(chost + (typeof cport != "undefined" ? ":" + cport : "")), e.on("connect", d)
            } else t || o.connect(!0)
        }, o.size = function(e) {
            return !e || typeof e == "undefined" || e == "window" ? o._dispatch("size", [getWindowSize()]) : o._dispatch("size", [].slice.call(arguments), "size"), this
        }, o.count = function() {
            return o._dispatch("count", [].slice.call(arguments), "count"), this
        }, o.time = function() {
            return o._dispatch("time", [].slice.call(arguments), "time"), this
        }, o.timeEnd = function() {
            return o._dispatch("time", [].slice.call(arguments), "timeEnd"), this
        }, o.trace = function() {
            var e = printStackTrace(),
                t = [],
                n = [].slice.call(arguments);
            for (c = 0; e.length > c; c++) /console.re.js/gi.test(e[c]) || t.push(e[c]);
            return o._dispatch("trace", [n.toString(), t]), this
        }, o.css = function() {
            return o._dispatch("css", [].slice.call(arguments), "css"), this
        }, o.test = function() {
            var e = [].slice.call(arguments),
                t = "",
                n = [];
            return e.forEach(function(e) {
                t = getType(e), /|[Function]|{Object}|[Array]|Element|/gi.test(t) && (t = "[color=#BBB519]" + t + "[/color]"), n.push("[color=#BC9044]" + e + "[/color]" + "[color=gray] is [/color]" + t)
            }), o._dispatch("test", n), this
        }, o.assert = function() {
            var e = [].slice.call(arguments),
                t = [];
            return e.forEach(function(n, r) {
                typeof n != "string" && (n || (typeof e[r + 1] == "string" ? t.push("[color=red]" + e[r + 1] + "[/color]") : t.push("[color=red]Assertion Failure[/color]")))
            }), t.length && o._dispatch("assert", t), this
        }, o._dispatch = function(e, t, n, r) {
            a(e, t, n, r)
        }, o.media = function(e, t) {
            function p(e) {
                window.matchMedia && (clearTimeout(h), h = setTimeout(function() {
                    o.media("w", e)
                }, 500))
            }

            function d(e) {
                for (var t = n.length - 1; t >= 0; t--)
                    if (n[t].media === e) return !0;
                return !1
            }

            function v() {
                var e = m(),
                    t;
                if (a)
                    for (t = e.length - 1; t >= 0; t--) d(e[t]) || n.push(window.matchMedia(e[t]));
                if (u) {
                    var r = document.getElementsByTagName("link");
                    for (t = r.length - 1; t >= 0; t--) r[t].media && n.push(window.matchMedia(r[t].media))
                }
            }

            function m() {
                var e = document.styleSheets,
                    t, n, r, i = [];
                for (n = e.length - 1; n >= 0; n--) try {
                    t = e[n].cssRules;
                    if (t)
                        for (r = 0; r < t.length; r++) t[r].type == CSSRule.MEDIA_RULE && i.push(t[r].media.mediaText)
                } catch (s) {}
                return i
            }

            function g() {
                var e = [];
                for (var t in n) n[t].matches && e.push(replaceWithNum(n[t].media));
                return e
            }
            var n = [],
                r = [],
                i = [],
                u = !1,
                a = !0,
                f = "landscape",
                l = window.orientation || 0,
                c;
            if (e === "type") u = !0, a = !1;
            else if (e === "all-types" || e === "all") a = u = !0;
            if (e === "watch") {
                var h;
                c = getCaller(5), window.addEventListener && (window.addEventListener("resize", function() {
                    p(c)
                }, !1), window.addEventListener("orientationchange", function() {
                    l !== window.orientation && (s = !0), p(c)
                }, !1))
            }
            return v(), i = g(), i.length ? i.length == 1 ? r.push(g()[0]) : r.push(g()) : r.push("[yellow]No Media Query Rules[/yellow]"), e === "w" ? (r.push(getWindowSize()), s && (Math.abs(window.orientation) !== 90 && (f = "portrait"), r.push("Orientation: [yellow]" + f + "[/yellow]")), o._dispatch("media", r, "", t)) : o._dispatch("media", r), this
        }, o.clear = function() {
            return o._dispatch("command", "", "clear"), this
        }, o
    }(), console.re = root[name];
    var BrowserDetect = {
            searchString: function(e) {
                for (var t = 0; t < e.length; t++) {
                    var n = e[t].str,
                        r = e[t].prop;
                    this.versionSearchString = e[t].vsearch || e[t].name;
                    if (n) {
                        if (n.indexOf(e[t].substr) != -1) return e[t].name
                    } else if (r) return e[t].name
                }
            },
            searchVersion: function(e) {
                var t = e.indexOf(this.versionSearchString);
                if (t == -1) return;
                return parseFloat(e.substr(t + this.versionSearchString.length + 1))
            },
            dataBrowser: [{
                str: navigator.userAgent,
                substr: "OPR",
                vsearch: "OPR",
                name: {
                    f: "Opera",
                    s: "OP"
                }
            }, {
                str: navigator.userAgent,
                substr: "Chrome",
                vsearch: "Chrome",
                name: {
                    f: "Chrome",
                    s: "CR"
                }
            }, {
                str: navigator.userAgent,
                substr: "OmniWeb",
                vsearch: "OmniWeb",
                name: {
                    f: "OmniWeb",
                    s: "OW"
                }
            }, {
                str: navigator.vendor,
                substr: "Apple",
                name: {
                    f: "Safari",
                    s: "SF"
                },
                vsearch: "Version"
            }, {
                prop: window.opera,
                name: {
                    f: "Opera",
                    s: "OP"
                },
                vsearch: "Version"
            }, {
                str: navigator.vendor,
                substr: "iCab",
                name: {
                    f: "iCab",
                    s: "iC"
                }
            }, {
                str: navigator.vendor,
                substr: "KDE",
                name: {
                    f: "Konqueror",
                    s: "KDE"
                }
            }, {
                str: navigator.userAgent,
                substr: "Firefox",
                name: {
                    f: "Firefox",
                    s: "FF"
                },
                vsearch: "Firefox"
            }, {
                str: navigator.vendor,
                substr: "Camino",
                name: {
                    f: "Camino",
                    s: "CM"
                }
            }, {
                str: navigator.userAgent,
                substr: "Netscape",
                name: {
                    f: "Netscape",
                    s: "NS"
                }
            }, {
                str: navigator.userAgent,
                substr: "MSIE",
                name: {
                    f: "Explorer",
                    s: "IE"
                },
                vsearch: "MSIE"
            }, {
                str: navigator.userAgent,
                substr: "Trident",
                name: {
                    f: "Explorer",
                    s: "IE"
                },
                vsearch: "rv"
            }, {
                str: navigator.userAgent,
                substr: "Mozilla",
                name: {
                    f: "Netscape",
                    s: "NS"
                },
                vsearch: "Mozilla"
            }],
            dataOS: [{
                str: navigator.platform,
                substr: "Win",
                name: "Win"
            }, {
                str: navigator.platform,
                substr: "Mac",
                name: "Mac"
            }, {
                str: navigator.userAgent,
                substr: "iPhone",
                name: "iOS"
            }, {
                str: navigator.userAgent,
                substr: "iPad",
                name: "iOS"
            }, {
                str: navigator.userAgent,
                substr: "Android",
                name: "Android"
            }, {
                str: navigator.platform,
                substr: "Linux",
                name: "Linux"
            }],
            init: function() {
                return {
                    browser: this.searchString(this.dataBrowser) || "An unknown browser",
                    version: this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "",
                    OS: this.searchString(this.dataOS) || "an unknown OS"
                }
            }
        },
        browser = BrowserDetect.init();
    window.onerror = handleError, window.ConsoleRe = !0
})(this, console), window.matchMedia || (window.matchMedia = function() {
    "use strict";
    var e = window.styleMedia || window.media;
    if (!e) {
        var t = document.createElement("style"),
            n = document.getElementsByTagName("script")[0],
            r = null;
        t.type = "text/css", t.id = "matchmediajs-test", n.parentNode.insertBefore(t, n), r = "getComputedStyle" in window && window.getComputedStyle(t, null) || t.currentStyle, e = {
            matchMedium: function(e) {
                var n = "@media " + e + "{ #matchmediajs-test { width: 1px; } }";
                return t.styleSheet ? t.styleSheet.cssText = n : t.textContent = n, r.width === "1px"
            }
        }
    }
    return function(t) {
        return {
            matches: e.matchMedium(t || "all"),
            media: t || "all"
        }
    }
}());
var VISIBILITY = function() {
    function e(r, i, s, o, u, a, f) {
        var l = r.parentNode,
            c = 2;
        if (!n(r)) return !1;
        if (9 === l.nodeType) return !0;
        if ("0" === t(r, "opacity") || "none" === t(r, "display") || "hidden" === t(r, "visibility")) return !1;
        if ("undefined" == typeof i || "undefined" == typeof s || "undefined" == typeof o || "undefined" == typeof u || "undefined" == typeof a || "undefined" == typeof f) i = r.offsetTop, u = r.offsetLeft, o = i + r.offsetHeight, s = u + r.offsetWidth, a = r.offsetWidth, f = r.offsetHeight;
        if (l) {
            if ("hidden" === t(l, "overflow") || "scroll" === t(l, "overflow"))
                if (u + c > l.offsetWidth + l.scrollLeft || u + a - c < l.scrollLeft || i + c > l.offsetHeight + l.scrollTop || i + f - c < l.scrollTop) return !1;
            return r.offsetParent === l && (u += l.offsetLeft, i += l.offsetTop), e(l, i, s, o, u, a, f)
        }
        return !0
    }

    function t(e, t) {
        if (window.getComputedStyle) return document.defaultView.getComputedStyle(e, null)[t];
        if (e.currentStyle) return e.currentStyle[t]
    }

    function n(e) {
        while (e = e.parentNode)
            if (e == document) return !0;
        return !1
    }
    return {
        getStyle: t,
        isVisible: e
    }
}();
(function(e, t) {
    e.printStackTrace = t()
})(this, function() {
    function e(t) {
        t = t || {
            guess: !0
        };
        var n = t.e || null,
            r = !!t.guess,
            i = new e.implementation,
            s = i.run(n);
        return r ? i.guessAnonymousFunctions(s) : s
    }
    return e.implementation = function() {}, e.implementation.prototype = {
        run: function(e, t) {
            return e = e || this.createException(), t = t || this.mode(e), t === "other" ? this.other(arguments.callee) : this[t](e)
        },
        createException: function() {
            try {
                this.undef()
            } catch (e) {
                return e
            }
        },
        mode: function(e) {
            return e.arguments && e.stack ? "chrome" : e.stack && e.sourceURL ? "safari" : e.stack && e.number ? "ie" : e.stack && e.fileName ? "firefox" : e.message && e["opera#sourceloc"] ? e.stacktrace ? e.message.indexOf("\n") > -1 && e.message.split("\n").length > e.stacktrace.split("\n").length ? "opera9" : "opera10a" : "opera9" : e.message && e.stack && e.stacktrace ? e.stacktrace.indexOf("called from line") < 0 ? "opera10b" : "opera11" : e.stack && !e.fileName ? "chrome" : "other"
        },
        instrumentFunction: function(t, n, r) {
            t = t || window;
            var i = t[n];
            t[n] = function() {
                return r.call(this, e().slice(4)), t[n]._instrumented.apply(this, arguments)
            }, t[n]._instrumented = i
        },
        deinstrumentFunction: function(e, t) {
            e[t].constructor === Function && e[t]._instrumented && e[t]._instrumented.constructor === Function && (e[t] = e[t]._instrumented)
        },
        chrome: function(e) {
            return (e.stack + "\n").replace(/^\s+(at eval )?at\s+/gm, "").replace(/^([^\(]+?)([\n$])/gm, "{anonymous}() ($1)$2").replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, "{anonymous}() ($1)").replace(/^(.+) \((.+)\)$/gm, "$1@$2").split("\n").slice(1, -1)
        },
        safari: function(e) {
            return e.stack.replace(/\[native code\]\n/m, "").replace(/^(?=\w+Error\:).*$\n/m, "").replace(/^@/gm, "{anonymous}()@").split("\n")
        },
        ie: function(e) {
            return e.stack.replace(/^\s*at\s+(.*)$/gm, "$1").replace(/^Anonymous function\s+/gm, "{anonymous}() ").replace(/^(.+)\s+\((.+)\)$/gm, "$1@$2").split("\n").slice(1)
        },
        firefox: function(e) {
            return e.stack.replace(/(?:\n@:0)?\s+$/m, "").replace(/^(?:\((\S*)\))?@/gm, "{anonymous}($1)@").split("\n")
        },
        opera11: function(e) {
            var t = "{anonymous}",
                n = /^.*line (\d+), column (\d+)(?: in (.+))? in (\S+):$/,
                r = e.stacktrace.split("\n"),
                i = [];
            for (var s = 0, o = r.length; s < o; s += 2) {
                var u = n.exec(r[s]);
                if (u) {
                    var a = u[4] + ":" + u[1] + ":" + u[2],
                        f = u[3] || "global code";
                    f = f.replace(/<anonymous function: (\S+)>/, "$1").replace(/<anonymous function>/, t), i.push(f + "@" + a + " -- " + r[s + 1].replace(/^\s+/, ""))
                }
            }
            return i
        },
        opera10b: function(e) {
            var t = /^(.*)@(.+):(\d+)$/,
                n = e.stacktrace.split("\n"),
                r = [];
            for (var i = 0, s = n.length; i < s; i++) {
                var o = t.exec(n[i]);
                if (o) {
                    var u = o[1] ? o[1] + "()" : "global code";
                    r.push(u + "@" + o[2] + ":" + o[3])
                }
            }
            return r
        },
        opera10a: function(e) {
            var t = "{anonymous}",
                n = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i,
                r = e.stacktrace.split("\n"),
                i = [];
            for (var s = 0, o = r.length; s < o; s += 2) {
                var u = n.exec(r[s]);
                if (u) {
                    var a = u[3] || t;
                    i.push(a + "()@" + u[2] + ":" + u[1] + " -- " + r[s + 1].replace(/^\s+/, ""))
                }
            }
            return i
        },
        opera9: function(e) {
            var t = "{anonymous}",
                n = /Line (\d+).*script (?:in )?(\S+)/i,
                r = e.message.split("\n"),
                i = [];
            for (var s = 2, o = r.length; s < o; s += 2) {
                var u = n.exec(r[s]);
                u && i.push(t + "()@" + u[2] + ":" + u[1] + " -- " + r[s + 1].replace(/^\s+/, ""))
            }
            return i
        },
        other: function(e) {
            var t = "{anonymous}",
                n = /function\s*([\w\-$]+)?\s*\(/i,
                r = [],
                i, s, o = 10;
            try {
                while (e && e.arguments && r.length < o) i = n.test(e.toString()) ? RegExp.$1 || t : t, s = Array.prototype.slice.call(e.arguments || []), r[r.length] = i + "(" + this.stringifyArguments(s) + ")", e = e.caller;
                return r
            } catch (e) {
                return ""
            }
        },
        stringifyArguments: function(e) {
            var t = [],
                n = Array.prototype.slice;
            for (var r = 0; r < e.length; ++r) {
                var i = e[r];
                i === undefined ? t[r] = "undefined" : i === null ? t[r] = "null" : i.constructor && (i.constructor === Array ? i.length < 3 ? t[r] = "[" + this.stringifyArguments(i) + "]" : t[r] = "[" + this.stringifyArguments(n.call(i, 0, 1)) + "..." + this.stringifyArguments(n.call(i, -1)) + "]" : i.constructor === Object ? t[r] = "#object" : i.constructor === Function ? t[r] = "#function" : i.constructor === String ? t[r] = '"' + i + '"' : i.constructor === Number && (t[r] = i))
            }
            return t.join(",")
        },
        sourceCache: {},
        ajax: function(e) {
            var t = this.createXMLHTTPObject();
            if (t) try {
                return t.open("GET", e, !1), t.send(null), t.responseText
            } catch (n) {}
            return ""
        },
        createXMLHTTPObject: function() {
            var e, t = [function() {
                return new XMLHttpRequest
            }, function() {
                return new ActiveXObject("Msxml2.XMLHTTP")
            }, function() {
                return new ActiveXObject("Msxml3.XMLHTTP")
            }, function() {
                return new ActiveXObject("Microsoft.XMLHTTP")
            }];
            for (var n = 0; n < t.length; n++) try {
                return e = t[n](), this.createXMLHTTPObject = t[n], e
            } catch (r) {}
        },
        isSameDomain: function(e) {
            return typeof location != "undefined" && e.indexOf(location.hostname) !== -1
        },
        getSource: function(e) {
            return e in this.sourceCache || (this.sourceCache[e] = this.ajax(e).split("\n")), this.sourceCache[e]
        },
        guessAnonymousFunctions: function(e) {
            for (var t = 0; t < e.length; ++t) {
                var n = /\{anonymous\}\(.*\)@(.*)/,
                    r = /^(.*?)(?::(\d+))(?::(\d+))?(?: -- .+)?$/,
                    i = e[t],
                    s = n.exec(i);
                if (s) {
                    var o = r.exec(s[1]);
                    if (o) {
                        var u = o[1],
                            a = o[2],
                            f = o[3] || 0;
                        if (u && this.isSameDomain(u) && a) {
                            var l = this.guessAnonymousFunction(u, a, f);
                            e[t] = i.replace("{anonymous}", l)
                        }
                    }
                }
            }
            return e
        },
        guessAnonymousFunction: function(e, t, n) {
            var r;
            try {
                r = this.findFunctionName(this.getSource(e), t)
            } catch (i) {
                r = "getSource failed with url: " + e + ", exception: " + i.toString()
            }
            return r
        },
        findFunctionName: function(e, t) {
            var n = /function\s+([^(]*?)\s*\(([^)]*)\)/,
                r = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/,
                i = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/,
                s = "",
                o, u = Math.min(t, 20),
                a, f;
            for (var l = 0; l < u; ++l) {
                o = e[t - l - 1], f = o.indexOf("//"), f >= 0 && (o = o.substr(0, f));
                if (o) {
                    s = o + s, a = r.exec(s);
                    if (a && a[1]) return a[1];
                    a = n.exec(s);
                    if (a && a[1]) return a[1];
                    a = i.exec(s);
                    if (a && a[1]) return a[1]
                }
            }
            return "(?)"
        }
    }, e
})