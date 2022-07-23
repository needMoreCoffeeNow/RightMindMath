var SCRIPT_PROP = PropertiesService.getScriptProperties(); // new property service

// start with aa_ to ensure at top of script run dropdown in scipt editor GUI
function aa_setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty('key', doc.getId());
    Logger.log('---start--- 5/28/1635');
    Logger.log(doc.getId());
}

// validate data functions
var g_v = (function() {
    //
    // validate specific m2 or d3 string (differnt r_str vs ASM)
    function validM2D3String(val_in) {
        var parts = val_in.split('^');
        // samples   d3^937/10^0   m2b^76x42^0   m2c^21x68^0
        if (parts.length !== 3) { return false; }
        if (!validINT(parts[2])) { return false; } // chunkit counter
        if (parts[0] === 'd3') {
            parts = parts[1].split('/');
        } else {
            parts = parts[1].split('x');
        }
        if (parts.length !== 2) { return false; }
        if (!validINT(parts[0])) { return false; }
        if (!validINT(parts[1])) { return false; }
        return true;
    }

    // validate ASM r_str
    function validASMString(val_in) {
        var parts = val_in.split('^');
        var header = parts[0].split('.');  // split idlevel.levelsCount.levelsTotal
        var eq = []; // split of equation e.g. 1|3|4|+
        var ans = []; // split answers
        var tries = []; // split an answer: intAnswer or tstamp_intAnswer (clicked)
        var i = 0;
        if (header.length !== 3) { return false; }
        if (!validINT(header[1]) || !validINT(header[2])) { return false; }
        if (header[0] === 'm1') {
            if (parts.length !== 4) { return false; }
            // ordered in slot 3 (index 2) must be either false
            if (['false', 'true'].indexOf(parts[2]) === -1) { return false; }
            ans = parts[3].split('|'); // m1 answers in slot 4 (index 3)
        } else {
            if (parts.length !== 3) { return false; }
            ans = parts[2].split('|'); //answers in slot 3 (index 2)
        }
        if (ans.length !== 4) {return false; }
        eq = parts[1].split('|');
        if (!validINT(eq[0])) { return false; }
        if (!validINT(eq[1])) { return false; }
        if (!validINT(eq[2])) { return false; }
        if (eq[3].length > 1) { return false; }
        if ('+-x'.indexOf(eq[3]) === -1) { return false; }
        for (i=0; i<4; i++) {
            tries = ans[i].split('_');
            if (tries.length > 2) { return false; }
            if (!validINT(tries[0])) { return false; }
            if (tries.length === 1) { continue; }
            if (!validINT(tries[1])) { return false; }
        }
        return true;
    }

    // initial handling of r_str essentially breaking out m2/d3 vs. ASM steps
    function validRstring(val_in) {
        var parts = val_in.split('^');
        var sub2 = val_in.substr(0, 2);
        var sub3 = val_in.substr(0, 3);
        var asm_levels = ['a1', 'a2', 'a3', 's1', 's2', 's3', 'm1'];
        if (sub2 === 'm2b' || sub2 === 'm2c' || sub3 === 'd3') {
            return validM2D3String(val_in);
        }
        if (asm_levels.indexOf(sub2) === -1) { return false; }
        return validASMString(val_in);
    }

    // make sure arg is an int without any changes eg. parseInt(12b34,  10) = 12
    function validINT(num_in) {
        var my_int = parseInt(num_in, 10);
        var my_int_str = '' + my_int;
        var num_in_str = '' + num_in;
        if (isNaN(my_int)) { return false; }
        if (num_in_str !== my_int_str) { return false; }
        return true;
    }

    // validate device
    function validDevice(val_in) {
        var temp = [];
        // structure = mac.952
        temp = val_in.split('.');
        if (temp.length !== 2) { return false; }
        if(temp[0].length > 20) { return false; }
        if (!validINT(temp[1])) { return false; }
        return true;
    }

    // validate device (30 chars or less) and iduser combination)
    function validDeviceIduser(val_in) {
        var temp = [];
        // structure = mac.952_442135493
        temp = val_in.split('_');
        if (temp.length !== 2) { return false; }
        if (!validINT(temp[1])) { return false; }
        temp = temp[0].split('.');
        if (temp.length !== 2) { return false; }
        if(temp[0].length > 20) { return false; }
        if (!validINT(temp[1])) { return false; }
        return true;
    }

    // validate idsession which is two or three ints separated by _
    function validIdsession(val_in) {
        var temp = [];
        // structure = m2+d3i: 1658157789752_2 or ASM1-3: 1658157755851_1_1
        temp = val_in.split('_');
        if (temp.length < 2 || temp.length > 3) { return false; }
        if (!validINT(temp[0])) { return false; }
        if (!validINT(temp[1])) { return false; }
        if (temp.length === 2) { return true; }
        if (!validINT(temp[2])) { return false; }
        return true;
    }

    // walk thru each of the possible idlevels to verify
    function validIdlevel(val_in) {
        if (val_in === 'a1') { return true; }
        if (val_in === 'a2') { return true; }
        if (val_in === 'a3') { return true; }
        if (val_in === 's1') { return true; }
        if (val_in === 's2') { return true; }
        if (val_in === 's3') { return true; }
        if (val_in === 'm1') { return true; }
        if (val_in === 'm2b') { return true; }
        if (val_in === 'm2c') { return true; }
        if (val_in === 'd3') { return true; }
        return false;
    }

    // validate all session recs in array returned by Google Sheet
    function validDataArray(data_in) {
        var td = {}; //temp dict parsed from each data_in rec
        var devs_ids = {}; // stored valid device_iduser
        var my_e = ''; // error string
        var my_v = null; // temporary dict value
        var recs = []; // store the #### delimited recs from data_in
        var data = []; // store the tstamp^^^^dict split for each data_in rec
        var i = 0;
        var len = 0;
        var err = null;
        try {
            recs = data_in.split('####');
            len = recs.length;
        } catch (err) {
            my_e = 'ERR00:try0';
            len = -1; // skip upcoming loop
        }
        for (i=0; i<len; i++) {
            if (my_e.length > 0) { break; }
            data = recs[i].split('^^^^');
            if (!validINT(data[0])) { my_e = 'ERR00'; continue; }
            try {
                td = JSON.parse(decodeURI(data[1]));
            } catch (err) {
                my_e = 'ERR00:try1';
                break;
            }
            // ERR01: device_iduser = mac.952_442135493
            my_v = td.device_iduser;
            if (!my_v) { my_e = 'ERR01'; continue; } // does not exist
            if (!devs_ids[my_v]) { // not previously proofed
                if (!validDeviceIduser(my_v)) { my_e = 'ERR01'; continue; }
                devs_ids[td.device_iduser] = true; // save proof
            }
            // ERR02: idsession = 1653751651154_2 or 1658157755851_1_1
            my_v = td.idsession;
            if (!my_v) { my_e = 'ERR02'; continue; }
            if (!validIdsession(my_v)) { my_e = 'ERR02'; continue; }
            // ERR03: iduser = 243184381
            my_v = td.iduser;
            if (!my_v) { my_e = 'ERR03'; continue; }
            if (!validINT(my_v)) { my_e = 'ERR03'; continue; }
            // ERR04: elapsed = 1431
            my_v = td.elapsed;
            if (!my_v) { my_e = 'ERR04'; continue; }
            if (!validINT(my_v)) { my_e = 'ERR04'; continue; }
            // ERR05: time = 2431
            my_v = td.time;
            if (!my_v) { my_e = 'ERR05'; continue; }
            if (!validINT(my_v)) { my_e = 'ERR05'; continue; }
            // ERR06: tries = 4
            my_v = td.tries;
            if (!my_v) { my_e = 'ERR06'; continue; }
            if (!validINT(my_v)) { my_e = 'ERR06'; continue; }
            // ERR07: tstamp =  1658157757460
            my_v = td.tstamp;
            if (!my_v) { my_e = 'ERR07'; continue; }
            if (!validINT(my_v)) { my_e = 'ERR07'; continue; }
            // ERR08: idlevel =  a1, a2, a3, s1, s2, s3, m1, m2, d3
            my_v = td.idlevel;
            if (!my_v) { my_e = 'ERR08'; continue; }
            if (!validIdlevel(my_v)) { my_e = 'ERR08'; continue; }
            // ERR09: r_str
            my_v = td.r_str;
            if (!my_v) { my_e = 'ERR09'; continue; }
            if (!validRstring(my_v)) { my_e = 'ERR09'; continue; }
        }
        return [my_e.length === 0, my_e];
    }

//
// >>> VALIDATE:end
    return {
        validDataArray: validDataArray,
        validDevice, validDevice
    };
})();



// g_s = provide common tool for  lock, doc, sheet, returns, and updates
var g_s = (function() {
    var lock = null; // public lock
    var doc = null; // doc from openById using scrip property key
    var sheet = null; // sheet from getSheetByName
    var resultDict = {'result':'', 'value':'', 'error':'' };
    var resultStr = ''; // will be set to JSON.stringify of result
    var c_err = null; // used for try/catch error
    // setters
    function setLock() {
        lock = LockService.getDocumentLock(); // released only in returnSrcJS
        lock.waitLock(3000);  // wait 3 seconds before defeat
        if (!lock) {
            setResult('ERR', '', 'lockNF');
            return false;
        } else {
            setResult('OK', 'lock', '');
            return true;
        }
    }
    function setDoc() {
        try {
            doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty('key'));
        } catch(c_err) {
            setResult('ERR', '', 'openById');
            return false;
        }
        if (!doc) {
            setResult('ERR', '', 'docNF');
            return false;
        } else {
            setResult('OK', 'doc', '');
            return true;
        }
    }
    function setSheet(sheet_name) {
        try {
            sheet = doc.getSheetByName(sheet_name);
        } catch(c_err) {
            setResult('ERR', '', 'getSheetByName');
            return false;
        }
        if (!sheet) {
            setResult('ERR', '', 'sheetNF');
            return false;
        } else {
            setResult('OK', 'sheet', '');
            return true;
        }
    }
    function setResult(result_in, value_in, error_in) {
        // NOTE: result_in must be either OK or ERR
        resultDict = {'result':'', 'value':'', 'error':'' }
        resultDict.result = result_in;
        resultDict.error = error_in;
        resultDict.value = value_in;
        resultStr = JSON.stringify(resultDict);
    }
    // processing functions
    function returnSrcJS() {
        var mime_t = ContentService.MimeType.JAVASCRIPT;
        var src = 'function syncResponseGS() { return(';
        src += resultStr;
        src += '); }';
        if (lock) { lock.releaseLock(); } // lock may not always be set
        return ContentService.createTextOutput(src).setMimeType(mime_t);
    }
    // processing functions
    function returnResultStr() {
        var mime_t = ContentService.MimeType.JAVASCRIPT;
        if (lock) { lock.releaseLock(); } // lock may not always be set
        return ContentService.createTextOutput(resultStr).setMimeType(mime_t);
    }
    function buildDeviceTstamps() {
        var range = sheet.getRange(1, 3);
        var values = range.getValues();
        var devhist = values[0][0];
        var dlist = devhist.split('#');
        var i = 0;
        var len = dlist.length;
        var parts = [];
        var tstamps = {};
        for (i=0; i<len; i++) {
            parts = dlist[i].split('_');
            tstamps[parts[0]] = parseInt(parts[1], 10);
        }
        return tstamps;
    }
    function addDataRows(device, datastr) {
        var tstamps = buildDeviceTstamps();
        var tstamp_max = tstamps.hasOwnProperty(device) ?  tstamps[device] : 0;
        var range = sheet.getDataRange();
        var values = range.getValues();
        var d_new = [];
        var d_add = datastr.split('####');
        var parts = [];
        var i = 1; // data starts in row 2 so array index starts at 1
        var len = values.length;
        var err = null; // try/catch error
        // save all non-device, and "earlier" device recs
        // Data cols are: 0=device, 1=tstamp, 2=json rec
        for (i=1; i<len; i++) {
            // not the device so save it
            if (values[i][0] !== device) {
                d_new.push(values[i]);
                continue;
            }
            // this device, but earlier than tstamp_max
            if (values[i][1] <= tstamp_max) {
                d_new.push(values[i]);
                continue;
            }
        }
        // add the new data from datastr
        len = d_add.length;
        for (i=0; i<len; i++) {
            parts = d_add[i].split('^^^^');
            try {
                d_new.push([
                    device,
                    parseInt(parts[0], 10),
                    parts[1]
                ]);
            } catch(err) {
              continue;
            }
        }
        // clear all existing data starting in row2 (three cols wide)
        if (values.length > 1) {
            range = sheet.getRange(2, 1, values.length, 3);
            range.clearContent();
        }
        // write the new data starting in row 2 (three cols wide)
        range = sheet.getRange(2, 1, d_new.length, 3);
        range.setValues(d_new);
    }
    function getDownloadRows(device, tstamps) {
        var range = sheet.getDataRange();
        var values = range.getValues();
        var tstamp_max = null;
        var data = [];
        var data_str = '';
        var i = 1; // data starts in row 2 so array index starts at 1
        var len = values.length;
        for (i=1; i<len; i++) {
            // do not process recs for the device making request
            if (values[i][0] === device) { continue; }
            // look up device in tstamps dict received
            tstamp_max = tstamps[values[i][0]];
            // if not device max tstamp then add and continue
            if (!tstamp_max) {
                data.push(values[i][2]);
                continue;
            }
            // only add row if tstamp is g.t. device max tstamp received
            if (values[i][1] > tstamp_max) {
                data.push(values[i][2]);
            }
        }
        data_str = encodeURI(JSON.stringify(data));
        setResult('OK', data_str, '');
        return returnSrcJS();
    }
    function updateDeviceTstampMax(device, tstamp_max) {
        var range = sheet.getRange(1, 3);
        var tstamps = buildDeviceTstamps();
        var key = null;
        var output = [];
        var mystamp = '';
        tstamps[device] = tstamp_max;
        for (key in tstamps) {
            mystamp = '' + tstamps[key];
            if (mystamp === 'NaN') { continue; }
            output.push(key + '_' + mystamp);
        }
        range.setValue(output.join('#'));
    }
    // getters
    function getLock()  { return lock; }
    function getDoc()   { return doc; }
    function getSheet() { return sheet; }
    // return dict for accessing functions
    return {
        // setters
        setLock : setLock,
        setDoc : setDoc,
        setSheet : setSheet,
        setResult : setResult,
        // processing functions
        returnSrcJS : returnSrcJS,
        returnResultStr : returnResultStr,
        buildDeviceTstamps : buildDeviceTstamps,
        addDataRows : addDataRows,
        updateDeviceTstampMax : updateDeviceTstampMax,
        getDownloadRows : getDownloadRows,
        // getters
        getLock : getLock,
        getDoc : getDoc,
        getSheet : getSheet
    };
})();

// write tstamp to B1
// sets resultDict to ERR does not set OK
// returns true/false NOT g_s.returnSrcJS
function writeTimeStamp(e) {
    var e_tstamp = e.parameter['tstamp'];
    var range = g_s.getSheet().getRange('B1');
    if (!e_tstamp) {
        g_s.setResult('ERR', '', 'tstampNF');
        return false;
    }
    range.setValue(e_tstamp);
    return true
}

// validates pwd against B1 setting 
// sets g_s.resultDict to ERR does not set OK
// returns true/false NOT g_s.returnSrcJS
function pwdValid(e_pwd) {
    var range = g_s.getSheet().getRange(1, 1);
    var values = range.getValues();
    var pwd = values[0][0];
    if (pwd !== e_pwd) {
        g_s.setResult('ERR', '', 'pwd');
        return false;
    }
    return true;
}

// quick read/return of a device last max tstamp value (C1)
function handleGetDeviceTstamp(e) {
    var tstamps = g_s.buildDeviceTstamps();
    var device = e.parameter['device'];
    if (!device) {
        g_s.setResult('ERR', '', 'deviceNF');
        return g_s.returnSrcJS();
    }
    if (device in tstamps) {
        g_s.setResult('OK', tstamps[device], '');
    } else {
        g_s.setResult('OK', 0, '');
    }
    return g_s.returnSrcJS();
}

// read the confirmation timestamp value from cell B1
function handleGetConfirmationTstamp() {
    var range = g_s.getSheet().getRange(1, 2);
    var values = range.getValues();
    g_s.setResult('OK', values[0][0], '');
    return g_s.returnSrcJS();
}

// handle remainder of link test after doGet's lock, doc, sheet checks
// sets g_s.resultDict to ERR does not set OK
// returns g_s.returnSrcJS
function handleLinkTest(e) {
    var e_pwd = e.parameter['pwd'];
    if (!pwdValid(e_pwd)) { return g_s.returnSrcJS(); }
    if (!writeTimeStamp(e)) { return g_s.returnSrcJS(); }
    g_s.setResult('OK', 'handleLinkTest', '');
    return g_s.returnSrcJS();
}

function controlAvailable() {
    var cntl_sheet = null;
    var c_err = null;
    var range = null;
    try {
        cntl_sheet = g_s.getDoc().getSheetByName('control');
    } catch(c_err) {
        g_s.setResult('ERR', c_err.message, 'controlSheetMissing');
        return false;
    }
    if (!cntl_sheet) {
        g_s.setResult('ERR', '', 'controlSheetFalse');
        return false;
    }
    range = cntl_sheet.getRange(1, 1);
    if (range.getValue() !== 1) {
        g_s.setResult('ERR', range.getValue(), 'controlNotAvailable');
        return false;
    }
    return true;
}
function validSyncKey(sync_key_in) {
    var cntl_sheet = null;
    var c_err = null;
    var range = null;
    var my_key = '';
    try {
        cntl_sheet = g_s.getDoc().getSheetByName('control');
    } catch(c_err) {
        g_s.setResult('ERR', c_err.message, 'controlSheetMissing');
        return false;
    }
    if (!cntl_sheet) {
        g_s.setResult('ERR', '', 'controlSheetFalse');
        return false;
    }
    range = cntl_sheet.getRange(4, 1);
    my_key = range.getValue();
    if (my_key !== sync_key_in) {
        //g_s.setResult('ERR', 'sync_key_hidden', 'syncKey');
        g_s.setResult('ERR', 'sync_key_hidden', 'syncKey');
        return false;
    }
    return true;
}

function handleGetDownload(e) {
    var tstamps = {};
    var c_err = null;
    var device = e.parameter['device'];
    var e_pwd = e.parameter['pwd'];
    if (!device) {
        g_s.setResult('ERR', '', 'deviceNF')
        return g_s.returnSrcJS();
    }
    if (!pwdValid(e_pwd)) { return g_s.returnSrcJS(); }
    try {
        tstamps = JSON.parse(decodeURI(e.parameter['tstamps_max']));
    } catch(c_err) {
        g_s.setResult('ERR', '', 'tstamps_max');
        return g_s.returnSrcJS();
    }
    return g_s.getDownloadRows(device, tstamps);
}

// GET returns a result object as script.src file (avoids CORS fails) 
function doGet(e) {
    var sync_key = e.parameter['sync_key'];
    var idtype = e.parameter['idtype'];
    var sheet = e.parameter['sheet'];
    var e_pwd = e.parameter['pwd'];
    // check for must-have params else exit
    if (!sync_key) {
        g_s.setResult('ERR', '', 'sync_keyNF')
        return g_s.returnResultStr();
    }
    if (!idtype) {
        g_s.setResult('ERR', '', 'idtypeNF')
        return g_s.returnSrcJS();
    }
    if (!sheet) {
        g_s.setResult('ERR', '', 'sheetNF')
        return g_s.returnSrcJS();
    }
    // set lock, doc and sheet successfully else exit
    if (!g_s.setLock()) { return g_s.returnSrcJS(); }
    if (!g_s.setDoc()) { return g_s.returnSrcJS(); }
    // check control is available
    if (!controlAvailable()) { return g_s.returnSrcJS(); }
    // check for valid sync_key
    if (!validSyncKey(sync_key)) { return g_s.returnSrcJS(); }
    // finally get sheet
    if (!g_s.setSheet(sheet)) { return g_s.returnSrcJS(); }
    // process type of call
    if (idtype === 'getDownload') {
        return handleGetDownload(e);
    }
    if (idtype === 'getConfirmationTstamp') {
        return handleGetConfirmationTstamp();
    }
    if (idtype === 'getDeviceTstamp') {
        return handleGetDeviceTstamp(e);
    }
    if (idtype === 'linkTest') {
        return handleLinkTest(e);
    }
    g_s.setResult('ERR', '', 'idtypeNF')
    return g_s.returnSrcJS();
}

// POST
// post is only used to add sync data given limits on GET url size
// response will be read at client as an "opaque" JSON string - i.e. does
// trigger the callback, but no response text can be read by the client
function doPost(e) {
    var jsonString = e.postData.getDataAsString();
    e.parameter = JSON.parse(jsonString);
    var sync_key = e.parameter['sync_key'];
    var sheet = e.parameter['sheet'];
    var device = e.parameter['device'];
    var datastr = e.parameter['datastr'];
    var e_pwd = e.parameter['pwd'];
    var valid = false;
    // tstamp is the Date.now() variable used to check post completes OK
    var tstamp = e.parameter['tstamp'];
    //tstamp_max is the largest tstamp for all the session recs read
    var tstamp_max = e.parameter['tstamp_max'];
    if (!sync_key) {
        g_s.setResult('ERR', '', 'sync_keyNF')
        return g_s.returnResultStr();
    }
    if (!sheet) {
        g_s.setResult('ERR', '', 'sheetNF')
        return g_s.returnResultStr();
    }
    if (!device) {
        g_s.setResult('ERR', '', 'deviceNF')
        return g_s.returnResultStr();
    }
    if (!datastr) {
        g_s.setResult('ERR', '', 'datastrNF')
        return g_s.returnResultStr();
    }
    if (!tstamp) {
        g_s.setResult('ERR', '', 'tstampNF')
        return g_s.returnResultStr();
    }
    if (!tstamp_max) {
        g_s.setResult('ERR', '', 'tstamp_maxNF')
        return g_s.returnResultStr();
    }
    // set lock, doc and sheet successfully else exit
    if (!g_s.setLock()) { return g_s.returnResultStr(); }
    if (!g_s.setDoc()) { return g_s.returnResultStr(); }
    // check control is available
    if (!controlAvailable()) { return g_s.returnSrcJS(); }
    // check for valid sync_key
    if (!validSyncKey(sync_key)) { return g_s.returnSrcJS(); }
    // finally get sheet
    if (!g_s.setSheet(sheet)) { return g_s.returnResultStr(); }
    if (!pwdValid(e_pwd)) { return g_s.returnSrcJS(); }
    if (!g_v.validDevice(device)) {
        g_s.setResult('ERR', '', 'deviceInvalid')
        return g_s.returnResultStr();
    }
    valid = g_v.validDataArray(datastr);
    if (!valid[0]) {
        g_s.setResult('ERR', '', 'datastr:' + valid[1]);
        return g_s.returnResultStr();
    }
    g_s.addDataRows(device, datastr);
    g_s.updateDeviceTstampMax(device, tstamp_max);
    if (!writeTimeStamp(e)) { return g_s.returnResultStr(); }
    g_s.setResult('OK', tstamp, '');
    return g_s.returnResultStr();
}
