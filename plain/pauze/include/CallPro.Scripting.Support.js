function bmnr_transfer() {
    var loScriptAction = goCallPro.GetScriptAction();
    var loScriptParams = loScriptAction.CreateParams();
    var lcCommand = "SCRIPT_REGDONOTCALL";
    var llResult = loScriptAction.ExecCommand(lcCommand, loScriptParams);
    loScriptAction = null;
    loScriptParams = null;
    return llResult;
}

function left(str, n) {
    if (n <= 0)
        return "";
    else if (n > String(str).length)
        return str;
    else
        return String(str).substring(0, n);
}
function right(str, n) {
    if (n <= 0)
        return "";
    else if (n > String(str).length)
        return str;
    else {
        var iLen = String(str).length;
        return String(str).substring(iLen, iLen - n);
    }
}

function isNumeric(strString)
    //  check for valid numeric strings	
{
    var strValidChars = "0123456789.-";
    var strChar;
    var blnResult = true;

    if (strString.length == 0) return false;

    //  test strString consists of valid characters listed above
    for (var i = 0; i < strString.length && blnResult == true; i++)
    {
        strChar = strString.charAt(i);
        if (strValidChars.indexOf(strChar) == -1)
        {
            blnResult = false;
        }
    }
    return blnResult;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// OUDE Lib-CallproInfo
//
// CallPro Scripting functions
//

//
// Function    : GetCampaignNotesTable
// Author      : J. Bennink (Calway Nederland b.v.)
// Version     : 1.00
// Description : Deze functie geeft een html table terug met de notities die op een Campagne zijn inegsteld.
//
// Parameters  : nCampaignID - Het CallPro ID nummer van de campagne
//
function GetCampaignNotesTable(cTitle, nCampaignID) {
    var loScript, loResFactory, loCampaign

    var loScript = goCallPro.GetScript();
    var loResFactory = goCallPro.GetResourceFactory();
    var loCampaign = loResFactory.CreateCampaign(nCampaignID, true);

    var loNotesList = loCampaign.GetNotesList();
    llResult = loNotesList.Requery();
    if (loNotesList.Count > 0) {
        lcNotes = "<table class=\"envision\">";
        if (cTitle > "") {
            lcNotes += "<thead><th><strong>" + cTitle + "</strong></th></thead>"
        }
        for (var nNotes = 1; nNotes <= loNotesList.Count; nNotes++) {
            var loNote = loNotesList.GetChild(nNotes);
            //
            // BNK-16-11-2006: Speciaal geval voor systeem notities die beginnen met SYS_
            // Deze notities wroden hier niet weergegeven. Ik wil deze tijdelijk gebruiken als variabelen
            // zolang er binnen Callpro geen ander optie voor is.
            //
            var noteResDescr = loNote.ResDescr;
            if ((loNote.DisplayOn & 1) == 0) {
                // Dit is een variabele die we niet als notitie weergeven voor de pauze pagina!
            } else {
                lcNotes = lcNotes + "<tr";
                if ((nNotes / 2) == 0) {
                    lcNotes += " class=\"row-a\"";
                } else {
                    lcNotes += " class=\"row-b\"";
                }
                lcNotes += "><td>";
                if ((loNote.ToDate > new Date()) || (loNote.ToDate == null)) {
                    if (loNote.FromDateDescr != "Geen") {
                        lcNotes += loNote.FromDateDescr + ":";
                    }
                    if (loNote.ToDateDescr != "Geen") {
                        lcNotes += " t/m " + loNote.ToDateDescr;
                    }
                    if (loNote.FromDateDescr != "Geen" || loNote.ToDateDescr != "Geen") {
                        lcNotes += ":";
                    }
                    lcNotes += "<b>" + loNote.ResDescr + "</b><br>";
                    lcNotes += loNote.Notes;
                }
                lcNotes = lcNotes + "</td></tr>";
            }
            var loNote = null;
        }
        lcNotes += "</table>";
    } else {
        lcNotes = "";
    }
    loCampaign.Free()

    return lcNotes
}

// ==================================================================================================================
//
// BEGIN-BLOK: AGENT STATISTIEKEN
//
// ==================================================================================================================
function GetFieldLabel(tcField) {
    switch (tcField) {
        case "CLID":
            return "Bellijst";
        case "STATID":
            return "Status";
        case "CAMPAIGNID":
            return "Campagne";
        default:
            return tcField;
    }
}

function GetDescription(toObject) {
    if (toObject.ResDescr == "") {
        return toObject.ResnameShortPath;
    } else {
        return toObject.ResDescr;
    }
}

//
// Function    : GetAgentCallListStatisticsForStatID
// Author      : J. Bennink (Calway Nederland b.v.)
// Version     : 1.00
// Description : Deze functie geeft het aantal STATID afcoderingen van vandaag weer voor de huidige agent voor ene specifieke bellijst.
//
// Parameters  : tnStatID - Belopdrachtstatus
//
function GetAgentCallListStatisticsForStatID(tnStatID, tnCLID) {
    var loScript = goCallPro.GetScript();
    var loResFactory = goCallPro.GetResourceFactory();
    nCount = 0;

    if (loScript.GetAgent() != null) {
        var loAgent = loScript.GetAgent();
        var loCollection1 = loAgent.GetAttemptsGroupedBy("CLID");

        loCollection1.oFilter.SetValue("BeginDate", new Ddate());

        for (var nIndex = 1; nIndex <= loCollection1.Count; nIndex++) {
            var loObject1 = loCollection1.GetChild(nIndex);
            if (loObject1.ResID == tnCLID) {
                var loCollection2 = loObject1.GetAttemptsGroupedBy("STATID");

                for (var j = 1; j <= loCollection2.Count; j++) {
                    var loObject2 = loCollection2.GetChild(j);
                    if (loObject2.ResID == tnStatID) {
                        nCount = nCount + loObject2.ResultCountDescr;
                    }
                }
            }
        }
    }
    return nCount;
}

//
// Function    : GetAgentStatisticsForStatID
// Author      : J. Bennink (Calway Nederland b.v.)
// Version     : 1.00
// Description : Deze functie geeft het aantal STATID afcoderingen van vandaag weer voor de huidige agent.
//
// Parameters  : tnStatID - Belopdrachtstatus
//
function GetAgentStatisticsForStatID(tnStatID) {
    var loScript = goCallPro.GetScript();
    var loResFactory = goCallPro.GetResourceFactory();
    nCount = 0;

    if (loScript.GetAgent() != null) {
        var loAgent = loScript.GetAgent();
        var loCollection1 = loAgent.GetAttemptsGroupedBy("STATID");

        loCollection1.oFilter.SetValue("BeginDate", new Date());

        for (var nIndex = 1; nIndex <= loCollection1.Count; nIndex++) {
            var loObject1 = loCollection1.GetChild(nIndex);
            if (loObject1.ResID == tnStatID) {
                nCount = nCount + loObject1.ResultCountDescr;
            }
        }
    }
    return nCount;
}

//
// Function    : GetAgentStatisticsTable
// Author      : J. Bennink (Calway Nederland b.v.)
// Version     : 1.00
// Description : Deze functie geeft een html table terug met de agent belpogingen statistieken.
//
// Parameters  : tcField1, tcField2 - Velden waarop de groupering wordt gemaakt.
//				tdBeginDate - De datum Vanaf waar de statistieken moeten worden berekend.
//
function GetAgentStatisticsTable(tcField1, tcField2, tdBeginDate) {
    var loScript = goCallPro.GetScript();
    var loResFactory = goCallPro.GetResourceFactory();
    lcText = "";

    if (loScript.GetAgent() != null) {
        var loAgent = loScript.GetAgent();
        var loCollection1 = loAgent.GetAttemptsGroupedBy(tcField1);

        // BNK-25-09-2013: toISOString() is not supported by pre-IE10 browsers
        // ORIGINAL:
        // loCollection1.oFilter.SetValue("BeginDate", tdBeginDate.toISOString());
        // TEMP CHANGE:
        tcBeginDate = tdBeginDate.getFullYear() + "-" + (tdBeginDate.getMonth() + 1) + "-" + tdBeginDate.getDate();
        loCollection1.oFilter.SetValue("BeginDate", tcBeginDate);

        lcText = "<table class=\"envision striped\">";
        lcText += "<thead><th>" + GetFieldLabel(tcField1);
        if (tcField2 != "") {
            lcText += " / " + GetFieldLabel(tcField2);
        }
        lcText += "</th><th>Aantal</th></thead>";
        //lcText += "<thead><th colspan=\"2\">Periode vanaf " + tdBeginDate.toString() + "</th></thead>";
        lcText += "<tbody>";
        lcRowClass = "row-a";
        for (var nIndex = 1; nIndex <= loCollection1.Count; nIndex++) {
            lcText += "<tr class='" + lcRowClass + "'>";
            var loObject1 = loCollection1.GetChild(nIndex);
            lcText += "<td><strong>" + GetDescription(loObject1) + "</strong></td><td class=\"count right\"><strong>" + loObject1.ResultCountDescr + "</strong></td></tr>";
            if (tcField2 != "") {
                var loCollection2 = loObject1.GetAttemptsGroupedBy(tcField2);
                for (var j = 1; j <= loCollection2.Count; j++) {
                    var loObject2 = loCollection2.GetChild(j);
                    //if ("456789".indexOf(loObject2.ResName.substr(0, 1)) > 0) {
                    lcText += "<tr><td>" + GetDescription(loObject2) + "</td><td class=\"count right\">" + loObject2.ResultCountDescr + "</td></tr>";
                    //}
                }
            }
            if (lcRowClass == "row-a")
                lcRowClass = "row-b"
            else
                lcRowClass = "row-a";
        }

        lcText += "</tbody>";
        lcText += "<tfoot><tr><td>Totaal</td><td class=\"count right\"><strong>" + loCollection1.GetTotalResultCount() + "</strong></td></tr></tfoot>";
        lcText += "</table>";
    }    
    return lcText;
}


//
// Function    : GetAgentStatisticsTodayTable
// Author      : J. Bennink (Calway Nederland b.v.)
// Version     : 1.00
// Description : Deze functie geeft een html table terug met de agent belpogingen statistieken van vandaag
//
// Parameters  : tcField1, tcField2 - Velden waarop de groupering wordt gemaakt.
//
function GetAgentStatisticsTodayTable(tcField1, tcField2) {
    var tBeginOfDay = new Date();
    tBeginOfDay.setHours(0);
    tBeginOfDay.setMinutes(0);
    tBeginOfDay.setSeconds(0);
    return GetAgentStatisticsTable(tcField1, tcField2, tBeginOfDay);
}


// ==================================================================================================================
//
// END-BLOK: AGENT STATISTIEKEN
//
// ==================================================================================================================

//
// Function    : GetCampaignNote
// Author      : J. Bennink (Calway Nederland b.v.)
// Version     : 1.00
// Description : Deze functie geeft een enkele notitie terug op basis van de omschrijving
//
// Parameters  : nCampaignID - Het CallPro ID nummer van de campagne
//				cDescr      - De omschrijving van de notitie die we willen hebben
//
function GetCampaignNote(nCampaignID, cDescr) {
    var loScript, loResFactory, loCampaign

    var loScript = goCallPro.GetScript();
    var loResFactory = goCallPro.GetResourceFactory();
    var loCampaign = loResFactory.CreateCampaign(nCampaignID, true);

    var loNotesList = loCampaign.GetNotesList();
    llResult = loNotesList.Requery();
    lcNote = "";
    for (var nNotes = 1; nNotes <= loNotesList.Count; nNotes++) {
        var loNote = loNotesList.GetChild(nNotes);
        if (loNote.ResDescr.toUpperCase() == cDescr.toUpperCase()) {
            // Dit is de variabele die we zoeken
            lcNote += loNote.Notes;
        }
        var loNote = null;
    }
    loCampaign.Free();

    return lcNote;
}

//
// Function    : GetCampaignVariable
// Author      : J. Bennink (Calway Nederland b.v.)
// Version     : 2.00
// Description : Deze functie geeft een een campagne notitie terug met als naam SYS_<parameter>. Zo kunnen we 
//				campagne variabelen gebruiken zoalang Callpro hiervoor nog geen standaard oplossing voor heeft!
//
// Parameters  : nCampaignID - Het CallPro ID nummer van de campagne
//		tcVariabele - De naam van de variabele die we willen uitlezen
//
// v2.00 : BNK-12-04-2010: Major update: Kijk eerst of er een 'Variable' is en dan pas bij het Informatiebord zodat we langzaam kunnen migreren
//
function GetCampaignVariable(nCampaignID, tcVariable) {
    var loScript, loResFactory, loCampaign;

    var loScript = goCallPro.GetScript();
    var loResFactory = goCallPro.GetResourceFactory();
    var loCampaign = loResFactory.CreateCampaign(nCampaignID, True);

    // BNK-12-04-2010: Eerst kijken bij Variables op de campagne
    var loVariables = loCampaign.GetResvariables();
    if (loVariables.ChildExists(tcVariable)) {
        lcNote = loVariables.GetChildValueByName(tcVariable);
    } else {
        // Geen Variable, kijk dan bij in het Informatiebord
        var loNotesList = loCampaign.GetNotesList();
        llResult = loNotesList.Requery();
        lcNote = "";
        for (var nNotes = 1; nNotes <= loNotesList.Count; nNotes++) {
            var loNote = loNotesList.GetChild(nNotes);
            if (loNote.ResDescr.toUpperCase() == "SYS_" + tcVariable.toUpperCase()) {
                // Dit is de variabele die we zoeken
                lcNote += loNote.Notes;
            }
            var loNote = null;
        }
        var loNotesList = null;
    }
    var loVariables = null;
    loCampaign.Free();

    return lcNote;
}
