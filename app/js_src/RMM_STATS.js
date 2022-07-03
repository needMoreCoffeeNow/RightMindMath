var RMM_STATS = (function() {
    var mydoc = window.document;
    var timervar = null; // use for setTimeout and clearTimeout functions
    var sdata = {}; // array stores all the session data
    var m1_digit = ''; // string value of m1 digit to analyze
    var m1_ordered = ''; // value for m1 ordered (true) or random (false)
    var rollup = {}; // rollup of usage stats
    var rollup_m1 = {}; // rollup of usage stats
    var xref_id = {}; // iduser indexed to user name
    var idstats = ''; // stores the iduser number selected for stats present
    var idname = ''; // stores the user name selected for stats present
    var idlevel = ''; // level of stats (l: a1, s2, etc.
    var times = []; // stores iduser, idlevel times
    var times_ypos = []; // stores calc'ed ypos for each times datapoint
    var triesSyms = []; // strores iduser, idlevel answer tries (not for m2, d3)
    var xpos_circles = []; // stores circle xpos based on line point xpos
    var xposXright = RMM_SymsNums.getXpos('chart_xright');
    var averaged = false; // flag set to true when charts times.length > 100
    var avg_len = 0; // stores times array length before averaging
    // db
    var DB_TRIES_STD = 100; // std arg to set db_max_tries in dbSetWaitVars
    var IDGUEST = 10884293110550;

    // RMM_CFG shortcuts start
    function getStr(id) { return RMM_CFG.getStr(id); }
    function getNums(id) { return RMM_SymsNums.getNums(id); }
    function getSyms(id) { return RMM_SymsNums.getSyms(id); }
    function getTransforms(id) { return RMM_SymsNums.getTransforms(id); }
    function numAtIndex(num, index) { return RMM_M2.numAtIndex(num, index); }

    function init() {
        console.log('init()');
        var txt = getStr('TXT_data_loading');
        txt = txt.replace('REPLACE_count', '1');
        mydoc.getElementById('div_info_text').innerHTML = txt;
        mydoc.getElementById('div_info').style.display = 'block';
        RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_STATS.idXrefSetup);
        RMM_DB.tableGetAll('user');
    }

    // show the moment please info dialog using CFG id as arg
    function showMomentPlease(id) {
        console.log('showMomentPlease(id)');
        mydoc.getElementById('div_stats_container').style.display = 'none';
        mydoc.getElementById('div_info_text').innerHTML = getStr(id);
        mydoc.getElementById('div_info').style.display = 'block';
    }

    function idXrefSetup() {
        console.log('idXrefSetup()');
        var result = RMM_DB.getDbResult();
        var i = 0;
        var len = result.length;
        xref_id = {};
        for (i=0; i<len; i++) {
            xref_id[result[i].iduser] = result[i].name;
        }
        console.log(xref_id);
        loadSessionData();
    }

    function loadSessionData() {
        console.log('loadSessionData()');
        sdata = [];
        RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_STATS.statsHandleReadData);
        RMM_DB.sessionGetAllRollup(null, 50, 'div_info_text');
    }

    // handle stats after data is read
    function statsHandleReadData() {
        console.log('statsHandleReadData()');
        var i = 0;
        var len = 0;
        var iduser = null;
        var idlevel = null;
        var digit = -1;
        var m1_id = '';
        sdata = RMM_DB.getDbResult();
        console.warn(sdata);
        console.log(sdata.length, 'sdata.length');
        len = sdata.length;
        if (len === 0) {
            alert(getStr('MSG_no_session_data'));
            mydoc.getElementById('div_info').style.display = 'none';
            mydoc.getElementById('div_menu_main').style.display = 'block';
            return;
        }
        rollup = {};
        // setup the iduser data containers first
        for (i=0; i<len; i++) {
            if (rollup[sdata[i].iduser]) { continue; }
            rollup[sdata[i].iduser] = {};
            rollup_m1[sdata[i].iduser] = {};
        }
        // add the rollup counts by level with m2b & m2c sub-totals for m2
        for (i=0; i<len; i++) {
            console.warn(sdata[i]);
            iduser = sdata[i].iduser;
            idlevel = sdata[i].idlevel;
            // remove the digit identifier from m1 recs
            if (idlevel.indexOf('m1') > -1) { idlevel = idlevel.substr(0, 2); }
            if (!rollup[iduser]['total']) {
                rollup[iduser]['total'] =  0;
            }
            if (!rollup[iduser][idlevel]) {
                rollup[iduser][idlevel] =  1;
                rollup[iduser]['total'] +=  1;
            } else {
                rollup[iduser][idlevel] +=  1;
            }
            if (sdata[i].idlevel.indexOf('m1') === -1) { continue; }
            // special handling to break out m1 by level and ordered/random
            digit = parseInt(sdata[i].idlevel.substr(2, 1), 10);
            if (sdata[i].ordered) {
                m1_id = '' + digit + '_O';
            } else {
                m1_id = '' + digit + '_R';
            }
            if (!rollup_m1[iduser][m1_id]) {
                rollup_m1[iduser][m1_id] =  1;
            } else {
                rollup_m1[iduser][m1_id] +=  1;
            }
        }
        buildUserButtons();
    }

    // get an array of names:iduser sorted by names for passed dict
    function namesIduserSortList(dict_in) {
        console.log('namesIduserSortList(dict_in)');
        var mykeys = Object.keys(dict_in);
        var mylist = [];
        var name = '';
        var i = 0;
        var len = mykeys.length;
        for (i=0; i<len; i++) {
            name = xref_id[mykeys[i]];
            mylist.push([name, mykeys[i]]);
        }
        mylist.sort();
        return mylist;
    }

    // create the buttons for the user stats
    function buildUserButtons() {
        console.log('buildUserButtons()');
        var nlist = namesIduserSortList(rollup);
        var html = '';
        var len = nlist.length;
        var total = 0;
        var i = 0;
        for (i=0; i<len; i++) {
            total = rollup[nlist[i][1]]['total'];
            html += '<div style="margin-top:10px;">';
            html += '<button id="b_' + nlist[i][1] + '_' + nlist[i][0] + '_' + total + ' " class="stats_id" ';
            html += 'onclick="RMM_STATS.userNameClick(event);">';        
            html += nlist[i][0];
            html += '</button></div>';
        }
        html += '<div style="margin-top:15px;">';
        html += '<button id="b_stats_user_exit" class="mbutton" ';
        html += 'style="margin-top:10px;" ';
        html += 'onclick="RMM_STATS.statsExit(event);">';
        html += getStr('TXT_exit');
        html += '</button></div>';
        mydoc.getElementById('div_stats_user_buttons').innerHTML = html;
        mydoc.getElementById('div_info').style.display = 'none';
        mydoc.getElementById('div_stats_container').style.display = 'block';
        mydoc.getElementById('div_stats_user_select').style.display = 'block';
    }

    // handle click on user name
    function userNameClick(ev) {
        console.log('userNameClick(ev)');
        var html = getStr('TXT_usage_stats_for') + ' ';
        var levels_count = parseInt(ev.target.id.split('_')[3], 10);
        idstats = parseInt(ev.target.id.split('_')[1], 10);
        idname = ev.target.id.split('_')[2];
        html += idname;
        mydoc.getElementById('div_stats_user_name').innerHTML = html;
        html = getStr('TXT_stats_type_charts') + '<br>';
        html += '<span style="font-size:75%;">(' + levels_count + ')</span>';
        mydoc.getElementById('b_stats_type_problem').innerHTML = html;
        mydoc.getElementById('div_stats_user_select').style.display = 'none';
        mydoc.getElementById('div_stats_type').style.display = 'block';
    }

    // handle click on user name
    function statsChartClick(ev) {
        console.log('statsChartClick(ev)');
        var levels = ['a1', 'a2', 'a3', 's1', 's2', 's3', 'm1', 'm2b', 'm2c', 'd3'];
        var html = '';
        var len = levels.length;
        var i = 0;
        var rec_str = getStr('TXT_Records');
        var myroll = {};
        namestats = xref_id[idstats];
        showMomentPlease('MSG_moment_please');
        myroll = rollup[idstats];
        for (i=0; i<len; i++) {
            if (myroll[levels[i]] === undefined) { continue; }
            html += '<div style="margin-top:10px;">';
            html += '<button id="b_' + levels[i] + '" class="stats_id" ';
            html += 'onclick="RMM_STATS.levelClick(event);">';        
            html += getStr('TXT_level_' + levels[i]) + '<br>';
            html += '<span id="bspan_' + levels[i] + '" ';
            html += 'style="font-size:70%;">(' + myroll[levels[i]] ;
            html += '&nbsp;' + rec_str + ')</span>';
            html += '</button></div>';
        }
        html += '<div style="margin-top:15px;">';
        html += '<button id="b_stats_user_exit" class="mbutton" ';
        html += 'style="margin-top:10px;" ';
        html += 'onclick="RMM_STATS.statsLevelExit(event);">';
        html += getStr('TXT_exit');
        html += '</button></div>';
        mydoc.getElementById('div_stats_level_buttons').innerHTML = html;
        mydoc.getElementById('div_info').style.display = 'none';
        mydoc.getElementById('div_stats_container').style.display = 'block';
        mydoc.getElementById('div_stats_type').style.display = 'none';
        mydoc.getElementById('div_stats_level_select').style.display = 'block';
    }

    // handle click of user stats level button click
    function levelClick(ev) {
        console.log('levelClick(ev)');
        var id = ev.target.id;
        mydoc.getElementById('div_stats_container').style.display = 'none';
        showMomentPlease('MSG_moment_please');
        if (id === 'b_m1') {
            idlevel = 'm1';
            buildM1Buttons();
            return;
        }
        idlevel = ev.target.id.split('_')[1];
        console.log(idlevel, 'idlevel');
        findUserLevelData();
    }

    // finds the iduser data for a idlevel
    function findUserLevelData(ev) {
        console.log('findUserLevelData()');
        var vars = [];
        var start = 0;
        var end = 0;
        var mylevel = '';
        var mydigit = '';
        var i = 0;
        var len = sdata.length;
        var basic = 'a1_s1_m1';
        showMomentPlease('MSG_moment_please');
        times = [];
        tries = [];
        for (i=0; i<len; i++) {
            if (sdata[i].iduser !== idstats) { continue; }
            // m1 idlevel had digit at end else length = 2
            mylevel = sdata[i].idlevel.substr(0, 2);
            if (mylevel === 'm2') { mylevel = sdata[i].idlevel.substr(0, 3) }
            if (mylevel !== idlevel) { continue; }
            // handle m1 ordered/random & digit in 3rd position
            if (idlevel === 'm1') {
                if (sdata[i].ordered !== m1_ordered) { continue; }
                mydigit = sdata[i].idlevel.substr(2, 1);
                if (mydigit !== m1_digit) { continue; }
            }
            if (basic.indexOf(mylevel) > -1) {
                // only use tries & step times if basic problem
                tries.push(sdata[i].tries);
                times.push(sdata[i].time);
            } else {
                    times.push(sdata[i].elapsed);
            }
        }
        mydoc.getElementById('stats_tab_export').innerHTML = txt;
        averaged = false;
        avg_len = times.length;
        if (times.length > 100) { averageTimes(); }
        chartBuild();
    }

    function statsExportClick(ev) {
        console.log('statsExportClick()');
        var ddmm_format = mydoc.getElementById('cb_export_ddmm').checked;
        var txt = 'idname,iduser,days,idlevel,timestamp,problemNum,Date,time,tries,equation,ordered,chunked';
        var date = null;
        var chunked = ''; // stores b/c for m2 else ''
        var i = 0;
        var len = sdata.length;
        var err = false;
        var anchor = null; // used to create csv file download anchor link
        showMomentPlease('MSG_moment_please');
        for (i=0; i<len; i++) {
            console.error(sdata[i]);
            chunked = '';
            txt += '\n';
            txt += idname + ',';
            txt += sdata[i].iduser + ',';
            txt += sdata[i].days + ',';
            if (sdata[i].idlevel.substr(0, 2) !== 'm2') {
                txt += sdata[i].idlevel + ',';
            } else {
                txt += sdata[i].idlevel.substr(0, 2) + ',';
                chunked = sdata[i].idlevel.substr(2, 3);
            }
            txt += sdata[i].idsession.split('_')[0] + ',';
            txt += sdata[i].idsession.split('_')[1] + ',';
            date = new Date(parseInt( sdata[i].idsession.split('_')[0], 10));
            if (ddmm_format) {
                txt += (date.getDate() + '/' + (date.getMonth()+1));
            } else {
                txt += (date.getMonth()+1) + '/' + (date.getDate());
            }
            // finish remaind of sheet readable date
            txt += '/' + date.getFullYear()
                + ' ' + date.getHours()
                + ':' + date.getMinutes()
                + ':' + date.getSeconds()
                + ',';
            // end of sheet readable date
            txt += (sdata[i].time/1000) + ',';
            if (sdata[i].tries) {
                txt += sdata[i].tries + ',';
            } else {
                txt += ',';
            }
            txt += sdata[i].equation;
            if (sdata[i].ordered) {
                txt += 'True' + ',';
            } else {
                txt += ',';
            }
            txt += chunked;
        }
        RMM_MENU.hideAll();
        mydoc.getElementById('div_stats_type').style.display = 'none';
        mydoc.getElementById('div_stats_export_close').style.display = 'block';
        mydoc.getElementById('div_stats_container').style.display = 'block';
        try {
            anchor = document.createElement('a');
            anchor.id = 'a_stats_export_csv';
            anchor.href = window.URL.createObjectURL(new Blob([txt], {type: 'text/plain'}));
            anchor.download = 'RMM_' + idname + '_stats.csv';
            anchor.click();
        } catch(err) {
            alert(getStr('MSG_export_not_supported'));
        }
    }

    function statsExportExit(ev) {
        console.log('statsExportExit(ev)');
        window.URL.revokeObjectURL('a_stats_export_csv');
        mydoc.getElementById('div_stats_export_close').style.display = 'none';
        mydoc.getElementById('div_stats_type').style.display = 'block';
    }

    // fit more than 100 times into 100 buckets
    function averageTimes() {
        console.log('averageTimes()');
        var avail = times.length;
        var todo = 100;
        var more = (Math.ceil(avail / todo)) - 1;
        var avg_times = [];
        var avg_tries = [];
        var a_time = 0;
        var a_try = 0;
        var index = 0;
        var i = 0;
        var len = 0;
        var count = 1;
        var basic = 'a1_s1_m1'.indexOf(idlevel) > -1;
        averaged = true;
        while (avail > 0) {
            a_time = times[index];
            if (basic) { a_try = tries[index]; }
            count = 1;
            index += 1;
            for (i=0; i<more; i++) {
                a_time += times[index];
                if (basic) { a_try += tries[index]; }
                count += 1;
                index += 1;
            }
            avg_times.push(Math.round(a_time / count));
            if (basic) { avg_tries.push(Math.round(a_try / count)); }
            todo -= 1;
            avail -= count;
            more = (Math.ceil(avail / todo)) - 1;
        }
        times = [];
        tries = [];
        len = avg_times.length;
        for (i=0; i<len; i++) {
            times.push(avg_times[i]);
            if (basic) tries.push(avg_tries[i]);
        }
    }

    // build the m1 data type buttons
    function buildM1Buttons() {
        console.log('buildM1Buttons()');
        var mydict = rollup_m1[idstats];
        var mykeys = Object.keys(mydict);
        var i = 0;
        var html = '';
        var len = mykeys.length;
        var vars = [];
        var ord = getStr('TXT_Ordered');
        var ran = getStr('TXT_Random');
        mykeys.sort();
        for (i=0; i<len; i++) {
            vars = mykeys[i].split('_');
            html += '<div style="margin-top:10px;">';
            html += '<button id="b_m1_' + mykeys[i] + '" class="stats_id" ';
            html += 'onclick="RMM_STATS.m1Select(event);">';        
            html += vars[0] + getStr('TXT_Plural_s') + ' : ';
            html += vars[1] === 'O' ? ord : ran;
            html += '&nbsp;&nbsp;(' + mydict[mykeys[i]] + ')';
            html += '</button></div>';
        }
        html += '<div style="margin-top:15px;">';
        html += '<button id="b_stats_m1_exit" class="mbutton" ';
        html += 'style="margin-top:10px;" ';
        html += 'onclick="RMM_STATS.m1Exit(event);">';
        html += getStr('TXT_exit');
        html += '</button></div>';
        mydoc.getElementById('div_stats_level_select').style.display = 'none';
        mydoc.getElementById('div_stats_m1_buttons').innerHTML = html;
        mydoc.getElementById('div_stats_m1_select').style.display = 'block';
        mydoc.getElementById('div_info').style.display = 'none';
        mydoc.getElementById('div_stats_container').style.display = 'block';
    }

    // handle m1 option click
    function m1Select(ev) {
        console.log('m1Select(ev)');
        var id = event.target.id;
        var vars = id.split('_');
        m1_digit = vars[2]; // keep value as str to speed comparison
        m1_ordered = vars[3] === 'O' ? true : false;
        findUserLevelData();
    }

    // handle exiting from the m1 options select dialog
    function m1Exit(ev) {
        console.log('m1Exit(ev)');
        mydoc.getElementById('div_stats_m1_select').style.display = 'none';
        mydoc.getElementById('div_stats_level_select').style.display = 'block';
    }

    // exit stats function
    function statsExit(ev) {
        console.log('statsExit(ev)');
        RMM_MENU.hideAll();
        mydoc.getElementById('div_stats_container').style.display = 'none';
        mydoc.getElementById('div_menu_container').style.display = 'block';
        mydoc.getElementById('div_menu_main').style.display = 'block';
    }

    // exit stats function
    function statsLevelExit(ev) {
        console.log('statsLevelExit(ev)');
        RMM_MENU.hideAll();
        mydoc.getElementById('div_stats_level_select').style.display = 'none';
        mydoc.getElementById('div_stats_user_select').style.display = 'block';
    }
//
// >>> --------------------------------CHART:Start
//

    // main control for building chart
    function chartBuild() {
        console.log('chartBuild()');
        var basic = 'a1_s1_m1'.indexOf(idlevel) > -1;
        var color = '#0074d9';
        var stroke = 1.5;
        var txt = mydoc.getElementById('div_chart_text').innerHTML;
        var tlen = times.length;
        chartAxisTriesSet();
        if (basic) {
            txt = getStr('TXT_chart_basic');
            chartYaxisLabels(30, 1);
            chartConvertBasicData(30000);
            chartBuildLine(color, stroke);
            chartBuildCircles('red', 1.5, true);
        } else {
            txt = getStr('TXT_chart_advanced');
            chartYaxisLabels(60, 1);
            chartConvertBasicData(60000);
            chartBuildLine(color, stroke);
            chartBuildCircles('red', 1.5, false);
        }
        txt += '<span style="font-size:80%;"> '
        if (averaged) {
            txt += getStr('TXT_chart_avg').replace('REPLACE_times', avg_len);
        } else {
            txt += getStr('TXT_chart_pts').replace('REPLACE_times', avg_len);
        }
        txt += '</span>';
        mydoc.getElementById('div_chart_text').innerHTML = txt;
        mydoc.getElementById('div_stats_level_select').style.display = 'none';
        mydoc.getElementById('div_stats_m1_select').style.display = 'none';
        mydoc.getElementById('div_info').style.display = 'none';
        mydoc.getElementById('div_chart_container').style.display = 'block';
        mydoc.getElementById('div_stats_container').style.display = 'block';
    }

    // convert times into yposition for a1, s1, and m1 (basic)
    function chartConvertBasicData(limit) {
        console.log('chartConvertBasicData()');
        var i = 0;
        var len = times.length;
        var ymax = 0;
        var temp = 0;
        times_ypos = [];
        ymax = mydoc.getElementById('x_axis').getAttribute('y2');
        ymax -= 10; // add a small buffer for very low times
        for (i=0; i<len; i++) {
            if (times[i] > limit) {
                times_ypos[i] = 0;
            } else {
                temp = (times[i] / limit);
                temp = ymax - (ymax * temp).toFixed(1);
                // set floor for any times just less than limit to 1
                temp = temp === 0 ? 1 : temp;
                times_ypos.push(temp);
            }
        }
    }

    // find the right xdelta based on number of data points
    function chartXdeltaFind() {
        console.log('chartXdeltaFind()');
        if (times.length > 50) { return 5; }
        if (times.length > 30) { return 10; }
        return 20;
    }

    // show/hide second axis based on idlevel
    function chartAxisTriesSet() {
        console.log('chartAxisTriesSet()');
        var basic = 'a1_s1_m1';
        if (basic.indexOf(idlevel) > -1) {
            mydoc.getElementById('chart_axis_tries').style.display = 'block';
        } else {
            mydoc.getElementById('chart_axis_tries').style.display = 'none';
        }
    }

    // build the chart line using 100 buckets
    function chartBuildLine(color, stroke) {
        console.log('chartBuildLine()');
        var xpos = 44;
        var xdelta = chartXdeltaFind();
        var i = 0;
        var len = times_ypos.length;
        var html = '<polyline fill="none" ';
        html += 'stroke="' + color + '" ';
        html += 'stroke-width="' + stroke + '" points="';
        xpos_circles = [];
        for (i=0; i<len; i++) {
            xpos = i === 0 ? xpos : xpos + xdelta;
            xpos_circles.push(xpos);
            html += '' + xpos + ',' + times_ypos[i] + ' ';
        }
        xvalueSetRight(len, xpos);
        html += '"/>"';
        mydoc.getElementById('chart_line').innerHTML = html;
    }

    function xvalueSetRight(len, xpos) {
        console.log('xvalueSetRight(xpos)', len, xpos);
        var x0 = mydoc.getElementById('xright_value_0');
        var x1 = mydoc.getElementById('xright_value_1');
        var x2 = mydoc.getElementById('xright_value_2');
        var tform = getTransforms('chart_xaxis_label');
        var path = '';
        x0.innerHTML = '';
        x1.innerHTML = '';
        x2.innerHTML = '';
        if (len > 99) {
            path = getNums(1).replace('/>', ' ' + tform + '/>');
            x0.innerHTML = path;
            x0.setAttribute('x', xposXright[0]);
            path = getNums(0).replace('/>', ' ' + tform + '/>');
            x1.innerHTML = path;
            x1.setAttribute('x', xposXright[1]);
            path = getNums(0).replace('/>', ' ' + tform + '/>');
            x2.innerHTML = path;
            x2.setAttribute('x', xposXright[2]);
            return;
        }
        if (len > 9) {
            path = getNums(numAtIndex(len, 10)).replace('/>', ' ' + tform + '/>');
            x1.innerHTML = path;
            x1.setAttribute('x', xpos - 8);
        }
        path = getNums(numAtIndex(len, 1)).replace('/>', ' ' + tform + '/>');
        x2.innerHTML = path;
        x2.setAttribute('x', xpos);
    }

    // build the tries circles
    function chartBuildCircles(color, radius, do_tries) {
        console.log('chartBuildCircles(color, radius)');
        var ypos = { 4:30, 3:103, 2:176, 1:250 };
        var i = 0;
        var len = times_ypos.length;
        var html = '';
        for (i=0; i<len; i++) {
            xpos = xpos_circles[i];
            if (do_tries) {
                html += '<circle cx="' + xpos + '" ';
                html += 'cy="' + ypos[tries[i]] + '" ';
                html += 'r="' + radius + '" ';
                html += 'fill="' + color + '"></circle>';
            }
            if (times_ypos[i] === 0) {
                html += '<circle class="overlimit" cx="' + xpos + '" ';
                html += 'cy="2" ';
                html += 'r="' + (radius * 1.5) + '" ';
                html += 'onclick="alert(\'';
                html += (times[i]/1000).toFixed(0) + ' ';
                html += getStr('TXT_Seconds') + '\');">';
                html += '</circle>';
            }
        }
        mydoc.getElementById('chart_circles').innerHTML = html;
    }

    // add paths to the upper and lower Yaxis label
    function chartYaxisLabels(top, bot) {
        console.log('chartYaxisLabels(top, bot)');
        var tform = getTransforms('chart_yaxis_label');
        var path = '';
        mydoc.getElementById('div_asm_container').style.display = 'none';
        if (top > 0) {
            path = getNums(numAtIndex(top, 1)).replace('/>', ' ' + tform + '/>');
            mydoc.getElementById('yaxis_label_02').innerHTML = path;
        }
        if (top > 9) {
            path = getNums(numAtIndex(top, 10)).replace('/>', ' ' + tform + '/>');
            mydoc.getElementById('yaxis_label_01').innerHTML = path;
        }
        if (top > 99) {
            path = getNums(numAtIndex(top, 100)).replace('/>', ' ' + tform + '/>');
            mydoc.getElementById('yaxis_label_00').innerHTML = path;
        }
        if (bot > 0) {
            path = getNums(numAtIndex(bot, 1)).replace('/>', ' ' + tform + '/>');
            mydoc.getElementById('yaxis_label_12').innerHTML = path;
        }
        if (bot > 9) {
            path = getNums(numAtIndex(bot, 10)).replace('/>', ' ' + tform + '/>');
            mydoc.getElementById('yaxis_label_11').innerHTML = path;
        }
        if (bot > 99) {
            path = getNums(numAtIndex(bot, 100)).replace('/>', ' ' + tform + '/>');
            mydoc.getElementById('yaxis_label_10').innerHTML = path;
        }
    }

    // close the chart
    function chartExit(ev) {
        console.log('chartExit(ev)');
        mydoc.getElementById('div_chart_container').style.display = 'none';
        if (idlevel === 'm1') {
            mydoc.getElementById('div_stats_m1_select').style.display = 'block';
        } else {
            mydoc.getElementById('div_stats_level_select').style.display = 'block';
        }
    }

//
// >>> CHART:End
//
//
// >>> --------------------------------TYPE:Start
//

    // close the type menau
    function statsTypeExit(ev) {
        console.log('statsTypeExit(ev)');
        mydoc.getElementById('div_stats_type').style.display = 'none';
        mydoc.getElementById('div_stats_user_select').style.display = 'block';
    }

    // close the type menau
    function statsUsageClick(ev) {
        console.log('statsUsageClick(ev)');
        var usage = {};
        var detailed = mydoc.getElementById('cb_usage_detail').checked;
        var detail = detailed ? {} : null;
        var len = sdata.length;
        var keyvalue = null;
        var dkey = null;
        var count = 0;
        // xref values will have leading sort chars, eg. 00_, 01_, etc.
        var xref = {
            'a1' : getStr('TXT_use_a1'), //00
            'a2' : getStr('TXT_use_a2'), //01
            'a3' : getStr('TXT_use_a3'), //02
            's1' : getStr('TXT_use_s1'), //03
            's2' : getStr('TXT_use_s2'), //04
            's3' : getStr('TXT_use_s3'), //05
            'm1' : getStr('TXT_use_m1'), //06
            'm2' : getStr('TXT_use_m2'), //07
            'd3' : getStr('TXT_use_d3')  //08
        }
        showMomentPlease('MSG_moment_please');
        for (i=0; i<len; i++) {
            if (sdata[i].iduser !== idstats) { continue; }
            count += 1;
            keyvalue = Math.floor(sdata[i].days / 10);
            dkey = xref[sdata[i].idlevel.substr(0, 2)];
            if (keyvalue in usage) {
                usage[keyvalue] += 1;
            } else {
                usage[keyvalue] = 1;
            }
            if (detailed) {
                if (keyvalue in detail) {
                    if (dkey in detail[keyvalue]) {
                        detail[keyvalue][dkey] += 1;
                    } else {
                        detail[keyvalue][dkey] = 1;
                    }
                } else {
                    detail[keyvalue]= {};
                    detail[keyvalue][dkey] = 1;
                }
            }
        }
        if (count === 0) {
            alert(getStr('MSG_no_usage_data'));
            mydoc.getElementById('div_info').style.display = 'none';
            mydoc.getElementById('div_stats_container').style.display = 'block';
            return;
        }
        statsUsageReveal(usage, detail, count);
    }

    //show user usage
    function statsUsageReveal(usage, detail, count) {
        console.log('statsUsageReveal(usage, detail, count)');
        var html = '<table class="usage">';
        var keys = Object.keys(usage);
        var i = 0;
        var len = keys.length;
        var days = null;
        var lifetime = getStr('TXT_stats_lifetime') + count;
        var row_count = 0;
        var color = '#fff'; // set to #fff for even #ddd for odd
        html += '<tr class="usage">';
        html += '<th>' + getStr('TXT_usage_days') + '</th>';
        html += '<th>' + getStr('TXT_usage_problems') + '</th>';
        html += '</tr>';
        keys.sort();
        for (i=0; i<len; i++) {
            color = row_count % 2 === 0 ? '#fff' : '#ddd';
            if (detail) {
                html += '<tr style="background:#999;line-height:5px;">';
                html += '<td>&nbsp;</td><td>&nbsp;</td>';
                html += '</tr>';
            }
            // add detail before range of days total
            if (detail) {
                html += statsUsageDetails(detail[keys[i]], color)
            }
            // build the range of days total
            days = keys[i] * 10;
            html += '<tr class="usage" ';
            html += 'style="background:' + color + ';">';
            html += '<td>';
            if (days === 0) {
                html += days + '-9';
            } else {
                html += (days - 9) + '-' + days;
            }
            html += '</td>';
            // add the problems count data cell
            html += '<td>' + usage[keys[i]] + '</td>';
            html += '</tr>';
            row_count += 1;
        }
        html += '</table>';
        mydoc.getElementById('div_stats_lifetime').innerHTML = lifetime;
        mydoc.getElementById('div_stats_usage_html').innerHTML = html;
        mydoc.getElementById('div_info').style.display = 'none';
        mydoc.getElementById('div_stats_type').style.display = 'none';
        mydoc.getElementById('div_stats_usage').style.display = 'block';
        mydoc.getElementById('div_stats_container').style.display = 'block';
    }

    // build the usage details hmtl string
    function statsUsageDetails(details_in, color) {
        console.log('statsUsageDetails(details_in, color)');
        var dkeys = Object.keys(details_in);
        var i = 0;
        var len = dkeys.length;
        var html = '';
        if (len === 0) { return ''; }
        dkeys.sort();
        for (i=0; i<len; i++) {
            html += '<tr class="usage" ';
            html += 'style="background:' + color + ';">';
            //html += 'font-size:70%;color:#33adff;">';
            html += '<td style="font-size:70%;color:#888;text-align:right;">';
                html += dkeys[i].split('_')[1];
            html += '</td>';
            html += '<td style="font-size:70%;color:#888;text-align:right;">';
                html += details_in[dkeys[i]];
            html += '</td>';
            html += '</tr>';
        }
        return html;
    }


    // close the type menau
    function statsUsageExit(ev) {
        console.log('statsUsageExit(ev)');
        mydoc.getElementById('div_stats_usage').style.display = 'none';
        mydoc.getElementById('div_stats_type').style.display = 'block';
    }

//
// >>> TYPE:end
//
// >>> --------------------------------GETSET:Start
//

//
// >>> GETSET:end
//
    return {
        init : init,
        idXrefSetup : idXrefSetup,
        loadSessionData : loadSessionData,
        statsHandleReadData : statsHandleReadData,
        userNameClick : userNameClick,
        statsExit : statsExit,
        levelClick : levelClick,
        statsLevelExit : statsLevelExit,
        m1Exit : m1Exit,
        m1Select : m1Select,
        chartYaxisLabels : chartYaxisLabels,
        chartExit : chartExit,
        statsTypeExit : statsTypeExit,
        statsUsageExit : statsUsageExit,
        statsChartClick : statsChartClick,
        statsExportClick : statsExportClick,
        statsExportExit : statsExportExit,
        statsUsageClick : statsUsageClick
    };
})();
