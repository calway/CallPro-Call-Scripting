function GetCalendarsActiveInArea(cSearchZip)
{
    //
    // Laat alleen adviseurs zien die actief zijn in dit gebied.
    //
    var loScript = goCallPro.GetScript();
    var loCampaign = loScript.GetCampaign();
  
    // Forceer een complete refresh van Callpro data (alleen voor testen gebruiken)
    //Set loResFactory = goCallPro.GetResourceFactory()
    //loResFactory.ResReQuery()
    //Set loResFactory = Nothing
  
    var loEntry = loScript.GetEntry();
    var cAdviseurForActiveAppointment = "";
    if(loEntry.FirstCurrentAppointment!=null) {
        var loAppointment = loEntry.FirstCurrentAppointment;
        var loCalendar = loAppointment.oCalendar;
        cAdviseurForActiveAppointment = loCalendar.ResName;
        loCalendar = null;
        loAppointment = null;
    }
    var cAdviseurForPreviousAppointment = "";
    if(loEntry.LastPassedAppointment!=null) {
        var loAppointment = loEntry.LastPassedAppointment;
        var loCalendar = loAppointment.oCalendar;
        cAdviseurForPreviousAppointment = loCalendar.ResName;
        loCalendar = null;
        loAppointment = null;
    }
    loEntry = null;

    var cActiveAdviseursHTML = "";
    var nCalendarsFound = 0;

    var aZipRegio = new Array();
    var loCampaignResources = loCampaign.GetChildResources(true);
    loCampaignResources.Requery();
    loCampaignResources.SortOnProperty("ResOrder",false);
    for(var nCampaignIndex=1; nCampaignIndex<=loCampaignResources.Count; nCampaignIndex++) {
        var loCampaignResource=loCampaignResources.GetResource(nCampaignIndex,true);

        //cActiveAdviseursHTML = cActiveAdviseursHTML & loCampaignResource.ResName & "<br/>"
	
        if(loCampaignResource.ResType == 10) {
            var loResource = loCampaignResource.ToResource;	
            var cFoundAdviseur = "";
		
            if (loResource.GetChildVariableByName("REGIO")!=null)
            {
                var loRegio = loResource.GetChildVariableByName("REGIO");
                var cZipRegio = loRegio.Value;
                var aZipRegio = new Array();
                aZipRegio = cZipRegio.split(",");
                
                var nIndex = 0;
                var lFound = false;
                while (!lFound && nIndex <= aZipRegio.length - 1)
                {
                    cZipRegio = aZipRegio[nIndex];
                    //cActiveAdviseursHTML = cActiveAdviseursHTML & "Controle postcode: " & aZipRegio(nIndex) & "<br/>"
                    if (cSearchZip.substr(0, cZipRegio.trim().length) == cZipRegio.trim() && cZipRegio.trim().length > 0)
                    {
                        lFound = true;
                        cFoundAdviseur = loResource.ResName;
                    }
                    nIndex = nIndex + 1;
                }
            } else {
                //cActiveAdviseursHTML = cActiveAdviseursHTML & "* Geen REGIO variabele!<br/>"
                lFound = false;
                cFoundAdviseur = loResource.ResName;
            }
		
            if(lFound) {
                // Dit is een Adviseur die geinteresseerd is in dit adres. Neem de Calendar op in onze lijst met beschikbare Calendars.
                if(cAdviseurForActiveAppointment == cFoundAdviseur) {
                    cAdviseurForActiveAppointment = "";
                    cActiveAdviseursHTML = cActiveAdviseursHTML + "<b><a href='#SCRIPT_CALLMODULE?MODULE=CALENDAR.EXE&CALENDAR=" + cFoundAdviseur + "&DISABLESWITCH'>";
                    cActiveAdviseursHTML = cActiveAdviseursHTML + cFoundAdviseur;
                    if(loResource.ResDescr > "") {
                        cActiveAdviseursHTML = cActiveAdviseursHTML + " (" + loResource.ResDescr + ") ";
                    }
                    cActiveAdviseursHTML = cActiveAdviseursHTML + "</a></b><br/>";
                } else {
                    if(cAdviseurForPreviousAppointment == cFoundAdviseur) {
                        cAdviseurForPreviousAppointment = "";
                        cActiveAdviseursHTML = cActiveAdviseursHTML + "<i><a href='#SCRIPT_CALLMODULE?MODULE=CALENDAR.EXE&CALENDAR=" + cFoundAdviseur + "&DISABLESWITCH'>"; 
                        cActiveAdviseursHTML = cActiveAdviseursHTML + cFoundAdviseur;
                        if(loResource.ResDescr > "") {
                            cActiveAdviseursHTML = cActiveAdviseursHTML + " (" + loResource.ResDescr + ") ";
                        }
                        cActiveAdviseursHTML = cActiveAdviseursHTML + "</a></i></li><br/>";
                    } else {
                        cActiveAdviseursHTML = cActiveAdviseursHTML + "<a href='#SCRIPT_CALLMODULE?MODULE=CALENDAR.EXE&CALENDAR=" + cFoundAdviseur + "&DISABLESWITCH'>";
                        cActiveAdviseursHTML = cActiveAdviseursHTML + cFoundAdviseur;
                        if(loResource.ResDescr > "") {
                            cActiveAdviseursHTML = cActiveAdviseursHTML + " (" + loResource.ResDescr + ") ";
                        }
                        cActiveAdviseursHTML = cActiveAdviseursHTML + "</a><br/>";
                    }
                }
                nCalendarsFound = nCalendarsFound + 1;
            }
            loRegio = null;
            loResource = null;
        }
        loCampaignResource.Free();
    }

    if(cAdviseurForActiveAppointment > "") {
        cActiveAdviseursHTML = "<b><a href='#SCRIPT_CALLMODULE?MODULE=CALENDAR.EXE&CALENDAR=" + cAdviseurForActiveAppointment + "&DISABLESWITCH'>" + cAdviseurForActiveAppointment + "</a></b><br/>" + cActiveAdviseursHTML;
        nCalendarsFound = nCalendarsFound + 1;
    }
    if(cAdviseurForPreviousAppointment > "") {
        cActiveAdviseursHTML = "<i><a href='#SCRIPT_CALLMODULE?MODULE=CALENDAR.EXE&CALENDAR=" + cAdviseurForPreviousAppointment + "&DISABLESWITCH'>" + cAdviseurForPreviousAppointment + "</a></i><br/>" + cActiveAdviseursHTML;
        nCalendarsFound = nCalendarsFound + 1;
    }

    if(nCalendarsFound==0) {
        cActiveAdviseursHTML = cActiveAdviseursHTML +  "<b>Er zijn geen adviseurs die op dit adres een afspraak willen</b></br>";
    } else {
        cActiveAdviseursHTML = "(Kies uit deze agenda's <b>vet is een actieve afspraak</b> en <i>italics is een oude afspraak</i>)<br/>" + cActiveAdviseursHTML;
    }

    loCampaign = null;
    loCampaignResources = null;
    loCampaignResource = null;

    return cActiveAdviseursHTML;
}

// Function    : FormatFieldZip
// Author      : Johan Bennink
// Date        : 06-02-2006
// Description : Formats a zip-code field in the Dutch format
// Parameters  : uField the name of a scriptfield
// 23-04-2014: converted to javascript
function formatFieldZip(uField) {
    var lcValue = getFieldValue(uField);
    var i = 0;
    while(i < lcValue.length) {
        if (isNumeric(lcValue.charAt(i))) {
            i = i + 1;
        } else {
            if(lcValue.charAt(i).toUpperCase() >= "A" && lcValue.charAt(i).toUpperCase()<="Z") {
                i = i + 1;
            } else {
                lcValue = lcValue.substr(0, i) + lcValue.substr(i+1);
            }
        }
    }
    if(lcValue.length == 6) {
        if (isNumeric(left(lcValue, 4)) && (lcValue.charAt(4).toUpperCase() >= "A" && lcValue.charAt(4).toUpperCase() <= "Z") && (lcValue.charAt(5).toUpperCase() >= "A" && lcValue.charAt(5).toUpperCase() <= "Z")) {
            lcValue = lcValue.substr(0, 4) + " " + lcValue.substr(4, 2).toUpperCase();
        }
    }
    setFieldValue(uField, lcValue);
}

function checkValidEmail(uField, lShowError) {
    var lResult = false;
    if (getFieldValue(uField) == "") {
        lResult = true;
    } else {
        if (isValidEmail(uField)) {
            lResult = true;
        } else {
            if (lShowError) {
                alert("Het opgegeven email adres is ongeldig! Maak het veld leeg of vul een geldig email adres in.");
            }
            lResult = false;
        }
    }
    return lResult;
}

function isValidDtm(uField, cFldDescr) {
    var lResult = false;
    if (getFieldValue(uField) == "") {
        lResult = true;
    } else {
        if (isValidDate(uField)) {
            // Nothing
            lResult = true;
        } else {
            if (cFldDescr > "") {
                alert("Dit is geen geldige " + cFldDescr + ". Maak het veld leeg\n of gebruik het datumformaat: dd-mm-jjjj");
            }
            lResult = false;
        }
    }
    return lResult;
}

// Function    : isValidDate
// Author      : Johan Bennink
// Date        : 23-04-2014
// Description : This function checks the specified scriptfield for a valid date. It recognises a valid Dutch date only...
// Parameters  : uField, a scriptfield.
// Returns     : True if a valid date was found, False otherwise
function isValidDate(uField) {
    var lResult = false;
    var lcValue = getFieldValue(uField);
    if (lcValue.length == 10) {
        var cDay = lcValue.substr(0, 2);
        var cMonth = lcValue.substr(3, 2);
        var cYear = lcValue.substr(6, 4);
        var baseDate = new Date(1900,1,1);
        var testDate = new Date(parseInt(cYear), parseInt(cMonth), parseInt(cDay));
        if (testDate > baseDate) lResult = true;
    }
    return lResult;
}

// Function    : isValidEmail
// Author      : Johan Bennink
// Date        : 05-09-2005
// Description : Controleert of de invoer een geldig email adres bevat. 
// Parameters  : uField the name of a scriptfield
// 23-04-2014: converted to javascript
function isValidEmail(uField) {
    var lResult = false;
    var lcValue = getFieldValue(uField);
    var lnIndex = 1;
    var lnDotFound = 0;
    var lnAtFound = 0;
    var lnFirstAtPos = 0;
    var lnLastDotPos = 0;
    var lnIllegalCharsFound = 0;
    while(lnIndex<=lcValue.length) {
        if(" !#$%^&*()+={}|\][:;'\"?/><,~`".indexOf(lcValue.charAt(lnIndex)) > 0) {
            lnIllegalCharsFound = lnIllegalCharsFound + 1;
        }
        if(lcValue.charAt(lnIndex)=="@") {
            lnAtFound = lnAtFound + 1;
            if(lnFirstAtPos == 0) {
                lnFirstAtPos = lnIndex;
            }
        }
        if(lcValue.charAt(lnIndex)==".") {
            lnDotFound = lnDotFound + 1;
            lnLastDotPos = lnIndex;
        }
        lnIndex = lnIndex + 1;
    }
    if((lnAtFound == 1) && (lnDotFound>0) && (lnIllegalCharsFound==0)) {
        if (lnFirstAtPos < lnLastDotPos) {
            lResult = true;
        } else {
            lResult = false;
        }
    }
    else {
        lResult = false;
    }
    return lResult;
}


// Function    : Dial
// Author      : Johan Bennink
// Date        : 1-1-2010
// Description : Bel het opgegeven telefoonummer
//
// Parameters  : cTelNr - Een geldig telefoonnummer
// Returns     : nothing
// 23-04-2014 converted to javascript
function Dial(cTelNr) {
    window.location="#SCRIPT_DIAL?TELNR=" + cTelNr
}

//
//
// Voorlopige plek voor support functies
//
function ToggleDisplay(oElement) {
    if(oElement.style.display=="") {
        oElement.style.display="none"
    } else {
        oElement.style.display=""
    }
}


function DisplayGenderText(uGenderField, uGenderDisplayField) {
    switch(getFieldValue(uGenderField))
    {
        case "M":
            cGenderText="meneer";
            break;
        case "V":
            cGenderText="mevrouw";
            break;
        case "O":
            cGenderText="familie";
            break;
        default:
            cGenderText="meneer/mevrouw";
            break;
    }
    setFieldValue(uGenderDisplayField,cGenderText);
}

function DagDeel() {
    var today = new Date();
    hourText = "";
    switch(today.getHours())
    {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
            hourText = "nacht";
            break;
        case 6:
        case 7:
        case 8:
        case 9:
        case 10:
        case 11:
            hourText = "morgen";
            break;
        case 12:
        case 13:
        case 14:
        case 15:
        case 16:
            hourText = "middag";
            break;
        case 17:
        case 18:
        case 19:
        case 20:
        case 21:
        case 22:
        case 23:
            hourText = "avond";
            break;
        default:
            hourText = "(onbekend)";
            break;
    }
    return hourText;
}


// Function    : setFieldCase
// Author      : Johan Bennink
// Date        : 08-12-2003
// Description : This function sets the value of the supplied field to cFormat
// Parameters  : uField the name of a scriptfield
//               cFormat - a format string containing the actions to be taken on the field
// 23-04-2014: convered to javascript
function setFieldCase(uField, cFormat) {
    lcValue = getFieldValue(uField);
    //
    // UPPERcase
    //
    if(cFormat.indexOf("/u")>=0) {
        lcValue = lcValue.toUpperCase();
    }
    //
    // lowercase
    //
    if(cFormat.indexOf("/l")>=0) {
        lcValue = lcValue.toLowerCase();
    }
    //
    // First caps
    //
    if(cFormat.indexOf("/m")>=0) {
        lcValue = left(lcValue,1).toUpperCase() + lcValue.substr(1).toLowerCase();
    }
    //
    // Proper (First-caps Lastnames)
    //
    if(cFormat.indexOf("/p")>=0) {
        lcValue = left(lcValue,1).toUpperCase() + lcValue.substr(1).toLowerCase();
        lUCaseChar = false;
        for(nIndex = 0; nIndex<lcValue.length;nIndex++) {
            if(lUCaseChar == true) {
                lcValue = lcValue.substr(0,nIndex) + lcValue.charAt(nIndex).toUpperCase() + lcValue.substr(nIndex+1);
            }
            if(lcValue.charAt(nIndex) == " " || lcValue.charAt(nIndex) == "-" || lcValue.charAt(nIndex) == ".") {
                lUCaseChar = true;
            } else {
                lUCaseChar = false;
            }
        }
    }
    //
    // Initials opmaak
    //
    if(cFormat.indexOf("/I")>=0) {
        cSeperator = cFormat.charAt(cFormat.indexOf("/I")+2);
        switch (cSeperator.toUpperCase()) {
            case "":
                cSeperator = ".";
                break;
            case "/":
                cSeperator = ".";
                break;
            case "D":
                cSeperator = ".";
                break;
            case "S":
                cSeperator = " ";
                break;
            case "X":
                cSeperator = "";
                break;
            default:
                // No change
                break;
        }
        // Determine Case conversion for Initials
        lcCharCase="";
        if(cFormat.indexOf("/u")>=0) {
            lcCharCase = "/u";
        }
        if(cFormat.indexOf("/l")>=0) {
            lcCharCase = "/l";
        }
        cInitials = "";
        for(nIndex = 0; nIndex<lcValue.length; nIndex++) {
            switch (lcCharCase) {
                case "/u":
                    cChar=lcValue.charAt(nIndex).toUpperCase();
                    break;
                case "/l":
                    cChar=lcValue.charAt(nIndex).toLowerCase();
                    break;
                default:
                    cChar=lcValue.charAt(nIndex);
                    break;
            }
            if((cChar >= "A" && cChar<="Z") || (cChar >= "a" && cChar <= "z")) {
                cInitials=cInitials+cChar+cSeperator;
            }
        }
        lcValue = cInitials;
    }
    //
    // Trim excess spaces
    //
    if(cFormat.indexOf("/t")>=0) {
        lcValue = lcValue.trim();
    }
  
    setFieldValue(uField, lcValue);
}

function CheckAndHighLightRequiredField(uField) {
    var lFieldOK = (getFieldValue(uField) > "");
    if(lFieldOK) {
        setFieldHighlight(uField, "black", "white");
    } else {
        setFieldHighlight(uField, "yellow", "red");
    }
    return lFieldOK;
}
