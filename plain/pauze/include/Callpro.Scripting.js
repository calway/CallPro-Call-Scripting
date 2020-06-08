// CallPro script library (C)opyright 2014-2017 Calway Nederland b.v.
// version: v20170421/2
//
// interface:
//  getFieldValue(field) 		- return a value for the field parameter
//  setFieldValue(field,value) 	- set the fieldparameter
//  hookField(source,target) 	- hooks value of source to target element
// Let op: als field wordt meegegeven als een string, dus tussen "" dan wordt de hele collectie van tags bepaald aan de hand van de id of de naam
//         als field wordt meegegeven als een tag met id dan wordt de collectie bepaald via de field.id (anders foutmelding in de html)
//
// cached scriptfields. Deze velden worden niet gesynchroniseerd met de scriptmodule(foxpro), maar 
// 1x bij initializatie van het goCallPro object hezet. Je hebt dan alle velden bij de hand in javascript ook al staan ze niet op
// de scriptpagina. De velden kunnen worden bijgewerkt met een oproep naar updateFromDOM
//  getCachedValue(field)        - get cached(database copy) value of "field"
//  updateFromDOM                - update dom to cached values
// 
(function (window, document, undefined) {

    var initialized = false;
    var goCallProObject = undefined;

    // wait for dom-model to be loaded and ready before exectuting the initializer
    if (!!(window.addEventListener))
        window.addEventListener("DOMContentLoaded", initCallPro);
    else // MSIE
        window.attachEvent("onload", initCallPro);

    Initialized = function () {
        return initialized;
    };

    // initializer function, called once on load
    var retryCount = 0;
    function initCallPro() {

        // alert("start initializing");

        // wait for the goCallPro object to be assigned
        // tood: strategy what to do when not initialized in time
        if (goCallProObject === undefined) {
            console.log("callpro waiting..." + retryCount++);
            if (retryCount < 10) {
                setTimeout(function () { initCallPro(); }, 500);
                return;
            }
        }

        if (goCallPro !== undefined) {

            var loScript = goCallPro.GetScript();
            var loEntry = loScript.GetEntry();
            var loDialer = loScript.GetDialer();
            var loAgent = loScript.GetAgent();
            var loCampaign = loScript.GetCampaign();

            if (loEntry !== null && loEntry !== undefined) {

                scriptFields.push(new scriptField("CLEntryID", loEntry.CLEntryID));
                scriptFields.push(new scriptField("AgentName", loAgent.ResName));
                scriptFields.push(new scriptField("CampaignID", loCampaign.ResID));

                for (var i = 1; i <= loEntry.ScriptFieldsCount; i++) {
                    var loField = loEntry.ScriptFields(i);
                    var loValue = loField.Value;

                    if (!loValue || loValue === undefined || loValue === "null" || loValue === null || loValue === "NULL")
                        loValue = "";

                    scriptFields.push(new scriptField(loField.FName, loValue));
                }

            }
        }
        initialized = true;
    }

    // CallPro scriptfield collection, javascript copy van de scriptvelden
    scriptFields = [];
    function scriptField(fieldName, fieldValue) {
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    updateFromDOM = function () {
        for (var i = 0; i < scriptFields.length; i++) {
            sf = scriptFields[i];
            var val = getFieldValue("script_" + sf.fieldName);
            if (val !== undefined) {
                // alert(sf.fieldName + " updated from " + sf.fieldValue + " to " + val);
                sf.fieldValue = val;
            }
        }
    };

    getCachedValue = function (fieldName) {
        for (var i = 0; i < scriptFields.length; i++) {
            sf = scriptFields[i];
            if (sf.fieldName.toUpperCase() === fieldName.toUpperCase()
                || "SCRIPT_" + sf.fieldName.toUpperCase() === fieldName.toUpperCase())
                return sf.fieldValue;
        }
        return undefined;
    };

    // isCollection
    // parameters: field
    // returns: true if field is a collection of elements, false otherwise
    var isCollection = function (field) {

        return (field.nodeName === undefined && field.length >= 1);
    };

    // elementType
    // return the elementType of field (object), compatible with IE7 and higher
    var elementType = function (field) {
        return field.nodeName;
        // Object.prototype.toString.call(field);
    };

    // isInputElement
    // return true if field is an input field, false otherwise
    var isInputElement = function (field) {
        var tp = elementType(field);
        return (tp === "INPUT" || tp === "SELECT" || tp === "TEXTAREA");
    };

    var getElementsByNameOrId = function (field) {
        var found = document.getElementById(field);
        var result = [];
        var byName = document.getElementsByName(field);
        var i;

        if (!(byName === undefined) && byName.length > 0) {

            if (isCollection(byName)) {
                for (i = 0; i < byName.length; ++i)
                    result.push(byName[i]);
            } else {
                result.push(byName);
            }
        }

        while (found) {
            result.push(found);
            found.id = field & new Date().time;
            found = document.getElementById(field);
        }

        for (i = 0; i < result.length; ++i) {
            if (result[i].id !== "")
                result[i].id = field;
        }

        return result;
    };

    // string2Object
    // parameters: field - string, id or name of a element
    // returns: element-object for field, or undefined if not existing
    var string2Object = function (field) {
        if (typeof field === "string") {
            var toObj = getElementsByNameOrId(field);

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
    };

    // get the collection of all tags (input/label/etc...) with name or id as given
    // field van be a string value (name or id)
    // or field can be a collection of 1 or more tags. Then the name or id is taken and used to get the collection
    var getCollection = function (field) {
        if (field === undefined)
            return undefined;

        if (typeof field === "string")
            field = string2Object(field);
        else {
            if (isCollection(field))
                field = field[0];

            if (field.id === "")
                field = string2Object(field.name);
            else
                field = string2Object(field.id);
        }

        return field;
    };


    // goCallPro object
    // get and set to manipulate (future) calls to set and get
    // WARNING: Only works with IE8 and up (NOT ie7 and lower!)
    Object.defineProperty(this, "goCallPro", {
        get: function () {
            if (goCallProObject === undefined)
                console.log('goCallPro not properly initialized');
            return goCallProObject;
        },
        set: function (obj) {
            goCallProObject = obj;
        }
    });

    // hooks the inputfield obj to labelfield objcopy (can be every type)
    // parameters: source - source field (copy from)
    //             target - target field (retrieves value of source)
    hookField = function (source, target) {
        if (!initialized) {
            // wait for everything to be fired up
            console.log("waiting...");
            setTimeout(function () { hookField(source, target); }, 500);
        } else {
            source = string2Object(source);
            target = string2Object(target);

            if (source && target) {
                setFieldValue(target, getFieldValue(source));
                if (isCollection(source)) {
                    for (i = 0; i < source.length; i++) {
                        // probably checkbox or radio, so also include mouse up. Wait 100ms to allow the system to set the value
                        source[i].onmouseup = source[i].onkeyup = function () {
                            setTimeout(function () {
                                setFieldValue(target, getFieldValue(source));
                            }, 100);
                        }
                    }
                } else {
                    source.onkeyup = function () {
                        setFieldValue(target, getFieldValue(source));
                    }
                }
            } else
                console.log("unknown or undefined field " + source + " or " + target);
        }
    };

    // getFieldValue - tries to return the value of field. 
    // parameters: field - can be either an object (by name or by id) or a stringref.
    // returns: string value or undefined if non-existing
    getFieldValue = function (field) {
        return getFieldValue(field, false);
    };

    getFieldValue = function (field, inner) {
        if (!inner)
            field = getCollection(field);

        //if (field === undefined)
        //  return undefined;

        if (isCollection(field)) {
            var result = undefined;
            for (var i = 0; i < field.length; i++) {
                var itemValue = getFieldValue(field[i], true);
                if (elementType(field[i]) === "INPUT" && field[i].type === "checkbox") {
                    // checkbox = multiselect, seperate values with "+"
                    if (itemValue !== "") {
                        if (result === undefined)
                            result = "";
                        result += ((result !== "") ? "+" : "") + itemValue;
                    }
                } else {
                    // allother elements (input, label etc...)

                    if (isInputElement(field[i])) {
                        // input elements
                        if (field[i].type === "radio") {
                            if (itemValue !== "")
                                result = itemValue;
                        }
                        else
                            result = itemValue;
                    }
                    else {
                        // non input elements (labels...)
                        if (itemValue !== "") {
                            if (result === undefined)
                                result = itemValue;
                        }
                    }
                }
            }
            return (result === undefined) ? "" : result;
        } else
            if (typeof field === "object") {
                var fieldType = "";
                var objType = elementType(field);

                switch (objType) {
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

                switch (fieldType) {
                    case "text":
                    case "password":
                    case "hidden":
                    case "button":
                        return field.value;
                    case "radio":
                    case "checkbox":
                        return (field.checked) ? field.value : "";
                    case "label":
                        return field.innerHTML;
                    case "textarea":
                        return field.value;
                    case "select":
                        return field.value;
                    case "email":
                    case "color":
                    case "date":
                    case "datetime-local":
                    case "file":
                    case "image":
                    case "month":
                    case "number":
                    case "range":
                    case "tel":
                    case "time":
                    case "url":
                    case "week":
                        return field.value;
                    case "unknown":
                        //console.log("Unknown control " + objType);
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
    setFieldValue = function (field, value) {
        return __setFieldValue(field, value, false);
    };

    // interal setFieldValue, should never be called from outside this class
    __setFieldValue = function (field, value, inner) {
        if (!inner)
            field = getCollection(field);

        if (field === undefined)
            return false;

        value = String(value);

        if (isCollection(field)) {
            var result = true;
            for (i = 0; i < field.length; i++)
                result = __setFieldValue(field[i], value, true) && result;
            return result;
        } else
            if (typeof field === "object") {
                var fieldType = "";
                var objType = elementType(field);
                var updateresult = false;

                switch (objType) {
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
                switch (fieldType) {
                    case "text":
                    case "password":
                    case "hidden":
                    case "button":
                        field.value = value;
                        updateresult = true;
                        break;
                    case "radio":
                    case "checkbox":
                        field.checked = (value.indexOf(field.value) !== -1);
                        updateresult = true;
                        break;
                    case "label":
                        field.innerHTML = value;
                        updateresult = true;
                        break;
                    case "textarea":
                        field.value = value;
                        updateresult = true;
                        break;
                    case "select":
                        field.value = value;
                        updateresult = true;
                        break;
                    case "unknown":
                        // console.log("Unknown control " + objType);
                        field.innerHTML = value;
                        break;
                }

                // If we are using angular make sure the value we just set is updated
                // ofcourse this only works (and will only be needed) if we had set 
                // an ng-model on the input element we are setting the value of
                if (typeof angular !== 'undefined') {
                    var _angularElement = angular.element(field);
                    _angularElement.triggerHandler('input');
                }
                return updateresult;
            }
        return false;
    };

    // setFieldReadOnly - makes the field readonly
    // parameters: field - can be either an object (by name or by id) or a stringref.
    //             value - true (readonly) or false (!readonly)
    // returns: boolean, succeeded (true) or failed(false)
    setFieldReadOnly = function (field, value) {
        if (typeof field === "string")
            field = string2Object(field);

        if (field === undefined)
            return false;

        if (isCollection(field)) {
            var result = true;
            for (i = 0; i < field.length; i++) {
                result = setFieldReadOnly(field[i], value) && result;
            }
            return result;
        } else
            if (typeof field === "object") {
                var fieldType = "";
                var objType = elementType(field);

                switch (objType) {
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
                switch (fieldType) {
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
                        // console.log("Unknown control " + objType);
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

        if (isCollection(field)) {
            var result = true;
            for (i = 0; i < field.length; i++) {
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

    niceDate = function (dateObject) {
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

    //backwards compatibility
    GetFieldValue = getFieldValue;
    SetFieldValue = setFieldValue;

    //deprecated
    SetFieldReadOnly = setFieldReadOnly;
    SetFieldHighlight = setFieldHighlight;

    // set object to root
    window.CallPro = window.$ = this;

    return this;
})(window, document);

// moet helaas buiten de "class" ivm CallPro oproep
function SetCallPro(obj) {
    try {

        if (CallPro === undefined) {
            console.log("Spawn SetCallPro");
            setTimeout(function () { SetCallPro(obj); }, 500);
            return;
        }

        CallPro.goCallPro = obj;
        console.log("SetCallPro executed");
    }
    catch (e) {
        console.log("Error setting goCallPro object " + e);
    }
}

