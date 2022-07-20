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
    ////////////var DB_TRIES_STD = 1000; // std arg to set db_max_tries in dbSetWaitVars
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
        /////////////RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_SYNC.handleUserGetAll);
        RMM_DB.setDbNextFunction(RMM_SYNC.handleUserGetAll);
        RMM_DB.tableGetAll('user');
    }

    // create the list of user names and IDs
    function handleUserGetAll() {
        console.log('handleUserGetAll()');
        var ids = RMM_DB.getDbResult();
        var guest = getStr('DAT_guest');
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
        ////////////RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_SYNC.handleReadIduser);
        RMM_DB.setDbNextFunction(RMM_SYNC.handleReadIduser);
        RMM_DB.readIduser(iduser_to_add);
    }

    // process logic after reading user table using iduser
    function handleReadIduser() {
        console.log('handleReadIduser()');
        var data = RMM_DB.getDbResult();
        if (data) {
            alert(getStr('MSG_sync_iduser_exists'));
            return;
        }
        data = { 'iduser':iduser_to_add, 'name':name_to_add };
        ////////////RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_SYNC.handleUserAdd);
        RMM_DB.setDbNextFunction(RMM_SYNC.handleUserAdd);
        RMM_DB.addRecord('user', data);
    }

    // handle process after adding user rec
    function handleUserAdd() {
        console.log('handleUserAdd()');
        var data = RMM_DB.getDbResult();
        var msg = getStr('MSG_sync_user_added');
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
        var parms = ev.target.id.split('_');
        sync_iduser = parseInt(parms[3], 10);
        sync_user = parms[4];
        if (sync_iduser in sync_existing) {
            mydoc.getElementById('sync_input_url').value = sync_existing[sync_iduser]['url'];
            mydoc.getElementById('sync_input_pwd').value = sync_existing[sync_iduser]['pwd'];
        } else {
            mydoc.getElementById('sync_input_url').value = '';
            mydoc.getElementById('sync_input_pwd').value = '';
        }
        mydoc.getElementById('div_sync_link').style.display = 'none';
        mydoc.getElementById('div_sync_link_add').style.display = 'block';
    }

    function gsDoGet(url) {
        console.warn('gsDoGet(url)');
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
                    return;
                }
            }
        } else {
            script.onload = function () {
                sync_callback();
                return;
            }
        }
        script.src = url; // onerror triggers here when offline
        console.log(script.src);
        console.log('head.appendChild(script);');
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
        if (sync_key.length !== 60) {
            alert(getStr('SYNC_sync_key_empty'));
            return;
        }
        if (url.length === 0) {
            alert(getStr('SYNC_sheet_url_empty'));
            return;
        }
        if (pwd.length === 0) {
            alert(getStr('SYNC_sheet_pwd_empty'));
            return;
        }
        showMomentPlease('MSG_moment_please');
        sync_confirm_tstamp = Date.now();
        url += '?idtype=linkTest';
        url += '&sync_key=' + sync_key;
        url += '&sheet=' + sync_iduser;
        url += '&pwd=' + pwd;
        url += '&tstamp=' + sync_confirm_tstamp;
        sync_callback = RMM_SYNC.handleLinkAddTest;
        sync_caller = 'linkAddCheck';
        console.warn('gsDoGet -------------------------- from LinkAddCheck');
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
        element.parentNode.removeChild(element);
        if (response.result === 'OK') {
            linkAddSave();
            return;
        }
        processResponseError(response, 'div_sync_link_add');
    }

    //respond to clicking on a user to edit sync link
    function linkAddSave() {
        console.log('linkAddSave()');
        var url = mydoc.getElementById('sync_input_url').value.trim();
        var pwd = mydoc.getElementById('sync_input_pwd').value.trim();
        var data = { 'sync_url' : url, 'sync_pwd' : pwd };
        ////////////RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_SYNC.handleLinkAddSave);
        RMM_DB.setDbNextFunction(RMM_SYNC.handleLinkAddSave);
        RMM_DB.updateRecord('user', sync_iduser, data);
    }

    // handle user record update completion
    function handleLinkAddSave() {
        console.log('handleLinkAddSave()');
        var msg = getStr('SYNC_link_saved');
        msg = msg.replace('REPLACE_sync_user', sync_user);
        alert(msg);
        linkAddClick(null);
        msg = getStr('SYNC_control_set_to_off');
        alert(msg);
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
        var disallowed = '<>"&#;$+,/:=?@ []{}|\^%`';
        // add single quote to diallowed
        disallowed += "'";
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
        var info = mydoc.getElementById('div_txt_sync_key_info')
        if (sync_key.length === 0) {
            info.innerHTML = getStr('SYNC_info_no_existing_key');
        } else {
            info.innerHTML = getStr('SYNC_info_yes_existing_key');
            mydoc.getElementById('txt_sync_key_existing').innerHTML = sync_key;
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
        mydoc.getElementById('txt_sync_key_update').value = '';
        sync_key = syncKeyCodeCreate();
        mydoc.getElementById('txt_sync_key_update').value = sync_key;
        alert(getStr('MSG_sync_save_needed'));
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
        var invalids = '';
        var char_str = null;
        var char_val = null;
        var disallowed = '<>"&#;$+,/:=?@ []{}|\^%`';
        // add single quote to diallowed
        disallowed += "'";
        if (len != 60) {
            msg = getStr('MSG_sync_key_not_60_char');
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
        ////////////RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_SYNC.handleProcessStart);
        RMM_DB.setDbNextFunction(RMM_SYNC.handleProcessStart);
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
        hideAll();
        // len = 1 means only default Guest exists (no added users)
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
        console.warn('procUpGetHistory(ev)');
        var parms = ev.target.id.split('_');
        var url = '';
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
        RMM_DB.setDbNextFunction(RMM_SYNC.handleDeviceMaxTstamps);
        RMM_DB.sessionDeviceMaxTstamps(sync_iduser);
    }

    function handleDeviceMaxTstamps() {
        console.log('handleDeviceMaxTstamps()');
        tstamps_str = encodeURI(JSON.stringify(RMM_DB.getDbResult()));
        console.warn(tstamps_str , 'tstamps_str ');
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
        console.warn('gsDoGet -------------------------- from procUpGetDeviceTstamp');
        gsDoGet(url);
    }

    function handleProcUpGetDeviceTstamp() {
        console.log('handleProcUpGetDeviceTstamp()');
        var element = document.getElementById('googlesheet');
        var response = syncResponseGS();
        element.parentNode.removeChild(element);
        if (response.result !== 'OK') {
            console.error('-----error-----'); //KEEPIN
            processResponseError(response, 'div_menu_sync_main');
            return;
        }
        if (response.value.length === 0) {
            sync_device_tstamp = 0;
        } else {
            sync_device_tstamp = parseInt(response.value, 10);
        }
        procUpGetSessionData();
    }

    function procUpGetSessionData() {
        console.log('procUpGetSessionData()');
        var index =  RMM_DB.getDevice() + '_' + sync_iduser;
        showMomentPlease('MSG_sync_process_step3');
        RMM_DB.setDbNextFunction(RMM_SYNC.handleUserSessionUpGet);
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
        sync_confirm_tstamp = Date.now(); // confirms write after fetch return
        data['sync_key'] = sync_key;
        data['device'] = d_device;
        data['sheet'] = sync_iduser;
        data['tstamp'] = sync_confirm_tstamp;
        data['tstamp_max'] = tstamp_max;
        data['datastr'] = a_recs.join('####');
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
        var url = '';
        url = sync_user_url;
        url += '?idtype=getConfirmationTstamp';
        url += '&sync_key=' + sync_key;
        url += '&sheet=' + sync_iduser;
        url += '&device=' +  RMM_DB.getDevice();
        sync_callback = RMM_SYNC.handleConfirmationTstamp;
        showMomentPlease('MSG_sync_process_step5');
        sync_caller = 'confirmSessionUpPost';
        console.warn('gsDoGet -------------------------- from confirmSessionUpPost');
        gsDoGet(url);
    }

    function handleConfirmationTstamp() {
        console.log('handleConfirmationTstamp()');
        var element = document.getElementById('googlesheet');
        var response = syncResponseGS();
        element.parentNode.removeChild(element);
        if (response.result !== 'OK') {
            postProcessWrapup('MSG_sync_process_final_err');
            return;
        }
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
        console.warn('gsDoGet -------------------------- from procdnStartDownload');
        gsDoGet(url);
    }

    function handleDownload() {
        console.log('handleDownload()');
        var element = document.getElementById('googlesheet');
        var response = syncResponseGS();
        var valid_result = []; // [true/false, ''/'ERRcode'] return value
        element.parentNode.removeChild(element);
        if (response.result !== 'OK') {
            console.log('-----error-----');
            postProcessWrapup('MSG_sync_process_final_err');
            return;
        }
        sync_procdn_data = JSON.parse(decodeURI(response.value));
        valid_result = validDataArray(sync_procdn_data);
        if (!valid_result[0]) {
            console.log(valid_result[1], 'validDataArray ERR'); //KEEPIN
            postProcessWrapup('MSG_sync_process_data_err');
            return;
        }
        sync_procdn_i = -1; // set to -1 as first recursive step is i++
        sync_procdn_len = sync_procdn_data.length;
        sync_procdn_msg = getStr('MSG_sync_process_step7');
        console.log(sync_procdn_len, 'sync_procdn_len');
        procdnRecursiveAdds();
    }

    function procdnRecursiveAdds() {
        //////console.log('procdnRecursiveAdds()'); //KEEPIN
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
        RMM_DB.addSessionRecRecursive(my_data, RMM_SYNC.procdnRecursiveAddsCallback);
    }

    function procdnRecursiveAddsCallback(ev, valid) {
        //////console.log('procdnRecursiveAddsCallback(ev, valid)'); //KEEPIN
        procdnRecursiveAdds();
    }

    // last step of posting session data recs
    function postProcessWrapup(id_msg) {
        console.log('postProcessWrapup(id_msg)');
        var msg = getStr(id_msg);
        msg = msg.replace('REPLACE_user', sync_user);
        hideAll();
        alert(msg);
        mydoc.getElementById('div_sync_link').style.display = 'block';
        msg = getStr('SYNC_control_set_to_off');
        alert(msg);
    }

//
// >>> PROCESS:end
//

//
// >>> VALIDATE:start
//

    // validate specific m2 or d3 string (differnt r_str vs ASM)
    function validM2D3String(val_in) {
        //////console.log('validM2D3String(val_in)', val_in);
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
        //////console.log('validASMString(val_in)', val_in);
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
        //////console.log('validRstring(val_in)', val_in);
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
        //////console.log('validINT(num_in)', num_in);
        var my_int = parseInt(num_in, 10);
        var my_int_str = '' + my_int;
        var num_in_str = '' + num_in;
        if (isNaN(my_int)) { return false; }
        if (num_in_str !== my_int_str) { return false; }
        return true;
    }

    // validate device (30 chars or less) and iduser combination)
    function validDeviceIduser(val_in) {
        //////console.log('validDeviceIduser(val_in)', val_in);
        var temp = [];
        // structure = mac.952_442135493
        temp = val_in.split('_');
        if (temp.length !== 2) { return false; }
        if (!validINT(temp[1])) { return false; }
        temp = temp[0].split('.');
        if (temp.length !== 2) { return false; }
        if(temp[0].length > 30) { return false; }
        if (!validINT(temp[1])) { return false; }
        return true;
    }

    // validate idsession which is two or three ints separated by _
    function validIdsession(val_in) {
        //////console.log('validIdsession(val_in)', val_in);
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
        //////console.log('validIdlevel(val_in)', val_in);
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
        console.log('validDataArray(data_in)');
        var start = Date.now();
        var td = {}; //temp dict parsed from each data_in rec
        var devs_ids = {}; // stored valid device_iduser
        var my_e = ''; // error string
        var my_v = null; // temporary dict value
        var i = 0;
        var len = data_in.length;
        var err = null;
        console.log(len, 'len');
        for (i=0; i<len; i++) {
            if (my_e.length > 0) { break; }
            try {
                td = JSON.parse(decodeURI(data_in[i]));
            } catch (err) {
                my_e = 'ERR00';
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
        console.warn(Date.now() - start, len, ' = milli to complete, data.length');
        console.warn([my_e.length === 0, my_e]);
        return [my_e.length === 0, my_e];
    }

//
// >>> VALIDATE:end
//

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

