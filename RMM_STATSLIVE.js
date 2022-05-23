var RMM_STATSLIVE = (function() {
    var mydoc = window.document;
    var sdata = {}; // array stores all the session data
    // statslive used to show problem type session:lifetime & grand totals
    var statslive = {};
    var DB_TRIES_STD = 100; // std arg to set db_max_tries in dbSetWaitVars

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
        console.error(sdata, 'sdata');
        len = sdata.length;
        if (len === 0) { return; }
        // setup the iduser data containers first
        statslive = {};
        for (i=0; i<len; i++) {
            iduser = sdata[i].iduser;
            if (statslive[iduser]) { continue; }
            statslive[iduser] = {'a1':[0,0], 'a2':[0,0], 'a3':[0,0], 
                                 's1':[0,0], 's2':[0,0], 's3':[0,0], 
                                 'm1':[0,0], 'm2b':[0,0], 'm2c':[0,0],
                                 'd3':[0,0], 'grand':0};
        }
        // accumulate total problems by level and grand total
        for (i=0; i<len; i++) {
            iduser = sdata[i].iduser;
            idlevel = sdata[i].idlevel;
            console.log(sdata[i]);
            console.log(iduser);
            console.log(idlevel);
            statslive[iduser][idlevel][1] += 1;
            statslive[iduser]['grand'] += 1;
        }
        console.error(statslive, 'statslive');
        mydoc.getElementById('div_info').style.display = 'none';
        RMM_ASM.initReadUserLast();
    }

    return {
        loadSessionData : loadSessionData,
        handleReadData : handleReadData
    };
})();
