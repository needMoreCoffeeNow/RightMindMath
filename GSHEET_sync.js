var SCRIPT_PROP = PropertiesService.getScriptProperties(); // new property service

// start with aa_ to ensure at top of script run dropdown in scipt editor GUI
function aa_setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty('key', doc.getId());
    Logger.log('---start--- 5/28/1635');
    Logger.log(doc.getId());
}

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
function pwdValid(e) {
    var e_pwd = e.parameter['pwd'];
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
    if (!pwdValid(e)) { return g_s.returnSrcJS(); }
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

function handleGetDownload(e) {
    var tstamps = {};
    var c_err = null;
    var device = e.parameter['device'];
    if (!device) {
        g_s.setResult('ERR', '', 'deviceNF')
        return g_s.returnSrcJS();
    }
    if (!pwdValid(e)) { return g_s.returnSrcJS(); }
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
    var idtype = e.parameter['idtype'];
    var sheet = e.parameter['sheet'];
    // check for must-have params else exit
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
    var sheet = e.parameter['sheet'];
    var device = e.parameter['device'];
    var datastr = e.parameter['datastr'];
    // tstamp is the Date.now() variable used to check post completes OK
    var tstamp = e.parameter['tstamp'];
    //tstamp_max is the largest tstamp for all the session recs read
    var tstamp_max = e.parameter['tstamp_max'];
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
    // finally get sheet
    if (!g_s.setSheet(sheet)) { return g_s.returnResultStr(); }
    g_s.addDataRows(device, datastr);
    g_s.updateDeviceTstampMax(device, tstamp_max);
    if (!writeTimeStamp(e)) { return g_s.returnResultStr(); }
    g_s.setResult('OK', tstamp, '');
    return g_s.returnResultStr();
}
