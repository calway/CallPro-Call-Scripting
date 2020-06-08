//
// from sample code developed by Grant Wagner (gwagner@agricoreunited.com)
//
function AddElementEvent(formName, elementName, elementEvent, eventHandler) {

    var el = document.getElementsByName(elementName);
    //alert(el[1].name);

    var f = document.forms[formName];
    if (f && f.elements[elementName]) 
    {
        f = f.elements[elementName];
        if (f[elementEvent]) 
        {
            // there is currently an on... event defined for this
            // element; append the event handler javascript to the
            // current event handler javascript
            f[elementEvent] = new Function(
            // take the original event
            f[elementEvent]
            // convert it to a string; the string looks like:
            // "...function...()...{...[js]...}..."
            .toString()
            // remove any newline characters or carriage returns
            .replace(/[\r\n]/g, '')
            // remove any leading or trailing whitespace
            .replace(/\s+$|^\s+/g, '')
            // turn "function...()...{...[js]...}"
            // into "function...()...{...[js][newline][new js]...}"
            // NOTE: THE NEXT LINE IS A SINGLE STATEMENT WHICH WILL
            // MOST LIKELY WRAP
            .replace(/^function\s*\w+\s*\(\w*\)\s*\{\s*(.*)\s*\}$/, '$1\n' + eventHandler)
            );
        }
        else 
        {
            // there is currently no on... event defined for this
            // element; set the event handler javascript to handle
            // the event
            f[elementEvent] = new Function(eventHandler);
        }
    }
} // AddElementEvent()


//slace.core.js
if (typeof slace === 'undefined') var slace = {};
if (!slace.core) slace.core = {};
slace.core.registerNamespace = function (namespace, global) {
    ///<summary>Registers a namespace as an object</summary>
    ///<param name="namespace" type="String" optional="false" mayBeNull="false">
    ///    Namespace as a string.  For instance, "slace.web.stuff" would define the object
    ///    window.slace.web.stuff = {}
    ///</param>
    ///<param name="global" type="Object" optional="true" mayBeNull="true">
    ///    The object to use as the starting point.  Defaults to 'window' if it exists.
    ///</param>
    var go;
    go = function (object, properties) {
        if (properties.length) {
            var propertyToDefine = properties.shift();

            if (typeof object[propertyToDefine] === 'undefined') {
                object[propertyToDefine] = {};
            }

            go(object[propertyToDefine], properties);
        }
    };

    go(global || (function () { return this; })(), namespace.split('.'));
};


/// <reference path="slace.core.js" />
slace.core.eventManager = (function () {
    var events = {};

    var getEvent = function (name) {
        ///<summary>Gets the event for the given id</summary>
        ///<param name="name">Name of the event</param>
        if (!events[name]) {
            events[name] = [];
        }
        return events[name];
    };

    var ret = {
        bind: function (name, fn, eventHandlerId) {
            ///<summary>Adds a particular event handler to the specified event</summary>
            ///<param name="name" type="String" optional="false" mayBeNull="false">Name of the event to bind to</param>
            ///<param name="fn" type="Function" optional="false" mayBeNull="false">Function to invoke when the event is triggered</param>
            var e = getEvent(name);
            if (!eventHandlerId) {
                //there was no event id, so auto-generate one
                eventHandlerId = name + '-' + (e.length + 1);
            }
            //add the id to the event
            fn.id = eventHandlerId;
            e.push(fn);
            return ret;
        },
        trigger: function (name, source, args) {
            ///<summary>Raises a named event on the given source with the supplied arguments</summary>
            ///<param name="name" type="String" optional="false" mayBeNull="false">Name of the event to raise</param>
            ///<param name="source" type="Object" optional="false" mayBeNull="true">Object to bind the 'this' context to</param>
            ///<param name="args" type="Object" optional="true" mayBeNull="true">Arguments to pass to the event</param>
            if (!source) {
                source = {};
            }
            if (!args) {
                args = [];
            }
            var evt = getEvent(name);
            if (!evt || (evt.length === 0)) {
                return;
            }
            evt = evt.length === 1 ? [evt[0]] : Array.apply(null, evt);
            if (args.constructor !== Array) {
                args = [args];
            }
            for (var i = 0, l = evt.length; i < l; i++) {
                evt[i].apply(source, args);
            }
             return ret;
       },
        unbind: function (name, eventHandlerId) {
            ///<summary>Unbinds a handler from a named event.</summary>
            ///<param name="name" type="String" optional="false" mayBeNull="false">Name of the event to unbind from</param>
            ///<param name="eventHandlerId" type="String" optional="true" mayBeNull="true">Unique name of the event handler to unbind, if not supplied all event handlers are unbound</param>
            var evt = getEvent(name);
            if (evt && evt.length > 0) {
                //if there is an event handler to remove look for it
                if (eventHandlerId) {
                    for (var i = 0, l = evt.length; i < l; i++) {
                        var e = evt[i];
                        if (e.id === eventHandlerId) {
                            evt.pop(e);
                            break;
                        }
                    }
                } else {
                    //remove all event handlers
                    evt = [];
                }
            }
            return ret;
        },
        isRegistered: function (name, eventHandlerId) {
            ///<summary>Checks if an event handler is registered</summary>
            ///<param name="name" type="String" optional="false" mayBeNull="false">Name of the event to check</param>
            ///<param name="eventHandlerId" type="String" optional="false" mayBeNull="false">Unique id of the event handler to check for</param>
            ///<returns type="Boolean" />
            var evt = getEvent(name);
            if (eventHandlerId) {
                for (var i = 0, l = evt.length; i < l; i++) {
                    var e = evt[i];
                    if (e.id === eventHandlerId) {
                        return true;
                    }
                }
            }
            return false;
        }
    };

    return ret;
})();

//slace.core.entensions.js
Function.prototype.method = function(name, func) {
    this.prototype[name] = func;
    return this;
};

Function.method('inherits', function(parent) {
    var d = {}, p = (this.prototype = new parent());
    this.method('uber', function uber(name) {
        if (!(name in d)) {
            d[name] = 0;
        }
        var f, r, t = d[name], v = parent.prototype;
        if (t) {
            while (t) {
                v = v.constructor.prototype;
                t -= 1;
            }
            f = v[name];
        } else {
            f = p[name];
            if (f == this[name]) {
                f = v[name];
            }
        }
        d[name] += 1;
        r = f.apply(this, Array.prototype.slice.apply(arguments, [1]));
        d[name] -= 1;
        return r;
    });
    return this;
});

Array.method('contains', function(array, item) {
    return (Array.indexOf(array, item) >= 0);
});
Array.method('remove', function(array, item) {
    var index = Array.indexOf(array, item);
    if (index >= 0)
        array.splice(index, 1);
    return (index >= 0);
});
Array.method('indexOf', function(array, item, start) {
    if (typeof (item) === "undefined") return -1;
    var length = array.length;
    if (length !== 0) {
        start = start - 0;
        if (isNaN(start)) start = 0;
        else {
            if (isFinite(start)) start = start - (start % 1);
            if (start < 0) start = Math.max(0, length + start);
        }
        for (var i = start; i < length; i++)
            if ((typeof (array[i]) !== "undefined") && (array[i] === item)) return i;
    }
    return -1;
});

//setup some type descriptors
Function.prototype.__type__ = 'function';
Number.prototype.__type__ = 'number';
Boolean.prototype.__type__ = 'boolean';
String.prototype.__type__ = 'string';
Object.prototype.__type__ = 'object';
Date.prototype.__type__ = 'date';
RegExp.prototype.__type__ = 'regex';

Object.method('getType', function() {
    return this.__type__;
});
Object.method('toDictionary', function() {
    var a = new Array();
    for (var i in this) {
        if (this.hasOwnProperty(i)) {
            a.push({
                key: i,
                value: this[i]
            });
        }
    }
    return a;
});

//slace.animator.js
var slace.animator = (function() {
	var g = document.getElementById;
	var supported = 'padding-top,padding-bottom,padding-left,padding-right,font-size,line-height,margin-top,margin-bottom,'
					+ 'margin-left,margin-right,border-top,border-bottom,border-left,border-right,width,height'.split(',');
	
	var parse = function(prop) { 
		var f = parseFloat(prop);
		if(isNaN(f)) f = parseFloat(prop.replace(/^[\-\d\.]+/,''));
		return f;
	};
	
	var buildStyles = function(style) {
		var s = '';
		for(var x in style) s +=' ' + x + ':' + (function() { return typeof style[x] == 'function' ? style[x]() : style[x]; })() + ';';
		var el = document.createElement('div');
		el.innerHTML = '<div style="' + s + '"></div>';
		var res = {};
		for(var i=0,l=supported.length;i<l;i++) {
			if((x = el.firstChild.style[supported[i]])) {
				res[supported[i]]=parse(x);
			}
		}
		return res;
	};

	return function(opts) {
		if(!opts.el) return;
		
		var el = typeof opts.el === 'string' ? g(opts.el) : opts.el;
		var start=+new Date,
			duration=opts.duration||600,
			end=start+duration,
			calc=el.currentStyle||getComputedStyle(el,null),
			style=buildStyles(opts.css),
			data={};
			
		for(var p in style) {
			data[p] = parse(calc[p]);
		}
		
		var interval = setInterval(function() {
			var now=+new Date
				pos=now>end ? 1 : (now-start)/duration;
			if(now>=end) {
				clearInterval(interval);
				return;
			}
			for(var p in style) {
				el.style[p] = (function() {
					return data[p]+(style[p]-data[p])*((-Math.cos(pos*Math.PI)/2)+0.5);
				})() + 'px';
			}
		}, 10);
	}
})();
