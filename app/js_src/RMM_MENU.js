var RMM_MENU = (function() {
    var mydoc = window.document;
    var pdata = {}; // data needed to initiate a problem nulls are important
    var dialog_last = ''; // what dialog to open when returning from help
    var input1_type = ''; // used to indentify objective for input1
    var char_range = {}; // dict which will have all allowed input chars
    var input_active = false; // use to exit setting w/o action when inputing
    var msg_div_next = ''; // set to div to show after msg dialog
    var timervar = null; // use for setTimeout and clearTimeout functions
    var idprint = null; // will be set to Date.now() as print sheet ID
    var problems = []; // array to store print problems
    var cb_print_listing = false; // show/hide answers on print sheet
    var print_created = false; // was a print page was created or loaded
    var get_mode = ''; // use to differentiate load vs. deleted "all" fnc
    var user_name_temp = ''; // store the new user name prior to adding it
    var user_iduser_name_xref = {}; // stores names indexed by iduser
    var iduserdelete = 0; // store the iduser being deleted
    // db
    var IDGUEST = 10884293110550;
    var IDSETUP = 1;
    // RMM_CFG shortcuts start
    function getStr(id) { return RMM_CFG.getStr(id); }
    function getNums(id) { return RMM_SymsNums.getNums(id); }
    function getSyms(id) { return RMM_SymsNums.getSyms(id); }
//
// >>> --------------------------------GENERAL:Start
//

    // hide all menu_container elements
    function hideAll() {
        console.log('menu.hideAll()');
        mydoc.getElementById('div_menu_main').style.display = 'none';
        mydoc.getElementById('div_menu_info').style.display = 'none';
        mydoc.getElementById('div_menu_levels').style.display = 'none';
        mydoc.getElementById('div_menu_digits').style.display = 'none';
        mydoc.getElementById('div_menu_subneg').style.display = 'none';
        mydoc.getElementById('div_menu_addneg').style.display = 'none';
        mydoc.getElementById('div_menu_subborrow').style.display = 'none';
        mydoc.getElementById('div_m1_options').style.display = 'none';
        mydoc.getElementById('div_menu_help').style.display = 'none';
        mydoc.getElementById('div_menu_load').style.display = 'none';
        mydoc.getElementById('div_tog_notes').style.display = 'none';
        mydoc.getElementById('div_input1').style.display = 'none';
        mydoc.getElementById('div_msg').style.display = 'none';
        mydoc.getElementById('div_print_menu').style.display = 'none';
        mydoc.getElementById('div_info').style.display = 'none';
        mydoc.getElementById('div_user_menu').style.display = 'none';
        mydoc.getElementById('div_d3_options').style.display = 'none';
    }

    // load the char_range var from the CFG values
    function initCharRange() {
        console.log('initCharRange()');
        var ranges = RMM_CFG.getCharRange();
        var start = null;
        var end = null;
        var len = ranges.length;
        var i = 0;
        var j = 0;
        var vars = null;
        char_range = {};
        for (i=0; i<len; i++) {
            vars = ranges[i].split('-');
            start = parseInt(vars[0], 10);
            if (vars.length > 1) {
                end = parseInt(vars[1], 10);
            } else {
                end = parseInt(vars[0], 10);
            }
            for (j=start; j < (end + 1); j++) {
                char_range[j] = true;
            }
        }
    }

    function getFullModule() {
        console.log('getFullModule()');
        var mod_str = pdata.module;
        if (mod_str == 'a' || mod_str === 's' || mod_str === 'm') {
            mod_str = '' + mod_str + pdata.digits;
        }
        return mod_str;
    }

    // get current level and user name for settings main menu
    function settingsUpdateCurrent() {
        console.log('settingsUpdateCurrent()');
        var name = RMM_ASM.getName();
        var setup_needed = false;
        var level_str_id = 'TXT_level_' +  getFullModule();
        var level_str = getStr(level_str_id);
        var txt = getStr('TXT_settings_current');
        // aftern initial DB load, level will be empty so no desc
        if (level_str === undefined) {
            setup_needed = true;
            level_str = getStr('TXT_level_not_set');
        }
        txt += '<div style="margin-left:20px;">';
        txt += getStr('TXT_problem_type') + ': ';
        txt += '<span style="color:#0000e6">';
        txt += level_str + '</span>';
        txt += '<br>';
        txt += getStr('TXT_user_name') + ': ';
        txt += '<span style="color:#0000e6">';
        txt += name + '</span>';
        txt += '</div>';
        txt += '<div style="text-align:center;">';
        txt += '<hr style="width:75%;"></div>';
        mydoc.getElementById('div_menu_setting_current').innerHTML = txt;
        return setup_needed;
    }

    // handle settings icon click
    function settingsClick(ev) {
        console.log('settingsClick()');
        var setup_needed = settingsUpdateCurrent();
        RMM_ASM.hideAll();
        hideAll();
        if (!pdata.module) {
            mydoc.getElementById('div_menu_exit').style.display = 'none';
        } else {
            mydoc.getElementById('div_menu_exit').style.display = 'block';
        }
        mydoc.getElementById('div_header').style.display = 'none';
        mydoc.getElementById('div_menu_container').style.display = 'block';
        mydoc.getElementById('div_menu_main').style.display = 'block';
        if (setup_needed) {
            mydoc.getElementById('div_menu_info').innerHTML = getStr('MSG_level_not_set');
            mydoc.getElementById('div_menu_info').style.display = 'block';
        }
    }

    // show the menu to select number of digits in add/subtract problems
    function showMenuDigits() {
        console.log('showMenuDigits()');
        hideAll();
        mydoc.getElementById('div_menu_digits').style.display = 'block';
    }

    // show the menu for number of negative one-digit subtractions to show
    function showSubnegMenu() {
        console.log('showSubnegMenu()');
        var subneg = pdata.subneg_pct;
        var subneg_pct = subneg * 10;
        var subtopneg = pdata.subtopneg_pct;
        var subtopneg_pct = subtopneg * 10;
        var txt = getStr('TXT_a1_neg_current'); // will hold updated section title count
        txt = txt.replace('REPLACE_number', subneg);
        txt += '  (' + subneg_pct + '%)';
        mydoc.getElementById('div_subneg_val').innerHTML = txt;
        txt = getStr('TXT_a1_neg_current'); // will hold updated section title count
        txt = txt.replace('REPLACE_number', subtopneg);
        txt += '  (' + subtopneg_pct + '%)';
        mydoc.getElementById('div_subtopneg_val').innerHTML = txt;
        addnegSetDefault('subneg_digit', subneg);
        addnegSetDefault('subtopneg_digit', subtopneg);
        hideAll();
        mydoc.getElementById('div_menu_subneg').style.display = 'block';
    }

    // set the default options for the select element
    function addnegSetDefault(id, opt_val) {
        console.warn('id, opt_val', id, opt_val);
        var my_select = document.getElementById(id);
        my_select.selectedIndex = opt_val; // option value will == index pos.
    }

    // show the menu for number of negative one-digit additions to show
    function showAddnegMenu() {
        console.log('showAddnegMenu()');
        console.warn(pdata);
        var addneg = pdata.addneg_pct;
        var addneg_pct = addneg * 10;
        var addtopneg = pdata.addtopneg_pct;
        var addtopneg_pct = addtopneg * 10;
        var txt = getStr('TXT_a1_neg_current'); // will hold updated section title count
        txt = txt.replace('REPLACE_number', addneg);
        txt += '  (' + addneg_pct + '%)';
        mydoc.getElementById('div_addneg_val').innerHTML = txt;
        txt = getStr('TXT_a1_neg_current'); // will hold updated section title count
        txt = txt.replace('REPLACE_number', addtopneg);
        txt += '  (' + addtopneg_pct + '%)';
        mydoc.getElementById('div_addtopneg_val').innerHTML = txt;
        addnegSetDefault('addneg_digit', addneg);
        addnegSetDefault('addtopneg_digit', addtopneg);
        hideAll();
        mydoc.getElementById('div_menu_addneg').style.display = 'block';
    }

    // show the menu for the option to include borrows in s2 & s3 problems
    function showSubBorrowMenu() {
        console.log('showSubBorrowMenu()');
        hideAll();
        mydoc.getElementById('div_menu_subborrow').style.display = 'block';
    }

    // show the options for multiplying one digit
    function showM1options() {
        console.log('showM1options()');
        if (pdata.module === 'm') {
            mydoc.getElementById('m1_digit').value = pdata.m1_digit;
            mydoc.getElementById('m1_order').value = pdata.m1_order;
            mydoc.getElementById('m1_start').value = pdata.m1_row1_min;
            mydoc.getElementById('m1_end').value = pdata.m1_row1_max;
            if (pdata.m1_row1_min === 11) {
                mydoc.getElementById('m1_end').disabled = true;
            } else {
                mydoc.getElementById('m1_end').disabled = false;
            }
        }
        hideAll();
        mydoc.getElementById('div_m1_options').style.display = 'block';
    }

    // show the options for long division
    function showD3options() {
        console.log('showD3options()');
        hideAll();
        if (pdata.decimal_pct) {
            mydoc.getElementById('d3_decimal').value = pdata.decimal_pct;
        } else {
            mydoc.getElementById('d3_decimal').value = 0;
        }
        if (pdata.divisor_pct) {
            mydoc.getElementById('d3_divisor').value = pdata.divisor_pct;
        } else {
            mydoc.getElementById('d3_divisor').value = 0;
        }
        mydoc.getElementById('div_d3_options').style.display = 'block';
    }

    // show the options for multiplying two digits
    function showM2options() {
        console.log('showM2options()');
        hideAll();
        mydoc.getElementById('div_m2_options').style.display = 'block';
    }

    // hide help and return to last dialog
    function helpContinue(ev) {
        console.log('helpContinue(ev)');
        hideAll();
        if (mydoc.getElementById(dialog_last)) {
            mydoc.getElementById(dialog_last).style.display = 'block';
        } else {
            mydoc.getElementById('div_menu_main').style.display = 'block';
        }
    }

    // show help for multiply one digit
    function helpNotes(ev) {
        console.log('helpNotes(ev)');
        dialog_last = 'div_tog_notes';
        var help_text = getStr('HLP_tog_notes');
        hideAll();
        mydoc.getElementById('div_menu_help_text').innerHTML = help_text;
        mydoc.getElementById('div_menu_help').style.display = 'block';
    }

    // show help for showing notes & info
    function helpM1(ev) {
        console.log('helpM1(ev)');
        dialog_last = 'div_m1_options';
        var help_text = getStr('HLP_m1_options');
        hideAll();
        mydoc.getElementById('div_menu_help_text').innerHTML = help_text;
        mydoc.getElementById('div_menu_help').style.display = 'block';
    }

    // returns unix timestap as delimited string arg=true -> microseconds
    function timestampString(ts_in, keep_milli) {
        //console.log('timestampString(keep_milli)');
        var s = '';
        var ts = '' + ts_in;
        var i = 0;
        var len = ts.length;
        if (!keep_milli && ts.length === 13) {
            ts = ts.substr(0, len-3);
            len = ts.length;
        }
        for (i=len-1; i>-1; i--) {
            s = ts.substr(i, 1) + s;
            if ((i-1) % 3 === 0) { s = '.' + s; }
        }
    return s
    }

    // converts a delimited timestamp string back to an int
    function timestampStringToInt(str) {
        //console.log('timestampStringToInt(str)');
        var digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        var s = '';
        var i = 0;
        var len = str.length;
        var err = null;
        for (i=0; i<len; i++) {
            if (digits.indexOf(str.substr(i, 1)) === -1) { continue; }
            s += str.substr(i, 1);
        }
        try {
            s = parseInt(s, 10);
        } catch (err) {
            s = null
        }
        return s
    }

//
// >>> GENERAL:End
//
//
// >>> --------------------------------DEVICE_USER:Start
//

    // prompt the user for a device name
    function inputDeviceName() {
        console.log('inputDeviceName()');
        var txt = getStr('TXT_input_device');
        mydoc.getElementById('input_1').value = '';
        input_active = true;
        hideAll();
        input1_type = 'device_name';
        // hide the exit button area forcing entry
        mydoc.getElementById('div_input1_exit_area').style.display = 'none';
        mydoc.getElementById('div_input1').style.display = 'block';
        mydoc.getElementById('div_input1_input').style.display = 'block';
        mydoc.getElementById('div_input1_text').innerHTML = txt;
    }

    // prompt the user for a user name
    function inputUserName() {
        console.log('inputUserName()');
        var txt = getStr('TXT_input_user');
        hideAll();
        mydoc.getElementById('input_1').value = '';
        input_active = true;
        input1_type = 'user_name';
        mydoc.getElementById('div_input1_exit_area').style.display = 'block';
        mydoc.getElementById('div_input1').style.display = 'block';
        mydoc.getElementById('div_input1_input').style.display = 'block';
        mydoc.getElementById('div_input1_text').innerHTML = txt;
    }
    
    // handle button clicks from print menu
    function userMenuClick(ev) {
        console.log('userMenuClick(ev)');
        var id = ev.target.id;
        hideAll();
        if (id === 'b_user_exit') {
            mydoc.getElementById('div_menu_main').style.display = 'block';
        }
        if (id === 'b_user_create') {
            inputUserName();
        }
        if (id === 'b_user_load') {
            get_mode = 'user_load';
            showMomentPlease('MSG_moment_please');
            RMM_DB.setDbNextFunction(RMM_MENU.handleUserGetAll);
            RMM_DB.tableGetAll('user');
        }
        if (id === 'b_user_delete') {
            get_mode = 'user_delete';
            showMomentPlease('MSG_moment_please');
            RMM_DB.setDbNextFunction(RMM_MENU.handleUserGetAll);
            RMM_DB.tableGetAll('user');
        }
    }

    // create the buttons for the loaded print page ids & display menu
    function handleUserGetAll() {
        console.log('handleUserGetAll()');
        var ids = RMM_DB.getDbResult();
        var id_str = '';
        var html = '';
        var len = ids.length;
        var i = 0;
        var name_str = getStr('TXT_user_load_info');
        user_iduser_name_xref = {};
        hideAll();
        // len = 1 means only default Guest exists (no added users)
        if (len < 2) {
            mydoc.getElementById('div_user_menu').style.display = 'block';
            alert(getStr('MSG_no_user_recs'));
            return;
        }
        cb_print_listing = false;
        html = '<div>';
        if (get_mode === 'user_load') {
            html += name_str.replace('REPLACE_name', RMM_ASM.getName());
        }
        if (get_mode === 'user_delete') {
            html += getStr('TXT_user_delete_info');
        }
        html += '</div>';
        mydoc.getElementById('div_menu_load_text').innerHTML = html;
        html = '';
        for (i=len-1; i>-1; i--) {
            if (get_mode === 'user_delete') {
                if (ids[i].name === getStr('DAT_guest')) {
                    continue;
                }
            }
            user_iduser_name_xref[ids[i].iduser] = ids[i].name;
            html += '<div style="margin-top:5px;">';
            html += '<button id="' + ids[i].iduser + '" class="print_id" ';
            if (get_mode === 'user_load') {
                html += 'onclick="RMM_MENU.userLoadIdClick(event);">';        
            }
            if (get_mode === 'user_delete') {
                html += 'onclick="RMM_MENU.userDeleteIdClick(event);">';        
            }
            html += ids[i].name + '</button>';
            html += '</div>';
        }
        html += '<div style="margin-top:15px;">';
        html += '<button id="b_user_load_exit" class="mbutton" ';
        html += 'onclick="RMM_MENU.userLoadIdClick(event);">';
        html += getStr('TXT_exit');
        html += '</button></div>';
        mydoc.getElementById('div_menu_load_buttons').innerHTML = html;
        mydoc.getElementById('div_menu_load').style.display = 'block';
    }

    // handle the user name id button click for delete
    function userDeleteIdClick(ev) {
        console.log('userDeleteIdClick(ev)');
        var valid = null;
        var txt = '';
        iduserdelete = parseInt(ev.target.id, 10);
        if (iduserdelete === IDGUEST) {
            alert(getStr('MSG_guest_no_delete'));
            return;
        }
        txt = getStr('MSG_user_delete_confirm');
        txt = txt.replace('REPLACE_name', user_iduser_name_xref[iduserdelete]);
        valid = window.confirm(txt);
        if (!valid) { return; }
        hideAll();
        showMomentPlease('TXT_data_deleting');
        RMM_DB.setDbNextFunction(RMM_MENU.userDeleteUserRec);
        RMM_DB.deleteRecs('session', 
                            'iduser', 
                            iduserdelete, 
                            false, 
                            2,
                            'div_info_text');
    }

    // process user record delete
    function userDeleteUserRec() {
        console.log('userDeleteUserRec()');
        RMM_DB.setDbNextFunction(RMM_MENU.handleUserDelete);
        RMM_DB.deleteRecs('user', 'iduser', iduserdelete, true, 100, '');
    }

    // process user record delete
    function handleUserDelete() {
        console.log('handleUserDelete()');
        var txt = getStr('MSG_user_delete_complete');
        var data = {'iduser':IDGUEST, 'name':getStr('DAT_guest')};
        changeUserCurrent(data);
        txt = txt.replace('REPLACE_name', user_iduser_name_xref[iduserdelete]);
        RMM_DB.setDbNextFunction(RMM_MENU.userDeleteWrapup);
        RMM_DB.setupParametersUpdate(data);
        alert(txt)
    }

    // final steps after user delete
    function userDeleteWrapup() {
        console.log('userDeleteWrapup()');
        changUserCurrentWrapup();
        hideAll();
        mydoc.getElementById('div_menu_main').style.display = 'block';
    }

    // handle the user name id button click for load
    function userLoadIdClick(ev) {
        console.log('userLoadIdClick(ev)');
        var my_iduser = ev.target.id;
        var ids = RMM_DB.getDbResult();
        var data = {iduser:null, name:null};
        var i = 0;
        var len = ids.length;
        if (my_iduser === 'b_user_load_exit') {
            hideAll();
            mydoc.getElementById('div_user_menu').style.display = 'block';
            return;
        }
        my_iduser = parseInt(my_iduser, 10);
        for (i=0; i<len; i++) {
            if (ids[i].iduser !== my_iduser) { continue;}
            data.iduser = ids[i].iduser;
            data.name = ids[i].name;
        }
        showMomentPlease('MSG_moment_please');
        console.log(data, 'data');
        RMM_DB.setDbNextFunction(RMM_MENU.handleUserUpdate);
        RMM_DB.setupParametersUpdate(data);
    }

    // process that follows updating setup table to selected iduser / name
    function handleUserUpdate() {
        console.log('handleUserUpdate()');
        var data = RMM_DB.getDbResult();
        changeUserCurrent(data);
        hideAll();
        mydoc.getElementById('div_menu_main').style.display = 'block';
    }

    // change the current user
    function changeUserCurrent(data) {
        console.log('changeUserCurrent(data)');
        RMM_ASM.setIduser(data.iduser);
        RMM_ASM.setName(data.name);
        changeUserName();
        RMM_DB.setDbNextFunction(RMM_MENU.handleUserSnapshot);
        RMM_DB.readSetup(data.iduser);
    }

    // handle pdata change based on user snapshot
    function handleUserSnapshot() {
        console.log('handleUserSnapshot()');
        var result = RMM_DB.getDbResult();
        var data = {};
        if (result !== undefined) {
            pdata = result.pdata;
            changUserCurrentWrapup();
            return;
        }
        data = { 'idkey' : RMM_ASM.getIduser(),
                 'pdata' : pdata}
        RMM_DB.setDbNextFunction(RMM_MENU.changUserCurrentWrapup);
        RMM_DB.addRecord('setup', data);
    }

    // handle pdata change based on user snapshot
    function changUserCurrentWrapup() {
        console.log('changUserCurrentWrapup()');
        RMM_ASM.showNotesSetValues(pdata);
        RMM_ASM.showNotesSetHtml();
        settingsUpdateCurrent();
    }

    // change the current user text line in user menu
    function changeUserName() {
        console.log('changeUserName()');
        var txt = getStr('TXT_user_current');
        var name = RMM_ASM.getName();
        txt = txt.replace('REPLACE_user', name);
        mydoc.getElementById('div_user_current').innerHTML = txt;
        mydoc.getElementById('div_name').innerHTML = name;
    }

    // handle input1 continue click
    function input1Continue(ev) {
        console.log('input1Continue()');
        var input_start = mydoc.getElementById('input_1').value;
        var input_end = '';
        var len = input_start.length;
        var i = 0;
        if (input1_type === 'print_delete_all') {
            printDeleteAllRecs();
            return;
        }
        if (len === 0) {
            alert(getStr('MSG_input_needed'));
            return;
        }
        if (len > 20) {
            alert(getStr('MSG_input_too_long'));
            return;
        }
        for (i=0; i<len; i++) {
            if (!char_range[input_start.charCodeAt(i)]) { continue; }
            input_end += input_start.charAt(i)
        }
        if (input_start !== input_end) {
            mydoc.getElementById('input_1').value = input_end;
            alert(getStr('MSG_invalid_chars'));
            return;
        }
        if (input1_type === 'device_name') {
            // add a random 3-digit number to device name to ensure unique
            input_end += '.' + (Math.floor(Math.random() * (1000 - 100) ) + 100);
            RMM_DB.setDevice(input_end);
            RMM_DB.setDbNextFunction(RMM_MENU.handleDeviceUpdate);
            RMM_DB.setupParametersUpdate({device : input_end});
            return;
        }
        if (input1_type === 'user_name') {
            if (input_end === getStr('DAT_guest')) {
                alert(getStr('MSG_name_not_guest'));
                return;
            }
            user_name_temp = input_end;
            showMomentPlease('MSG_moment_please');
            RMM_DB.setDbNextFunction(RMM_MENU.handleUserCheckAdd);
            RMM_DB.getRecByIndex('user', 'name', user_name_temp);
            return;
        }
    }
    
    // handle logic after adding device name
    function handleDeviceUpdate() {
        console.log('handleDeviceUpdate()');
        hideAll();
        msg_div_next = 'div_menu_main';
        // restore the exit button area
        mydoc.getElementById('div_input1_exit_area').style.display = 'block';
        mydoc.getElementById('div_msg_text').innerHTML = getStr('MSG_device_entry_done');
        mydoc.getElementById('txt_msg_textarea').style.display = 'none';
        mydoc.getElementById('div_msg').style.display = 'block';
    }

    // checks to see if new user name exists
    function handleUserCheckAdd() {
        console.log('handleUserCheckAdd()');
        var result = RMM_DB.getDbResult();
        if (result === undefined) {
            addUserName();
            return;
        }
        alert(getStr('MSG_user_name_exists'));
        hideAll();
        mydoc.getElementById('div_user_menu').style.display = 'block';
    }

    // add a user name record
    function addUserName() {
        var iduser = RMM_ASM.getRandInt(100, 1000);
        var data = { 'iduser':iduser, 'name':user_name_temp };
        data.iduser += RMM_ASM.getRandInt(100, 1000) * 1000;
        // leading digit cannot be a 1 to protect default guest id
        data.iduser += RMM_ASM.getRandInt(200, 1000) * 1000000;
        RMM_STATSLIVE.newUserAdd(data.iduser);
        RMM_DB.setDbNextFunction(RMM_MENU.handleUserAdd);
        RMM_DB.addRecord('user', data);
    }

    // handle process after adding user rec
    function handleUserAdd() {
        console.log('handleUserAdd()');
        var data = RMM_DB.getDbResult();
        pdata = RMM_DB.pdataInit();
        data['pdata'] = pdata;
        RMM_DB.setDbNextFunction(RMM_MENU.userAddFinish);
        RMM_DB.setupParametersUpdate(data);
    }

    // final steps after adding new user
    function userAddFinish() {
        console.log('userAddFinish()');
        var data = RMM_DB.getDbResult();
        var txt = getStr('MSG_user_add_done');
        var usr_txt = '';
        txt = txt.replace('REPLACE_name', data.name);
        // add sheet copy/paste text
        usr_txt += data.name + '\t';
        usr_txt += data.iduser + '\t';
        usr_txt += RMM_DB.getDevice();
        changeUserCurrent(data);
        hideAll();
        msg_div_next = 'div_menu_main';
        mydoc.getElementById('txt_msg_textarea').value = usr_txt;
        mydoc.getElementById('txt_msg_textarea').style.display = 'block';
        mydoc.getElementById('div_msg_text').innerHTML = txt;
        mydoc.getElementById('div_msg').style.display = 'block';
    }
//
// >>> DEVICE_USER:End
//
//
// >>> --------------------------------SETUPS:Start
//
//

    // handle levels change
    function levelsSet(ev) {
        console.log('levelsSet(ev)');
        var id = (ev.target.id);
        if (id === 'b_menu_add') {
            pdata.module = 'a';
            showMenuDigits();
            return;
        }
        if (id === 'b_menu_sub') {
            pdata.module = 's';
            showMenuDigits();
            return;
        }
        if (id === 'b_menu_mul') {
            pdata.module = 'm';
            showM1options();
            return;
        }
        if (id === 'b_menu_m2') {
            pdata.module = 'm2';
            showM2options();
            return;
        }
        if (id === 'b_menu_d3') {
            pdata.module = 'd3';
            showD3options();
            return;
        }
        checkProblemStart();
    }

    // handle digits change
    function digitsSet(ev) {
        console.log('digitsSet(ev)');
        var id = (ev.target.id);
        if (id === 'b_digits_1') { pdata.digits = 1; }
        if (id === 'b_digits_2') { pdata.digits = 2; }
        if (id === 'b_digits_3') { pdata.digits = 3; }
        // subneg logic must preceed checkProblemStart
        if (pdata.module === 's' && pdata.digits === 1) {
            showSubnegMenu();
            return;
        }
        if (pdata.module === 's' && pdata.digits > 1) {
            showSubBorrowMenu();
            return;
        }
        // a1 problem options for negative addendums
        if (pdata.module === 'a' && pdata.digits === 1) {
            showAddnegMenu();
            return;
        }
        checkProblemStart();
    }

    // handle a1 negative addendum clicks
    function addnegSet(ev) {
        console.log('addnegSet(ev)');



        var id = (ev.target.id);
        var val = mydoc.getElementById(id).value;
        var parts = id.split('_');
        var num_val = parseInt(val, 10);
        var pct = num_val * 10;
        var type = parts[0];
        var txt = getStr('TXT_a1_neg_current'); // will hold updated section title count
        txt = txt.replace('REPLACE_number', num_val);
        txt += '  (' + pct + '%)';
        if (type === 'addneg') {
            mydoc.getElementById('div_addneg_val').innerHTML = txt;
        } else {
            mydoc.getElementById('div_addtopneg_val').innerHTML = txt;
        }
//////
//////
//////
//////
//////
//////
//////        var id = (ev.target.id);
//////        var parts = id.split('_');
//////        var pct = parseInt(parts[2], 10);
//////        var type = parts[1];
//////        var txt = getStr('TXT_a1_neg_current'); // will hold updated section title count
//////        txt = txt.replace('REPLACE_number', pct);
//////        if (type === 'addneg') {
//////            mydoc.getElementById('div_addneg_val').innerHTML = txt;
//////        } else {
//////            mydoc.getElementById('div_addtopneg_val').innerHTML = txt;
//////        }
//////
    }

    // handle exiting the s1 negative menu which sets the 2 related pdata vars
    function subnegPdataUpdate(ev) {
        console.log('subnegPdataUpdate(ev)');
        var subneg_str = mydoc.getElementById('div_subneg_val').innerHTML;
        var subneg_num = subneg_str.split(' ')[0];
        var addtopneg_str = mydoc.getElementById('div_subtopneg_val').innerHTML;
        var addtopneg_num = addtopneg_str.split(' ')[0];
        pdata.subneg_pct = subneg_num;
        pdata.subtopneg_pct = addtopneg_num;
        checkProblemStart();
    }

    // handle exiting the a1 negative menu which sets the 2 related pdata vars
    function addnegPdataUpdate(ev) {
        console.log('addnegPdataUpdate(ev)');
        var addneg_str = mydoc.getElementById('div_addneg_val').innerHTML;
        var addneg_num = addneg_str.split(' ')[0];
        var addtopneg_str = mydoc.getElementById('div_addtopneg_val').innerHTML;
        var addtopneg_num = addtopneg_str.split(' ')[0];
        pdata.addneg_pct = addneg_num;
        pdata.addtopneg_pct = addtopneg_num;
        checkProblemStart();
    }

    // handle subneg number click
    function subnegSet(ev) {
        console.log('subnegSet(ev)');
        var id = (ev.target.id);
        var val = mydoc.getElementById(id).value;
        var parts = id.split('_');
        var num_val = parseInt(val, 10);
        var pct = num_val * 10;
        var type = parts[0];
        var txt = getStr('TXT_a1_neg_current'); // will hold updated section title count
        txt = txt.replace('REPLACE_number', num_val);
        txt += '  (' + pct + '%)';
        if (type === 'subneg') {
            mydoc.getElementById('div_subneg_val').innerHTML = txt;
        } else {
            mydoc.getElementById('div_subtopneg_val').innerHTML = txt;
        }
    }
    // handle subborrow yes/nor click
    function subborrowSet(ev) {
        console.log('subborrowSet(ev)');
        var num_str = ev.target.id.split('_')[2];
        pdata.subborrow = parseInt(num_str, 10);
        checkProblemStart();
    }

    // clear both the onclicks for M2 Next Problem button, then set to arg
    function setNextProblemOnclickM2(onclick_function) {
        console.log('setNextProblemOnclickM2()');
        var elem = mydoc.getElementById('b_m2_next');
        elem.removeEventListener('click', RMM_M2.nextM2Equation);
        elem.addEventListener('click', onclick_function);
    }

    // clear both the onclicks for D3 Next Problem button, then set to arg
    function setNextProblemOnclickD3(onclick_function) {
        console.log('setNextProblemOnclickD3()');
        var elem = mydoc.getElementById('b_d3_next');
        elem.removeEventListener('click', RMM_D3.nextD3Equation);
        elem.addEventListener('click', onclick_function);
    }

    // handle m2 type (basic / chunk) selection
    function m2optionsType(ev) {
        console.log('m2optionsType(ev)');
        var type = ev.target.id;
        if (type === 'b_m2_type_basic') {
            RMM_M2.setLevel('m2b');
            pdata.module = 'm2b';
        } else {
            RMM_M2.setLevel('m2c');
            pdata.module = 'm2c';
        }
        RMM_MENU.setNextProblemOnclickM2(RMM_M2.nextM2Equation);
        RMM_M2.setModule('m2');
        RMM_M2.setBkgdsRowsCols(5, 4);
        mydoc.getElementById('div_m2_options').style.display = 'none';
        mydoc.getElementById('div_header').style.display = 'block';
        RMM_ASM.hideAll();
        RMM_DB.setupPdataSet(IDSETUP, pdata);
        RMM_M2.setCounters();
        RMM_M2.nextM2Equation();
    }

    // handle m1 change of start number
    function m1optionsStartChange(ev) {
        console.log('m1optionsStartChange(ev)');
        var start = parseInt(mydoc.getElementById('m1_start').value, 10);
        if (start === 11) {
            mydoc.getElementById('m1_end').value = 20;
            mydoc.getElementById('m1_end').disabled = true;
            return;
        }
        mydoc.getElementById('m1_end').disabled = false;
    }

    // handle d3 options
    function d3optionsSet(ev) {
        console.log('d3optionsSet(ev)');
        hideAll();
        RMM_MENU.setNextProblemOnclickD3(RMM_D3.nextD3Equation);
        pdata.divisor_pct = parseInt(mydoc.getElementById('d3_divisor').value, 10);
        pdata.decimal_pct = parseInt(mydoc.getElementById('d3_decimal').value, 10);
        RMM_D3.setEquationVars(pdata);
        checkProblemStart();
    }

    // handle m1 options
    function m1optionsSet(ev) {
        console.log('m1optionsSet(ev)');
        var start = parseInt(mydoc.getElementById('m1_start').value, 10);
        var end = parseInt(mydoc.getElementById('m1_end').value, 10);
        if (end < start) {
            alert(getStr('MSG_m1_startend_mismatch'));
            return;
        }
        pdata.m1_digit = parseInt(mydoc.getElementById('m1_digit').value, 10);
        pdata.m1_order = mydoc.getElementById('m1_order').value;
        pdata.m1_row1_min = start;
        pdata.m1_row1_max = end;
        checkProblemStart();
    }

    // checks pdata to find completed states to start a problem
    function checkProblemStart() {
        console.log('checkProblemStart()');
        var start = false;
        var idlevel = '';
        if (pdata.module === 'd3') {
            mydoc.getElementById('div_header').style.display = 'block';
            startProblemD3();
            RMM_STATSLIVE.displayUserCounts('d3', false);
            return;
        }
        if (pdata.module === 'a' && pdata.digits) {
            start = true;
            idlevel = 'a' + pdata.digits;
        }
        if (pdata.module === 's') {
            // neg_pct only used for digits == 1
            idlevel = 's' + pdata.digits;
            if (pdata.digits > 1) { start = true; }
            if (pdata.digits && pdata.subneg_pct !== null) {
                start = true;
            } else {
                idlevel = 's1';
            }
        }
        if (pdata.module === 'm' && pdata.m1_row_max !== null) {
            pdata.digits = 1;
            start = true;
            idlevel = 'm1';
        }
        if (pdata.module.substr(0, 2) === 'm2') {
            pdata.digits = 2;
            start = true;
            idlevel = 'm2';
        }
        RMM_ASM.setSessionCount(); // need this even for s1 which is not started here
        console.log(start);
        if (start) {
            mydoc.getElementById('div_asm_container').style.display = 'block';
            mydoc.getElementById('div_menu_exit').style.display = 'block';
            mydoc.getElementById('div_header').style.display = 'block';
            startProblemASM();
        }
        RMM_STATSLIVE.displayUserCounts(idlevel, false);
    }

    // start long division D3
    function startProblemD3() {
        console.log('startProblemD3()');
        //RMM_ASM.hideAll();
        RMM_ASM.setModule('d3');
        RMM_DB.setupPdataSet(IDSETUP, pdata);
        RMM_D3.setCounters();
        RMM_D3.nextD3Equation(pdata);
    }

    // start the ASM problem setting the data first
    function startProblemASM() {
        console.log('startProblemASM()');
        RMM_ASM.setModule('asm');
        RMM_DB.setupPdataSet(IDSETUP, pdata);
        RMM_ASM.setProblem(pdata);
    }
// >>> SETUPS:end
//
//
// >>> --------------------------------PRINT:Start
//

    // setup the text in the print menu, then display the menu
    function printMenuShow() {
        console.log('printMenuShow()');
        var txt = getStr('TXT_print_menu_text');
        var txt_level = getStr('TXT_level_' + getFullModule());
        txt = txt.replace('REPLACE_LEVEL', txt_level);
        mydoc.getElementById('div_print_menu_text').innerHTML = txt;
        mydoc.getElementById('div_print_menu').style.display = 'block';
    }

    // convert reduce problem string into 3x3 array with nulls for no number
    function printCreateProblemArray(problem) {
        console.log('printCreateProblemArray(problem)');
        var temp = []
        var prob = [];
        var rows = problem.split('|');
        var i = 0;
        var len = 3;
        var result = {};
        for (i=0; i<len; i++) {
            // remember prob_asm array indexing: 0=100s, 1=10s, 2=0s
            temp = [null, null, null, null];
            if (rows[i].length === 1) {
                temp[3] = parseInt(rows[i].substr(0, 1), 10);
            }
            if (rows[i].length === 2) {
                temp[3] = parseInt(rows[i].substr(1, 1), 10);
                // only non-numeric possible is negative sign in 10s col
                if (rows[i].substr(0, 1) === '-') {
                    temp[2] = '-';
                } else {
                    temp[2] = parseInt(rows[i].substr(0, 1), 10);
                }
            }
            if (rows[i].length === 3) {
                temp[3] = parseInt(rows[i].substr(2, 1), 10);
                if (rows[i].substr(1, 1) === '-') {
                    temp[2] = '-';
                } else {
                    temp[2] = parseInt(rows[i].substr(1, 1), 10);
                }
                if (rows[i].substr(0, 1) === '-') {
                    temp[1] = '-';
                } else {
                    temp[1] = parseInt(rows[i].substr(0, 1), 10);
                }
            }
            if (rows[i].length === 4) {
                temp[3] = parseInt(rows[i].substr(3, 1), 10);
                temp[2] = parseInt(rows[i].substr(2, 1), 10);
                temp[1] = parseInt(rows[i].substr(1, 1), 10);
                temp[0] = parseInt(rows[i].substr(0, 1), 10);
            }
            prob.push(temp);
        }
        result['problem'] = prob;
        result['op'] = rows[3];
        return result
    }

    //return a number sliced from string
    function getNumStringPath(num_str, pos) {
        var mynum = 0;
        var err = null;
        try {
            mynum = parseInt(num_str.slice(pos-1, pos), 10);
        } catch (err) {
            mynum = 0;
        }
        return RMM_ASM.pathTransform(getNums(mynum), 'printd3');
    }

    // build the individual print problem svg elements
    function printBuildD3Svg(problem, margins) {
        console.log('printBuildD3Svg(problem, margins)');
        var divide = getSyms('divide_print');
        var dpoint = getSyms('decimal_print');
        var path = '';
        var svg = '';
        var vars = problem.split('|');
        var divisor = vars[0];
        var dividend = vars[1];
        var quotient = vars[2].split('.')[0];
        var decimal = vars[3].length === 1 ? vars[3] : vars[3].slice(2, 3);
        // offset numbers using one nested svg minus 18 for 4th answer digit
        svg = '<svg x="' + (margins.page_left) + '" y="0">';
        path = RMM_ASM.pathTransform(getNums(8), 'printd3');
        // divisor
        if (divisor.length === 1) {
            path = getNumStringPath(divisor, 1);
            svg += '<svg x="10" y="20">' + path + '</svg>';
        } else {
            path = getNumStringPath(divisor, 2);
            svg += '<svg x="10" y="20">' + path + '</svg>';
            path = getNumStringPath(divisor, 1);
            svg += '<svg x="00" y="20">' + path + '</svg>';
        }
        // dividend
        path = getNumStringPath(dividend, 1);
        svg += '<svg x="28" y="20">' + path + '</svg>';
        path = getNumStringPath(dividend, 2);
        svg += '<svg x="41" y="20">' + path + '</svg>';
        path = getNumStringPath(dividend, 3);
        svg += '<svg x="54" y="20">' + path + '</svg>';
        // decimal point
        if (decimal !== '0') {
            svg += '<svg x="-35" y="12">' + dpoint + '</svg>';
        }
        // quotient
        if (cb_print_listing) {
            if (quotient.length === 3) {
                path = getNumStringPath(quotient, 3);
                svg += '<svg x="54" y="0">' + path + '</svg>';
                path = getNumStringPath(quotient, 2);
                svg += '<svg x="41" y="0">' + path + '</svg>';
                path = getNumStringPath(quotient, 1);
                svg += '<svg x="28" y="0">' + path + '</svg>';
            }
            if (quotient.length === 2) {
                path = getNumStringPath(quotient, 2);
                svg += '<svg x="54" y="0">' + path + '</svg>';
                path = getNumStringPath(quotient, 1);
                svg += '<svg x="41" y="0">' + path + '</svg>';
            }
            if (quotient.length === 1) {
                path = getNumStringPath(quotient, 1);
                svg += '<svg x="54" y="0">' + path + '</svg>';
            }
            // decimal value
            if (decimal !== '0') {
                path = getNumStringPath(decimal, 1);
                svg += '<svg x="75" y="0">' + path + '</svg>';
            }
        }
        svg += '<svg x="-25" y="13">' + divide + '</svg>';
        svg += '</svg>'; // end of numbers nest svg
        return svg;
    }

    // build the individual print problem svg elements
    function printBuildProblemSvg(problem, margins) {
        console.log('printBuildProblemSvg(problem, margins)');
        var result = printCreateProblemArray(problem);
        var op = result.op;
        var prob = result.problem; // array format
        var i = 0;
        var j = 0;
        var max_nums = 4; // max number of digits in any problem row
        var xpos = [0, 18, 36, 54]; // number spacing in row for 4-digit answer
        var ypos = [0, 25, 55]; // spacing between rows
        var line = RMM_ASM.pathTransform(getSyms('line_total'), 'print');
        var path = '';
        var svg = '';
        if (op === '+') {
            op = RMM_ASM.pathTransform(getSyms('plus'), 'print');
        }
        if (op === '-') {
            op = RMM_ASM.pathTransform(getSyms('minus'), 'print');
        }
        if (op === 'x') {
            op = RMM_ASM.pathTransform(getSyms('multiply'), 'print');
        }
        // offset numbers using one nested svg minus 18 for 4th answer digit
        svg = '<svg x="' + (margins.page_left - 18) + '" y="0">';
        // i is the problem row, j is the num position in a row
        for (i=0; i<3; i++) {
            for (j=0; j<max_nums; j++) {
                if (prob[i][j] === undefined) { continue; }
                if (prob[i][j] === null) { continue; }
                // if answers check box is not clicked continue
                if (i === 2 && !cb_print_listing) { continue;}
                // handle unique case of negative number for subtractions
                if (prob[i][j] === '-') {
                    path = RMM_ASM.pathTransform(getSyms('minus'), 'print_minus');
                } else {
                    path = RMM_ASM.pathTransform(getNums(prob[i][j]), 'print');
                    //if (prob[i][j] === 3) { path = RMM_ASM.pathTransform(getSyms('minus'), 'print_minus'); }
                }
                svg += '<svg x="' + xpos[j] + '" ';
                svg += 'y="' + ypos[i] + '">';
                svg += path;
                svg += '</svg>';
            }
        }
        svg += '</svg>'; // end of numbers nest svg
        // add operator
        svg += '<svg x="0" y="-18" fill-rule="evenodd" clip-rule="evenodd" ';
        svg += 'stroke-linejoin="round" stroke-miterlimit="2">' + op + '</svg>';
        // add total line
        svg += '<svg x="0" y="22" fill-rule="evenodd" clip-rule="evenodd" ';
        svg += 'stroke-linejoin="round" stroke-miterlimit="2">' + line + '</svg>';
        return svg;
    }

    function printBuildPage() {
        console.log('printBuildPage()');
        var margins = RMM_CFG.getPrintMargins();
        var ptrans = margins.transforms;
        var p_top = margins.page_margin_top;
        var i = 0;
        var len = problems.length;
        var rows = len / 7;
        var j = 0;
        var num_prob = 6;
        var div_top = '<div id="div_print_line_';
        var div_bot = '</div>';
        var svg_txt = '<svg width="70" height="70" viewBox="0 0 70 70" x="0" y="0" transform="translate(';
        var svg = '';
        var html = '';
        var module = pdata.module;
        if (module === 'd3') {
            num_prob = 5;
            rows = 7;
            svg_txt = '<svg width="110" height="70" viewBox="0 0 110 70" x="0" y="0" transform="translate(';
        }
        // seven lines of problems, 6 problems per line
        for (i=0; i<rows; i++) {
            html += div_top + i + '">';
            for (j=0; j<num_prob; j++) {
                if (module === 'd3') {
                    svg = svg_txt + (ptrans[j]-(20*j)) + ',0)">';
                } else {
                    svg = svg_txt + ptrans[j] + ',0)">';
                }
                //if (i===0 && j===0) {svg += printBuildProblemSvg(problems[(i*6)+j], margins);}
                //if (i===0) {svg += printBuildProblemSvg(problems[(i*6)+j]), margins;}
                if (module !== 'd3') {
                    svg += printBuildProblemSvg(problems[(i*num_prob)+j], margins);
                } else {
                    svg += printBuildD3Svg(problems[(i*num_prob)+j], margins);
                }
                svg += '</svg>';
                html += svg;
            }
            html += div_bot;
            if (i < rows) {
                html += '<div style="margin-top:' + margins.row_gap + 'px">'
                html += '&nbsp</div>';
            }
        }
        mydoc.getElementById('div_print_page').innerHTML = html;
    }

    // show the moment please info dialog using CFG id as arg
    function showMomentPlease(id) {
        console.log('showMomentPlease(id)');
        hideAll();
        mydoc.getElementById('div_info_text').innerHTML = getStr(id);
        mydoc.getElementById('div_info').style.display = 'block';
    }

    // loop thru problem setup to build full array
    function printProblemsBuildArray() {
        console.log('printProblemsBuildArray()');
        var module = pdata.module;
        var i = 0;
        var len = 42;
        problems = [];
        if (module === 'd3') { len = 35; }
        showMomentPlease('MSG_print_moment');
        RMM_ASM.setPrintmode(true);
        for (i=0; i<len; i++) {
            if (module === 'a' || module === 's' || module === 'm') {
                RMM_ASM.printProblemSetup();
                problems.push(RMM_ASM.getProblemStr());
            }
            if (module === 'm2c' || module === 'm2b') {
                RMM_M2.printProblemSetup();
                problems.push(RMM_M2.getProblemStr());
            }
            if (module === 'd3') {
                RMM_D3.printProblemSetup();
                problems.push(RMM_D3.getProblemStr());
            }
        }
        RMM_ASM.setPrintmode(false);
    }

    // create print problems, save to the db then print page display (onsuccess)
    function printCreateNewSheet() {
        console.log('printCreateNewSheet()');
        var id_ts = Date.now();
        var data = {};
        var module = pdata.module;
        if (module === 'm2c' || module === 'm2b') { module = 'm2'; }
        // asm will have level tacked on after module
        idprint = timestampString(id_ts, false);
        // idprint trimmed milliseconds so convert to int for DB save
        idprint = timestampStringToInt(idprint);
        printProblemsBuildArray();
        data = { 'idprint' : idprint,
                 'problems' : problems,
                 'module' : module, 
                 'digits' : pdata.digits,
                 'm1_digit' : pdata.m1_digit};
        cb_print_listing = false;
        RMM_DB.setDbNextFunction(RMM_MENU.printPageShow);
        RMM_DB.addRecord('print', data);
        // leave next line in to test layout of a "full page" of equations
        //problems = ["888|888|888|x", "881|827|054|-", "398|175|223|-", "653|235|418|-", "470|200|270|-", "438|258|180|-", "824|219|605|-", "566|531|035|-", "827|218|609|-", "943|388|555|-", "332|192|140|-", "777|294|483|-", "851|269|582|-", "726|363|363|-", "628|218|410|-", "483|313|170|-", "837|513|324|-", "689|646|043|-", "898|362|536|-", "817|356|461|-", "865|756|109|-", "979|559|420|-", "441|222|219|-", "585|377|208|-", "772|140|632|-", "621|237|384|-", "548|399|149|-", "920|260|660|-", "896|399|497|-", "914|748|166|-", "722|706|016|-", "908|230|678|-", "502|138|364|-", "923|732|191|-", "507|497|010|-", "226|165|061|-", "514|344|170|-", "960|575|385|-", "923|562|361|-", "829|787|042|-", "974|557|417|-", "844|324|520|-"];
        }

        // show the print page
        function printPageShow() {
        console.log('printPageShow()');
        var margins = RMM_CFG.getPrintMargins();
        var p_left = margins.page_margin_left;
        var p_top = margins.page_margin_top;
        var exit_txt = getStr('TXT_print_page_exit');
        var id_str = timestampString(idprint, false);
        hideAll();
        mydoc.getElementById('div_print_page').style.marginLeft = p_left + 'px';
        mydoc.getElementById('a_idprint').style.marginLeft = p_left + 'px';
        mydoc.getElementById('a_idprint').style.marginTop = p_top + 'px';
        mydoc.getElementById('a_idprint').innerHTML = '' + id_str + exit_txt;
        mydoc.getElementById('div_header').style.display = 'none';
        printBuildPage();
        mydoc.getElementById('div_developer').style.display = 'none';
        mydoc.getElementById('div_print_page').style.display = 'block';
        mydoc.getElementById('div_print_container').style.display = 'block';
    }

    // handle button clicks from print menu
    function printMenuClick(ev) {
        console.log('printMenuClick(ev)');
        var id = ev.target.id;
        hideAll();
        get_mode = '';
        if (id === 'b_print_exit') {
            RMM_ASM.resetNegativeCounters();
            mydoc.getElementById('div_menu_main').style.display = 'block';
        }
        if (id === 'b_print_create') {
            print_created = true;
            printCreateNewSheet();
        }
        if (id === 'b_print_load') {
            get_mode = 'print_load';
            print_created = false;
            showMomentPlease('MSG_moment_please');
            RMM_DB.setDbNextFunction(RMM_MENU.handlePrintGetAll);
            RMM_DB.tableGetAll('print');
        }
        if (id === 'b_print_delete') {
            get_mode = 'print_delete';
            print_created = false;
            showMomentPlease('MSG_moment_please');
            RMM_DB.setDbNextFunction(RMM_MENU.handlePrintGetAll);
            RMM_DB.tableGetAll('print');
            alert(getStr('MSG_print_delete_warning'));
        }
    }

    // create the buttons for the loaded print page ids & display menu
    function handlePrintGetAll() {
        console.log('handlePrintGetAll()');
        var ids = RMM_DB.getDbResult();
        var id_str = '';
        var html = '';
        var mod = '';
        var len = ids.length;
        var i = 0;
        mydoc.getElementById('div_menu_load_buttons').innerHTML = '';
        hideAll();
        cb_print_listing = false;        
        html = '<div>';
        if (get_mode === 'print_load') {
            html += getStr('TXT_print_load_info');
        }
        if (get_mode === 'print_delete') {
            html += getStr('TXT_print_delete_info');
        }
        if (len === 0) {
            html += '<br><br>' + getStr('MSG_no_print_recs');
        }
        html += '<div style="text-align:center;">';
        html += '<br><input type="checkbox" id="cb_print_listing" ';
        html += 'onchange="RMM_MENU.printDeleteAllCheck(event);">';
        if (get_mode === 'print_load') {
            html += '&nbsp;&nbsp' + getStr('TXT_include_answers');
        } else {
            html += '&nbsp;&nbsp' + getStr('TXT_delete_all_prints');
        }
        html += '</div>';        
        html += '</div>';
        mydoc.getElementById('div_menu_load_text').innerHTML = html;
        html = '';
        for (i=len-1; i>-1; i--) {
            id_str = timestampString(ids[i].idprint, false);
            mod = ids[i].module;
            if (ids[i].module === 'a') { mod += '+' + ids[i].digits }
            if (ids[i].module === 's') { mod += '&#150;' + ids[i].digits }
            if (ids[i].module === 'm') {
                mod += 'x' + ids[i].digits + '.' + ids[i].m1_digit;
            }
            if (ids[i].module === 'm2') { mod += 'x2' }
            if (ids[i].module === 'd3') { mod += '/3' }
            html += '<div id="prt_' + ids[i].idprint + '"';
            html += ' style="margin-top:5px;">';
            html += '<button id="' + ids[i].idprint + '" class="print_id" ';
            html += 'onclick="RMM_MENU.printPageIdClick(event);">';
            html += id_str + '</button>';
            html += '&nbsp;&nbsp;<span style="font-size:75%;';
            html += 'display:inline-block;width:50px;">';
            html += mod;
            html += '</span></div>';            
        }
        html += '<div style="margin-top:15px;">';
        html += '<button id="b_print_load_exit" class="mbutton" ';
        html += 'onclick="RMM_MENU.printPageIdClick(event);">';        
        html += getStr('TXT_exit');
        html += '</button></div>';
        mydoc.getElementById('div_menu_load').style.display = 'block';
        mydoc.getElementById('div_menu_load_buttons').innerHTML += html;
    }

    // handle the print page id button click
    function printPageIdClick(ev) {
        console.log('printPageIdClick(ev)');
        var my_idprint =ev.target.id;
        if (my_idprint === 'b_print_load_exit') {
            hideAll();
            mydoc.getElementById('div_print_menu').style.display = 'block';
            return;
        }
        if (get_mode === 'print_load') {
            printPageLoad(my_idprint);
        } else { // delete where my_idprint is timestamp idprint
            mydoc.getElementById('prt_' + my_idprint).remove();
            hideAll();
            showMomentPlease('MSG_moment_please');
            RMM_DB.setDbNextFunction(RMM_MENU.printDeleteOneDone);
            RMM_DB.deleteRecs('print',
                                'idprint', 
                                parseInt(my_idprint, 10),
                                false,
                                2,
                                'div_info_text');
        }
    }

    // process following delete of one print record
    function printDeleteOneDone() {
        console.log('printDeleteOneDone()');
        RMM_DB.setDbNextFunction(RMM_MENU.handlePrintGetAll);
        RMM_DB.tableGetAll('print');
    }

    // load a specific print worksheet
    function printPageLoad(my_idprint) {
        console.log('printPageLoad(my_idprint)');
        var ids = RMM_DB.getDbResult();
        var i = 0;
        var len = ids.length;
        cb_print_listing = mydoc.getElementById('cb_print_listing').checked;
        // set global idprint
        idprint = parseInt(my_idprint, 10);
        for (i=0; i<len; i++) {
            if (ids[i].idprint !== idprint) { continue;} 
            problems = ids[i].problems;
        }
        printPageShow();
    }

    // handle the delete all checkbox click (also used for answers check)
    function printDeleteAllCheck(ev) {
        console.log('printDeleteAllCheck(ev)');
        var txt = getStr('TXT_print_confirm_delete_all');
        if (get_mode === 'print_load') { return; }
        input_active = true;
        hideAll();
        input1_type = 'print_delete_all';
        mydoc.getElementById('div_input1_exit_area').style.display = 'block';
        mydoc.getElementById('div_input1').style.display = 'block';
        mydoc.getElementById('div_input1_input').style.display = 'none';
        mydoc.getElementById('div_input1_text').innerHTML = txt;
    }

    // delete all the print recs
    function printDeleteAllRecs() {
        console.log('printDeleteAllRecs()');
        showMomentPlease('MSG_moment_please');
        RMM_DB.setDbNextFunction(RMM_MENU.printDeleteAllDone);
        RMM_DB.deleteRecs('print',
                            null,
                            null,
                            false,
                            2,
                            'div_info_text');
    }

    // print delete all done handler
    function printDeleteAllDone() {
        console.log('printDeleteAllDone()');
        hideAll();
        mydoc.getElementById('div_print_menu').style.display = 'block';
    }

    // close the print page note: changes containers display styles
    function printPageExit(ev) {
        console.log('printPageExit(ev)');
        hideAll();
        mydoc.getElementById('div_print_container').style.display = 'none';
        if (!print_created) {
            mydoc.getElementById('div_menu_load').style.display = 'block';
            return;
        }
        alert(getStr('MSG_answers_access'));
        mydoc.getElementById('div_print_menu').style.display = 'block';
        mydoc.getElementById('div_menu_container').style.display = 'block';

    }
//
// >>> PRINT:end
//
// >>> --------------------------------CLICKS:Start
//
//
// >>> CLICKS:end
//

    // handle settings icon click
    function exitClick(ev) {
        console.log('exitClick()');
        hideAll();
    }

    // handle main menu click
    function menuMainClick(ev) {
        console.log('menuMainClick()');
        var id = ev.target.id;
        hideAll();
        switch(id) {
            case 'b_menu_sync':
                RMM_SYNC.mainMenuShow();
                break;
            case 'b_menu_stats':
                RMM_STATS.init();
                break;
            case 'b_menu_print':
                printProblems();
                break;
            case 'b_menu_user':
                mydoc.getElementById('div_user_menu').style.display = 'block';
                break;
            case 'b_menu_levels':
                mydoc.getElementById('div_menu_levels').style.display = 'block';
                break;
            case 'b_menu_notes':
                RMM_ASM.showNotesSetValues(pdata);
                RMM_ASM.showNotesSetHtml();
                mydoc.getElementById('div_tog_notes').style.display = 'block';
                break;
            case 'b_menu_exit':
                checkProblemStart();
                break;
            default:
                alert(id + ' is missing in menuMainClick()');
                
        }
    }

    // process the print problems selection
    function printProblems() {
        console.log('printProblems()');
        // handle case where print is done before setting ANY problem type
        if (!pdata.module) {
            mydoc.getElementById('div_menu_main').style.display = 'block';
            alert(getStr('MSG_print_level_needed'));
            return;
        }
        printMenuShow();
    }

    // handle all of the buttons for setting notes on / off
    function togClick(ev) {
        console.log('togClick()');
        var id = (ev.target.id);
        toggleNotes(id);
    }

    // toggle problem notes between off/on
    function toggleNotes(id) {
        console.log('toggleNotes(id)');
        var span = id.replace('b_', 's_');
        var ele = mydoc.getElementById(span);
        var is_on = true;
        if (ele.innerHTML === getStr('TXT_eq_off')) {
            ele.innerHTML = getStr('TXT_eq_on');
            ele.setAttribute('class', 'toggle_on');
        } else {
            ele.innerHTML = getStr('TXT_eq_off');
            ele.setAttribute('class', 'toggle_off');
            is_on = false;
        }
        RMM_ASM.setToggleNotes(id, is_on);
        notesPdataSet(id, is_on);
    }

    // add the changed notes field to pdata
    function notesPdataSet(id, is_on) {
        console.log('notesPdataSet(id)');
        var xref = {
            'b_tog_numpos' : 'shnote_numpos',
            'b_tog_next' : 'shnote_next',
            'b_tog_carry' : 'shnote_carry',
            'b_tog_chunk' : 'shnote_chunk',
            'b_tog_borrow' : 'shnote_borrow',
            'b_tog_bpopup' : 'shnote_bpopup',
        }
        pdata[xref[id]] = is_on;
    }

    // handle exiting notes on/off changes updating ndata in setup
    function notesExit(ev) {
        console.log('notesExit()');
        var id = (ev.target.id);
        hideAll();
        RMM_DB.setupPdataSet(IDSETUP, pdata);
        if (id === 'b_tog_exit') {
            mydoc.getElementById('div_menu_main').style.display = 'block';
            return;
        }
        checkProblemStart();
    }

    // exit from levels options dialog
    function levelsExit(ev) {
        console.log('levelsExit(ev)');
        id = ev.target.id;
        if (id === 'b_menu_addneg_save') { addnegPdataUpdate(); }
        if (id === 'b_menu_subneg_save') { subnegPdataUpdate(); }
        hideAll();
        // open problem after either s1 or a1 exits
        if (id === 'b_menu_addneg_exit'  || id == 'b_menu_subneg_exit') {
            checkProblemStart();
            return;
        }
        mydoc.getElementById('div_menu_main').style.display = 'block';
    }

    // exit from msg options dialog
    function msgExit(ev) {
        console.log('msgExit(ev)');
        input_active = false;
        mydoc.getElementById('txt_msg_textarea').value = '';
        mydoc.getElementById('txt_msg_textarea').style.display = 'none';
        if (msg_div_next === 'div_menu_main') {
            settingsClick(null);
            return;
        }
        hideAll();
        mydoc.getElementById(msg_div_next).style.display = 'block';
    }

// >>> --------------------------------GETSET:Start
//

    // setPdata
    function setPdata(pdata_in) {
        pdata = pdata_in;
    }

    // resize M2 and DV
    function resize(ev) {
        console.log('resize(ev)');
        RMM_M2.lo_centerContainer();
    }

    // allowed character range
    function getCharRange() {
        console.log('getCharRange)');
        return char_range;
    }
//
// >>> GETSET:end
//
    return {
        initCharRange : initCharRange,
        inputDeviceName : inputDeviceName,
        inputUserName : inputUserName,
        handlePrintGetAll : handlePrintGetAll,
        handleUserGetAll : handleUserGetAll,
        handleUserAdd : handleUserAdd,
        printDeleteAllCheck : printDeleteAllCheck,
        printDeleteAllDone: printDeleteAllDone,
        printDeleteOneDone: printDeleteOneDone,
        handleUserUpdate : handleUserUpdate,
        handleUserCheckAdd : handleUserCheckAdd,
        handleDeviceUpdate : handleDeviceUpdate,
        userAddFinish : userAddFinish,
        userDeleteUserRec : userDeleteUserRec,
        handleUserDelete : handleUserDelete,
        userDeleteWrapup : userDeleteWrapup,
        handleUserSnapshot : handleUserSnapshot,
        changUserCurrentWrapup : changUserCurrentWrapup,
        setNextProblemOnclickM2 : setNextProblemOnclickM2,
        setNextProblemOnclickD3 : setNextProblemOnclickD3,
        hideAll : hideAll,
        // button handlers
        settingsClick : settingsClick,
        notesExit : notesExit,
        menuMainClick : menuMainClick,
        togClick : togClick,
        helpContinue : helpContinue,
        helpM1 : helpM1,
        helpNotes : helpNotes,
        levelsExit : levelsExit,
        msgExit : msgExit,
        input1Continue : input1Continue,
        printMenuClick : printMenuClick,
        userMenuClick : userMenuClick,
        printPageExit : printPageExit,
        printPageShow : printPageShow,
        printPageIdClick : printPageIdClick,
        userLoadIdClick : userLoadIdClick,
        userDeleteIdClick : userDeleteIdClick,
        m1optionsStartChange : m1optionsStartChange,
        m2optionsType : m2optionsType,
        resize : resize,
        // setup handlers
        levelsSet : levelsSet,
        digitsSet : digitsSet,
        subnegSet : subnegSet,
        addnegSet : addnegSet,
        subborrowSet : subborrowSet,
        m1optionsSet : m1optionsSet,
        d3optionsSet : d3optionsSet,
        // getters+setters
        setPdata : setPdata,
        printCreateNewSheet : printCreateNewSheet,
        getCharRange : getCharRange
    };
})();
