'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var eventemitter3 = require('eventemitter3');
var WebSocket = _interopDefault(require('isomorphic-ws'));

var AuthResponse = function AuthResponse() {};

var AuthRequest = function AuthRequest() {
  this.getTypeName = function () {
    return "rpc.authenticate";
  };

  this.createResponse = function () {
    return new AuthResponse();
  };

  this.Parameters = {};
};
AuthRequest.userNameKey = "UserName";
AuthRequest.passwordKey = "Password";

var EventFilter =
/*#__PURE__*/
function () {
  function EventFilter() {}

  EventFilter.matches = function matches(eventFilter, eventArgs) {
    // empty filter matches anything
    if (eventFilter === null || eventFilter === undefined || Object.keys(eventFilter).length === 0) {
      return true;
    } // empty event arguments doesn't match any filter except for empty filter


    if (eventArgs === null || eventArgs === undefined) {
      return false;
    } // match individual properties based on their types


    for (var key in eventFilter) {
      // check eventFilter's own properties
      if (Object.prototype.hasOwnProperty.call(eventFilter, key)) {
        var filterValue = eventFilter[key] || "";
        var propertyValue = eventArgs[key];

        if (!this.valueMatches(filterValue, propertyValue)) {
          return false;
        }
      }
    }

    return true;
  };

  EventFilter.valueMatches = function valueMatches(filterValue, propertyValue) {
    // property not found
    if (propertyValue === undefined) {
      return false;
    } // empty filter matches anything


    if ((filterValue || "") === "") {
      return true;
    } // match based on the property value type


    if (filterValue === (propertyValue || "").toString()) {
      return true;
    } else if (typeof propertyValue === "string") {
      return this.stringMatches(filterValue, propertyValue);
    } else if (typeof propertyValue === "number") {
      return this.numberMatches(filterValue, propertyValue);
    } else if (typeof propertyValue === "boolean") {
      return this.boolMatches(filterValue, propertyValue);
    }

    return false;
  };

  EventFilter.stringMatches = function stringMatches(filterValue, propertyValue) {
    // avoid null and undefined
    filterValue = (filterValue || "").toLowerCase();
    propertyValue = (propertyValue || "").toLowerCase();
    return propertyValue.indexOf(filterValue) >= 0;
  };

  EventFilter.numberMatches = function numberMatches(filterValue, propertyValue) {
    // avoid null and undefined
    filterValue = filterValue || "";

    if (filterValue === "") {
      return true;
    }

    var value = propertyValue || "";
    var parts = filterValue.toLowerCase().split(",");
    return parts.findIndex(function (v) {
      return v === value.toString();
    }) >= 0;
  };

  EventFilter.boolMatches = function boolMatches(filterValue, propertyValue) {
    // avoid null and undefined
    filterValue = filterValue || "";

    if (filterValue === "") {
      return true;
    }

    var value = (propertyValue || false).toString().toLowerCase().trim();
    return filterValue.toLowerCase().trim() === value;
  };

  return EventFilter;
}();

var SubscriptionMessage = function SubscriptionMessage() {
  this.getTypeName = function () {
    return SubscriptionMessage.messageName;
  };
};
SubscriptionMessage.messageName = "rpc.subscription";

var ClientSubscription = function ClientSubscription() {
  var _this = this;

  this.invoke = function (eventArgs) {
    // TODO: handle 'this' context?
    // apply eventFilter locally (we might get events matching other local subscriber's event filter)
    if (EventFilter.matches(_this.eventFilter, eventArgs)) {
      _this.eventHandler(eventArgs);
    }
  };

  this.createSubscriptionMessage = function () {
    var msg = new SubscriptionMessage();
    msg.Subscriptions = [{
      Enabled: true,
      EventName: _this.eventName,
      EventFilter: _this.eventFilter,
      SubscriptionId: _this.subscriptionId
    }];
    return msg;
  };

  this.createUnsubscriptionMessage = function () {
    var msg = _this.createSubscriptionMessage();

    delete msg.Subscriptions[0].EventFilter;
    msg.Subscriptions[0].Enabled = false;
    return msg;
  };
};

var ClientSubscriptionManager = function ClientSubscriptionManager() {
  var _this = this;

  this.emitter = new eventemitter3.EventEmitter();
  this.subscriptions = {};

  this.add = function (subscription) {
    _this.subscriptions[subscription.subscriptionId] = subscription;

    _this.emitter.on(subscription.eventName, subscription.invoke, subscription);

    return function () {
      delete _this.subscriptions[subscription.subscriptionId];

      _this.emitter.off(subscription.eventName, subscription.invoke, subscription);
    };
  };

  this.broadcast = function (eventName, eventArgs) {
    _this.emitter.emit(eventName, eventArgs);
  };
};

var CredentialsBase =
/*#__PURE__*/
function () {
  function CredentialsBase(credentials) {
    this.parameters = {}; // initialize parameters if specified

    if (credentials) {
      this.parameters[AuthRequest.userNameKey] = credentials.userName;
      this.parameters[AuthRequest.passwordKey] = credentials.password;
    }
  }

  var _proto = CredentialsBase.prototype;

  _proto.authenticate = function authenticate(client) {
    try {
      var _this2 = this;

      var msg = new AuthRequest();
      msg.Parameters = _this2.parameters;
      return Promise.resolve(client.call(msg)).then(function (response) {
        return response.SessionId;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  return CredentialsBase;
}();

// A type of promise-like that resolves synchronously and supports only one observer
var _iteratorSymbol =
/*#__PURE__*/
typeof Symbol !== "undefined" ? Symbol.iterator || (Symbol.iterator =
/*#__PURE__*/
Symbol("Symbol.iterator")) : "@@iterator"; // Asynchronously iterate through an object's values
var _asyncIteratorSymbol =
/*#__PURE__*/
typeof Symbol !== "undefined" ? Symbol.asyncIterator || (Symbol.asyncIterator =
/*#__PURE__*/
Symbol("Symbol.asyncIterator")) : "@@asyncIterator"; // Asynchronously iterate on a value using it's async iterator if present, or its synchronous iterator if missing

function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
} // Asynchronously await a promise and pass the result to a finally continuation

var LogoutMessage =
/*#__PURE__*/
function () {
  function LogoutMessage() {}

  var _proto = LogoutMessage.prototype;

  _proto.getTypeName = function getTypeName() {
    return "rpc.logout";
  };

  return LogoutMessage;
}();

var PendingMessage = function PendingMessage(id, promise) {
  this.id = id;
  this.promise = promise;
};

var RequestMessage = function RequestMessage(method, params, id) {
  this.jsonrpc = "2.0";
  this.method = method;
  this.params = params;
  this.id = id;
};

var JsonClient =
/*#__PURE__*/
function () {
  function JsonClient(url, options) {
    if (options === void 0) {
      options = {
        reconnect: true,
        reconnectInterval: 5000,
        maxReconnects: 10
      };
    }

    this.url = url;
    this.options = options;
    this.connected = false;
    this.reconnects = 0;
    this.pendingMessages = {};

    this.traceMessage = function (_) {// do nothing by default
    };

    this.errorFilter = function (_) {// do nothing by default
    }; // outgoing message ids


    this.lastMessageId = 0;
    this.subscriptionManager = new ClientSubscriptionManager();
    this.credentials = options.credentials; // make sure that this argument stays

    this.call = this.call.bind(this);
    this.notify = this.notify.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.generateMessageId = this.generateMessageId.bind(this);
    this.nameOf = this.nameOf.bind(this);
  }

  var _proto = JsonClient.prototype;

  _proto.disconnect = function disconnect() {
    try {
      var _this2 = this;

      var _temp2 = function () {
        if (_this2.webSocket && _this2.connected) {
          return Promise.resolve(_this2.notify(new LogoutMessage())).then(function () {
            _this2.webSocket.close();

            _this2.connected = false;
            delete _this2.webSocket;
            delete _this2.connectPromise;
          });
        }
      }();

      return Promise.resolve(_temp2 && _temp2.then ? _temp2.then(function () {}) : void 0);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.rejectPendingMessages = function rejectPendingMessages(closeEvent) {
    var message = "Connection was closed.";

    if (closeEvent.code !== 1000) {
      message = "Connection was aborted. Error code: " + closeEvent.code;
    }

    var error = new Error(message);
    Object.defineProperty(error, "code", {
      value: -32003
    });

    for (var messageId in this.pendingMessages) {
      if (Object.prototype.hasOwnProperty.call(this.pendingMessages, messageId)) {
        var pending = this.pendingMessages[messageId];

        if (pending) {
          // clear pending message
          delete this.pendingMessages[messageId]; // reject the promise

          this.errorFilter(error);
          pending.reject(error);
        }
      }
    }
  };

  _proto.connect = function connect(credentials) {
    var _this3 = this;

    // you only connect once
    if (this.connectPromise) {
      return this.connectPromise;
    } // make sure to have some credentials


    var creds = credentials || this.credentials || new CredentialsBase();
    return this.connectPromise = new Promise(function (resolve, reject) {
      // check if already connected
      if (_this3.webSocket) {
        resolve(_this3.sessionId);
        return;
      }

      _this3.webSocket = new WebSocket(_this3.url);

      _this3.webSocket.onerror = function (error) {
        _this3.connected = false;
        delete _this3.webSocket;
        delete _this3.connectPromise;
        var message = "Couldn't connect to " + _this3.url;

        if (error.message) {
          message = message + ": " + error.message;
        }

        var e = new Error(message);

        _this3.errorFilter(e);

        reject(e);
      };

      _this3.webSocket.onopen = function () {
        try {
          // this is crucial for the subsequent authenticate call
          _this3.connected = true;

          var _temp4 = _catch(function () {
            // authenticate
            return Promise.resolve(creds.authenticate(_this3)).then(function (_creds$authenticate) {
              _this3.sessionId = _creds$authenticate;
              // great, now we're connected
              _this3.reconnects = 0;
              resolve(_this3.sessionId);
            });
          }, function (e) {
            // report failure
            _this3.connected = false;

            _this3.errorFilter(e);

            reject(e);
            delete _this3.webSocket;
            delete _this3.connectPromise;
          });

          return Promise.resolve(_temp4 && _temp4.then ? _temp4.then(function () {}) : void 0);
        } catch (e) {
          return Promise.reject(e);
        }
      };

      _this3.webSocket.onclose = function (closeEvent) {
        _this3.connected = false;

        _this3.rejectPendingMessages(closeEvent);

        delete _this3.webSocket;
        delete _this3.connectPromise;

        if (closeEvent.code === 1000) {
          resolve(_this3.sessionId);
          return; // closed normally, don't reconnect
        }

        _this3.reconnects++;

        if (_this3.options.reconnect && (_this3.options.maxReconnects < _this3.reconnects || _this3.options.maxReconnects === 0)) {
          setTimeout(function () {
            return _this3.connect();
          }, _this3.options.reconnectInterval);
        }

        resolve(_this3.sessionId);
      };

      _this3.webSocket.onmessage = function (message) {
        // trace incoming message
        _this3.traceMessage({
          isOutcoming: false,
          data: message.data.toString()
        }); // if message is binary data, convert it to string


        var json = typeof message.data === "string" ? message.data : "";

        if (message.data instanceof ArrayBuffer) {
          json = Buffer.from(message.data).toString();
        } // parse message and get its data


        var parsedMessage;

        try {
          parsedMessage = JSON.parse(json);
        } catch (e) {
          // TODO: decide how to handle parse errors
          _this3.errorFilter(e);

          _this3.errorFilter(new Error("Error parsing JSON: " + json));

          return;
        } // check if it's a reply


        if (parsedMessage.id) {
          var pending = _this3.pendingMessages[parsedMessage.id];

          if (pending) {
            // clear pending message
            delete _this3.pendingMessages[parsedMessage.id]; // resolve or reject the promise depending on the parsed message data

            if (parsedMessage.error) {
              _this3.errorFilter(parsedMessage.error);

              pending.reject(parsedMessage.error);
              return;
            } else {
              pending.resolve(parsedMessage.result);
            }
          } // TODO: decide how to handle unknown responses from server


          return;
        } // it's a notification, fire an event


        _this3.subscriptionManager.broadcast(parsedMessage.method, parsedMessage.params);
      };
    });
  };

  _proto.call = function call(message) {
    try {
      var _temp7 = function _temp7() {
        return Promise.resolve(_this5.callCore(message));
      };

      var _this5 = this;

      var _temp8 = function () {
        if (!_this5.connected) {
          return Promise.resolve(_this5.connect()).then(function () {});
        }
      }();

      return Promise.resolve(_temp8 && _temp8.then ? _temp8.then(_temp7) : _temp7(_temp8));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.callCore = function callCore(message) {
    var _this6 = this;

    var name = this.nameOf(message);
    var messageId = this.generateMessageId();
    var msg = new RequestMessage(name, message, messageId);
    var serialized = JSON.stringify(msg); // prepare pending message

    var pendingMessage = new PendingMessage(messageId);
    this.pendingMessages[messageId] = pendingMessage; // return a promise awaiting the results of the call

    return pendingMessage.promise = new Promise(function (resolve, reject) {
      // store resolve/reject callbacks for later use
      pendingMessage.resolve = resolve;
      pendingMessage.reject = reject; // fail early if not connected

      if (_this6.webSocket === undefined || !_this6.connected) {
        delete _this6.pendingMessages[messageId];
        var e = new Error("WebSocket not connected");

        _this6.errorFilter(e);

        reject(e);
        return;
      } // trace outcoming message


      _this6.traceMessage({
        isOutcoming: true,
        data: serialized
      }); // send it


      _this6.webSocket.send(serialized);
    });
  } // one-way calls
  ;

  _proto.notify = function notify(message) {
    try {
      var _temp11 = function _temp11() {
        var name = _this8.nameOf(message);

        var msg = new RequestMessage(name, message);
        var serialized = JSON.stringify(msg); // fail if not connected

        if (_this8.webSocket === undefined || !_this8.connected) {
          var e = new Error("WebSocket not connected");

          _this8.errorFilter(e);

          throw e;
        } // trace outcoming message


        _this8.traceMessage({
          isOutcoming: true,
          data: serialized
        }); // send it


        _this8.webSocket.send(serialized);
      };

      var _this8 = this;

      var _temp12 = function () {
        if (!_this8.connected) {
          return Promise.resolve(_this8.connect()).then(function () {});
        }
      }();

      return Promise.resolve(_temp12 && _temp12.then ? _temp12.then(_temp11) : _temp11(_temp12));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.generateMessageId = function generateMessageId() {
    return ++this.lastMessageId + "";
  } // stolen from the ServiceStack client
  ;

  _proto.nameOf = function nameOf(o) {
    if (!o) {
      return "null";
    }

    if (typeof o.getTypeName === "function") {
      return o.getTypeName();
    }

    var ctor = o && o.constructor;

    if (ctor === null) {
      var e = new Error(o + " doesn't have constructor");
      this.errorFilter(e);
      throw e;
    }

    if (ctor.name) {
      return ctor.name;
    }

    var str = ctor.toString();
    return str.substring(9, str.indexOf("(")); // "function ".length == 9
  } // returns unsubscription function
  ;

  _proto.subscribe = function subscribe(event) {
    try {
      var _temp15 = function _temp15() {
        var cs = new ClientSubscription();
        cs.subscriptionId = _this10.generateMessageId();
        cs.eventName = event.eventName;
        cs.eventHandler = event.eventHandler;
        cs.eventFilter = event.eventFilter; // notify the server about the new subscription

        var subMessage = cs.createSubscriptionMessage();
        return Promise.resolve(_this10.call(subMessage)).then(function () {
          // return async unsubscription
          var unsubscribe = _this10.subscriptionManager.add(cs);

          var unsubMessage = cs.createUnsubscriptionMessage();
          return function () {
            try {
              unsubscribe();
              return Promise.resolve(_this10.call(unsubMessage)).then(function () {});
            } catch (e) {
              return Promise.reject(e);
            }
          };
        });
      };

      var _this10 = this;

      var _temp16 = function () {
        if (!_this10.connected) {
          return Promise.resolve(_this10.connect()).then(function () {});
        }
      }();

      return Promise.resolve(_temp16 && _temp16.then ? _temp16.then(_temp15) : _temp15(_temp16));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  return JsonClient;
}();

var VersionResponse = function VersionResponse() {};

var VersionRequest =
/*#__PURE__*/
function () {
  function VersionRequest() {}

  var _proto = VersionRequest.prototype;

  _proto.getTypeName = function getTypeName() {
    return "rpc.version";
  };

  _proto.createResponse = function createResponse() {
    return new VersionResponse();
  };

  return VersionRequest;
}();

exports.AuthRequest = AuthRequest;
exports.AuthResponse = AuthResponse;
exports.ClientSubscription = ClientSubscription;
exports.ClientSubscriptionManager = ClientSubscriptionManager;
exports.CredentialsBase = CredentialsBase;
exports.EventFilter = EventFilter;
exports.JsonClient = JsonClient;
exports.LogoutMessage = LogoutMessage;
exports.SubscriptionMessage = SubscriptionMessage;
exports.VersionRequest = VersionRequest;
exports.VersionResponse = VersionResponse;
exports.default = JsonClient;
//# sourceMappingURL=json-services-client.cjs.development.js.map
