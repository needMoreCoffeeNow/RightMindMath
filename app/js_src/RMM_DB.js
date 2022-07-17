var RMM_DB = (function() {
    var mydoc = window.document;
    var db_active = false; // set to true when opend DB is successful
    var db = null;
    var rw_session = null;
    var RW = 'readwrite';
    var db_result = null; // stores the request results
    var db_error = false;
    var db_complete = false;
    var db_upgrade = false;
    var DB_MILLI_STD = 10; // standard wait time to check for db_result
    var timervar = null; // use for setTimeout and clearTimeout functions
    var VERSION = 1; // indexedDB version - only change to force upgrade
    var IDSETUP = 1;
    var IDGUEST = 10884293110550;
    var pass_caller = ''; // set to function name to help passError debuging
    // async
    var MAX_TRIES = 100; // limit on how many waits for db_complete
    var DB_MILLI_STD = 10; // standard wait time to check for db_result
    var DB_MILLI_LONG = 50; // standard wait time to check for db_result
    var db_next_function = null; //next function once db_complete = true
    var db_wait_tries_std = 800; // std arg to set MAX_TRIES in dbSetWaitVars
    var db_tries_count = 0;
    var count_delete = 0; // counts the number of cursor deletes
    var device = null; // set to the current device

    // RMM_CFG shortcuts start
    function getStr(id) { return RMM_CFG.getStr(id); }
//
// >>> --------------------------------OPEN:Start
//

    // processes run before fully functional main page displays
    function init() {
        console.warn('db.init()');
        console.log(Date.now(), 'Date.now()');
        var req = null;
        if (!window.indexedDB) {
            alert(getStr('MSG_db_not_supported'));
        } else { 
            transactionInit();
            timervar = window.setTimeout(dbWait, DB_MILLI_LONG);
            console.log('init open next');
            req = window.indexedDB.open('rmm_db', VERSION);
            req.onsuccess = dbhandleOpenSuccess;
            req.onerror = dbhandleOpenError;
            req.onupgradeneeded = dbhandleOpenUpgrade;
        }
    }

    // handle db open upgrade
    function dbhandleOpenUpgrade(ev) {
        console.log('dbhandleOpenUpgrade(ev)');
        var old_version = ev.oldVersion;
        var new_version = ev.newVersion;
        var db_session = null;
        var db_user = null;
        var db_setup = null;
        var db_print = null;
        var req = null;
        if (old_version !== new_version) { db_upgrade = true; }
        db = ev.target.result;
        if (old_version < 1) {
            db_session = db.createObjectStore('session', { keyPath: 'idsession' });
            db_session.createIndex('iduser', 'iduser', { unique: false });
            db_session.createIndex('idlevel', 'idlevel', { unique: false });
            db_session.createIndex('device_iduser', 'device_iduser', { unique: false });
            db_user = db.createObjectStore('user', { keyPath: 'iduser' });
            db_user.createIndex('name', 'name', { unique: true });
            db_setup = db.createObjectStore('setup', { keyPath: 'idkey' });
            db_setup = db.createObjectStore('print', { keyPath: 'idprint' });
        }
    }

    // handle db open success
    function dbhandleOpenSuccess(ev) {
        console.log('dbhandleOpenSuccess(ev)');
        db = ev.target.result;
        db_active = true;
        if (db_upgrade) {
            // write guest user rec first time DB is setup only
            if (VERSION < 2) { dbupgradeWriteUser(); }
            if (VERSION == 2) {
                // need to add future upgrade logic herersion2();
            }
            db_upgrade = false;
        } else {
            db_complete = true;
        }
    }

    // handle db open error
    function dbhandleOpenError(ev) {
        console.log('dbhandleOpenError(ev)');
        console.error('Database error:'  + ev.target.errorCode); //KEEPIN
    }

    // write the Guest user record in new DB Note: after upgrade only
    function dbupgradeWriteUser(ev) {
        console.log('dbupgradeWriteUser(ev)');
        var obj = objectstoreGet('user', true);
        var req = null;
        var data = { iduser:IDGUEST, 'name':getStr('DAT_guest')};
        if (!obj) { return; }
        transactionInit();
        req = obj.add(data);
        req.onsuccess = function(ev) {
            console.log('db.user.added:  ' + getStr('DAT_guest'));
            dbupgradeWriteSetup(data);
        }
        req.onerror = function(ev) {
            alert('ERR: dbupgradeWriteUser id=' + getStr('DAT_guest'));
            db_error = true;
        }
    }

    // initial pdata values
    function pdataInit() {
        console.log('pdataInit()');
        var pdata = {
            'module' : null,
            'digits' : null,
            'subneg_pct' : 0,
            'subtopneg_pct' : 0,
            'addneg_pct' : 0,
            'addtopneg_pct' : 0,
            'subborrow' : null,
            'm1_digit' : null,
            'm1_order' : null,
            'm1_row1_max' : null,
            'm1_row1_min' : null,
            'shnote_numpos' : true,
            'shnote_next' : true,
            'shnote_carry' : true,
            'shnote_chunk' : true,
            'shnote_borrow' : true,
            'shnote_bpopup' : true
        };
        return pdata;
    }

    // write the setup record in new DB Note: after upgrade only
    function dbupgradeWriteSetup(data_user) {
        console.log('dbupgradeWriteSetup(ev)');
        var obj = objectstoreGet('setup', true);
        var req = null;
        var pdata = pdataInit();
        var data = { idkey : IDSETUP, 
                     iduser : data_user.iduser,
                     name : data_user.name,
                     pdata : pdata,
                     device : null,
                     sync_key : ''};
        if (!obj) { return; }
        transactionInit();
        req = obj.add(data);
        req.onsuccess = function(ev) {
            console.log('db.user.added:  ' + getStr('DAT_guest'));
            initLastStep();
        }
        req.onerror = function(ev) {
            alert('ERR: dbupgradeWriteSetup id=' + getStr('DAT_guest'));
            db_error = true;
        }
    }

    // final step in init process - must be called only by last init function
    function initLastStep() {
        console.log('initLastStep()');
        db_complete = true;
    }
//
// >>> OPEN:End
//
//
// >>> --------------------------------ASYNC:Start
//
    // wait for db_complete to be true, then proceed to next function
    function dbWait() {
        console.log('dbWait()');
        window.clearTimeout(timervar);
        db_tries_count += 1;
        if (db_tries_count > MAX_TRIES) {
            alert(getStr('MSG_db_timeout'));
            return;
        }
        if (!db_active || !db_complete) {
            timervar = window.setTimeout(dbWait, DB_MILLI_STD);
            return;
        }
        // do a second clear to try to avoid console violation timer msg
        window.clearTimeout(timervar);
        db_next_function();
    }

    // set the db_wait variables
    function dbSetWaitVars(tries, next_fnc) {
        console.log('dbSetWaitVars(tries, next_fnc)');
        MAX_TRIES = tries;
        db_tries_count = 0;
        db_next_function = next_fnc;
    }
//
// >>> ASYNC:End
//
//
// >>> --------------------------------COMMON:Start
//

    // create an objectStore variable for DB transactions
    function objectstoreGet(store, readwrite) {
        //////console.log('----objectstoreGet(store) + store = ' + store); //KEEPIN
        if (!db_active) {
            console.warn('DB NOT ACTIVE');
            return null;
        }
        if (readwrite) {
            return db.transaction([store], RW).objectStore(store);
        } else {
            return db.transaction([store]).objectStore(store);
        }
    }

    // initialize db transaction fields
    function transactionInit() {
        //////console.log('transactionInit()');  //KEEPIN
        db_complete = false;
        db_error = false;
        db_result = null;
    }
//
// >>> COMMON:End
//
// >>> --------------------------------READS:Start
//

    // read setup
    function readSetup(id) {
        console.log('readSetup(id)' + 'id=' + id);
        var obj = objectstoreGet('setup', true);
        var req = null;
        if (!obj) { return; }
        timervar = window.setTimeout(dbWait, DB_MILLI_STD);
        transactionInit();
        req = obj.get(id);
        req.onsuccess = function(ev) {
            db_result = req.result;
            db_complete = true;
        }
        req.onerror = function(ev) {
            alert('ERR: readSetup id=' + id);
            db_error = true;
        }
    }

    // get the tstamp_max for each device for an iduser
    function sessionDeviceMaxTstamps(iduser_in) {
        console.log('sessionDeviceMaxTstamps(iduser_in)');
        var obj = objectstoreGet('session', true);
        var req = null;
        var myindex = null;
        var myrange = null;
        var cursor_req = null;
        var cursor = null;
        var data = {};
        var my_device = '';
        var tstamps = {};
        var date_now = Date.now();
        var i = 0;
        if (!obj) { return; }
        timervar = window.setTimeout(dbWait, DB_MILLI_STD);
        transactionInit();
        myindex = obj.index('iduser');
        myrange = IDBKeyRange.only(iduser_in);
        cursor_req = myindex.openCursor(myrange);
        cursor_req.onsuccess = function(ev) {
            cursor = ev.target.result;
            if (cursor) {
                i += 1;
                data = cursor.value;
                my_device = data['device_iduser'].split('_')[0];
                if (tstamps[my_device]) {
                    if (data['tstamp'] > tstamps[my_device]) {
                        tstamps[my_device] = data['tstamp'];
                    }
                } else {
                    tstamps[my_device] = data['tstamp'];
                }
                cursor.continue();
            } else {
                console.warn(tstamps, i);
                console.warn(Date.now() - date_now, 'milliseconds to run');
                db_result = tstamps;
                db_complete = true;
                db_next_function();
            }
        }
        cursor_req.onerror = function(ev) {
            alert('ERR: sessionDeviceMaxTstamps:' + table + ' : ' + 'ival=' + ival);
            db_result = {};
            db_error = true;
        }
        console.warn('DONE');
    }

    // read table using an index filter
    function sessionDeviceUserGet(tstamp_in, ival) {
        console.log('sessionDeviceUserGet(tstamp_in, ival)');
        var obj = objectstoreGet('session', true);
        var req = null;
        var myindex = null;
        var myrange = null;
        var cursor_req = null;
        var cursor = null;
        var recs = [];
        var data = {};
        var date_start = Date.now();
        var total_recs = 0;
        if (!obj) { return; }
        //timervar = window.setTimeout(dbWait, DB_MILLI_LONG * 100);
        transactionInit();
        myindex = obj.index('device_iduser');
        myrange = IDBKeyRange.only(ival);
        cursor_req = myindex.openCursor(myrange);
        cursor_req.onsuccess = function(ev) {
            total_recs += 1;
            cursor = ev.target.result;
            if (cursor) {
                data = cursor.value;
                if (data['tstamp'] > tstamp_in) {
                    recs.push(data);
                }
                cursor.continue();
            } else {
                console.warn('sessionDeviceUserGet finished');
                console.warn(total_recs, Date.now() - date_start, 'total_recs, milliseconds to run');
                db_result = recs;
                db_complete = true;
                db_next_function();
            }
        }
        cursor_req.onerror = function(ev) {
            alert('ERR: sessionDeviceUserGet:' + table + ' : ' + 'ival=' + ival);
            db_result = {};
            db_error = true;
        }
    }

    // read table using an index filter
    function getRecByIndex(table, iname, ival) {
        console.log('getRecByIndex(table, iname, ival)');
        var obj = objectstoreGet(table, true);
        var req = null;
        var myindex = null;
        if (!obj) { return; }
        timervar = window.setTimeout(dbWait, DB_MILLI_STD);
        transactionInit();
        myindex = obj.index(iname); 
        req = myindex.get(ival);
        req.onsuccess = function(ev) {
            db_result = req.result;
            db_complete = true;
        }
        req.onerror = function(ev) {
            alert('ERR: getRecByIndex:' + table + ' : ' + 'ival=' + ival);
            db_result = {};
            db_error = true;
        }
    }

    // read iduser
    function readIduser(id) {
        console.log('readIduser(id)');
        var obj = objectstoreGet('user', true);
        var req = null;
        if (!obj) { return; }
        timervar = window.setTimeout(dbWait, DB_MILLI_STD);
        transactionInit();
        req = obj.get(id);
        req.onsuccess = function(ev) {
            db_result = req.result;
            db_complete = true;
        }
        req.onerror = function(ev) {
            alert('ERR: readIduser id=' + id);
            db_result = {};
            db_error = true;
        }
    }

    // getAll recs for any tabler
    function tableGetAll(table) {
        console.log('tableGetAll(table)');
        var obj = objectstoreGet(table, true);
        var req = null;
        if (!obj) { return; }
        transactionInit();
        timervar = window.setTimeout(dbWait, DB_MILLI_STD);
        req = obj.getAll();
        req.onsuccess = function(ev) {
            db_result = ev.target.result;
            db_complete = true;
        }
        req.onerror = function(ev) {
            alert('ERR: tableGetAll table=' + table);
            db_error = true;
        }
    }

    function rollupRec(data, id_curr, eq_time, date_now) {
        //console.log('----------------------------------------------------------rollupRec(data, id_curr, eq_time)');
        var date_eq = parseInt(id_curr.split('_'), 10);
        var day_milli = (1000*60*60*24);
        var basic = 'a1_s1_m1';
        var digit = [];
        var rec = {'idsession' : id_curr,
                   'iduser' : data.iduser,
                   'idlevel' : data.idlevel,
                   'elapsed' : data.elapsed,
                   'time' : eq_time,
                   'equation' : data.r_str.split('^')[1],
                   'days' : Math.floor((date_now - date_eq) / day_milli)
                   };
        // if m2 then we break out basic (m2b) & chunk (m2c)
        if (rec.idlevel === 'm2') {
            rec.idlevel = data.r_str.split('^')[0];
        }
        if (rec.idlevel === 'm1') {
            rec.idlevel += data.r_str.split('^')[1].split('|')[0];
            rec['ordered'] = data.r_str.split('^')[2] === 'true';
        }
        if (basic.indexOf(rec.idlevel.substr(0, 2)) > -1) {
            rec['tries'] = data.tries;
        }
        return rec;
    }

    // getAll recs for any tabler
    function sessionGetAllRollup(iduser, modnum, divmsg) {
        console.log('sessionGetAllRollup(iduser)');
        var obj = objectstoreGet('session', true);
        var req = null;
        var cursor = null;
        var txt = getStr('TXT_data_loading');
        var txt_count = '';
        var count_read = 0;
        var basic = 'a1_s1_m1_m2b_m2c_d3';
        var recs = [];
        var rec_last = {};
        var eq_time = 0;
        var id_curr = '';
        var id_last = '';
        var multi = false;
        var write_active = false;
        var data = null;
        var date_now = Date.now();
        var total_recs = 0;
        if (!obj) { return; }
        transactionInit();
        //timervar = window.setTimeout(dbWait, DB_MILLI_LONG * 10);
        count_read = 0;
        obj.openCursor().onsuccess = function(ev) {
            cursor = ev.target.result;
            if (cursor) {
                total_recs += 1;
                write_active = true;
                // handle info msg update fist
                count_read += 1;
                if (count_read % modnum === 0) {
                    txt_count = txt.replace('REPLACE_count', count_read);
                    mydoc.getElementById(divmsg).innerHTML = txt_count;
                }
                // save last rec's data if last rec was multi-step
                if (id_last !== '') {
                    rec_last = rollupRec(data, id_last, eq_time, date_now);
                }
                data = cursor.value;
                id_curr = data.idsession.split('_');
                id_curr = id_curr[0] + '_' + id_curr[1];
                // skip recs not matching iduser
                if (iduser !== null) {
                    if (data.iduser !== iduser) { cursor.continue; }
                }
                if (basic.indexOf(data.idlevel) > -1) {
                    // basic one-digit problems have only one rec per problem
                    if (multi) {
                        recs.push(rec_last);
                    }
                    multi = false;
                    eq_time = data.time;
                    id_last = '';
                } else {
                    // accumulate time for multi-step a2, a3, s2, s3 problems
                    multi = true;
                    eq_time += data.time;
                    // if id_last is not '', then it is second or later step
                    if (id_last !== '') {
                       if (id_curr !== id_last) {
                            // new problem following multi-step problem
                            recs.push(rec_last);
                            id_last = '';
                            eq_time = data.time;
                        }
                    } else {
                        id_last = id_curr;
                    }
                }
                if (!multi) {
                    recs.push(rollupRec(data, id_curr, eq_time, date_now));
                    eq_time = 0;
                    id_last = '';
                }
                cursor.continue();
            } else {
                if (!write_active) {
                    db_result = [];
                } else {
                    // if very last rec was last step of a multi add a rec
                    if (multi) {
                        recs.push(rollupRec(data, id_curr, eq_time, date_now));
                    }
                    db_result = recs;
                }
                db_complete = true;
                console.warn('sessionGetAllRollup finished');
                console.warn(total_recs, Date.now() - date_now, 'total_recs, milliseconds to run');
                db_next_function();
            }
        }
    }
//
// >>> READS:End
//
// >>> --------------------------------TRANS:Start
//

    // add session record for recursive adds
    function addSessionRecRecursive(data, my_callback) {
        //////console.log('addSessionRecRecursive(data, my_callback)'); //KEEPIN
        var obj = objectstoreGet('session', true);
        var req = null;
        if (!obj) {
            my_callback(null, false);
            return;
        }
        transactionInit();
        req = obj.add(data);
        req.onsuccess = function(ev) {
            my_callback(ev, true);
        }
        req.onerror = function(ev) {
            console.log('ERROR: addSessionRecRecursive=' + data.idsession);
            console.log(ev);
            my_callback(ev, false);
        }
    }

    // add session record
    function addSessionRec(data) {
        console.error('addSessionRec(data)');
        var obj = objectstoreGet('session', true);
        var req = null;
        if (!obj) { return; }
        transactionInit();
        req = obj.add(data);
        req.onsuccess = function(ev) {
            console.log('addSessionRec idsession=' + data.idsession);
            console.warn(data, 'data');
            db_complete = true;
        }
        req.onerror = function(ev) {
            console.error('ERROR: addSessionRec idsession=' + data.idsession); //KEEPIN
            console.error(ev); //KEEPIN
            alert('ERR: addSessionRec idsession=' + data.idsession);
            db_error = true;
        }
    }

    // set pdata in setup table
    function setupPdataSet(my_iduser, pdata) {
        console.log('setupPdataSet(pdata)');
        var obj = objectstoreGet('setup', true);
        var req = null;
        var data = null;
        if (!obj) { return; }
        req = obj.get(my_iduser);
        req.onsuccess = function(ev) {
            data = req.result;
            data['pdata'] = pdata;
            req = obj.put(data);
            req.onsuccess = setupSnapshotPdataSet(my_iduser, pdata);
            pass_caller = 'setupPdataSet';
            req.onerror = transErrorPass(ev);
        }
        req.onerror = function(ev) {
            alert('ERR: setupPdataSet id=' + my_iduser);
        }
    }

    // set pdata for non-IDSETUP iduser in setup table
    function setupSnapshotPdataSet(my_iduser, pdata) {
        console.log('setupSnapshotPdataSet(my_iduser, pdata)');
        var my_iduser = RMM_ASM.getIduser();
        var obj = objectstoreGet('setup', true);
        var req = null;
        var data = null;
        if (!my_iduser || my_iduser === IDSETUP || my_iduser === IDGUEST) {
            return;
        }
        if (!obj) { return; }
        req = obj.get(my_iduser);
        req.onsuccess = function(ev) {
            data = req.result;
            data['pdata'] = pdata;
            req = obj.put(data);
            req.onsuccess = transSuccessPass(ev);
            pass_caller = 'setupSnapshotPdataSet';
            req.onerror = transErrorPass(ev);
        }
        req.onerror = function(ev) {
            alert('ERR: setupSnapshotPdataSet id=' + my_iduser);
        }
    }

    // set or read user pdata snapshot
    function setupUserSnapshot(my_iduser) {
        console.log('setupUserSnapshot()');
    }

    // update a record based on field provided in dict
    function updateRecord(table, idrec, dict) {
        console.log('updateRecord(table, dict)');
        var obj = objectstoreGet(table, true);
        var req = null;
        var data = null;
        var key = null;
        if (!obj) { return; }
        req = obj.get(idrec);
        req.onsuccess = function(ev) {
            transactionInit();
            timervar = window.setTimeout(dbWait, DB_MILLI_LONG);
            data = req.result;
            for (key in dict) {
                data[key] = dict[key];
            }
            req = obj.put(data);
            req.onsuccess = function(ev) {
                db_result = data;
                db_complete = true;
            }
            req.onerror = function(ev) {
                db_result = null;
                db_error = true;
            }
        }
        req.onerror = function(ev) {
            alert('ERR: updateRecord=' + IDSETUP);
        }
    }

    // set pdata in setup table
    function setupParametersUpdate(dict) {
        console.log('setupParametersUpdate(dict)');
        var obj = objectstoreGet('setup', true);
        var req = null;
        var data = null;
        var key = null;
        if (!obj) { return; }
        req = obj.get(IDSETUP);
        req.onsuccess = function(ev) {
            transactionInit();
            timervar = window.setTimeout(dbWait, DB_MILLI_LONG);
            data = req.result;
            for (key in dict) {
                data[key] = dict[key];
            }
            req = obj.put(data);
            req.onsuccess = function(ev) {
                db_result = data;
                db_complete = true;
            }
            req.onerror = function(ev) {
                db_result = null;
                db_error = true;
            }
        }
        req.onerror = function(ev) {
            alert('ERR: setupParametersUpdateid=' + IDSETUP);
        }
    }
    
    // delete recs using a cursor either all, or matching a key value
    function deleteRecs(table, key_name, key_value, store, modnum, divmsg) {
        console.log('deleteRecs(table, key_name, key_value, store, modnum, divmsg)');
        console.log(table, key_name, key_value, store, modnum, divmsg, 'table, key_name, key_value, store, modnum, divmsg');
        var obj = objectstoreGet(table, true);
        var req = null;
        var del_req = null;
        var cursor = null;
        var do_delete = false;
        var count_read = 0;
        var txt = getStr('TXT_data_deleting');
        var txt_count = '';
        if (!obj) { return; }
        transactionInit();
        timervar = window.setTimeout(dbWait, DB_MILLI_LONG);
        count_delete = 0;
        obj.openCursor().onsuccess = function(ev) {
            cursor = ev.target.result;
            if (cursor) {
                count_read += 1;
                if (divmsg.length > 0 && count_read % modnum === 0) {
                    txt_count = txt.replace('REPLACE_count', count_read);
                    mydoc.getElementById(divmsg).innerHTML = txt_count;
                }
                do_delete = false;
                // key_value is null means a delete all call
                if (key_name === null) {
                    do_delete = true;
                } else {
                    // check for key_name & key_value
                    if (cursor.value[key_name] === key_value) {
                        do_delete = true;
                    }
                }
                if (do_delete) {
                    if (store) {db_result = cursor.value; }
                    del_req = cursor.delete();
                    del_req.onsuccess = function(ev) { count_delete += 1; }
                }
                cursor.continue();
            } else {
                if (!store) { db_result = count_delete; }
                db_complete = true;
            }
        }
        obj.onerror = function(ev) {
            console.log('deleteRecs openCursor onerror for: ' + table);
            db_result = 0;
            db_error = true;
        }
    }

    // add a table record
    function addRecord(table, data) {
        console.log('addRecord(table, data)');
        var obj = objectstoreGet(table, true);
        if (!obj) { return; }
        transactionInit();
        timervar = window.setTimeout(dbWait, DB_MILLI_LONG);
        req = obj.add(data);
        req.onsuccess = function(ev) {
            console.log('addRecord success');
            db_complete = true;
            db_result = data;
        }
        req.onerror = function(ev) {
            console.log('ERR: addRecord');
            db_error = true;
        }
    }

    // do nothing but console log for trans success without async followup
    function transSuccessPass(ev) {
        console.log('transSuccessPass(ev)');
        console.log(ev);
    }

    // do nothing but console log for trans error without async followup
    function transErrorPass(ev) {
        console.log('transErrorPass(ev)');
        if (ev.type === 'success') { return; }
        alert('transErrorPass() from: ' + pass_caller);
    }

    // set the sync_key value in the DB setup record
    function updateSyncKey(sync_key_in) {
        console.log('updateSyncKey()');
        var obj = objectstoreGet('setup', true);
        var req = null;
        var data = null;
        if (!obj) { console.error('no obj in updateSyncKey'); return; } //KEEPIN
        req = obj.get(IDSETUP);
        req.onsuccess = function(ev) {
            data = req.result;
            data['sync_key'] = sync_key_in;
            req = obj.put(data);
            req.onsuccess = function(ev) {
                console.warn(data['sync_key'], data['sync_key'].length, ' setup[sync_key] updated');
            }
            req.onerror = function(ev) {
                alert(getStr('MSG_sync_key_update_failed') + ' [obj.put]');
            }
        }
        req.onerror = function(ev) {
            req.onerror = console.error('sync_key NOT SET : req.onerror'); //KEEPING
        }
    }
//
// >>> TRANS:End
//
//
// >>> --------------------------------GETSET:Start
//

    // getter for db_active
    function getDbActive() {
        return db_active;
    }

    // getter for db_complete
    function getDbComplete() {
        return db_complete;
    }

    // getter for db_error
    function getDbError() {
        return db_error;
    }

    // getter for db_result
    function getDbResult() {
        console.log('getDbResult()');
        return db_result;
    }

    // return IDGUEST
    function getIDGUEST() {
        return IDGUEST;
    }

    // set device
    function setDevice(device_in) {
        device = device_in;
    }

    // set db_next_function
    function setDbNextFunction(func_in) {
        db_next_function = func_in;
    }

    // return device
    function getDevice() {
        return device;
    }

//
// >>> GETSET:end
//
    return {
        init : init,
        // getters & setters
        getDbActive : getDbActive,
        getDbComplete : getDbComplete,
        getDbResult : getDbResult,
        getDbError : getDbError,
        getIDGUEST : getIDGUEST,
        setDevice : setDevice,
        getDevice : getDevice,
        setDbNextFunction : setDbNextFunction,
        // transactions
        addSessionRec : addSessionRec,
        addSessionRecRecursive : addSessionRecRecursive,
        setupPdataSet : setupPdataSet,
        setupParametersUpdate : setupParametersUpdate,
        updateRecord : updateRecord,
        addRecord : addRecord,
        deleteRecs : deleteRecs,
        updateSyncKey : updateSyncKey,
        // async
        dbWait : dbWait,
        dbSetWaitVars : dbSetWaitVars,
        // reads
        readSetup : readSetup,
        sessionGetAllRollup : sessionGetAllRollup,
        tableGetAll : tableGetAll,
        getRecByIndex : getRecByIndex,
        pdataInit : pdataInit,
        readIduser : readIduser,
        // sync
        sessionDeviceUserGet : sessionDeviceUserGet,
        sessionDeviceMaxTstamps : sessionDeviceMaxTstamps
    };
})();
