var RMM_STATSLIVE = (function() {
    var mydoc = window.document;
    var sdata = {}; // array stores all the session data
    // statslive used to show problem type session:lifetime & grand totals
    var statslive = {};
    var DB_TRIES_STD = 100; // std arg to set db_max_tries in dbSetWaitVars
    var IDGUEST = 10884293110550;

    // RMM_CFG shortcuts start
    function getStr(id) { return RMM_CFG.getStr(id); }

    function loadSessionData() {
        console.log('loadSessionData()');
        var txt = getStr('TXT_data_loading');
        var type = getStr('TXT_history');
        txt = txt.replace('REPLACE_count', type);
        mydoc.getElementById('div_info_text').innerHTML = txt;
        mydoc.getElementById('div_info').style.display = 'block';
        RMM_DB.dbSetWaitVars(DB_TRIES_STD, RMM_STATSLIVE.handleReadData);
        RMM_DB.sessionGetAllRollup(null, 50, 'div_info_text');
    }

    // handle stats after data is read
    function handleReadData() {
        console.log('handleReadData()');
        var i = 0;
        var len = 0;
        var iduser = null;
        var idlevel = null;
        sdata = RMM_DB.getDbResult();
        console.log(sdata, 'sdata');
        len = sdata.length;
        if (len === 0) { return; }
        // setup the iduser data containers first
        statslive = {};
        for (i=0; i<len; i++) {
            iduser = sdata[i].iduser;
            if (statslive[iduser]) { continue; }
            statslive[iduser] = {'a1':[0,0], 'a2':[0,0], 'a3':[0,0], 
                                 's1':[0,0], 's2':[0,0], 's3':[0,0], 
                                 'm1':[0,0], 'm2':[0,0], 'd3':[0,0],
                                 'grand':0};
        }
        // accumulate total problems by level and grand total
        for (i=0; i<len; i++) {
            iduser = sdata[i].iduser;
            idlevel = sdata[i].idlevel;
            // remove any unneccessary 3rd char qualifiers (e.g. m2b, m2c, m12)
            idlevel = idlevel.length > 2 ? idlevel.substr(0, 2) : idlevel;
            // drop the b(basic) & c(chunk) from m2
            console.log(sdata[i]);
            console.log(iduser);
            console.log(idlevel);
            statslive[iduser][idlevel][1] += 1;
            statslive[iduser]['grand'] += 1;
        }
        console.log(statslive, 'statslive');
        mydoc.getElementById('div_info').style.display = 'none';
        RMM_ASM.initReadUserLast();
    }

    function updateUserCounts(iduser, level) {
        if (!statslive[iduser][level]) {
            console.error('updateUserCounts: %s, %s NotFound' % (iduser, level));
            return;
        }
        statslive[iduser][level][0] += 1;
        statslive[iduser][level][1] += 1;
        statslive[iduser]['grand'] += 1;
    }

    function displayUserCounts(level, answered) {
        console.error('displayUserCounts(iduser, level, answered)');
        var txt = '';
        // remove any unneccessary 3rd char qualifiers (e.g. m2b, m2c, m12)
        var idlevel = level.length > 2 ? level.substr(0, 2) : level;
        console.warn(idlevel, 'idlevel');
        var iduser = RMM_ASM.getIduser();
        if (iduser === IDGUEST) { return; }
        if (answered) { updateUserCounts(iduser, idlevel); }
        console.log(statslive);
        console.log(iduser, 'iduser');
        console.log(statslive[iduser]);
        console.log(statslive[iduser][idlevel]);
        console.log(statslive[iduser][idlevel][0]);
        console.log(statslive[iduser][idlevel][1]);
        console.log(statslive[iduser]['grand']);
        txt += statslive[iduser][idlevel][0] + '&nbsp;:&nbsp;';
        txt += statslive[iduser][idlevel][1] + '&nbsp;:&nbsp;';
        txt += statslive[iduser]['grand'];
        mydoc.getElementById('div_statslive').innerHTML = txt;
    }

    return {
        loadSessionData : loadSessionData,
        handleReadData : handleReadData,
        displayUserCounts : displayUserCounts
    };
})();
