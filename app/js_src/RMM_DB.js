var RMM_DB = (function() {
    var mydoc = window.document;
    var rw_session = null;
    var RW = 'readwrite';
    var timervar = null; // use for setTimeout and clearTimeout functions
    var IDSETUP = 1;
    var pass_caller = ''; // set to function name to help passError debuging
    // async
    var MAX_TRIES = 100; // limit on how many waits for db_complete
    var DB_MILLI_LONG = 500; // standard wait time to check for db_result
    var db_next_function = null; //next function once db_complete = true
    var db_wait_tries_std = 800; // std arg to set MAX_TRIES in dbSetWaitVars
    var db_tries_count = 0;
    var count_delete = 0; // counts the number of cursor deletes
    var device = null; // set to the current device
    //exportDB
    var tables = ['print', 'setup', 'user', 'session'];
    var tables_done = 0; // used to index which tables have been exported
    var exportDB_txt = ''; // text file with exportDB table heards and json data
    var exportDB_fname = ''; // export fnme ending _YYYYMMDDHHMMSS.txt
    var exportDB_failed = false;
    // indexedDB variables
    const DB_NAME = 'rmm_db';
    var VERSION = 1;
    var IDGUEST = 10884293110550;
    var db = null;
    var db_active = false;
    var db_complete = false;
    var db_error = false;
    var db_result = null;
    var db_load_active = false;

    // RMM_CFG shortcuts start
    function getStr(id) { return RMM_CFG.getStr(id); }
//
// >>> --------------------------------OPEN:Start
//
    /**
     * Master Initialization Sequence
     * Coordinates database startup, user migration approval, and standard post-setup steps.
     */
    async function init() {
        console.warn('db.init()');
        console.log(Date.now(), 'Date.now()');
        try {
            // 1. Initialize variables and wait for database setup to finish completely
            transactionInit();
            await openDB();
            console.log('Database successfully connected and schema checks complete.');
            // 2. Prompt user for external data restore
            if (confirm(getStr('MSG_exportDBLoadFile')) === true) {
                // PATH A: User confirmed file upload. Run import and bypass standard seed.
                db_load_active = true;
                // Safe fallback DOM handling (handles 'mydoc' or 'document')
                const docContext = typeof mydoc !== 'undefined' ? mydoc : document;
                const infoDiv = docContext.getElementById('div_info');
                if (infoDiv) infoDiv.style.display = 'none';
                console.log('exportDBLoadFile confirmed. Executing file import...');
                if (typeof exportDBLoadFile === 'function') {
                    exportDBLoadFile();
                }
            } else {
                // PATH B: User declined upload. Process standard new-database installations.
                console.log('Export file load declined. Processing standard database seeding...');
                if (VERSION < 2) { 
                    await dbupgradeWriteUser(); 
                }
                if (VERSION === 2) {
                    // Future v2 data migration pathways go here
                }
                if (typeof RMM_STATSLIVE !== 'undefined' && RMM_STATSLIVE.loadSessionData) {
                    RMM_STATSLIVE.loadSessionData();
                }
                db_complete = true;
            }
        } catch (error) {
            console.error('Critical error during database initialization sequence:', error);
        }
    }
    /**
     * Resets tracking fields for an operational database transaction cycle
     */
    function transactionInit() {
        db_complete = false;
        db_error = false;
        db_result = null;
    }
    /**
     * Promise wrapper around the native IndexedDB open event loop
     */
    function openDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                alert(getStr('MSG_db_not_supported'));
                return reject(new Error('IndexedDB is not supported by this browser.'));
            }
            console.log('init open next');
            const req = window.indexedDB.open(DB_NAME, VERSION);
            // Synchronously handle structural schema migrations when version updates
            req.onupgradeneeded = (ev) => {
                console.log('dbhandleOpenUpgrade(ev)', ev);
                const upgradeDb = ev.target.result;
                const old_version = ev.oldVersion;
                const new_version = ev.newVersion;
                console.log('old_version:', old_version, 'new_version:', new_version);
                if (old_version < 1) {
                    const db_session = upgradeDb.createObjectStore('session', { keyPath: 'idsession' });
                    db_session.createIndex('iduser', 'iduser', { unique: false });
                    db_session.createIndex('idlevel', 'idlevel', { unique: false });
                    db_session.createIndex('device_iduser', 'device_iduser', { unique: false });
                    const db_user = upgradeDb.createObjectStore('user', { keyPath: 'iduser' });
                    db_user.createIndex('name', 'name', { unique: true });
                    // FIXED: Separate assignments preserve both objectStores securely
                    const db_setup = upgradeDb.createObjectStore('setup', { keyPath: 'idkey' });
                    const db_print = upgradeDb.createObjectStore('print', { keyPath: 'idprint' });
                    console.warn('------------------------------------version setup complete');
                }
            };
            req.onsuccess = (ev) => {
                console.log('dbhandleOpenSuccess(ev)');
                db = ev.target.result;
                db_active = true;
                resolve(db);
            };
            req.onerror = (ev) => {
                console.log('dbhandleOpenError(ev)');
                console.error('Database error: ' + ev.target.errorCode);
                reject(ev.target.error);
            };
        });
    }

    /**
     * Handles seeding the initial Guest user record down into the datastore safely
     */
    async function dbupgradeWriteUser() {
        console.log('dbupgradeWriteUser() invoking write...');
        if (!db) {
            console.error('Database connection reference lost during seeding.');
            return;
        }
        const data = { 
            iduser: IDGUEST, 
            name: getStr('DAT_guest')
        };
        transactionInit();
        try {
            // Run internal write logic natively using an isolated transaction promise block
            await new Promise((resolve, reject) => {
                const tx = db.transaction(['user'], 'readwrite');
                const store = tx.objectStore('user');
                const req = store.add(data);

                req.onsuccess = () => resolve();
                req.onerror = (ev) => reject(ev.target.error);
            });
            console.log('db.user.added: ' + getStr('DAT_guest'));
            // Advance to subsequent setup writing if defined down-chain
            if (typeof dbupgradeWriteSetup === 'function') {
                dbupgradeWriteSetup(data);
            }
        } catch (err) {
            alert('ERR: dbupgradeWriteUser id=' + getStr('DAT_guest'));
            db_error = true;
            console.error('Failed to seed guest database entry:', err);
        }
    }

    // processes run before fully functional main page displays
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
            'm1_digit' : 1,
            'm1_order' : 'ordered',
            'm1_row1_max' : 10,
            'm1_row1_min' : 0,
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
            timervar = window.setTimeout(dbWait, DB_MILLI_LONG);
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
        //console.log('----objectstoreGet(store) + store = ' + store); //KEEPIN
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
        transactionInit();
        req = obj.get(id);
        req.onsuccess = function(ev) {
            db_result = req.result;
            db_complete = true;
            db_next_function();
        }
        req.onerror = function(ev) {
            alert('ERR: readSetup id=' + id);
            db_error = true;
            db_next_function();
        }
    }

    // get the tstamp_max for each device for an iduser
    function sessionDeviceMaxTstamps(iduser_in) {
        //console.log('sessionDeviceMaxTstamps(iduser_in)');
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
                return;
            }
        }
        cursor_req.onerror = function(ev) {
            alert('ERR: sessionDeviceMaxTstamps:' + table + ' : ' + 'ival=' + ival);
            db_result = {};
            db_error = true;
            db_next_function();
            return;
        }
    }

    // read table using an index filter
    function sessionDeviceUserGet(tstamp_in, ival) {
        console.log('sessionDeviceUserGet(tstamp_in, ival)', tstamp_in, ival);
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
                console.warn(total_recs, Date.now() - date_start, '--------------------------------total_recs, milliseconds to run');
                db_result = recs;
                db_complete = true;
                db_next_function();
                return;
            }
        }
        cursor_req.onerror = function(ev) {
            alert('ERR: sessionDeviceUserGet:' + table + ' : ' + 'ival=' + ival);
            db_result = {};
            db_error = true;
            db_next_function();
            return;
        }
    }

    // read table using an index filter
    function getRecByIndex(table, iname, ival) {
        console.log('getRecByIndex(table, iname, ival)');
        var obj = objectstoreGet(table, true);
        var req = null;
        var myindex = null;
        if (!obj) { return; }
        transactionInit();
        myindex = obj.index(iname); 
        req = myindex.get(ival);
        req.onsuccess = function(ev) {
            db_result = req.result;
            db_complete = true;
            db_next_function();
        }
        req.onerror = function(ev) {
            alert('ERR: getRecByIndex:' + table + ' : ' + 'ival=' + ival);
            db_result = {};
            db_error = true;
            db_next_function();
        }
    }

    // read iduser
    function readIduser(id) {
        console.log('readIduser(id)');
        var obj = objectstoreGet('user', true);
        var req = null;
        if (!obj) { return; }
        transactionInit();
        req = obj.get(id);
        req.onsuccess = function(ev) {
            db_result = req.result;
            db_complete = true;
            db_next_function();
        }
        req.onerror = function(ev) {
            alert('ERR: readIduser id=' + id);
            db_result = {};
            db_error = true;
            db_next_function();
        }
    }

    // getAll recs for any tabler
    function tableGetAll(table) {
        console.log('tableGetAll(table)');
        var obj = objectstoreGet(table, true);
        var req = null;
        if (!obj) { return; }
        transactionInit();
        req = obj.getAll();
        req.onsuccess = function(ev) {
            db_result = ev.target.result;
            db_complete = true;
            db_next_function();
        }
        req.onerror = function(ev) {
            alert('ERR: tableGetAll table=' + table);
            db_error = true;
            db_next_function();
        }
    }

    function rollupRec(data, id_curr, eq_time, date_now) {
        //console.log('----------------------------------------------------------rollupRec(data, id_curr, eq_time, date_now)');
        //console.log(data);
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
        console.log('sessionGetAllRollup(iduser, modnum, divmsg)');
        console.log(iduser, '=iduser');
        var obj = objectstoreGet('session', true);
        var req = null;
        var cursor = null;
        var txt = getStr('TXT_data_loading');
        var txt_count = '';
        var count_read = 0;
        var count_skip = 0;
        var count_unique = 0;
        var count_multi = 0;
        var count_user = 0;
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
                // iduser == null gets all records
                if (iduser !== null) {
                    if (data.iduser !== iduser) {
                        count_skip += 1;
                        cursor.continue;
                    }
                }
                if (basic.indexOf(data.idlevel) > -1) {
                    // basic one-digit problems have only one rec per problem
                    if (multi) {
                        recs.push(rec_last);
                    }
                    multi = false;
                    eq_time = data.time;
                    id_last = '';
                    count_unique += 1;
                } else {
                    // accumulate time for multi-step a2, a3, s2, s3 problems
                    multi = true;
                    count_multi += 1;
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
                count_user += 1;
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
                console.warn('count_skip: ', count_skip);
                console.warn('count_unique: ', count_unique);
                console.warn('count_multi: ', count_multi);
                console.warn('count_user: ', count_user);
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
        //console.log('addSessionRecRecursive(data, my_callback)'); //KEEPIN
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
        console.log('addSessionRec(data)');
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
            data = req.result;
            for (key in dict) {
                data[key] = dict[key];
            }
            req = obj.put(data);
            req.onsuccess = function(ev) {
                db_result = data;
                db_complete = true;
                db_next_function();
                return;
            }
            req.onerror = function(ev) {
                db_result = null;
                db_error = true;
                db_next_function();
                return;
            }
        }
        req.onerror = function(ev) {
            alert('ERR: updateRecord=' + IDSETUP);
            db_next_function();
            return;
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
            data = req.result;
            for (key in dict) {
                data[key] = dict[key];
            }
            req = obj.put(data);
            req.onsuccess = function(ev) {
                db_result = data;
                db_complete = true;
                db_next_function();
                return;
            }
            req.onerror = function(ev) {
                db_result = null;
                db_error = true;
                db_next_function();
                return;
            }
        }
        req.onerror = function(ev) {
            alert('ERR: setupParametersUpdateid=' + IDSETUP);
            db_next_function();
            return;
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
                db_next_function();
                return;
            }
        }
        obj.onerror = function(ev) {
            console.log('deleteRecs openCursor onerror for: ' + table);
            db_result = 0;
            db_error = true;
            db_next_function();
            return;
        }
    }

    // add a table record
    function addRecord(table, data) {
        console.log('addRecord(table, data)');
        var obj = objectstoreGet(table, true);
        if (!obj) { return; }
        transactionInit();
        req = obj.add(data);
        req.onsuccess = function(ev) {
            console.log('addRecord success');
            db_complete = true;
            db_result = data;
            db_next_function();
        }
        req.onerror = function(ev) {
            console.log('ERR: addRecord');
            db_error = true;
            db_next_function();
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
            req.onerror = console.error('sync_key NOT SET : req.onerror'); //KEEPIN
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
        //console.log('setDbnextFunction', func_in);
        db_next_function = func_in;
    }

    // return device
    function getDevice() {
        return device;
    }

//
// >>> GETSET:end
//
//
// >>> DEVELOPER: start
//

    // use to reset device_iduser when you want to download
    // very large datasets generated on other devices
    // and treat them (e.g. test Sync Upload) as if from 
    // current device
    function developerResetSessionDevice() {
        console.log('developerResetSessionDevice()');
        var obj = objectstoreGet('session', true);
        var req = null;
        var data = null;
        var cursor = null;
        var data = null;
        var res = null; // response from cursor.update()
        var found = 0;
        var updated = 0;
        var failed = 0;
        var skipped = 0;
        //
        // variables below must be set befor running
        //
        var my_iduser = 439164423;
        var my_device_iduser = 'mac.992_439164423';
        if (!obj) { console.error('!obj'); return; }
        total_recs = 0;
        obj.openCursor().onsuccess = function(ev) {
            cursor = ev.target.result;
            if (cursor) {
                data = cursor.value;
                if (data.iduser === my_iduser) {
                    found += 1;
                    data.device_iduser = my_device_iduser;
                    res = cursor.update(data);
                    res.onsuccess = function(e){
                        updated += 1;
                    }
                     res.onerror = function(e){
                        failed += 1;
                    }
                } else {
                    skipped += 1;
                }
                cursor.continue();
            } else {
                console.warn(found + ' = found')
                console.warn(updated + ' = updated')
                console.warn(failed + ' = failed')
                console.warn(skipped + ' = skipped')
            }
        }
    }
//
// >>> DEVOPER: end
//
//
// >>> EXPORTDB: start
//
    function exportDBConfirm(ev) {
        console.log('exportDBConfirm(ev)');
        var txt = getStr('MSG_exportDBConfirm');
        if (confirm(txt) == true) {
            RMM_MENU.hideAll();
            console.log('exportDB confirmed');
            tables_done = 0;
            exportDB_failed = false;
            exportDB();
        } else {
            RMM_MENU.settingsClick();
        }
    }
    function exportDB(ev) {
        console.log('exportDB(ev)');
        var msg = getStr('MSG_exportDB_finished');
        mydoc.getElementById('div_exportDB').style.display = 'block';
        mydoc.getElementById('div_exportDB_title').innerHTML = getStr('TXT_exportDB_export');
        console.log('tables_done:', tables_done);
        if (tables_done < 4) {
            mydoc.getElementById('div_exportDB_table').innerHTML = tables[tables_done];
        }
        console.log('--------------table: ' + tables[tables_done]);
        if (tables_done === 4) {
            exportDBFileSave();
            if (!exportDB_failed) {
                msg += '  ' + exportDB_fname;
                alert(msg);
                exportDBWrapup();
                return;
            }
        } else {
            exportDB_txt += '-----table:' + tables[tables_done] + '\n';
            RMM_DB.setDbNextFunction(RMM_DB.exportDBWrite);
            RMM_DB.tableGetAll(tables[tables_done]);
        }
        //console.log(exportDB_txt);
    }
    function exportDBWrite() {
        console.log('exportDBWrite()');
        var result = RMM_DB.getDbResult();
        var txt = '';
        var i = 0;
        var len = result.length;
        mydoc.getElementById('div_exportDB_count').innerHTML = '0/' + len;
        for (i=0; i<len; i++) {
            txt = JSON.stringify(result[i]);
            if (i+1 < len) { txt += '\n'; };
            exportDB_txt += txt;
            if (i % 10 == 0) {
                mydoc.getElementById('div_exportDB_count').innerHTML = (i+1) + '/' + (len+1);
            }
        }
            mydoc.getElementById('div_exportDB_count').innerHTML = (i+1) + '/' + (len+1);
        tables_done += 1
        if (tables_done < 4) { exportDB_txt += '\n'; }
        exportDB();
    }
    function exportDBFileSave() {
        console.log('exportDBFileSave');
        var now = new Date();
        var yr = now.getFullYear();  // Returns the 4-digit year (YYYY)
        var mn = String((now.getMonth() + 1)).padStart(2, '0'); // Returns the month (0-11), so add 1 to get (1-12)
        var dy = String((now.getDay() + 1)).padStart(2, '0');
        var hh = String(now.getHours()).padStart(2, '0');
        var mm = String(now.getMinutes()).padStart(2, '0');
        var ss = String(now.getSeconds()).padStart(2, '0');
        exportDB_fname = 'RMM_Export_Data_' + yr + mn + dy + hh + mm + ss + '.txt';
        try {
            anchor = document.createElement('a');
            anchor.id = 'a_exportDB_text_file';
            anchor.href = window.URL.createObjectURL(new Blob([exportDB_txt], {type: 'text/plain'}));
            anchor.download = exportDB_fname;
            anchor.click();
        } catch(err) {
            exportDB_failed = true;
            alert(getStr('MSG_export_not_supported'));
            exportDBWrapup();
            return;
        }
    }
    function exportDBWrapup() {
        console.log('exportDBWrapup');
        RMM_MENU.settingsClick();
    }
//*****************************************************************************
//*****************************************************************************
    function exportDBLoadFile() {
        console.log('exportDBLoadFile');
        RMM_MENU.hideAll();
        mydoc.getElementById('div_loadDB').style.display = 'block';
        document.getElementById('file_input').onchange = function(event) {
            const file = event.target.files[0];
            if (!file) {
                console.log('file select failed');
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                console.log('reader.onload complete');
                handleFileLoad(e.target.result);
            };
            reader.readAsText(file);
        };
    }
    async function handleFileLoad(txt) {
        console.warn('handleFileLoad(ev)');
        const lines = txt.split('\n');
        const len = lines.length;
        mydoc.getElementById('div_loadDB').style.display = 'none';
        mydoc.getElementById('div_exportDB').style.display = 'block';
        mydoc.getElementById('div_exportDB_title').innerHTML = getStr('TXT_exportDB_load');
        let batches = {'print': [], 'setup': [], 'user': [], 'session': []};
        let current_table = '';
        let count_session = 0;
        let total_processed = 0;
        // Phase 1: Group records by table name to batch them
        mydoc.getElementById('div_exportDB_count').innerHTML = ''; // the table div will be used for count
        mydoc.getElementById('div_exportDB_table').innerHTML = '0 / ' + len;
        for (let i = 0; i < len; i++) {
            total_processed += 1;
            if (total_processed % 10 == 0) {
                mydoc.getElementById('div_exportDB_table').innerHTML = total_processed + ' / ' + len;
            }
            const line = lines[i].trim();
            if (line.length === 0) continue;
            if (line.startsWith('-----table:')) {
                current_table = line.split(':')[1].trim();
                continue;
            }
            // Edge check: Skip if text data appears before a valid table header declaration
            if (!current_table || !batches[current_table]) continue;
            try {
                const rec = JSON.parse(line);
                batches[current_table].push({
                    index: i,
                    lineText: line,
                    data: rec
                });
                if (current_table === 'session') {
                    count_session += 1;
                }
            } catch (err) {
                exportDBAddRecError(i, line, 'JSON Parse Error: ' + (err.message || err));
                return;
            }
        }
        // Phase 2: Process each batch atomically using a single transaction per table
        mydoc.getElementById('div_exportDB_table').innerHTML = total_processed + ' / ' + len;
        for (const key in batches) {
            const records = batches[key];
            if (records.length === 0) continue;
            try {
                // FIX: Corrected parameters passed to function, removing the broken arrow callback
                const successCount = await saveBatchToIndexedDB(key, records);
            } catch (batch_error) {
                console.error(batch_error);
                // FIX: Corrected missing closing parenthesis syntax error
                alert('Failed to process batch for table: ' + key);
                return;
            }
        }
        console.warn('total_processed: ', total_processed);
        alert(total_processed + ' data lines loaded');
        RMM_STATSLIVE.loadSessionData();
    }
    function saveBatchToIndexedDB(table_name, records) {
        return new Promise((resolve, reject) => {
            if (!records || records.length === 0) return resolve(0);
            transactionInit();
            const store = objectstoreGet(table_name, true);
            let success_count = 0;
            let pending_requests = records.length;
            records.forEach((item) => {
                const req = store.add(item.data);
                req.onsuccess = function() {
                    success_count++;
                    pending_requests--;
                    if (pending_requests === 0) {
                        resolve(success_count);
                    }
                };
                req.onerror = function(ev) {
                    pending_requests--;
                    const errMsg = req.error ? req.error.message : 'Database write conflict';
                    exportDBAddRecError(item.index, item.lineText, errMsg);
                    if (pending_requests === 0) {
                        resolve(success_count);
                    }
                };
            });
        });
    }
    function exportDBAddRecError(i, line_in, err) {
        console.error('exportDBAddRecError(i, line_in, err)');
        console.error('err:', err);
        console.error('Line Index =', i);
        console.error(line_in);
        alert(getStr('MSG_exportDBAddError'));
    }
//*****************************************************************************
//*****************************************************************************
// >>> EXPORTDB: end
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
        sessionDeviceMaxTstamps : sessionDeviceMaxTstamps,
        // exportDB
        exportDBConfirm : exportDBConfirm,
        exportDBWrite : exportDBWrite,
        // developer
        developerResetSessionDevice : developerResetSessionDevice
    };
})();
