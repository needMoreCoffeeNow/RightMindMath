var RMM_SYNC = (function() {
    var mydoc = window.document;
    var iduser_to_add = null; // will store valid iduser for sync add user
    var name_to_add = null; // will store valid name for sync add user
    var timervar = null; // use for setTimeout and clearTimeout functions
    var tstamps_str = ''; // store the tstamps_max values as sring to support download recs
    var user_getall_next = null; // next function after user get all db read
    var sync_user = ''; // stores name of user having link setup
    var sync_iduser = ''; // stores name of iduser having link setup
    var sync_test_return_value = null; // stores the timestamp sheet value (B1)
    var sync_callback = null; // function to call after get/post to Google Sheet
    var sync_existing = {}; // stores iduser url & pwd
    var sync_user_url = ''; // stores link url for selected user
    var sync_user_pwd = ''; // stores link pwd for selected user
    var sync_device_tstamp = 0; // stores response value for previous update tstamp 
    var sync_confirm_tstamp = 0; // stores tstamp used to confirm sync fetch post
    var sync_caller = ''; // identifies calling fnc to vary handler process
    var sync_procdn_data = []; // will store download recs to add from GSheet
    var sync_procdn_i = 0; // stores interator for download recursive adds
    var sync_procdn_len = 0; // stores interator limit for download recursive adds
    var sync_procdn_msg = ''; // stores recursive add message
    var sync_key = ''; // 60 character sync key token to verify all calls to GSheet
    // db
    var DB_TRIES_STD = 100; // std arg to set db_max_tries in dbSetWaitVars
    var IDGUEST = 10884293110550;

    // RMM_CFG shortcuts start
    function getStr(id) { return RMM_CFG.getStr(id); }

//
//
// >>> --------------------------------SYNC:Start
//

    // hideAll elements unique to sync
    function hideAll() {
        console.log('hideAll()');
        mydoc.getElementById('div_info').style.display = 'none';
        mydoc.getElementById('div_menu_sync_main').style.display = 'none';
        mydoc.getElementById('div_sync_orig').style.display = 'none';
        mydoc.getElementById('div_sync_link_add').style.display = 'none';
        mydoc.getElementById('div_sync_link').style.display = 'none';
    }

    // show the moment please info dialog using CFG id as arg
    function showMomentPlease(id) {
        console.log('showMomentPlease(id)', id);
        hideAll();
        mydoc.getElementById('div_info_text').innerHTML = getStr(id);
        mydoc.getElementById('div_info').style.display = 'block';
    }
    
    // show listing of original userIDs setup on current device
    function userOrigClick(ev) {
        console.log('userOrigClick(ev)');
        user_getall_next = RMM_SYNC.userListInfo;
        userGetAll();
    }
    
    // show listing of original userIDs setup on current device
    function userGetAll() {
        console.log('userGetAll()');
        showMomentPlease('MSG_moment_please');
        RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_SYNC.handleUserGetAll);
        RMM_DB.tableGetAll('user');
    }

    // create the list of user names and IDs
    function handleUserGetAll() {
        console.log('handleUserGetAll()');
        var ids = RMM_DB.getDbResult();
        var guest = getStr('DAT_guest');
        console.log(ids, 'ids');
        // len = 1 means only default Guest exists (no added users)
        if (ids.length < 2) {
            mydoc.getElementById('div_menu_sync_main').style.display = 'block';
            alert(getStr('MSG_no_user_recs'));
            return;
        }
        user_getall_next();
    }

    // list all the user names and ids
    function userListInfo() {
        console.log('userListInfo()');
        var ids = RMM_DB.getDbResult();
        var html = '';
        var guest = getStr('DAT_guest');
        var len = ids.length;
        var i = 0;
        hideAll();
        for (i=0; i<len; i++) {
            if (ids[i].name === guest) { continue; }
            if (ids[i].name.indexOf('+') > -1) { continue; }
            html += '<div style="margin-top:10px;">';
            html += '<span class="orig">' + ids[i].name + '</span>';
            html += '<span class="orig">=</span>';
            html += '<span class="orig">' + ids[i].iduser + '</span>';
            html += '</div>';
            html += '<div style="margin-top:10px;text-align:left;">';
            html += getStr('TXT_sync_sheet_text');
            html += '</div>'
            html += '<div style="margin-top:10px;">';
            html += '<textarea rows="1" cols="40" readonly>';
            html += ids[i].name + '\t';
            html += ids[i].iduser + '\t';
            html += RMM_DB.getDevice();
            html += '</textarea>';
            html += '</div>'
            html += '<hr>';
        }
        hideAll();
        mydoc.getElementById('div_sync_orig_list').innerHTML = html;
        mydoc.getElementById('div_sync_orig').style.display = 'block';
    }

    // show the main menu
    function mainMenuShow() {
        console.log('mainMenuShow()');
        mydoc.getElementById('div_menu_main').style.display = 'none';
        mydoc.getElementById('div_menu_sync_main').style.display = 'block';
        mydoc.getElementById('div_sync_container').style.display = 'block';
    }

    // exit back to setting menu
    function exitClick() {
        console.log('exitClick()');
        mydoc.getElementById('div_sync_container').style.display = 'none';
        mydoc.getElementById('div_menu_main').style.display = 'block';
    }

    // exit listing of original device user IDs
    function exitOrig() {
        console.log('exitOrig()');
        mydoc.getElementById('div_sync_orig').style.display = 'none';
        mydoc.getElementById('div_menu_sync_main').style.display = 'block';
    }

//
// >>> SYNC:end
//
//
// >>> USER_ADD:start
//

    // eixt back to sync main menu
    function userAddExit(ev) {
        console.log('userAddExit()');
        mydoc.getElementById('div_sync_user_add').style.display = 'none';
        mydoc.getElementById('div_menu_sync_main').style.display = 'block';
    }

    // show user add dialog
    function userAddClick(ev) {
        console.log('exitClick()');
        mydoc.getElementById('sync_input_user').value = '';
        mydoc.getElementById('sync_input_iduser').value = '';
        mydoc.getElementById('div_menu_sync_main').style.display = 'none';
        mydoc.getElementById('div_sync_user_add').style.display = 'block';
    }

    // returns only integers from string
    function integersOnly(str) {
        console.log('integersOnly(str)');
        console.log(str.length);
        var digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        var s = '';
        var i = 0;
        var len = str.length;
        for (i=0; i<len; i++) {
            if (digits.indexOf(str.substr(i, 1)) === -1) { continue; }
            s += str.substr(i, 1);
        }
        return s
    }

    // strip out any non-allowed characters
    function charRangeOnly(str_in) {
        console.log('');
        var char_range = RMM_MENU.getCharRange();
        var str_out = '';
        var len = str_in.length;
        var i = 0;
        for (i=0; i<len; i++) {
            if (!char_range[str_in.charCodeAt(i)]) { continue; }
            str_out += str_in.charAt(i)
        }
        return str_out;
    }

    //add a sync user
    function userAdd(ev) {
        console.log('userAdd(ev)');
        name_to_add = mydoc.getElementById('sync_input_user').value;
        iduser_to_add = mydoc.getElementById('sync_input_iduser').value;
        // name checks
        if (name_to_add.length === 0) {
            alert(getStr('MSG_user_needed'));
            return;
        }
        if (name_to_add !== charRangeOnly(name_to_add)) {
            alert(getStr('MSG_no_special_characters'));
            return;
        }
        // + at end of name denotes sync user name
        name_to_add = charRangeOnly(name_to_add) + '+';
        // iduser checks
        // make sure no leading zeros
        iduser_to_add = integersOnly(iduser_to_add);
        iduser_to_add = '' + parseInt(iduser_to_add, 10);
        if (iduser_to_add.length === 0) {
            alert(getStr('MSG_iduser_needed'));
            return;
        }
        if (iduser_to_add.length !== 9) {
            alert(getStr('MSG_9digits_needed'));
            return;
        }
        // leading digit is 1 is only allowed for Guest ID
        if (iduser_to_add.substr(0, 1) === '1') {
            alert(getStr('MSG_leading_digit_error'));
            return;
        }
        // finally convert valid iduser to int
        iduser_to_add = parseInt(iduser_to_add, 10);
        // now check for existing iduser
        RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_SYNC.handleReadIduser);
        RMM_DB.readIduser(iduser_to_add);
    }

    // process logic after reading user table using iduser
    function handleReadIduser() {
        console.log('handleReadIduser()');
        var data = RMM_DB.getDbResult();
        console.log(data);
        if (data) {
            alert(getStr('MSG_sync_iduser_exists'));
            return;
        }
        data = { 'iduser':iduser_to_add, 'name':name_to_add };
        RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_SYNC.handleUserAdd);
        RMM_DB.addRecord('user', data);
    }

    // handle process after adding user rec
    function handleUserAdd() {
        console.log('handleUserAdd()');
        var data = RMM_DB.getDbResult();
        var msg = getStr('MSG_sync_user_added');
        console.log(data);
        msg = msg.replace('REPLACE_NAME', data.name);
        alert(msg);
        userAddExit(null);
    }

//
// >>> USER_ADD:end
//

//
// >>> LINK:start
//

    // exit back to sync main menu
    function linkExit(ev) {
        console.log('linkExit()');
        mydoc.getElementById('div_sync_link').style.display = 'none';
        mydoc.getElementById('div_menu_sync_main').style.display = 'block';
    }

    // exit back to sync main menu
    function linkAddClick(ev) {
        console.log('linkAddClick()');
        user_getall_next = RMM_SYNC.linkUserList;
        userGetAll();
    }

    //respond to clicking on a user to edit sync link
    function linkAddExit(ev) {
        console.log('linkAddExit');
        mydoc.getElementById('div_sync_link_add').style.display = 'none';
        mydoc.getElementById('div_sync_link').style.display = 'block';
    }

    // exit back to sync main menu
    function linkUserList(ev) {
        console.log('linkUserList()');
        var ids = RMM_DB.getDbResult();
        var html = '';
        var guest = getStr('DAT_guest');
        var link_list = mydoc.getElementById('div_sync_link_list');
        var link_text = mydoc.getElementById('div_sync_link_text');
        var len = ids.length;
        var i = 0;
        var type = '';
        var s_add = getStr('TXT_add_link');
        var s_edit = getStr('TXT_edit_link');
        hideAll();
        sync_existing = {};
        for (i=0; i<len; i++) {
            if (ids[i].name === guest) { continue; }
            type = 'sync_url' in ids[i] ? s_edit : s_add;
            html += '<div style="margin-top:15px;margin-left:-25px;">';
            html += '<button id="b_user_link_';
            html += ids[i].iduser + '_' + ids[i].name + '" ';
            if ('sync_url' in ids[i]) {
                html += 'class="toggle link_edit" ';
            } else {
                html += 'class="toggle link" ';
            }
            html += 'onclick="RMM_SYNC.linkUserEdit(event);">';
            html += type;
            html += '</button>';
            html += '<span class="link_name">' + ids[i].name + '</span>';
            html += '&nbsp;';
            html += '<span class="link_iduser">(' + ids[i].iduser + ')</span>';
            if (ids[i].sync_url) {
                html += '<div style="font-size:50%;float:right;margin-top:7px;">';
                html += '<textarea rows="1" cols="15" style="resize:none">';
                html += ids[i].sync_url;
                html += '</textarea>';
                html += '</div>';
            }
            html += '</div>';
            // add existing url/pwd
            if (ids[i].sync_url) {
                sync_existing[ids[i].iduser] = {'url' : ids[i].sync_url,
                                                'pwd' : ids[i].sync_pwd};
            }
        }
        console.log(sync_existing);
        hideAll();
        link_list.style.marginLeft = '20px';
        link_list.style.textAlign = 'left';
        link_text.innerHTML = getStr('TXT_sync_link_text');
        link_list.innerHTML = html;
        mydoc.getElementById('div_sync_link').style.display = 'block';
    }

    //respond to clicking on a user to edit sync link
    function linkUserEdit(ev) {
        console.log('linkUserEdit');
        console.log(ev.target.id);
        var parms = ev.target.id.split('_');
        sync_iduser = parseInt(parms[3], 10);
        sync_user = parms[4];
        console.log(sync_existing);
        console.log(sync_iduser in sync_existing);
        console.log(sync_iduser);
        console.log(sync_existing);
        if (sync_iduser in sync_existing) {
            console.log('setting', sync_existing[sync_iduser]['url']);
            mydoc.getElementById('sync_input_url').value = sync_existing[sync_iduser]['url'];
            mydoc.getElementById('sync_input_pwd').value = sync_existing[sync_iduser]['pwd'];
        } else {
            console.log('new user so set inputs to empty string');
            mydoc.getElementById('sync_input_url').value = '';
            mydoc.getElementById('sync_input_pwd').value = '';
        }
        mydoc.getElementById('div_sync_link').style.display = 'none';
        mydoc.getElementById('div_sync_link_add').style.display = 'block';
    }

    function gsDoGet(url) {
        console.log('gsDoGet(url)');
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        var err = false;
        script.id = 'googlesheet';
        script.type= 'text/javascript';
        script.onerror = RMM_SYNC.gsDoGetError;
        if (script.readyState) {
            script.onreadystatechange = function () {
                if (script.readyState == 'loaded' || script.readyState == 'complete') {
                    script.onreadystatechange = null;
                    sync_callback();
                }
            }
        } else {
            script.onload = function () {
                sync_callback();
            }
        }
        script.src = url; // onerror triggers here when offline
        head.appendChild(script);
        console.log('done');
    }
    
    function gsDoGetError(err) {
        console.log('gsDoGetError()');
        var element = document.getElementById('googlesheet');
        console.log(element);
        if (element.length === 0) {
            alert(getStr('SYNC_error_offline'));
        } else {
            if (sync_caller === 'linkAddCheck') {
                alert(getStr('SYNC_test_error_404'));
            }
            if (sync_caller === 'procUpGetDeviceTstamp') {
                alert(getStr('SYNC_src_error_404'));
            }
        }
        if (element) { element.parentNode.removeChild(element); }
        mydoc.getElementById('div_info').style.display = 'none';
        if (sync_caller === 'linkAddCheck') {
            mydoc.getElementById('div_sync_link_add').style.display = 'block';
        }
        if (sync_caller === 'procUpGetHistory') {
            mydoc.getElementById('div_menu_sync_main').style.display = 'block';
        }
    }

    function linkAddCheck() {
        console.log('linkAddCheck()');
        var url = mydoc.getElementById('sync_input_url').value.trim();
        var pwd = mydoc.getElementById('sync_input_pwd').value.trim();
        showMomentPlease('MSG_moment_please');
        sync_confirm_tstamp = Date.now();
        url += '?idtype=linkTest';
        url += '&sync_key=' + sync_key;
        url += '&sheet=' + sync_iduser;
        url += '&pwd=' + pwd;
        url += '&tstamp=' + sync_confirm_tstamp;
        console.log(url);
        sync_callback = RMM_SYNC.handleLinkAddTest;
        sync_caller = 'linkAddCheck';
        gsDoGet(url);
    }
    
    function processResponseError(response, div_block) {
        console.log('processResponseError(response)');
        var reason = '';
        hideAll();
        mydoc.getElementById(div_block).style.display = 'block';
        if (response.error === 'pwd') {
            reason = getStr('SYNC_error_pwd');
        }
        if (response.error.indexOf('control') === 0) {
            reason = getStr('SYNC_error_control');
        }
        if (response.error.indexOf('syncKey') === 0) {
            reason = getStr('SYNC_error_syncKey');
        }
        if (response.error === 'sheetNF') {
            reason = getStr('SYNC_error_sheetNF');
            reason = reason.replace('REPLACE_sync_iduser', (''+sync_iduser));
        }
        if (reason.length === 0) {
            reason = getStr('SYNC_error_other');
            reason = reason.replace('REPLACE_error', (response.error));
        }
        alert(reason);
    }

    function handleLinkAddTest() {
        console.log('handleLinkAddTest()');
        var element = document.getElementById('googlesheet');
        var response = syncResponseGS();
        console.log('-----response-----');
        console.log(response);
        element.parentNode.removeChild(element);
        if (response.result === 'OK') {
            linkAddSave();
            return;
        }
        console.log('-----error-----');
        processResponseError(response, 'div_sync_link_add');
    }

    //respond to clicking on a user to edit sync link
    function linkAddSave() {
        console.log('linkAddSave()');
        var url = mydoc.getElementById('sync_input_url').value.trim();
        var pwd = mydoc.getElementById('sync_input_pwd').value.trim();
        var data = { 'sync_url' : url, 'sync_pwd' : pwd };
        RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_SYNC.handleLinkAddSave);
        RMM_DB.updateRecord('user', sync_iduser, data);
    }

    // handle user record update completion
    function handleLinkAddSave() {
        console.log('handleLinkAddSave()');
        var msg = getStr('SYNC_link_saved');
        msg = msg.replace('REPLACE_sync_user', sync_user);
        alert(msg);
        linkAddClick(null);
    }

//
// >>> LINK:end
//

//
// >>> KEY:start
//

    // generate 60 character sync_key cod
    function syncKeyCodeCreate() {
        console.log('syncKeyCodeCreate()');
        var mykey = '';
        var min = 33;
        var max = 126 + 1; //getRandInt includes min val but is < max so add 1
        var newchar = '';
        var disallowed = '<>"&#;';
        while (mykey.length < 60) {
            newchar = String.fromCharCode(RMM_ASM.getRandInt(min, max));
            if (disallowed.indexOf(newchar) > -1) { continue; }
            mykey += newchar;
        }
        console.warn(mykey, mykey.length, 'mykey from syncKeyCodeCreate()');
        return mykey
    }

    //handle Create/Copy button click
    function keyClickOpenMenu(ev) {
        console.log('keyClickOpenMenu(ev)');
        console.log(sync_key.length, 'sync_key.length');
        var info = mydoc.getElementById('div_txt_sync_key_info')
        if (sync_key.length === 0) {
            info.innerHTML = getStr('SYNC_info_no_existing_key');
            mydoc.getElementById('div_key_create_button').style.display = 'block';
        } else {
            info.innerHTML = getStr('SYNC_info_yes_existing_key');
            mydoc.getElementById('txt_sync_key_existing').innerHTML = sync_key;
            mydoc.getElementById('div_key_create_button').style.display = 'none';
        }
        mydoc.getElementById('div_menu_sync_main').style.display = 'none';
        mydoc.getElementById('div_sync_key').style.display = 'block';
    }

    //exit sync_key menu returning to main sync menu
    function keyMenuExit(ev) {
        console.log('keyMenuExit(ev)');
        mydoc.getElementById('div_sync_key').style.display = 'none';
        mydoc.getElementById('div_menu_sync_main').style.display = 'block';
    }

    //create a new key if there is no existing key
    function keyCreate(ev) {
        console.log('keyCreate(ev)');
        var info = mydoc.getElementById('div_txt_sync_key_info')
        if (sync_key.length > 0) {
            alert(getStr('MSG_sync_key_already_exists'));
            return;
        }
        sync_key = syncKeyCodeCreate();
        RMM_DB.updateSyncKey(sync_key);
        info.innerHTML = getStr('SYNC_info_yes_existing_key');
        mydoc.getElementById('txt_sync_key_existing').value = sync_key;
        mydoc.getElementById('div_key_create_button').style.display = 'none';
    }

    //update after validation new sync_key
    function keyUpdate(ev) {
        console.log('keyUpdate(ev)');
        var info = mydoc.getElementById('div_txt_sync_key_info')
        var min = 33;
        var max = 126; //getRandInt includes min val but is < max so add 1
        var new_key = mydoc.getElementById('txt_sync_key_update').value;
        var i = 0;
        var len = new_key.length;
        var msg = '';
        var disallowed = '<>"&#;';
        var invalids = '';
        var char_str = null;
        var char_val = null;
        if (len != 60) {
            msg = getStr('MSG_sync_key_not_valid');
            msg = msg.replace('REPLACE_len', len);
            alert(msg);
            return;
        }
        for (i=0; i<len; i++) {
            char_str = new_key.charAt(i);
            char_val = new_key.charCodeAt(i);
            if (disallowed.indexOf(char_str) > -1) {
                invalids += char_str;
                continue;
            }
            if (char_val < min || char_val > max) {
                invalids += char_str;
                continue;
            }
        }
        if (invalids.length > 0) {
            msg = getStr('MSG_sync_key_not_valid');
            msg = msg.replace('REPLACE_invalids', invalids);
            alert(msg);
            return;
        }
        sync_key = new_key;
        RMM_DB.updateSyncKey(sync_key);
        info.innerHTML = getStr('SYNC_info_yes_existing_key');
        mydoc.getElementById('txt_sync_key_existing').value = sync_key;
        mydoc.getElementById('txt_sync_key_update').value = '';
        mydoc.getElementById('div_key_create_button').style.display = 'none';
        alert(getStr('MSG_sync_key_updated'));
    }

//
// >>> KEY:end
//

//
// >>> PROCESS:start
//

    // handle user record update completion
    function processStartClick(ev) {
        console.log('processStartClick(ev)');
        showMomentPlease('MSG_moment_please');
        RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_SYNC.handleProcessStart);
        RMM_DB.tableGetAll('user');
    }

    //
    function handleProcessStart() {
        console.log('handleProcessStart()');
        var ids = RMM_DB.getDbResult();
        var bid = '';
        var html = '';
        var guest = getStr('DAT_guest');
        var link_list = mydoc.getElementById('div_sync_link_list');
        var link_text = mydoc.getElementById('div_sync_link_text');
        var len = ids.length;
        var i = 0;
        console.log(ids, 'ids');
        hideAll();
        // len = 1 means only default Guest exists (no added users)
        console.log(ids);
        if (ids.length < 2) {
            mydoc.getElementById('div_menu_sync_main').style.display = 'block';
            alert(getStr('MSG_no_user_recs'));
            return;
        }
        for (i=0; i<len; i++) {
            if (ids[i].name === guest) { continue; }
            if (!ids[i].sync_url) { continue; }
            bid = ids[i].iduser + '_' + ids[i].name;
            html += '<div id="test" style="margin-top:15px;text-align:center;">';
            html += '<button id="b_user_link_' + bid + '"';
            html += 'class="link" style="min-width:50%;margin-left:0px;"';
            html += 'onclick="RMM_SYNC.procUpGetHistory(event);">';
            html += '<span id="span1_user_link_' + bid + '"';
            html += ' style="color:blue;">';
            html += ids[i].name;
            html += '</span>';
            html += '&nbsp;&nbsp;<span id="span2_user_link_' + bid + '"';
            html += ' style="font-size:70%;">(';
            html += ids[i].iduser;
            html += ')</span>';
            html += '</button>';
            html += '</div>';
            // add existing url/pwd
            sync_existing[ids[i].iduser] = {'url' : ids[i].sync_url,
                                            'pwd' : ids[i].sync_pwd};
        }
        if (html.length === 0) {
            mydoc.getElementById('div_menu_sync_main').style.display = 'block';
            alert(getStr('MSG_no_link_user_recs'));
            return;
        }
        hideAll();
        link_list.style.marginLeft = '0px';
        link_list.style.textAlign = 'center';
        link_text.innerHTML = getStr('TXT_sync_process_select');
        link_list.innerHTML = html;
        mydoc.getElementById('div_sync_link').style.display = 'block';
    }

    // handle user record update completion
    function procUpGetHistory(ev) {
        console.log('procUpGetHistory(ev)');
        var parms = ev.target.id.split('_');
        var url = '';
        console.log(parms, 'parms');
        console.log(sync_existing, 'sync_existing');
        sync_iduser = parseInt(parms[3], 10);
        sync_user = parms[4];
        sync_user_url = sync_existing[sync_iduser]['url'];
        sync_user_pwd = sync_existing[sync_iduser]['pwd'];
        procDnGetDeviceMaxTstamps();
    }

    //build the device tstamp_max dict prior to downloading sync data
    function procDnGetDeviceMaxTstamps() {
        console.log('procDnGetDeviceMaxTstamps()');
        showMomentPlease('MSG_sync_process_step1');
        RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_SYNC.handleDeviceMaxTstamps);
        RMM_DB.sessionDeviceMaxTstamps(sync_iduser);
    }

    function handleDeviceMaxTstamps() {
        console.log('handleDeviceMaxTstamps()');
        tstamps_str = encodeURI(JSON.stringify(RMM_DB.getDbResult()));
        console.log(tstamps_str); // max tstamp currently in DB for download process
        procUpGetDeviceTstamp();
    }

    function procUpGetDeviceTstamp() {
        console.log('procUpGetDeviceTstamp()');
        url = sync_user_url;
        url += '?idtype=getDeviceTstamp';
        url += '&sync_key=' + sync_key;
        url += '&sheet=' + sync_iduser;
        url += '&device=' +  RMM_DB.getDevice();
        sync_callback = RMM_SYNC.handleProcUpGetDeviceTstamp;
        showMomentPlease('MSG_sync_process_step2');
        sync_caller = 'procUpGetDeviceTstamp';
        gsDoGet(url);
    }

    function handleProcUpGetDeviceTstamp() {
        console.log('handleProcUpGetDeviceTstamp()');
        var element = document.getElementById('googlesheet');
        var response = syncResponseGS();
        console.log('-----response-----');
        console.log(response);
        element.parentNode.removeChild(element);
        if (response.result !== 'OK') {
            console.log('-----error-----');
            processResponseError(response, 'div_menu_sync_main');
            return;
        }
        console.log(response.value);
        if (response.value.length === 0) {
            sync_device_tstamp = 0;
        } else {
            sync_device_tstamp = parseInt(response.value, 10);
        }
        console.log(sync_device_tstamp, 'sync_device_tstamp');
        procUpGetSessionData();
    }

    function procUpGetSessionData() {
        console.log('procUpGetSessionData()');
        var index =  RMM_DB.getDevice() + '_' + sync_iduser;
        console.log(index, '-----index: device_iduser');
        showMomentPlease('MSG_sync_process_step3');
        RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_SYNC.handleUserSessionUpGet);
        RMM_DB.sessionDeviceUserGet(sync_device_tstamp, index);
    }

    function handleUserSessionUpGet() {
        console.log('handleUserSessionUpGet()');
        var recs = RMM_DB.getDbResult();
        var d_device = RMM_DB.getDevice();
        var a_recs = [];
        var data = {};
        var tstamp_max = 0;
        var my_ts = 0;
        var datastr = '';
        var i = 0;
        var len = recs.length;
        if (len === 0) {
            console.warn('no session recs to post');
            procdnStartDownload();
            return;
        }
        for (i=0; i<len; i++) {
            my_ts = recs[i]['tstamp'];
            datastr = my_ts;
            datastr += '^^^^' + encodeURI(JSON.stringify(recs[i]));
            a_recs.push(datastr);
            if (my_ts > tstamp_max) { tstamp_max = my_ts; }
        }
        console.log(tstamp_max, 'tstamp_max');
        sync_confirm_tstamp = Date.now(); // confirms write after fetch return
        console.log(sync_confirm_tstamp, 'sync_confirm_tstamp');
        data['sync_key'] = sync_key;
        data['device'] = d_device;
        data['sheet'] = sync_iduser;
        data['tstamp'] = sync_confirm_tstamp;
        data['tstamp_max'] = tstamp_max;
        data['datastr'] = a_recs.join('####');
        console.log(data['tstamp_max'], 'data.tstamp_max');
        showMomentPlease('MSG_sync_process_step4');
        fetch(sync_user_url, {
            method: 'post',
            mode: 'no-cors',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(response => { confirmSessionUpPost(response); });
    }

    function confirmSessionUpPost(response) {
        console.log('confirmSessionUpPost(response)');
        console.log(response);
        var url = '';
        url = sync_user_url;
        url += '?idtype=getConfirmationTstamp';
        url += '&sync_key=' + sync_key;
        url += '&sheet=' + sync_iduser;
        url += '&device=' +  RMM_DB.getDevice();
        sync_callback = RMM_SYNC.handleConfirmationTstamp;
        showMomentPlease('MSG_sync_process_step5');
        sync_caller = 'confirmSessionUpPost';
        gsDoGet(url);
    }

    function handleConfirmationTstamp() {
        console.log('handleConfirmationTstamp()');
        var element = document.getElementById('googlesheet');
        var response = syncResponseGS();
        console.log('-----response-----');
        console.log(response);
        element.parentNode.removeChild(element);
        if (response.result !== 'OK') {
            postProcessWrapup('MSG_sync_process_final_err');
            return;
        }
        console.log(response);
        console.log(sync_confirm_tstamp, response.value);
        if (sync_confirm_tstamp === response.value) {
            procdnStartDownload();
        } else {
            postProcessWrapup('MSG_sync_process_final_err');
        }
    }

    function procdnStartDownload() {
        console.log('procdnStartDownload()');
        url = sync_user_url;
        url += '?idtype=getDownload';
        url += '&sync_key=' + sync_key;
        url += '&sheet=' + sync_iduser;
        url += '&pwd=' + sync_user_pwd;
        url += '&device=' +  RMM_DB.getDevice();
        url += '&tstamps_max=' +  tstamps_str;
        sync_callback = RMM_SYNC.handleDownload;
        showMomentPlease('MSG_sync_process_step6');
        sync_caller = 'procdnStartDownload';
        gsDoGet(url);
    }

    function handleDownload() {
        console.log('handleDownload()');
        var element = document.getElementById('googlesheet');
        var response = syncResponseGS();
        console.log('-----response-----');
        console.log(response);
        element.parentNode.removeChild(element);
        if (response.result !== 'OK') {
            console.log('-----error-----');
            postProcessWrapup('MSG_sync_process_final_err');
            return;
        }
        sync_procdn_data = JSON.parse(decodeURI(response.value));
        sync_procdn_i = -1; // set to -1 as first recursive step is i++
        sync_procdn_len = sync_procdn_data.length;
        sync_procdn_msg = getStr('MSG_sync_process_step3');
        console.log(sync_procdn_data);
        procdnRecursiveAdds();
    }

    function procdnRecursiveAdds() {
        console.log('procdnRecursiveAdds()');
        var my_msg = '';
        var my_data = {};
        sync_procdn_i += 1;
        if (sync_procdn_i >= sync_procdn_len) {
            showMomentPlease('MSG_sync_process_step99');
            postProcessWrapup('MSG_sync_process_final_ok');
            return;
        }
        if (sync_procdn_i % 50 === 0) {
            my_msg = sync_procdn_msg + '<br>';
            my_msg += '(' + (sync_procdn_i+1) + ' / ' + sync_procdn_len + ')';
            mydoc.getElementById('div_info_text').innerHTML = my_msg;
        }
        my_data = JSON.parse(decodeURI(sync_procdn_data[sync_procdn_i]));
        console.log(my_data);
        RMM_DB.addSessionRecRecursive(my_data, RMM_SYNC.procdnRecursiveAddsCallback);
    }

    function procdnRecursiveAddsCallback(ev, valid) {
        console.log('procdnRecursiveAddsCallback(ev, valid)');
        procdnRecursiveAdds();
    }

    // last step of posting session data recs
    function postProcessWrapup(id_msg) {
        console.log('postProcessWrapup(id_msg)');
        var msg = getStr(id_msg);
        console.log(msg, 'msg b4 replace');
        msg = msg.replace('REPLACE_user', sync_user);
        hideAll();
        alert(msg);
        mydoc.getElementById('div_sync_link').style.display = 'block';
    }

//
// >>> PROCESS:end
//

//
// >>> GETTER+SETTER:start
//

    function setSyncKey(key_in) {
        sync_key = key_in;
    }

    function getSyncKey() {
        return sync_key;
    }

//
// >>> GETTER+SETTER:end
//

    return {
        mainMenuShow : mainMenuShow,
        exitClick : exitClick,
        exitOrig : exitOrig,
        userOrigClick : userOrigClick,
        handleUserGetAll : handleUserGetAll,
        userAddExit : userAddExit,
        userAddClick : userAddClick,
        userAdd : userAdd,
        handleUserAdd : handleUserAdd,
        handleReadIduser : handleReadIduser,
        // process
        processStartClick : processStartClick,
        handleProcessStart : handleProcessStart,
        procUpGetHistory : procUpGetHistory,
        procdnRecursiveAddsCallback : procdnRecursiveAddsCallback,
        handleProcUpGetDeviceTstamp : handleProcUpGetDeviceTstamp,
        handleConfirmationTstamp : handleConfirmationTstamp,
        handleDeviceMaxTstamps : handleDeviceMaxTstamps,
        handleDownload : handleDownload,
        //key
        syncKeyCodeCreate : syncKeyCodeCreate,
        keyClickOpenMenu : keyClickOpenMenu,
        keyMenuExit : keyMenuExit,
        keyCreate : keyCreate,
        keyUpdate : keyUpdate,
        // link edit
        linkExit : linkExit,
        linkAddClick : linkAddClick,
        userListInfo : userListInfo,
        linkUserList : linkUserList,
        linkUserEdit : linkUserEdit,
        linkAddSave : linkAddSave,
        linkAddExit : linkAddExit,
        linkAddCheck : linkAddCheck,
        handleLinkAddTest : handleLinkAddTest,
        handleLinkAddSave : handleLinkAddSave,
        handleUserSessionUpGet : handleUserSessionUpGet,
        gsDoGetError : gsDoGetError,
        // get+set
        setSyncKey : setSyncKey,
        getSyncKey : getSyncKey
    };
})();

