/*
	Copyright 2020
	Author : Ingar Arntzen

	This file is part of the Timingsrc module.

	Timingsrc is free software: you can redistribute it and/or modify
	it under the terms of the GNU Lesser General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Timingsrc is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Lesser General Public License for more details.

	You should have received a copy of the GNU Lesser General Public License
	along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


define(function () {

	'use strict';

	const DEFAULT_INIT_EVENT_ARG = function(name){return;}

	/*
		Event
		- name: event name
		- publisher: the object which defined the event
		- init: true if the event suppports init events
		- subscriptions: subscriptins to this event

	*/

	class Event {

		constructor (publisher, name, options) {
			options = options || {}
			this.publisher = publisher;
			this.name = name;
			this.init = (options.init === undefined) ? false : options.init;
			this.subscriptions = [];
		}

		/*
			subscribe to event
			- subscriber: subscribing object
			- callback: callback function to invoke
			- options:
				init: if true subscriber wants init events
		*/
		subscribe (callback, options) {
			if (!callback || typeof callback !== "function") {
				throw new Error("Callback not a function", callback);
			}
			const sub = new Subscription(this, callback, options);
			this.subscriptions.push(sub);

		    // Initiate init callback for this subscription
		    if (this.init && sub.init) {
		    	sub.init_pending = true;
		    	let initEventArg;
		    	if ("eventifyInitEventArg" in this.publisher) {
		    		let pub = this.publisher;
		    		initEventArg = pub.eventifyInitEventArg.bind(pub);
		    	} else {
		    		initEventArg = DEFAULT_INIT_EVENT_ARG;
		    	}
		    	let self = this;
		    	Promise.resolve().then(function () {
	    	    	const eArg = initEventArg(self.name);
		    		if (eArg !== undefined) {
		    			self._trigger(eArg, sub);
		    		} else {
		    			sub.init_pending = false;
		    		};
		    	});
		    }
			return sub
		}

		/*
			trigger event
		*/
		trigger (eArg) {
			if (this.subscriptions.length > 0) {
				const self = this;
				Promise.resolve().then(function () {
					self._trigger(eArg);
				});
			}
		}

		/*
			internal function
			trigger single event
			- if sub is undefined - publish to all subscriptions
			- if sub is defined - publish only to given subscription
		*/
		_trigger (eArg, sub) {
			const subscriptions = (sub == undefined) ? this.subscriptions : [sub];
			let eInfo, ctx;
			for (const _sub of subscriptions) {
				// ignore terminated subscriptions
				if (_sub.terminated) {
					continue;
				}
				eInfo = {
					src: this.publisher,
					name: this.name,
					sub: _sub,
					init: (sub != undefined)
				}
				if (sub == undefined) {
					// publish to all, except those with pending init
					if (_sub.init_pending) {
						continue;
					}
				} else {
					// not pending anymore
					_sub.init_pending = false;
				}
				// callback
				ctx = _sub.ctx || this.publisher;
				try {
					_sub.callback.apply(ctx, [eArg, eInfo]);
				} catch (err) {
					console.log(`Error in ${this.name}: ${_sub.callback} ${err}`);
				}
			}
		}

		/*
		unsubscribe from event
		- use subscription returned by previous subscribe
		*/
		unsubscribe(sub) {
			let idx = this.subscriptions.indexOf(sub);
			if (idx > -1) {
				this.subscriptions.splice(idx, 1);
				sub.terminate();
			}
		}
	}


	/*
		Subscription class
	*/

	class Subscription {

		constructor(event, callback, options) {
			options = options || {}
			this.event = event;
			this.name = event.name;
			this.callback = callback
			this.init = (options.init === undefined) ? this.event.init : options.init;
			this.init_pending = false;
			this.terminated = false;
			this.ctx = options.ctx;
		}

		terminate() {
			this.terminated = true;
			this.callback = undefined;
			this.event.unsubscribe(this);
		}
	}


	/*

		EVENTIFY INSTANCE

		Eventify brings eventing capabilities to any object.

		In particular, eventify supports the initial-event pattern.
		Opt-in for initial events per event type.

		eventifyInitEventArg(name) {
			if (name == "change") {
				return this._value;
			}
		}

	*/

	function eventifyInstance (object) {
		object.__eventify_eventMap = new Map();
		return object;
	};


	/*
		EVENTIFY PROTOTYPE

		Add eventify functionality to prototype object
	*/

	function eventifyPrototype(_prototype) {

		function eventifyGetEvent(object, name) {
			const event = object.__eventify_eventMap.get(name);
			if (event == undefined) {
				throw new Error("Event undefined", name);
			}
			return event;
		}

		/*
			DEFINE EVENT
			- used only by event source
			- name: name of event
			- options: {init:true} specifies init-event semantics for event
		*/
		function eventifyDefineEvent(name, options) {
			// check that event does not already exist
			if (this.__eventify_eventMap.has(name)) {
				throw new Error("Event already defined", name);
			}
			this.__eventify_eventMap.set(name, new Event(this, name, options));
		};

		/*
			ON
			- used by subscriber
			register callback on event.
		*/
		function on(name, callback, options) {
			return eventifyGetEvent(this, name).subscribe(callback, options);
		};

		/*
			OFF
			- used by subscriber
			Un-register a handler from a specfic event type
		*/
		function off(sub) {
			return eventifyGetEvent(this, sub.name).unsubscribe(sub);
		};

		/*
			Trigger event
			- used only by event source
		*/
		function eventifyTriggerEvent(name, eArg) {
			return eventifyGetEvent(this, name).trigger(eArg);
		}


		_prototype.eventifyDefineEvent = eventifyDefineEvent;
		_prototype.eventifyTriggerEvent = eventifyTriggerEvent;
		_prototype.on = on;
		_prototype.off = off;
	};


	/*
		EVENT BOOLEAN

		Single boolean variable, its value accessible through get and toggle methods.
		Defines an event 'change' whenever the value of the variable is changed.

		initialised to false if initValue is not specified

		Note : implementation uses falsiness of input parameter to constructor and set() operation,
		so eventBoolean(-1) will actually set it to true because
		(-1) ? true : false -> true !
	*/

	class EventBoolean {

		constructor(initValue) {
			eventifyInstance(this);
			this._value = Boolean(initValue);
			this.eventifyDefineEvent("change", {init:true});
		}

		eventifyInitEventArg(name) {
			if (name == "change") {
				return this._value;
			}
		}

		get value () {return this._value};
		set value (newValue) {return this.set(newValue);};

		get () {return this._value};;
		set (newValue) {
			newValue = Boolean(newValue);
			if (newValue !== this._value) {
				this._value = newValue;
				this.eventifyTriggerEvent("change", newValue);
				return true;
			}
			return false;
		}

		toggle () {
			this.value = !this.value;
		}
	};
	eventifyPrototype(EventBoolean.prototype);


	/*
		make a promise which is resolved when EventBoolean changes
		value.
	*/
	function makePromise(eventBoolean) {
		if (!eventBoolean instanceof EventBoolean) {
			throw new Error("eventBoolean not instance of EventBolean");
		}
		const target = !eventBoolean.value;
		return new Promise (function (resolve, reject) {
			let sub = eventBoolean.on("change", function (value) {
				if (value === target) {
					resolve();
					eventBoolean.off(sub);
				}
			});
		});
	};

	// module api
	return {
		eventifyPrototype : eventifyPrototype,
		eventifyInstance : eventifyInstance,
		EventBoolean: EventBoolean,
		makePromise: makePromise
	};
});
