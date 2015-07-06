// CallPro script library (C)opyright 2014-2015 Calway Nederland b.v.
// v20140612
// interface:
//
// getFieldValue(field) 		- return a value for the field parameter
// setFieldValue(field,value) 	- set the fieldparameter
// hookField(source,target) 	- hooks value of source to target element
// Log(text)					- simple log function, a element with id logpart is needed
//
(function( window, document, undefined ) {

	var initialized = false;
	var goCallProObject = undefined;
	
	// wait for dom-model to be loaded and ready before exectuting the initializer
	if ( !!(window.addEventListener) )
		window.addEventListener("DOMContentLoaded", initCallPro)
	else // MSIE
		window.attachEvent("onload", initCallPro)
		
	insertVB = function() {
		var head = document.getElementsByTagName("head")[0];
		var script = document.createElement("script");
		script.type = "text/vbscript";
		script.text = ' Sub SetCallPro(ByVal toObject)	\r\n \tMsgBox("vb injected") \r\n End Sub ';
		head.appendChild(script);
	} ();
		
	Initialized = function () { 
		return initialized;
	}
		
	// initializer function, called once on load
	var retryCount = 0;
	function initCallPro() {
		
		// alert("start initializing");
		
		// wait for the goCallPro object to be assigned
		// tood: strategy what to do when not initialized in time
		if (goCallProObject === undefined) {
			Log("callpro waiting..." + retryCount++);
			if (retryCount < 10) {
				setTimeout(function() { initCallPro(); },500);
				return;
			}
		}
		
		if (goCallPro !== undefined) {

			var loScript = goCallPro.GetScript();
			var loEntry = loScript.GetEntry();
			var loDialer = loScript.GetDialer();
			var loAgent = loScript.GetAgent();
			var loCampaign = loScript.GetCampaign();

			if (loEntry != null && loEntry !== undefined) {
			
				scriptFields.push(new scriptField("CLEntryID",loEntry.CLEntryID));
				scriptFields.push(new scriptField("AgentName",loAgent.ResName));
				scriptFields.push(new scriptField("CampaignID",loCampaign.ResID));
			
				for(var i=1; i<= loEntry.ScriptFieldsCount; i++) {
					var loField = loEntry.ScriptFields(i);
					var loValue = loField.Value;
				
					if (!loValue || loValue === undefined || loValue  === "null" || loValue == null || loValue  === "NULL")
						loValue = "";
					
					scriptFields.push(new scriptField(loField.FName, loValue));
				}
			
			}
		}
		initialized = true;
	};

	// CallPro scriptfield collection
	scriptFields = [];
	function scriptField(fieldName, fieldValue) {
		this.fieldName = fieldName;
		this.fieldValue = fieldValue;
	}
	
	updateFromDOM = function() {
		for (var i = 0; i < scriptFields.length; i++) {
			sf = scriptFields[i];
			var val = getFieldValue("script_" + sf.fieldName);
			if (val !== undefined) {
				// alert(sf.fieldName + " updated from " + sf.fieldValue + " to " + val);
				sf.fieldValue = val;
			}
		}
	}
	
	getCachedValue = function(fieldName) {
		for (var i = 0; i < scriptFields.length; i++) {
			sf = scriptFields[i];
			if (sf.fieldName.toUpperCase() === fieldName.toUpperCase() 
				|| "SCRIPT_" + sf.fieldName.toUpperCase() === fieldName.toUpperCase())
				return sf.fieldValue;
		}	
		return undefined;
	}
	
	// isCollection
	// parameters: field
	// returns: true if field is a collection of elements, false otherwise
	var isCollection = function(field) {
		return (field.nodeName === undefined && field.length >= 1);
	}
	
	// elementType
	// return the elementType of field (object), compatible with IE7 and higher
	var elementType = function(field) {
		return field.nodeName;
		// Object.prototype.toString.call(field);
	}
	
	// isInputElement
	// return true if field is an input field, false otherwise
	var isInputElement = function(field) {
		var tp = elementType(field);
		return (tp === "INPUT" || tp === "SELECT" || tp === "TEXTAREA");
	}
	
	// string2Object
	// parameters: field - string, id or name of a element
	// returns: element-object for field, or undefined if not existing
	var string2Object = function(field) {
		if (typeof field === "string") {
			var toObj = document.getElementsByName(field);
			if (toObj.length === 0) {
				// maybe field is by Id
				toObj = document.getElementById(field);
			} else
			if (toObj.length === 1) {
				// collection of one, get the first one
				toObj = toObj[0];
			}

			if (toObj)
				return toObj;
			else
				return undefined;
		}
		
		// already an object
		return field;
	}
	
	// simple log function, depends on an element with ID "logpart" (otherwise no logging)
	// parameters: msg - line of text to write to log
	Log = function(msg) {
		var logpart = document.getElementById("logpart");
		// !! casts the expression to a boolean
		if (!!logpart)
			logpart.innerHTML = logpart.innerHTML + msg + "<br/>";
	};

	// goCallPro object
	// get and set to manipulate (future) calls to set and get
	// WARNING: Only works with IE8 and up (NOT ie7 and lower!)
	Object.defineProperty(this, "goCallPro", {
		get: function() {
				if (goCallProObject === undefined)
					alert("goCallPro not properly initialized");
				return goCallProObject;
			},
		set: function(obj) {
				goCallProObject = obj;
			}
	});

	// hooks the inputfield obj to labelfield objcopy (can be every type)
	// parameters: source - source field (copy from)
	//             target - target field (retrieves value of source)
	hookField = function (source, target) {
		if (!initialized){
			// wait for everything to be fired up
			Log("waiting...");
			setTimeout(function() { hookField(source,target); },500);
		} else
		{
			source = string2Object(source);
			target = string2Object(target);
			
			if (source && target) {
				setFieldValue(target,getFieldValue(source));
				if (isCollection(source)) {
					for(i=0;i<source.length;i++) {
						// probably checkbox or radio, so also include mouse up. Wait 100ms to allow the system to set the value
						source[i].onmouseup = source[i].onkeyup = function() { setTimeout(function() {
							setFieldValue(target,getFieldValue(source)); }, 100);
					} }
				} else {
					source.onkeyup = function() {
					setFieldValue(target,getFieldValue(source));
					}
				}
			} else
				Log("unknown or undefined field " + source + " or " + target);
		}
	};

	// getFieldValue - tries to return the value of field. 
	// parameters: field - can be either an object (by name or by id) or a stringref.
	// returns: string value or undefined if non-existing
	getFieldValue = function (field) {
		if (typeof field === "string")
			field = string2Object(field);

		if (field === undefined)
			return undefined;
			
		if (isCollection(field)){
			var result = undefined;
			for(var i=0;i<field.length;i++) {
				var itemValue = getFieldValue(field[i]);
				if (elementType(field[i]) === "INPUT" && field[i].type === "checkbox") {
					// checkbox = multiselect, seperate values with "+"
					if (itemValue != "") {
						if (result === undefined)
							result = ""
						result += ((result!="")?"+":"") + itemValue;
					}
				} else {
					// allother elements (input, label etc...)
					
					if (isInputElement(field[i])) {
						// input elements
						if (field[i].type === "radio") {
							if (itemValue != "")
								result = itemValue;
						}
						else
							result = itemValue;
					} 
					else {
						// non input elements (labels...)
						if (itemValue != "") {
							if (result === undefined)
								result = itemValue;
						}		
					}
				}
			}
			return (result===undefined)?"":result;
		} else
		if (typeof field === "object") {
			var fieldType = "";
			var objType = elementType(field);
			
			switch (objType)
			{
				case "INPUT":
					fieldType = field.type;
					break;
				case "SELECT":
					fieldType = "select";
					break;
				case "LABEL":
					fieldType = "label";
					break;
				case "TEXTAREA":
					fieldType = "textarea";
					break;
				default:
					fieldType = "unknown";
					break;
			}
			
			switch (fieldType)
			{
				case "text":
				case "password":
				case "hidden":
				case "button":
					return field.value;
				case "radio":
				case "checkbox":
					return (field.checked)?field.value:"";
				case "label":
				case "textarea":
					return field.innerHTML;
				case "select":
					return field.value;
				case "unknown":
					//Log("Unknown control " + objType);
					return field.innerHTML;
			}
		}
		else
			return undefined;
	};
	
	// setFieldValue - tries to returns the value of field. 
	// parameters: field - can be either an object (by name or by id) or a stringref.
	//             value - the new value for the field
	// returns: true on succeed, false otherwise
	setFieldValue = function(field, value) {
		if (typeof field === "string")
			field = string2Object(field);
			
		if (field === undefined)
			return false;
	
		value = String(value);
	
		if (isCollection(field)){
			var result = true;
			for(i=0;i<field.length;i++)
				result = result && setFieldValue(field[i],value);
			return result;
		} else
		if (typeof field === "object") {
			var fieldType = "";
			var objType = elementType(field);
			
			switch (objType)
			{
				case "INPUT":
					fieldType = field.type;
					break;
				case "SELECT":
					fieldType = "select";
					break;
				case "LABEL":
					fieldType = "label";
					break;
				case "TEXTAREA":
					fieldType = "textarea";
					break;
				default:
					fieldType = "unknown";
					break;
			}
			switch (fieldType)
			{
				case "text":
				case "password":
				case "hidden":
				case "button":
					field.value = value;
					return true;
				case "radio":
				case "checkbox":
					field.checked = (value.indexOf(field.value) !== -1);
					return true;
				case "label":
				case "textarea":
					field.innerHTML = value;
					break;
				case "select":
					field.value = value;
					return true;
				case "unknown":
					// Log("Unknown control " + objType);
					field.innerHTML = value;
					return false;
			}
		}		
		
		return false;
	}
	
	// setFieldReadOnly - makes the field readonly
	// parameters: field - can be either an object (by name or by id) or a stringref.
	//             value - true (readonly) or false (!readonly)
	// returns: boolean, succeeded (true) or failed(false)
	setFieldReadOnly = function (field, value) {
		if (typeof field === "string")
			field = string2Object(field);

		if (field === undefined)
			return false;
			
		if (isCollection(field)){
			var result = true;
			for(i=0;i<field.length;i++) {
				result = result && setFieldReadOnly(field[i], value);
			}
			return result;
		} else
		if (typeof field === "object") {
			var fieldType = "";
			var objType = elementType(field);
			
			switch (objType)
			{
				case "INPUT":
					fieldType = field.type;
					break;
				case "SELECT":
					fieldType = "select";
					break;
				case "LABEL":
					fieldType = "label";
					break;
				case "TEXTAREA":
					fieldType = "textarea";
					break;
				default:
					fieldType = "unknown";
					break;
			}
			switch (fieldType)
			{
				case "text":
				case "password":
				case "hidden":
				case "textarea":
					field.readOnly = value;
					return true;
				case "button":
				case "radio":
				case "checkbox":
					field.disabled = value;
					return true;
				case "label":
					field.disabled = value;
					return true;
				case "select":
					field.disabled = value;
					return true;
				case "unknown":
					//Log("Unknown control " + objType);
					return false;
			}
		}
		else
			return false;
	};	
	
	// setFieldHighlight - set color of field
	// parameters: field - can be either an object (by name or by id) or a stringref.
	//             forecolor - foreground (text) color
	//             backcolor - background color
	// returns: boolean, succeeded (true) or failed(false)
	setFieldHighlight = function (field, forecolor, backcolor) {
		if (typeof field === "string")
			field = string2Object(field);

		if (field === undefined)
			return false;
			
		if (isCollection(field)){
			var result = true;
			for(i=0;i<field.length;i++) {
				result = result && setFieldHighlight(field[i], forecolor, backcolor);
			}
			return result;
		} else
		if (typeof field === "object") {
			field.style.color = forecolor;
			field.style.backgroundColor = backcolor;
			
			return true;
		}
		else
			return false;
	};		
	
	niceDate = function(dateObject) {
		var d = new Date(dateObject);
		var day = d.getDate();
		var month = d.getMonth() + 1;
		var year = d.getFullYear();
		if (day < 10) {
			day = "0" + day;
		}
		if (month < 10) {
			month = "0" + month;
		}
		var date = year + "/" + month + "/" + day;

		return date;
	};	
	
	// Backwards compatibility
	GetFieldValue = getFieldValue;
	SetFieldValue = setFieldValue;
	SetFieldReadOnly = setFieldReadOnly;
	SetFieldHighlight = setFieldHighlight;
	
	// set object to root
	window.CallPro = window.$ = this;
		
	return this;
})( window, document );	

// moet helaas buiten de "class" ivm CallPro oproep
function SetCallPro(obj) {
	try {
	
		if (CallPro === undefined) {
			Log("Spawn SetCallPro");
			setTimeout(function() { SetCallPro(obj); },500);
			return;
		}
	
		CallPro.goCallPro = obj;
		
		Log("SetCallPro executed");
	}
	catch(e) {
		alert("Error setting goCallPro object " + e);
	}
};


