var RMM_ASM = (function() {
    var mydoc = window.document;
    var problem_str = ''; // problem as delimited string
    // prob_asm represents the problem/answer for the ASM presentation
    // index value (0, 1, 2) corresponds to the row index of the ASM matrix
    // index value within each row corresponds to the col value
    // where col values are: 0=100s, 1=10s, 2=1s (zero indexed left-to-right)
    var prob_asm = [[null, null, null],
                    [null, null, null],
                    [null, null, null]];
    var level = ''; // a1-a3 s1-s3, m1-3 (a1: add 1s, a2: add 10s, a3: add 100s. etc.)
    var level_steps = 1; // step in problem solving. asm eg: 1=1s, 2=10s, 3=100s
    var level_done = 0; // progresses 0, 1, 2
    var this_col = 2; // progresses 2, 1, 0
    var opASM = ''; // plus, minus, multiply symbol for ASM
    var module = 'asm'; // asm, m2, dv
    var mod_lo = 'asm'; // module for layout (d3 becomes m2 else = module)
    var printmode = false; // identifies when creating print problem
    var answers = [[1,2,3,4]]; // array with the answers positionally indexed L-to-R, [1,2,3,4] are dummy level_done=0 init values
    var responses = []; //stores the positional answer button value_time string
    var answer_active = []; // index 0-3 set true/false if answer is active
    var complete = false; //set to true when right answer is clicked
    var correct = null; //stores the correct answer
    var timervar = null; // use for setTimeout and clearTimeout functions
    var over_active = true; // quick way to disable answer buttons hover logic
    // tracking
    var iduser = null; // string value will be set to DB.setup.iduser
    var name = null; // string value will be set to DB.setup.name
    var rand_last3 = []; //store the last 3 random row1 ops to avoid pattern in m1 random
    var answer_index_last = -1; // store the index position of the last answer
    var record = [];
    var test_dump = '';
    var tests = [];
    var test_index = 0;
    var time_start = Date.now(); // start of time for each answer
    var time_enter = Date.now(); // start of time entering the problem
    var session = Date.now(); // keypath id for indexedDB idsession
    var count_record = 0; // unique counters added to idsession per answer
    var count_problem = 0; // unique counters added to idsession per problem
    // info
    var info_lines = [];
    var info_index = 0;
    var info_fnc_finish = null;
    var s1_neg_problems = 0; // used to control pct of negative S1 problems
    var subneg_pct = 0.0; // used to control pct of negative S1 problems
    var subborrow = 0; // 1=yes_borrowing 0=no_borrowing
    var s3_doubleborrow_allow = true; // no double borrow problems if false
    var total_problems = 0; // counter of total problems when level is started
    // toggles start: next & borrow/carry notes between step levels
    var shnote_next = true; // controls display of next_problem notes
    var shnote_numpos = true; // controls display of number_position notes
    var shnote_carry = true; // controls display of carry notes
    var shnote_chunk = true; // controls display of chunk notes
    var shnote_bpopup = true; // controls display of borrow popup
    var shnote_borrow = true; // controls display of borrow info notes
    var borrow_note_active = false; // used to advance prob when block all click
    var bnext_note_active = false; // 
    var borrow_info_active = false; // 
    var carry_override = false; // flag when next step involves a carry
    // toggles end
    var next_problem_init = null; // reference to next problem init function
    var carries = {0:0, 1:0, 2:0 }; // key=2 just for symmetry
    // in borrows only gives0, gives2, gets2, gets1 will get non-zero values
    // others keys are there to support building key reference with col value
    var borrows = {'gives0':0, 'gets0':0,
                   'gives1':0, 'gets1':0,
                   'gives2':0, 'gets2':0};
    // multiply m1 controls
    var m1_digit = 0; // selected 1-9 by user else 0 (randomized)
    var m1_order = false; // step thru multiplys by ones (1-20) if true
    var m1_order_count = -1; // 0-20 when doing ordered m1 task : initialize to 0
    var m1_row1_max = 20; // upper limit on row1 values
    var m1_row1_min = 0; // lower limit on row1 values
    var m1_chunk = true; // shows chunk it message when true
    // database
    var db_wait_tries_std = 100; // std arg to set db_max_tries in dbSetWaitVars
    // end of vars
    // 
    // function aliases
    function getStr(id) { return RMM_CFG.getStr(id); }
    function getNums(id) { return RMM_SymsNums.getNums(id); }
    function getSyms(id) { return RMM_SymsNums.getSyms(id); }
    function getTransforms(id) { return RMM_SymsNums.getTransforms(id); }
    function getOperatorXY(id) { return RMM_SymsNums.getOperatorXY(id); }
    // RMM_SymsNums shortcuts end
//
// >>> --------------------------------INIT:Start
//
    // processes run before fully functional main page displays
    function init() {
        console.log('init()');
        var slash_num_0 = mydoc.getElementById('asm_bc_0_slash_num');
        var slash_num_1 = mydoc.getElementById('asm_bc_1_slash_num');
        var slash_num_2 = mydoc.getElementById('asm_bc_2_slash_num');
        var spath = pathTransform(getSyms('slash'), 'borrow_carry_slash_num');
        // log user agent string
        console.log(window.navigator.userAgent);
        // handle PWA versus web page
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('This is PWA.');
        } else {
            console.log('This is WEB.');
        }
        RMM_MENU.initCharRange();
        // dev var controlled - show all asm
        slash_num_0.innerHTML = spath;
        slash_num_1.innerHTML = spath;
        slash_num_2.innerHTML = spath;
        processInnerHtml();
        RMM_DB.dbSetWaitVars(db_wait_tries_std, RMM_STATSLIVE.loadSessionData);
        RMM_DB.init();
        console.log('done');
    }

    // last step of init is to read iduser from DB
    // called from RMM_STATSLIVE after loadSessionData is finished
    function initReadUserLast() {
        console.log('initReadUserLast()');
        RMM_DB.dbSetWaitVars(db_wait_tries_std, RMM_ASM.initSetupDBSet)
        RMM_DB.readSetup(1);
    }

    // set iduser based on db.setup.idser_last
    function initSetupDBSet() {
        console.log('initSetupDBSet()');
        var db_result = RMM_DB.getDbResult();
        var pd = null; // used only to shorten db_result.pdata for if stmts
        var level = '';
        if (db_result) {
            // need to set pdata in Menu with indexedDB value
            iduser = db_result.iduser;
            name = db_result.name;
            mydoc.getElementById('div_name').innerHTML = name;
            RMM_MENU.setPdata(db_result.pdata);
            level = db_result.pdata.module;
            if (level === 'a') { level += db_result.pdata.digits; }
            if (level === 'm') { level += db_result.pdata.digits; }
            if (level === 's') { level += db_result.pdata.digits; }
            RMM_STATSLIVE.displayUserCounts(level, false);
            RMM_SYNC.setSyncKey(db_result.sync_key);
            console.warn(db_result);
        }
        if (!db_result || !db_result.pdata) {
            iduser = getStr('DAT_guest');
            alert(getStr('MSG_db_setup_nf'));
            RMM_MENU.settingsClick(null);
            return;
        }
        console.log(iduser, 'iduser');
        console.log(db_result.pdata, 'pdata');
        if (db_result.device === null) {
            RMM_MENU.inputDeviceName(null);
            return;
        } else {
            RMM_DB.setDevice(db_result.device);
        }
        pd = db_result.pdata;
        if (pd.module === null) {
            RMM_MENU.settingsClick(null);
            return;
        }
        RMM_MENU.setPdata(pd);
        showNotesSetValues(pd);
        showNotesSetHtml();
        setProblem(pd);
        //RMM_D3.showAllD3();
    }

//
// >>> INIT:End
//
//
// >>> --------------------------------SHOWNOTES:Start
//

    // set show note values based on pdata received
    function showNotesSetValues(pd) {
        console.log('showNotesSetValues(pd)');
        shnote_numpos = pd.shnote_numpos;
        shnote_next = pd.shnote_next;
        shnote_carry = pd.shnote_carry;
        shnote_chunk = pd.shnote_chunk;
        shnote_borrow = pd.shnote_borrow;
        shnote_bpopup = pd.shnote_bpopup;
    }

    // set the show notes innerHTML values
    function showNotesSetHtml() {
        console.log('showNotesSetHtml()');
        showNotesToggle('s_tog_numpos', shnote_numpos);
        showNotesToggle('s_tog_next', shnote_next);
        showNotesToggle('s_tog_carry', shnote_carry);
        showNotesToggle('s_tog_chunk', shnote_chunk);
        showNotesToggle('s_tog_borrow', shnote_borrow);
        showNotesToggle('s_tog_bpopup', shnote_bpopup);
    }

    // toggle the show notes span values and class
    function showNotesToggle(id, turn_on) {
        console.log('showNotesToggle(id, is_on)', id, turn_on);
        var ele = mydoc.getElementById(id);
        if (turn_on) {
            ele.innerHTML = getStr('TXT_eq_on');
            ele.setAttribute('class', 'toggle_on');
        } else {
            ele.innerHTML = getStr('TXT_eq_off');
            ele.setAttribute('class', 'toggle_off');
        }
    }
//
// >>> SHOWNOTES:End
//
//
// >>> --------------------------------GENERAL:Start
//

    // show the high level ASM divs/containers
    function showASM() {
        console.log('showASM()');
        mydoc.getElementById('div_asm_container').style.display = 'block';
        mydoc.getElementById('svg_asm_container').style.display = 'block';
        mydoc.getElementById('asm').style.display = 'block';
    }

    // loop thru CFG file innerhtml dict to update elements in html file
    function processInnerHtml() {
        console.log('processInnerHtml()');
        var mydoc = document;
        var ids = RMM_CFG.getInnerHtmlDict();
        var key = null;
        var err = null;
        for (key in ids) {
            try {
                mydoc.getElementById(key).innerHTML = ids[key];
            }
            catch(err) {
                console.log('INNER_HTML missing: ' + key);
                console.log('ERROR: ' + err);
            }
        }
    }

    // return row0 + row1 values for a col in the ASM grid (ie. row3 value)
    function calcColumn(col, op) { 
        console.log('calcColumn(col, op)');
        var val = null;
        var row0 = prob_asm[0][col];
        var row1 = prob_asm[1][col];
        // skip any col that still has a null
        if (row0 === null || row1 === null) { return val; }
        if (op === '+') { val = row0 + row1; }
        if (op === '-') { val = row0 - row1; }
        if (op === 'x') { val = row0 * row1; }
        return val;
    }

    // return random int in range = includes min up to but exclude max
    function getRandInt(min, max) {
        return Math.floor(Math.random() * (max - min) ) + min;
    }

    // read the SymnNums transform string & add it to end of svg path string
    function pathTransform(path, id) {
        console.log('pathTransform(path, id)');
        console.log(id, 'id');
        var tform = getTransforms(id);
        //console.log(tform);
        return path.replace('/>', ' ' + tform + '/>');
    }

    // removes random value (randStr_int) from answers returning array of ints
    function splitAnswerIntegers(ans) {
        console.log('splitAnswerIntegers(ans)');
        var i = 0;
        var len = ans.length;
        var temp = []
        for (i=0; i<len; i++) {
            temp.push(parseInt(ans[i].split('_')[1], 10));
        }
        return temp;
    }

    // resets responses array: set each element = corresponding answer element
    function setResponsesAnswersActive() {
        console.log('setResponsesAnswersActive()');
        console.log(answers, 'answers b/4');
        if (!answers[level_done]) { return; }
        responses = [];
        if (level_done > 3) {
            ////////console.error(level_done, 'g.t 3 error in setResponsesAnswersActive()');
            return;
        }
        responses = [answers[level_done][0], 
                     answers[level_done][1], 
                     answers[level_done][2], 
                     answers[level_done][3]];
        answer_active = [true, true, true, true];
        console.log(answer_active, 'answer_active');
    }

    // read ASM operator path & transform then set ASM grid op innerHTML
    function operatorSet(type) {
        console.log('operatorSet()');
        var op = mydoc.getElementById('asm_operator');
        var path = getSyms(type);
        var tform = getTransforms(type);
        if (tform) {
            path = path.replace('/>', ' ' + tform + '/>');
        }
        op.innerHTML = path;
        xydict = getOperatorXY('asm_' + type);
        op.setAttribute('x', xydict.x);
        op.setAttribute('y', xydict.y);
    }

    // set prob_asm array = 3 arrays having 3 nulls (3x3 = ASM grid)
    function resetProblemArray() {
        console.log('resetProblemArray');
        prob_asm = [[null, null, null],
                    [null, null, null], 
                    [null, null, null]];
    }

    // set the negative sign in rows 0 or 1 when level=a1 & negatives = true
    function setA1NegSigns() {
        console.log('setA1NetSigns()');
        var neg_sign = pathTransform(getSyms('minus'), 'asm_a1_neg_sign');
        if (prob_asm[0][2] < 0) {
           mydoc.getElementById('asm_num_01').innerHTML = neg_sign;
        }
        if (prob_asm[1][2] < 0) {
           mydoc.getElementById('asm_num_11').innerHTML = neg_sign;
        }
    }

    // set each svg rect num innerHTML in the ASM grid to '' (blank)
    function setNumbers() {
        //console.log('setNumbers()');
        //console.log(level, 'level');
        var i = 0;
        var j = 0;
        var id = '';
        for (i=0; i<3; i++) {
            for (j=0; j<3; j++) {
                id = 'asm_num_' + i + j;
                if (prob_asm[i][j] === null) {
                    mydoc.getElementById(id).innerHTML = '';
                    continue;
                }
                mydoc.getElementById(id).innerHTML = getNums(prob_asm[i][j]);
            }
        }
        if (level === 'a1') { setA1NegSigns(); }
    }

    // blank out every element in ASM (nums, carrys, answers, etc)
    function blankout() {
        console.log('blankout()');
        layoutAsmNumShowValue(false);
        layoutAnswerButtonValuesHide();
        layoutBorrowCarry([0, 1, 2], false, false)
        layoutVerdict(null, '');
    }

    // show the div_animation_box after a hideAll
    function showAnimationBox() {
        console.log('showAnimationBox()');
        hideAll();
        mydoc.getElementById('div_animation_box').style.display = 'block';
    }

    // hide all the highest-level divs & svgs
    function hideAll() {
        console.log('hideAll()');
        // non-ASM
        mydoc.getElementById('div_m2_container').style.display = 'none';
        mydoc.getElementById('div_d3_container').style.display = 'none';
        mydoc.getElementById('div_menu_container').style.display = 'none';
        mydoc.getElementById('div_print_container').style.display = 'none';
        // ASM
        mydoc.getElementById('svg_asm_container').style.display = 'none';
        mydoc.getElementById('div_note').style.visibility = 'hidden';
//////        mydoc.getElementById('div_test_count').style.display = 'none';
        mydoc.getElementById('div_info').style.display = 'none';
        mydoc.getElementById('div_animation_box').style.display = 'none';
        mydoc.getElementById('blockAll').style.display = 'none';
        layoutNumslashAll(['none', 'none', 'none']);
    }

    // convert a row in any (not just ASM) number grid to a string
    function convertRowValuesToString(a_row_in) {
        console.log('convertRowValuesToString(a_row_in)');
        var i = 0;
        var len = a_row_in.length;
        var num_str = '';
        for (i=0; i<len; i++) {
            if (a_row_in[i] !== null) { num_str += my_row[i]; }
        }
        return parseInt(num_str, 10);
    }
//
// >>> GENERAL:End
//
//
//
// >>> --------------------------------NEEDS DEFINTION:Start
//

    // calc ASM col value including carries & borrows gives/gets
    function colAnswer(col) {
        //console.log('colAnswer(col)');
        var val = 3579; // distinctive number to id nothing set
        if (opASM === '+') {
            val = prob_asm[0][col] + prob_asm[1][col] + carries[col];
        }
        if (opASM === '-') {
            val = prob_asm[0][col] + (borrows['gets'+col] * 10);
            val -= (prob_asm[1][col] + borrows['gives'+col]);
        }
        if (opASM === 'x' && level !== 'm1') {
            val = prob_asm[0][col] * prob_asm[1][col] + carries[col];
        }
        if (level === 'm1') { val = probRowsAsTotal('x'); }
        return val;
    }

    function answersRandomOptimize(myval, found) {
        console.log('answersRandomize(myval, myarr)');
        console.log(myval, found, 'myval, found in optimize');
        var limit = 10;
        var i = 0;
        var count = 0;
        var more = true;
        var array_new = [];
        while (more) {
            array_new = [];
            for (i = 0; i < 4; i++) {
                array_new.push(getRandInt(0, 1000) + '_' + found[i]);
            }
            array_new.sort();
            array_new = splitAnswerIntegers(array_new);
            more = array_new.indexOf(myval) === answer_index_last;
            count += 1;
            if (count > limit) { more = false; }
        }
        answer_index_last = array_new.indexOf(myval);
        return array_new;
    }

    // fills the 4-answer array with values close to correct answer
    function answersResponsesSetValues() {
        console.log('answersResponsesSetValues()');
        var ans = null;
        var found = []; // use to avoid duplicate answers
        var i = 0;
        var j = 0;
        var myarr = [];
        var myval = null;
        var mycol = -1;
        answers = [];
        for (i=0; i<level_steps; i++) {
            myarr = [];
            mycol = 2 - i;
            myval = colAnswer(mycol);
            found.push(myval);
            myarr.push(getRandInt(0, 1000) + '_' + myval)
            for (j=0; j<3; j++) {
                // need to be careful about how to get close give opASM value
                if (opASM === '+') {ans = answerGetValid(found, mycol, 4, 19);}
                if (opASM === '-') {ans = answerGetValid(found, mycol, 4, 13);}
                // limit & ans_max for multiply are functions of col values
                if (opASM === 'x') {
                    ans = answerGetValid(found,
                                         mycol, 
                                         multiplyMinMax(mycol, false), 
                                         multiplyMinMax(mycol, true));
                }
                found.push(ans);
            }
            answers[i] = answersRandomOptimize(myval, found);
            found = [];
        }
        console.log(answers, 'answers in SetValues');
    }

    // finds a valid col answer using correct global & existing in 4-ans array
    function answerGetValid(found, col, limit, ans_max) {
        //console.log('answerGetValid(found, col)');
        //console.log(found, col, limit, ans_max);
        var myans = null;
        var tries = 0;
        var val = colAnswer(col);
        var minmax = getMinMax(val, col, limit, ans_max); // [0]=min, [1]=max
        if (minmax[0] === null || minmax[1] === null) {
            return;
        }
        while (myans === null || myans === val) {
            // ensure not duplicate answer & within specified range
            myans = getRandInt(minmax[0], minmax[1]);
            if (found.indexOf(myans) > -1) { myans = null; }
            tries += 1;
            if (tries > 20) {
                console.error('ERR tries limit: answerGetValid() myans=76543'); //KEEPIN
                myans = 76543;
            } // distinctive number = fail
        }
        return myans;
    }

    // set either min or max values for alt answers for multiply
    function multiplyMinMax(col, max) {
        //console.log('multiplyMinMax(min)');
        var ans = probRowsAsTotal('x');
        var adj = 18; // adjustment: 2-digit limit so max=18 (9*9 + 18 = 99)
        if (max) { 
            if (ans < 10) { return 9; }
            if (ans < 15) { return 25; }
            return (ans) + adj;
        }
        // minimums
        if (ans < adj) { return 0; }
        return (ans) - adj;
    }

    // min & max changes to correct ans for calcing 4-ans array (op dependent)
    function getMinMax(val, col, limit, ans_max) {
        //console.log('getMinMax(val, col, limit)');
        var minmax = [null, null]; // [0]=min, [1]=max
        if (opASM === '+') {
            // need special handling of a1 problem with potential neg answers
            if (prob_asm[0][2] < 0 || prob_asm[1][2] < 0) {
                minmax[0] = val - limit;
                if (minmax[0] < (ans_max * -1)) {
                    mixmax[0] = (ans_max * -1);
                }
            } else {
                minmax[0] = val - limit < 1 ? 1 :  val - limit;
            }
            minmax[1] = val + limit > ans_max ? ans_max : val + limit;
        }
        if (opASM === '-') {
            minmax[0] = val - limit < -13 ? -13 :  val - limit;
            minmax[1] = val + limit > ans_max ? ans_max : val + limit;
        }
        if (opASM === 'x') { minmax = [limit, ans_max]; }
        return minmax;
    }

    // convert rows in prob_asm to a total value
    function probRowsAsTotal(op) {
        //console.log('probRowsAsTotal()');
        var rows = probRowsAsIntegers();
        if (op === '+') { return rows[0] + rows[1]; }
        if (op === '-') { return rows[0] - rows[1]; }
        if (op === 'x') { return rows[0] * rows[1]; }
    }

    // convert row in prob_asm into its representative integer
    function probRowsAsIntegers() {
        //console.log('probRowsAsIntegers()');
        var vals = [0, 0];
        // row0 first add in ones, tens & hundreds
        if (prob_asm[0][0] !== null) { vals[0] += prob_asm[0][0] * 100; }
        if (prob_asm[0][1] !== null) { vals[0] += prob_asm[0][1] * 10; }
        if (prob_asm[0][2] !== null) { vals[0] += prob_asm[0][2] * 1; }
        // row1 first add in ones, tens & hundreds
        if (prob_asm[1][0] !== null) { vals[1] += prob_asm[1][0] * 100; }
        if (prob_asm[1][1] !== null) { vals[1] += prob_asm[1][1] * 10; }
        if (prob_asm[1][2] !== null) { vals[1] += prob_asm[1][2] * 1; }
        return vals;
    }

    // sets row0 row1 in prob_asm matrix to min/man randInt for a given column
    function probColumnSetRandValue(col_in, min, max) {
        console.log('probColumnSetRandValue(col)', min, max, 'col_in, min, ma');
        var rand_1 = getRandInt(min, max);
        var rand_2 = getRandInt(min, max);
        prob_asm[0][col_in] =  rand_1;
        prob_asm[1][col_in] =  rand_2;

    }

    // set prob_asm 3rd (answer) row using row0 opASM and row1
    function probAnswerSet() {
        console.log('probAnswerSet()');
        var vals = probRowsAsIntegers();
        var ans = vals[0] + vals[1];
        if (opASM === '-') { ans = vals[0] - vals[1] };
        if (opASM === 'x') { ans = vals[0] * vals[1] };
        prob_asm[2][2] = ans % 10;
        if (ans > 9) { prob_asm[2][1] = parseInt(ans/10, 10) % 10; }
        if (ans > 99) { prob_asm[2][0] = parseInt(ans/100, 10); }
        // add leading zeros
        if (level_steps === 2 && ans < 10) { prob_asm[2][1] = 0; }
        if (level_steps === 3 && ans < 100) { prob_asm[2][0] = 0; }
    }

    // gets the net of gets & gives for row0 col1
    function netColumn(col) {
        var net = prob_asm[0][col];
        if (borrows['gets'+col]) { net += (borrows['gets'+col] * 10); }
        if (borrows['gives'+col]) { net -= borrows['gives'+col]; }
        return net;
    }
//
// >>> NEEDS DEFINTION:End
//
//
// >>> --------------------------------NEXT LEVEL:Start
//
    // handle the process steps at complete of multi-step problem
    function nextLevelWrapUp() {
        console.log('nextLevelWrapUp()');
        carryAddProcess();
        answerLineReveal();
    }

    // handle specific level steps for next prblem
    function nextProblemLevel() {
        console.log('nextProblemLevel()');
        // keep if (level_done === level_steps) as first check
        console.log(level_done, level_steps, 'level_done, level_steps');
        console.log(this_col, 'this_col');
        if (level_done === level_steps) { // start a new problem
            nextLevelWrapUp();
            next_problem_init();
            console.log('if (level_done === level_steps) EXIT');
            return;
        }
        correct = colAnswer(2 - level_done);
        complete = false;
        mydoc.getElementById('svg_next').style.display = 'none';
        mydoc.getElementById('div_note').style.visibility = 'hidden';
        setResponsesAnswersActive();
        layoutVerdict(null, '');
        layoutAnswerButtons();
        layoutAnswerNumFill(null, '#000');
        answerButtonClassReset();
        carryAddProcess();
        nextColumnHighlight();
        if (level_done === 0) { return; }
        // advance the column, and then check for borrows
        console.log(this_col, 'this_col--------------------------------------------------b4');
        this_col -= 1;
        console.log(this_col, 'this_col--------------------------------------------------after');
        if (level === 's2' || level === 's3') {
            borrowNoteCheck();
            borrowShowInfo();
        }
        if (level === 's3' && this_col === 1) { doubleborrowAlert(); }
        time_start = Date.now();
        console.warn(time_start, 'time_start nextProblemLevel');
    }

    // set the highlight for the column
    function nextColumnHighlight() {
        console.log('nextColumnHighligh()');
        var lights = {
            1 : ['_back', '_front', '_back'],
            2 : ['_front', '_back', '_back'] };
        if (level === 'a2' || level === 's2') {
            layoutColumnHighlight(['', '_front', '_back']);
            return;
        }
        if (!lights[level_done]) { return; };
        layoutColumnHighlight(lights[level_done]);
    }
//
// >>> NEXT LEVEL:End
//
//
// >>> --------------------------------BORROW CARRY:Start
//
    // show the appropriate borrowInfo
    function borrowShowInfo() {
        console.log('borrowShowInfo()');
        console.log(level, level_steps, level_done, '(level, level_steps, level_done');
        var note = '';
        var c_gets = this_col === 2 ? '1s' : '10s';
        var c_gives = this_col === 2 ? '10s' : '100s';
        var giver = this_col - 1;
        var n_gives = null; // int set later
        var n_gets = prob_asm[0][this_col];
        var n_row0 = prob_asm[0][this_col];
        var n_row1 = prob_asm[1][this_col];
        var dbl_note = '';
        var after_borrow = '';
        if (borrow_info_active) { return; }
        if (level_done > 1) {
            mydoc.getElementById('div_note').style.visibility = 'hidden';
            return;
        }
        if (giver < 0 || giver > 2) {
            if (shnote_borrow) {
                // correct borrowing note has already been set so we just show it
                if (!shnote_bpopup ) { // no need to wait for popup to clear
                    mydoc.getElementById('div_note').style.visibility = 'visible';
                } else {
                    borrow_info_active = true; // set flag for display after bnote popup clears
                }
            }
            console.warn('EXIT: if (giver < 0 || giver > 2)');
            return;
        }
        n_gives = prob_asm[0][giver] - borrows['gives'+giver];
        n_gets += (borrows['gets'+this_col] * 10);
        n_gets -= borrows['gives'+this_col];
        if (!borrows['gets'+this_col] && !borrows['gives'+this_col]) {
            return;
        }
        numslashSet();
        if (this_col === 1 && borrows.gives1 && prob_asm[0][1] === 0) {
            dbl_note = ' (0-1+10)';
        }
        if (this_col === 1 && borrows.gives1 && prob_asm[0][1] === 1) {
            dbl_note = ' (1-1+10)';
            after_borrow = ' (' + getStr('TXT_after_borrow') + ')';
        }
        if (borrows['gets'+this_col]) {
            if (shnote_borrow) {
                note = getStr('TXT_borrow_receives');
                note = note.replace('REPLACE_row0', ''+n_row0);
                note = note.replace('REPLACE_row1', ''+n_row1);
                note = note.replace('REPLACE_n_gets', ''+n_gets);
                note = note.replace('REPLACE_n_gives', ''+n_gives);
                note = note.replace('REPLACE_c_gets', c_gets);
                note = note.replace('REPLACE_c_gives', c_gives);
                note = note.replace('REPLACE_c_gives', c_gives);
                note = note.replace('REPLACE_dbl_note', dbl_note);
                note = note.replace('REPLACE_after_borrow', after_borrow);
                mydoc.getElementById('div_note_txt').innerHTML = note;
                if (shnote_bpopup)
                    if (level_done === 0) {
                        mydoc.getElementById('div_note').style.visibility = 'visible';
                        borrow_info_active = true;
                    } else {
                        borrow_info_active = true;
                    }
                else {
                    mydoc.getElementById('div_note').style.visibility = 'visible';
                }
            }
            borrowPathValues(this_col, n_gets);
            borrowPathValues(giver, n_gives);
        }
    }

    // show the explanatory alert if tens col previous borrow was negative
    function doubleborrowAlert() {
        console.log('doubleborrowAlert()');
        if (level != 's3') { return;} // only applies to s3
        if (this_col !== 1) { return; } // only applies to tens col
        if ((prob_asm[0][2] - prob_asm[1][2]) > -1) { return; } // no 10s borrow
        if (prob_asm[0][1] > 0) { return; } // no neg borrow
        alert(getStr('MSG_double_borrow'));
    }

    // logic to set the slashs thru the ASM matrix number based on level_done
    function numslashSet() {
        console.log('numslashSet()');
        if (this_col === 2 && borrows['gets'+this_col]) {
            layoutNumslashAll(['none', 'block', 'block']);
        }
        if (this_col === 1 && borrows['gets'+this_col]) {
            layoutNumslashSingle(0, true);
            layoutNumslashSingle(1, true);
        }
    }

    // returns true if the ASM matrix column either gives or gets a borrow
    function borrowThisCol() {
        console.log('borrowThisCol()');
        var val = false;
        if (this_col === 2 && borrows.gets2) { val = true; }
        if (this_col === 1 && borrows.gets1) { val = true; }
        return val;
    }

    // display borrowing info notes if borrow is used/received
    function borrowNoteCheck() {
        console.log('borrowNoteCheck()');
        var receives = borrows['gets'+this_col];
        var note = '';
        if (['s2', 's3'].indexOf(level) === -1) { return; }
        if (!shnote_bpopup) {
            borrowShowInfo();
            if (!shnote_borrow) {
                mydoc.getElementById('div_note').style.visibility = 'hidden';
            }
            return;
        }
        if (borrowThisCol()) {
            borrow_note_active = true;
            note = getStr('TXT_borrow_needed');
            mydoc.getElementById('b_borrow_note').innerHTML = note;
            note = getStr('TXT_borrow_continue');
            mydoc.getElementById('b_borrow_continue').innerHTML = note;
            mydoc.getElementById('svg_borrow_note').style.display = 'block';
            mydoc.getElementById('blockAll').style.display = 'block';
            mydoc.getElementById('svg_gear').style.opacity = 0.3;
        }
    }

    // set the path value for the borrow/carry boxes and disply if show=true
    function borrowPathValues(col, value) {
        console.log('borrowPathValues(col, value)');
        var box  = mydoc.getElementById('asm_bc_' + col + '_box');
        var num0 = mydoc.getElementById('asm_bc_' + col + '_num_0');
        var num1 = mydoc.getElementById('asm_bc_' + col + '_num_1');
        var v0 = parseInt(value / 10, 10);
        var v1 = value % 10;
        var p0 = ''; // path conditional on if value is pos or neg
        var p1 = ''; // path conditional on if value is pos or neg
        if (value >= 0) {
            p1 = pathTransform(getNums(v1), 'borrow_carry_number');
            if (v0 > 0) {
                p0 = pathTransform(getNums(v0), 'borrow_carry_number');
            }
        }
        if (value < 0) {
            v1 = Math.abs(v1);
            p1 = pathTransform(getNums(v1), 'borrow_carry_number');
            p0 = pathTransform(getSyms('minus'), 'borrow_carry_minus');
        }
        num0.innerHTML = p0;
        num1.innerHTML = p1;
        if (borrows['gets'+this_col]) {
            layoutBorrowCarry([this_col], true, false);
            layoutBorrowCarry([this_col-1], true, false);
        }
    }

    // sets the borrows Dict, and returns true if borrowing is needed
    function borrowNeeded() {
        console.log('borrowNeeded');
        borrowsSetDict();
        console.log(borrows.gets0 + borrows.gets1 + borrows.gets2 > 0);
        return borrows.gets0 + borrows.gets1 + borrows.gets2 > 0;
    }
    
    // set the gives and gets for cols using 0,1,2 index references
    function borrowsSetDict() {
        console.log('borrowsSetDict()');
        var val = 0;
        borrows = {'gives0':0, 'gets0':0, 
                   'gives1':0, 'gets1':0, 
                   'gives2':0, 'gets2':0};
        if (level === 's1') { return; } // neg answers ok in s1
        val = calcColumn(2, '-');
        if (val < 0) {
            borrows.gets2 = 1;
            borrows.gives1 = 1;
        }
        val = calcColumn(1, '-') - borrows.gives1;
        if (val < 0) {
            borrows.gets1 = 1;
            borrows.gives0 = 1;
        }
    }

    // initial carries & then set gets = 1 for each col getting a carry
    function carryforwardSet() {
        console.log('carryforwardSet()');
        carries = {0:0, 1:0, 2:0}; // key=2 just for symmetry
        // possible carries: 1s (col=2) & 10s (col=1)
        carries[1] = parseInt(calcColumn(2, opASM) / 10, 10);
        carries[0] = parseInt(calcColumn(1, opASM) / 10, 10);
        if (prob_asm[0][0] === null && prob_asm[1][0] === null) {
            if (prob_asm[2][0] > 0) {
                carries[0] = 1;
            }
        }
    }
    // display the carry info note
    function displayCarryNote(val) {
        console.log('displayCarryNote(val)');
        var note = '';
        if (!shnote_carry) { return; }
        if (!complete) {
            note = getStr('TXT_carry_next');
        } else {
            note = getStr('TXT_carry_add');
        }
        note = note.replace('REPLACE_ANSWER', ''+val);
        note = note.replace('REPLACE_ONES', ''+(val % 10));
        note = note.replace('REPLACE_VALUE', ''+(val % 10));
        if (level_done === 0) {
            note = note.replace('REPLACE_COLA', '1s');
            note = note.replace('REPLACE_COLA', '1s');
            note = note.replace('REPLACE_COLB', '10s');
            note = note.replace('REPLACE_COLB', '10s');
            note = note.replace('REPLACE_COLB', '10s');
        } else {
            note = note.replace('REPLACE_COLA', '10s');
            note = note.replace('REPLACE_COLA', '10s');
            note = note.replace('REPLACE_COLB', '100s');
            note = note.replace('REPLACE_COLB', '100s');
            note = note.replace('REPLACE_COLB', '100s');
        }
        mydoc.getElementById('div_note_txt').innerHTML = note;
        mydoc.getElementById('div_note').style.visibility = 'visible';
    }

    // display borrow/carry column value & note (level_done dependencies)
    function carryAddProcess() {
        console.log('carryAddProcess()');
        var val = colAnswer(this_col, '+');
        if (opASM !== '+') { return; }
        if (val > 9) { displayCarryNote(val); }
        if (this_col > 0) { carriesAddSet(); }
    }

    // do borrow/carry value setup & display: depends on carries
    function carriesAddSet() {
        console.log('carriesAddSet()');
        var colnext = this_col - 1; // look ahead to next column
        var val = carries[colnext];
        var pth = val ? pathTransform(getNums(val), 'borrow_carry_number') : '';
        var id = 'asm_bc_' + colnext + '_';
        if (val === 0) { return; }
        mydoc.getElementById(id + 'num_0').innerHTML = pth;
        setBorrowCarry(colnext, 0, val, false);
        layoutBorrowCarry([colnext], true, true);
    }

    // set column borrowcarry svg rects to either blank('') or value (path)
    function setBorrowCarry(col, n0, n1, slash) {
        console.log('setBorrowCarry(col, n0, n1, slash)');
        var id = 'asm_bc_' + col + '_';
        n0 = n0 ? pathTransform(getNums(n0), 'borrow_carry_number') : '';
        n1 = n1 ? pathTransform(getNums(n1), 'borrow_carry_number') : '';
        s1 = slash ? pathTransform(getSyms('slash'), 'borrow_carry_slash') : '';
        mydoc.getElementById(id + 'num_0').innerHTML = n0;
        mydoc.getElementById(id + 'num_1').innerHTML = n1;
        mydoc.getElementById(id + 'slash_1').innerHTML = s1;
    }
//
// >>> BORROW CARRY:End
//
//
// >>> --------------------------------PROBLEM SETUP:Start
//
    // initial common steps done before setting up the ASM problem (prob_asm)
    function problemInit(lvl, steps, op, op_sym) {
        console.log('problemInit(lvl, steps, op, op_sym)');
        level = lvl;
        level_steps = steps;
        level_done = 0;
        opASM = op;
        operatorSet(op_sym);
        resetProblemArray();
        complete = false;
        count_problem += 1;
        count_record = 0;
    }

    // final common steps done after setting up the ASM problem (prob_asm)
    function finishProbSetup() {
        console.log('finishProbSetup()');
        over_active = false;
        reduceProblem();
        setNumbers();
        answersResponsesSetValues();
        setResponsesAnswersActive();
        complete = false;
        this_col = 2;
    }

    // common steps to init a new problem - prob_fnc is the problem setup fnc
    function levelInit(prob_fnc, col_layout_array) {
        console.log('levelInit(prob_fnc, col_layout_array)');
        hideAll();
        level_done = 0;
        total_problems += 1;
        console.log('prob_fnc()----------------------start');
        prob_fnc();
        console.log('prob_fnc()----------------------end');
        layoutInitialGrid(col_layout_array);
    }

    // level M1 problem init
    function levelM1Init() {
        console.log('levelM1Init()');
        var col_layout_array = ['_back', '_back', '_front'];
        next_problem_init = levelM1Init;
        levelInit(levelM1Problem, col_layout_array);
    }

    // level S3 problem init
    function levelS3Init() {
        console.log('levelS3Init()');
        var col_layout_array = ['_back', '_back', '_front'];
        next_problem_init = levelS3Init;
        levelInit(levelS3Problem, col_layout_array);
    }

    // level S2 problem init
    function levelS2Init() {
        console.log('levelS2Init()');
        var col_layout_array = ['', '_back', '_front'];
        next_problem_init = levelS2Init;
        levelInit(levelS2Problem, col_layout_array);
    }

    // level S1 problem init
    function levelS1Init() {
        console.log('levelS1Init()');
        var col_layout_array = ['', '', '_front'];
        next_problem_init = levelS1Init;
        levelInit(levelS1Problem, col_layout_array);
    }

    // level A3 problem init
    function levelA3Init() {
        console.log('levelA3Init()');
        var col_layout_array = ['_back', '_back', '_front'];
        next_problem_init = levelA3Init;
        levelInit(levelA3Problem, col_layout_array);
    }

    // level A2 problem init
    function levelA2Init() {
        console.log('levelA2Init()');
        var col_layout_array = ['', '_back', '_front'];
        next_problem_init = levelA2Init;
        levelInit(levelA2Problem, col_layout_array);
    }

    // level A1 problem init
    function levelA1Init() {
        console.log('levelA1Init()');
        var col_layout_array = ['', '', '_front'];
        next_problem_init = levelA1Init;
        levelInit(levelA1Problem, col_layout_array);
    }

    function m1RandomPatternCheck(rand_in) {
        console.log('m1RandomPatternCheck(rand_in)', rand_in, 'rand_in');
        var i = 0;
        var len = rand_last3.length;
        var exists = rand_last3.indexOf(rand_in);
        var my_rand = rand_in;
        while (exists > -1) {
            my_rand = getRandInt(m1_row1_min, m1_row1_max);
            exists = rand_last3.indexOf(my_rand);
            i += 1;
            if (i > 10) { exists = -1;}
        }
        if (len < 3) {
            rand_last3.push(my_rand);
        } else {
            rand_last3[0] = rand_last3[1];
            rand_last3[1] = rand_last3[2];
            rand_last3[2] = my_rand;
        }
        return my_rand;
    }

    // setup and finish a M1 problem
    function levelM1Problem() {
        console.log('levelM1Problem()');
        var pos_needed = true;
        var row1 = getRandInt(m1_row1_min, m1_row1_max);
        console.log(m1_order, 'm1_order')
        console.log(m1_row1_min, 'm1_row1_min');
        console.log(m1_row1_max, 'm1_row1_max');
        console.log(row1, 'row1');
        problemInit('m1', 1, 'x', 'multiply')
        if (!m1_order) { row1 = m1RandomPatternCheck(row1); }
        prob_asm[0][2] = m1_digit;
        if (m1_order) {
            m1_order_count += 1;
            // need to reset m1_order_count to zero to properly handle
            // when user wraps-around (more than 1 time) working thru
            // an ordered m1 process
            if (m1_order_count > m1_row1_max) { m1_order_count = 0; }
            row1 = m1_order_count > m1_row1_max ? m1_row1_min : m1_order_count;
        }
        if (row1 < 10) {
            prob_asm[1][2] = row1;
        } else {
            prob_asm[1][2] = row1 % 10;
            prob_asm[1][1] = parseInt(row1 / 10, 10);
        }
        //prob_asm  = [ [null,null,9], [null,1,2], [1,0,8] ];
        probAnswerSet();
        finishProbSetup();
        correct = colAnswer(2);
        console.log(correct, '--------------------------------------------------correct');
    }

    // generate chunk html with button and chunk text
    function chunkHtml(row1, show_total, font_pct) {
        console.log('chunkHtml(row1, show_total, font_pct)');
        var tens = 0; // row1 integer in tens
        var txt = '';
        tens = parseInt(row1 / 10) * 10;
        txt = '<button class="chunk" '
        txt += 'onclick="RMM_ASM.chunkShow(event);">'
        txt += getStr('TXT_chunk_it') + '</button>';
        txt += '<div id="div_chunkit" style="margin-top:10px;display:none;';
        txt += 'font-size:' + font_pct + '%;">';
        txt += '&nbsp;';
        if (calcColumn(2, 'x') < 10) { txt += '&nbsp'; }
        txt += calcColumn(2, 'x');
        txt += '&nbsp;=&nbsp;' + prob_asm[0][2];
        txt += '&nbsp;x&nbsp;' + prob_asm[1][2]; 
        txt += '<br>+&nbsp;' + prob_asm[0][2] * tens;
        txt += '&nbsp;=&nbsp;' + prob_asm[0][2] + '&nbsp;x&nbsp;';
        txt += tens;
        if (show_total) {
            txt += '<br>' + correct + '&nbsp;=&nbsp;' + getStr('TXT_Total');
        }
        txt += '</div>';
        return txt;
    }

    //shows or hides the chunk it message
    function chunkMessage(show_total) {
        console.log('chunkMessage()');
        var vals = probRowsAsIntegers();
        var txt = '';
        if (!shnote_chunk) { return; }
        if (level.substr(0, 1) !== 'm') { return; }
        if (!m1_chunk || vals[1] < 11 || vals[1] === 20) {
            mydoc.getElementById('div_note').style.visibility = 'hidden';
            return;
        }
        txt = chunkHtml(vals[1], show_total, 100);
        mydoc.getElementById('div_note_txt').innerHTML = txt;
        mydoc.getElementById('div_note').style.visibility = 'visible';
    }

    // display chunk message after button click
    function chunkShow(ev) {
        console.log('chunkShow(ev)');
        console.log(mydoc.getElementById('div_chunkit').innerHTML);
        mydoc.getElementById('div_chunkit').style.display = 'block';
    }

    // setup and finish a S3 problem
    function levelS3Problem() {
        console.log('levelS3Problem()');
        console.log(subborrow, 'subborrow');
        var pos_needed = true;
        problemInit('s3', 3, '-', 'minus')
        while (pos_needed) {
            probColumnSetRandValue(2, 0, 10);
            if (s3_doubleborrow_allow) {
                probColumnSetRandValue(1, 0, 10);
            } else {
                probColumnSetRandValue(1, 1, 10);
            }
            probColumnSetRandValue(0, 1, 10);
            if (!subborrow && borrowNeeded()) { continue; }
            if (probRowsAsTotal('-') > -1) { pos_needed = false; }
        }
        //prob_asm  = [ [9,0,0], [7,5,9], [1,4,1] ];
        //prob_asm  = [ [4,1,2], [1,8,3], [2,2,9] ];
        //prob_asm  = [ [8,6,2], [5,0,9], [3,5,3] ];
        //prob_asm  = [ [7,0,5], [5,6,8], [1,4,3] ];
        //prob_asm  = [ [8,1,1], [6,6,3], [1,4,8] ];
        //prob_asm  = [ [4,9,6], [3,0,0], [1,9,6] ];
        //prob_asm  = [ [8,0,1], [5,1,9], [2,8,2] ];
        //prob_asm  = [ [7,2,3], [3,7,0], [3,5,3] ];
        //prob_asm  = [ [9,7,2], [7,6,0], [2,1,2] ];
        //prob_asm  = [ [8,8,1], [8,2,7], [0,5,2] ];
        borrowsSetDict();
        probAnswerSet();
        finishProbSetup();
        correct = colAnswer(2);
        console.log(correct, '--------------------------------------------------correct');
    }

    // setup and finish a S2 problem
    function levelS2Problem() {
        console.log('levelS2Problem()');
        var pos_needed = true;
        problemInit('s2', 2, '-', 'minus')
        while (pos_needed) {
            probColumnSetRandValue(2, 0, 10);
            probColumnSetRandValue(1, 1, 10);
            if (!subborrow && borrowNeeded()) { continue; }
            if (probRowsAsTotal('-') > -1) { pos_needed = false; }
        }
        //prob_asm  = [ [null, 8, 2], [null, 7, 3], [null,0,9] ];
        borrowsSetDict();
        probAnswerSet();
        finishProbSetup();
        correct = colAnswer(2);
        console.log(correct, '--------------------------------------------------correct');
    }

    // setup and finish a S1 problem
    function levelS1Problem() {
        console.log('levelS1Problem()');
        var neg_prob = false;
        var pos_needed = true;
        var myrand = 0;
        problemInit('s1', 1, '-', 'minus');
        // use simple randomize for print negative problem, and
        // more sophisticated randomization across total problem for non-print
        if (printmode) {
           myrand = getRandInt(1, 11);
           neg_prob = myrand <= (subneg_pct * 10);
        } else {
            neg_prob = (s1_neg_problems / total_problems) < subneg_pct;
        }
        console.log(neg_prob, 'neg_prob');
        if (neg_prob) {
            probColumnSetRandValue(2, 0, 10);
        } else {
            while (pos_needed) {
                probColumnSetRandValue(2, 0, 10);
                if (colAnswer(2) > -1) { pos_needed = false; }
            }
        }
        //prob_asm  = [ [null, null, 1], [null, null, 9], [null, null, -8] ];
        //prob_asm  = [ [null, null, 5], [null, null, 1], [null, null, 4] ];
        borrowsSetDict();
        if (colAnswer(2) < 0) { s1_neg_problems += 1; }
        //probColumnSetRandValue(2, 0, 10);
        probAnswerSet();
        finishProbSetup();
        correct = colAnswer(2);
        console.log(correct, '--------------------------------------------------correct');
    }

    // setup and finish a A3 problem
    function levelA3Problem() {
        console.log('levelA3Problem()');
        problemInit('a3', 3, '+', 'plus')
        var val = 1000;
        var tries = 0;
        probColumnSetRandValue(2, 0, 10);
        probColumnSetRandValue(1, 0, 10);
        // make sure total of three cols is not > 999 (limit of answer display)
        while (val > 999 && tries < 20) {
            probColumnSetRandValue(0, 1, 9);
            val = colAnswer(0) * 100;
            val += colAnswer(1) * 10;
            val += colAnswer(2);
            tries += 1;
        }
        // handle very rare case where could not find val < 1000
        if (val > 1000) {
            prob_asm[0][0] = getRandInt(1, 5);
            prob_asm[1][0] = getRandInt(1, 4);
        }
        //prob_asm  = [ [1, 6, 5], [2, 7, 8], [4, 4, 3] ];
        //prob_asm  = [ [1, 0, 4], [2, 7, 8], [4, 4, 3] ];
        //prob_asm  = [ [2, 4, 5], [5, 6, 0], [8, 0, 5] ];
        //prob_asm  = [ [1, 9, 9], [1, 9, 9], [3, 9, 8] ];
        carryforwardSet();
        probAnswerSet();
        finishProbSetup();
        layoutColumnHighlight(['', '_back', '_front']);
        correct = colAnswer(2);
        console.log(correct, '--------------------------------------------------correct');
    }

    // setup and finish a A2 problem
    function levelA2Problem() {
        console.log('levelA2Problem()');
        problemInit('a2', 2, '+', 'plus')
        probColumnSetRandValue(2, 0, 10);
        probColumnSetRandValue(1, 1, 10);
        //prob_asm  = [ [null, 7, 5], [null, 5, 6], [1,3,1] ];
        //prob_asm  = [ [null, 1, 6], [null, 5, 6], [null, 7, 6] ];
        //prob_asm  = [ [null, 8, 4], [null, 1, 7], [1, 0, 1] ];
        carryforwardSet();
        probAnswerSet();
        finishProbSetup();
        layoutColumnHighlight(['', '_back', '_front']);
        correct = colAnswer(2);
        console.log(correct, '--------------------------------------------------correct');
    }

    // setup and finish a A1 problem
    function levelA1Problem() {
        console.log('levelA1Problem()');
        var rand = getRandInt(0, 3);
        problemInit('a1', 1, '+', 'plus')
        probColumnSetRandValue(2, 0, 10);
        if (rand < 6) { levelA1NegativeProblem(); }
        //prob_asm  = [ [null, null, 1], [null, null, 0], [null,null,1] ];
        //prob_asm  = [ [null, null, -8], [null, null, 2], [null,null,-6] ];
        //prob_asm  = [ [null, null, -5], [null, null, 1], [null,null,-4] ];
        carryforwardSet();
        probAnswerSet();
        finishProbSetup();
        correct = colAnswer(2);
        console.log(correct, '--------------------------------------------------correct');
    }

    // change to a equation with negative addendums
    function levelA1NegativeProblem() {
        console.log('levelA1NegativeProblem()');
        var rand = getRandInt(0, 3);
        // avoid many complications from answer being > -9 (sorry)
        if ((prob_asm[0][2]*-1) + (prob_asm[1][2]*-1) < -9) { return; };
        if (rand < 1) {
            prob_asm[0][2] = prob_asm[0][2] * -1;
        } else {
            prob_asm[1][2] = prob_asm[1][2] * -1;
        }
        prob_asm[2][2] = prob_asm[0][2] + prob_asm[1][2];
    }

    // set the random

    // converts the ASM grid into a str: row0|row1|row2|op where rows = int vals
    function reduceProblem() {
        console.log('reduceProblem()');
        var op1 = prob_asm[0].join('');
        var op2 = prob_asm[1].join('');
        var ans = prob_asm[2].join('');
        problem_str = op1 + '|' + op2 + '|' + ans;
        problem_str += '|' + opASM;
    }

    // setup a print problem such that the problem_str is available
    function printProblemSetup() {
        console.log('printProblemSetup()');
        if (level === 'a1') { levelA1Problem(); }
        if (level === 'a2') { levelA2Problem(); }
        if (level === 'a3') { levelA3Problem(); }
        if (level === 's1') { levelS1Problem(); }
        if (level === 's2') { levelS2Problem(); }
        if (level === 's3') { levelS3Problem(); }
        if (level === 'm1') { levelM1Problem(); }
    }
//
// >>> PROBLEM SETUP:End
//
//
// >>> --------------------------------ANSWERED:Start
//
    // apply the blur filter to svg id=asm & set timer to call blur remove fnc
    function blurBreakStart(milli) {
        console.log('blurBreakStart()');
        console.log('milli', milli);
        mydoc.getElementById('asm').className.baseVal = 'f3';
        // we use rotate(0deg) to force Safari to redraw asm in blurBreakEnd
        // so must clear it here otherwise it only works first time 
        mydoc.getElementById('asm').style.WebkitTransform = 'none';
        timervar = window.setTimeout(blurBreakEnd, milli);
    }

    // remove svg id=asm blur & clear blur timer & set problem timer start value
    function blurBreakEnd() {
        console.log('blurBreakEnd()');
        window.clearTimeout(timervar);
        mydoc.getElementById('asm').className.baseVal = 'f0';
        over_active = true;
        mydoc.getElementById('asm_answer').style.opacity = 1.0;
        // rotate(0deg) to force Safari to redraw asm
        // without this, the asm almost always stays blurred
        mydoc.getElementById('asm').style.transform = 'rotate(0deg)';
        time_enter = Date.now();
        if (!borrow_note_active) {
            time_start = Date.now();
        }
        console.log(level, 'level');
        console.log(level_steps, 'level_steps');
        if (level_steps > 1 && level.substr(0, 1) === 's') {
            borrowNoteCheck();
        }
        chunkMessage(true);
        console.log('baseVal', mydoc.getElementById('asm').className.baseVal);
        if (!borrow_note_active) {
            mydoc.getElementById('svg_gear').style.opacity = '1.0';
        }
    }

    // handle click on answer box: set verdict=wrong OR call correct process
    function answerClick(ev) {
        console.log('answerClick(ev)---------------------------------------------------------');
        var id = ev.target['id'];
        var bid = null; // button id
        var i = 0;
        var index = -1;
        var cf_notes = []; // will have the carryforward note texts
        over_active = false;
        if (complete) { return; }
        // if number inside answer box is clicked parentElement has the id
        if (id.length === 0) { id = ev.target.parentElement['id']; }
        bid = id.split('_')[2];
        index = parseInt(bid.replace('b', '') , 10);
        answer_active[index] = false;
        complete = responses[index] === correct;
        console.warn(complete, 'complete-------------------------------------');
        // add timestamp to int in responses if not yet clicked (still an int)
        if (typeof(responses[index]) !== 'string') {
            responses[index] = Date.now() + '_' + responses[index];
            mydoc.getElementById(id).className.baseVal = 'answer_button';
        }
        if (!complete) {
            layoutVerdict(index, 'multiply');
            console.warn('EXIT answerClick !complete-------------------------');
            return;
        }
        if (module != 'm2' && module != 'd3') {
            carryAddProcess();
            count_record += 1;
            recordAnswer();
        }
        correctAnswerHandler(index);
        console.warn('FINISHED answerClick complete=true---------------------');
    }

    // steps for ASM correct answer click (problem level dependencies)
    function correctAnswerHandler(index) {
        console.log('correctAnswerHandler(index) ------------------------------------------------------------------------');
        console.log(module, 'module');
        ////////console.error(shnote_numpos, 'shnote_numpos');
        ////////console.error(shnote_next, 'shnote_next');
        bnext_note_active = false;
        setCarryOverride();
        // answer buttons updates
        answerButtonClassReset();
        layoutVerdict(index, 'check');
        layoutAnswerNumFill(index, '#0000e6');
        // handle d3 and m2 with specific functions
        if (module === 'd3') {
            RMM_D3.correctAnswerHandler();
            return;
        }
        if (module === 'm2') {
            RMM_M2.correctAnswerHandler();
            return;
        }
        ////////console.error(level, 'level-----------------------');
        ////////console.error(level_steps, level_done, 'level_steps, level_done-------');
        // update answer line befor incrementing level_done
        answerLineReveal();
        // any level 1 problem either show Next Problem or goto next problem
        ////////console.error('starting: if (level === a1 || level === s1 || level === m1) {');
        if (level === 'a1' || level === 's1' || level === 'm1') {
            RMM_STATSLIVE.displayUserCounts(level, true);
            if (shnote_next) {
                mydoc.getElementById('b_next').innerHTML = getStr('TXT_next_prob');
                bnext_note_active = true;
                activateSvgNext();
            } else {
                next_problem_init();
            }
            return;
        }
        ////////console.error('MULTI-STEP----------------------------------------------');
        // handle completed multi-step problem and next_problem popup false
        ////////console.error('---------vars start----------');
        ////////console.error('---------vars start----------');
        ////////console.error(complete, 'complete');
        ////////console.error(shnote_next, 'shnote_next');
        ////////console.error(shnote_numpos, 'shnote_numpos');
        ////////console.error(shnote_carry, 'shnote_carry');
        ////////console.error(shnote_bpopup, 'shnote_bpopup');
        ////////console.error(shnote_borrow, 'shnote_borrow');
        ////////console.error(carry_override, 'carry_override');
        ////////console.error(level_steps, level_done, 'level_steps, level_done-------');
        ////////console.error(carries, 'carries');
        ////////console.error('---------vars end----------');
        ////////console.error('---------vars end----------');
        ////////// handle last step in multi-step
        // either go to next problem or show Next Problem popup
        if ( (level_done + 1) >= level_steps) {
            ////////console.error('HANDLE LAST STEP------------------------------------');
            level_done += 1;
            RMM_STATSLIVE.displayUserCounts(level, true);
            if (!shnote_next) {
                next_problem_init();
            } else {
                ////////console.error('DO --- nextButtonText()');
                nextButtonText();
                activateSvgNext();
            }
            return;
        }
        // handle multi-step problems where either b_next is shown with either
        // number position or next problem prompts are shown
        if (level_steps > 1) {
            ////////console.error('if (level_steps > 1) {');
            // check number position prompt befor increment level_done
            numberPositionText();
            level_done += 1;
            if (level_steps === level_done) { 
                RMM_STATSLIVE.displayUserCounts(level, true);
            }
            // check next button prompt after incrementing level_done
            nextButtonText();
        }
        setResponsesAnswersActive();
        complete = false;
        ////////console.error(shnote_numpos, 'shnote_numpos');
        ////////console.error(shnote_next, 'shnote_next');
        ////////console.error(carries, 'carries');
        if (shnote_next === false && shnote_numpos === false) {
            console.log('-----1-----------------------start');
            nextProblemLevel();
            console.log('-----1-----------------------end');
        }
        if (level.substr(0, 1) === 's') {
            if (bnext_note_active) {
                console.log('-----2-----------------------start');
                activateSvgNext();
                console.log('-----2-----------------------end');
            } else {
                console.log('-----3-----------------------start');
                nextProblemLevel();
                console.log('-----3-----------------------end');
            }
        }
        if (level.substr(0, 1) === 'a') {
            if (complete && !shnote_next) {
                if ( (level_done + 1) >= level_steps) {
                    next_problem_init();
                    return;
                }
            }
            if (shnote_numpos) {
                console.log('-----4-----------------------start');
                activateSvgNext();
                console.log('-----4-----------------------end');
            } else {
                if (!shnote_carry || !carry_override) {
                    console.log('-----5-----------------------start');
                    nextProblemLevel();
                    console.log('-----5-----------------------end');
                } else {
                    console.log('-----6-----------------------start');
                    activateSvgNext();
                    console.log('-----6-----------------------end');
                }
            }
        }
        console.log(level, 'level');
        if (shnote_bpopup && level.substr(0,1) === 's') {
            console.log('-----7-----------------------start');
            mydoc.getElementById('div_note').style.visibility = 'hidden';
            console.log('-----7-----------------------end');
        }
        console.log('correctAnswerHandler DONE ------------------------------------------------------------------------');
    }

    // show the blockAll and svg_next elements
    function activateSvgNext() {
        console.log('activateSvgNext()');
        mydoc.getElementById('blockAll').style.display = 'block';
        mydoc.getElementById('svg_gear').style.opacity = 0.3;
        mydoc.getElementById('svg_next').style.display = 'block';
        mydoc.getElementById('asm_answer').style.opacity = 0.6;
    }

    function setCarryOverride() {
        console.log('setCarryOverride()');
        ////////console.error(level_done, 'level_done');
        ////////console.error(carries, 'carries');
        var carry_ahead = 0;
        // check for a carry. Note carries[0] = hundreds, [1]=tens, [2]=ones
        // which is opposite how number cols work. Only check tens & 000s.
        if (level_done === 0) { carry_ahead = carries[1]; } // num col = 1s [2]
        if (level_done === 1) { carry_ahead = carries[0]; } // nom col = 10s [1]
        carry_override = carry_ahead !== 0;
        ////////console.error(carry_override, '= carry_override at exit');
    }

    // show appropriate next button text based on levels & done
    function numberPositionText() {
        console.log('numberPositionText()');
        var bnext = mydoc.getElementById('b_next');
        setCarryOverride();
        bnext_note_active = false;
        if (shnote_numpos === false && !carry_override) {
            ////////console.error('----exit 01');
            return;
        }
        if (level_steps === level_done) {
            ////////console.error('----exit 02');
            return;
        }
        bnext_note_active = true;
        if (level_steps === 2) {
            if (level_done === 0) { bnext.innerHTML = getStr('TXT_next_10'); }
            if (level_done === 1) { bnext.innerHTML = getStr('TXT_next_prob'); }
        }
        if (level_steps === 3) {
            if (level_done === 0) { bnext.innerHTML = getStr('TXT_next_10'); }
            if (level_done === 1) { bnext.innerHTML = getStr('TXT_next_100'); }
            if (level_done === 2) { bnext.innerHTML = getStr('TXT_next_prob'); }
        }
        console.log('numberPositionText Done');
    }

    // show appropriate next button text based on levels & done
    function nextButtonText() {
        console.log('nextButtonText()');
        console.log(level_steps, 'level_steps', level_done, 'level_done', '--------------------------------------------------');
        var bnext = mydoc.getElementById('b_next');
        if (!shnote_next) {
            ////////console.error('EXIT !shnote_next');
            return;
        }
        if (level_done < level_steps) {
            ////////console.error('EXIT level_done < level_steps');
            return;
        }
        bnext_note_active = true;
        if (level_steps > level_done) {
            ////////console.error('EXIT level_steps > level_done');
            return;
        }
        mydoc.getElementById('b_next').innerHTML = getStr('TXT_next_prob');
        ////////console.error(mydoc.getElementById('b_next').innerHTML, 'getElementById(b_next).innerHTML');
    }

    // answer line (row2): display the appropriate numbers
    function answerLineReveal() {
        console.log('answerLineReveal()');
        console.log(level, 'level');
        if (level === 'm1') {
            layoutToggleRow2Visibility(true, [true, true, true]);
            return;
        }
        if (level === 'a1' || level === 's1') {
            layoutToggleRow2Visibility(true, [false, true, true]);
            return;
        }
        if (level_done === 0) {
            layoutToggleRow2Visibility(true, [false, false, true]);
            return;
        }
        if (level_done === 1 && (level === 'a3' || level === 's3')) {
                layoutToggleRow2Visibility(true, [false, true, true]);
                return;
        }
        if (level_done === level_steps) {
            layoutToggleRow2Visibility(true, [true, true, true]);
            return
        }
        layoutToggleRow2Visibility(true, [true, true, true]);
    }

    // returns number of tries in responses array (time_value strings)
    function calcAnswerTries() {
        console.log('calcAnswerTries()');
        var i = 0;
        var len = responses.length;
        var tries = 0;
        for (i=0; i<len; i++) {
            if (typeof(responses[i]) === 'string') { tries += 1; }
        }
        return tries;
    }

    // create concatenated str with user/prob/ans data & push() it is testing
    function recordAnswer() {
        console.log('recordAnswer()');
        var tries = calcAnswerTries();
        var idsession = session + '_' + count_problem + '_' + count_record;
        var data = {'idsession' : idsession};
        var r_str = '';
        var tic = '^';
        var now = Date.now();
        console.log(getGuestActive(), 'getGuestActive()');
        if (getGuestActive()) { return; }
        data['iduser'] = iduser;
        data['idlevel'] = level;
        data['device_iduser'] = RMM_DB.getDevice() + '_' + iduser;
        data['time'] = now - time_start;
        data['tstamp'] = now;
        data['elapsed'] = now - time_enter;
        console.log(data['time'], 'time');
        data['tries'] = tries;
        r_str += level + '.' + level_steps + '.' + level_done;
        r_str += tic + problem_str;
        if (level === 'm1') { // add whether problem was ordered
            r_str += tic + m1_order;
        }
        r_str += tic + responses.join('|');
        data['r_str'] = r_str;
        console.log('%c' + r_str, 'color:#009933;');
        RMM_DB.addSessionRec(data);
    }

    // handle click on block (full window cover) presented after correct ans
    function blockAllClick(ev) {
        console.log('blockAllClick(ev)');
        console.log( borrow_info_active, 'borrow_info_active');
        //alert('blockAllClick');
        mydoc.getElementById('blockAll').style.display = 'none';
        mydoc.getElementById('svg_gear').style.opacity = '1.0';
        over_active = true;
        if (borrow_info_active) {
            mydoc.getElementById('div_note').style.visibility = 'visible';
            borrow_info_active = false;
        }
        if (borrow_note_active && ['s2', 's3'].indexOf(level) > -1) {
            mydoc.getElementById('svg_borrow_note').style.display = 'none';
            borrow_note_active = false;
            borrowShowInfo();
            time_start = Date.now();
            return;
        }
        if (bnext_note_active) {
            mydoc.getElementById('svg_next').style.display = 'none';
            bnext_note_active = false;
        }
        if (level === 's1' || level === 'a1' || level === 'm1') {
            next_problem_init();
            return;
        }
        nextProblemLevel();
    }
//
// >>> ANSWERED:End
//
//
// >>> --------------------------------LAYOUT:Start
//
    // show/hide each element in a column borrowcarry svg rect
    function layoutBorrowCarry(array_in, show, slash) {
        console.log('layoutBorrowCarry(array_in)');
        var i = 0;
        var len = array_in.length;
        var d_value = show ? 'block' : 'none';
        var s_value = slash ? 'block' : 'none';
        var id = '';
        for (i=0; i<len; i++) {
            id = 'asm_bc_' + array_in[i] + '_';
            mydoc.getElementById(id + 'box').style.display = d_value;
            mydoc.getElementById(id + 'num_0').style.display = d_value;
            mydoc.getElementById(id + 'num_1').style.display = d_value;
            mydoc.getElementById(id + 'slash_1').style.display = s_value;
        }
    }

    // set the color css value of the column bkgds in the ASM grid
    function layoutInitialGrid(col_backfront_array) {
        console.log('layoutInitialGrid()---------------------------------------start');
        mydoc.getElementById('svg_next').style.display = 'none';
        mydoc.getElementById('div_note').style.visibility = 'hidden';
        layoutToggleRow2Visibility(false);
        blurBreakStart(200);
        layoutPlaceholders();
        layoutPlaceholderBkgs(false, false, true);
        layoutBorrowCarry([0, 1, 2], false, false);
        layoutLineTotal();
        if (level !== 'm1') {
            layoutColumnHighlight(col_backfront_array);
        } else {
            if (prob_asm[1][1] === null) {
                layoutColumnHighlight(['_back', '_back', '_front']);
            } else {
                layoutColumnHighlight(['_back', '_front', '_front']);
            }
        }
        layoutAnswerButtons();
        layoutAnswerNumFill(null, '#000');
        mydoc.getElementById('asm_answer').style.display = 'block';
        answerButtonClassReset();
        layoutVerdict(null, '');
        showASM();
        console.log('layoutInitialGrid()---------------------------------------end');
    }

    // set style.display for SINGLE row0 number slash
    function layoutNumslashSingle(col, show) {
        console.log('layoutNumslashSingle(col, show)');
        console.log(col, 'col', show, 'show');
        var id = 'asm_bc_' + col + '_slash_num';
        var show = show ? 'block' : 'none'
        mydoc.getElementById(id).style.display = show;
    }

    // set style.display for ALL row0 number slashes
    function layoutNumslashAll(a_in) {
        console.log('layoutNumslashAll(array_in)');
        mydoc.getElementById('asm_bc_0_slash_num').style.display = a_in[0];
        mydoc.getElementById('asm_bc_1_slash_num').style.display = a_in[1];
        mydoc.getElementById('asm_bc_2_slash_num').style.display = a_in[2];
    }

    // set all the column borrow/carry nums and slashes to '' (blank)
    function layoutClearBorrowCarry() {
        console.log('layoutClearBorrowCarry()');
        mydoc.getElementById('asm_bc_0_num_0').innerHTML = '';
        mydoc.getElementById('asm_bc_0_num_1').innerHTML = '';
        mydoc.getElementById('asm_bc_0_slash_1').innerHTML = '';
        mydoc.getElementById('asm_bc_1_num_0').innerHTML = '';
        mydoc.getElementById('asm_bc_1_num_1').innerHTML = '';
        mydoc.getElementById('asm_bc_1_slash_1').innerHTML = '';
        mydoc.getElementById('asm_bc_2_num_0').innerHTML = '';
        mydoc.getElementById('asm_bc_2_num_1').innerHTML = '';
        mydoc.getElementById('asm_bc_2_slash_1').innerHTML = '';
    }

    // show/hide row2 (answer) in ASM grid: if grid box has value show/hide it
    function layoutToggleRow2Visibility(show, columns) {
        console.log('layoutToggleRow2Visibility(show)');
        console.log(show, columns, 'show, columns');
        console.log(prob_asm, 'prob_asm');
        console.log(level, 'level');
        if (!show) {
            mydoc.getElementById('asm_num_20').style.display = 'none';
            mydoc.getElementById('asm_num_21').style.display = 'none';
            mydoc.getElementById('asm_num_22').style.display = 'none';
            mydoc.getElementById('asm_num_22_neg').style.display = 'none';
            console.log('NO SHOW EXit');
            return;
        }
        console.log('-------------------1');
        if (columns[0] && prob_asm[2][0] !== null) {
            mydoc.getElementById('asm_num_20').style.display = 'block';
        }
        console.log('-------------------2');
        if (columns[1] && prob_asm[2][1] !== null) {
            mydoc.getElementById('asm_num_21').style.display = 'block';
        }
        console.log('-------------------3');
        if (columns[2] && prob_asm[2][2] !== null) {
            mydoc.getElementById('asm_num_22').style.display = 'block';
        }
        console.log('-------------------4');
        mydoc.getElementById('asm_num_22_neg').style.display = 'none';
        // special handling of negative sign for s1 problems
        if (level !== 's1') { console.log('NO NEG'); return; }
        console.log('-------------------5');
        if (prob_asm[2][2] < 0) {
            console.log('YES NEG');
            mydoc.getElementById('asm_num_22_neg').style.display = 'block';
        }
        console.log('-------------------6');
    }

    // set ASM number column className & set placeholder to match (fnc call) 
    function layoutColumnHighlight(bf_values) {
        // bf_values = array with last part of class name css string
        // indexing is [100s, 10s, 1s]
        // eg: ['', '_back', '_front'] is 100s:default, 10s:back, 1s:front
        // where default=white, front=light_blue, back=light_grey
        console.log('layoutColumnHighlight(bf_values)');
        var class_100 = 'number_column' + bf_values[0];
        var class_10 = 'number_column' + bf_values[1];
        var class_1 = 'number_column' + bf_values[2];
        var bool_100 = bf_values[0] === '_front';
        var bool_10  = bf_values[1] === '_front';
        var bool_1   = bf_values[2] === '_front';
        mydoc.getElementById('asm_col100').className.baseVal = class_100;
        mydoc.getElementById('asm_col10').className.baseVal = class_10;
        mydoc.getElementById('asm_col1').className.baseVal = class_1;
        layoutPlaceholderBkgs(bool_100, bool_10, bool_1);
    }
    
    // set 4 answer values in ASM grid using values from answers[level_done]
    function layoutAnswerButtons() {
        console.log('layoutAnswerButtons()');
        console.log(answers, 'answers');
        console.log(level_done, 'level_done');
        var i = 0;
        var len = answers[level_done].length;
        for (i=0; i<len; i++) {
            layoutAnswerNumber(answers[level_done][i], i);
        }
    }

    // set an answer svg path and x/y position (tricky) to the value arg
    function layoutAnswerNumber(answer, index) {
        console.log('layoutAnswerNumber(answer, index)', answer, index);
        // index in 0-base, left starting ref to answer box
        console.log(mod_lo, 'mod_lo');
        var id0 = mydoc.getElementById(mod_lo + '_answer_b' + index + '_0');
        var id1 = mydoc.getElementById(mod_lo + '_answer_b' + index + '_1');
        var id2 = mydoc.getElementById(mod_lo + '_answer_b' + index + '_2');
        var tform = mod_lo + '_answer_digit';
        // ans0=hundreds, ans1=tens, ans2=ones (zero indexed from left col)
        var ans0 = parseInt(answer/100, 10); // can be zero if 2-digits
        var ans1 = parseInt(answer/10, 10) % 10; // can be zero if 1digit
        var ans2 = answer % 10;
        // need to change position of each number to center inside answer rect
        var xpos_triple = RMM_SymsNums.getXpos(mod_lo).triple;
        var xpos_double = RMM_SymsNums.getXpos(mod_lo).double;
        var xpos_single = RMM_SymsNums.getXpos(mod_lo).single;
        // reset 100s and 10s in case they are zero
        id0.innerHTML = '';
        id1.innerHTML = '';
        // reset y attribute in case id was used for minus sign (y=340)
        if (module != 'm2' && module != 'd3') {
            id1.setAttribute('y', 520);
        }
        // negative number (will be single digit)
        // only used by ASM never M2 or LD
        if (answer < 0) {
            id1.setAttribute('x', xpos_double[index][0]);
            id2.setAttribute('x', xpos_double[index][1]);
            id1.setAttribute('y', 340);
            id1.innerHTML = pathTransform(getSyms('minus'), 'asm_answer_neg_sign');
            id2.innerHTML = pathTransform(getNums(Math.abs(ans2)), tform);
            return;
        }
        // 3-digit answer
        if (ans0) {
            id0.setAttribute('x', xpos_triple[index][0]);
            id1.setAttribute('x', xpos_triple[index][1]);
            id2.setAttribute('x', xpos_triple[index][2]);
            id0.innerHTML = pathTransform(getNums(ans0), tform + '_triple');
            id1.innerHTML = pathTransform(getNums(ans1), tform + '_triple');
            id2.innerHTML = pathTransform(getNums(ans2), tform + '_triple');
            return;
        }
        // 2-digit answer
        if (ans1 || ans0) { // allow for something like 102 (ans0 !== 0)
            id1.setAttribute('x', xpos_double[index][0]);
            id2.setAttribute('x', xpos_double[index][1]);
            id1.innerHTML = pathTransform(getNums(ans1), tform);
            id2.innerHTML = pathTransform(getNums(ans2), tform);
            return;
        }
        // 1-digit answer
        id2.setAttribute('x', xpos_single[index][0]);
        id2.innerHTML = pathTransform(getNums(ans2), tform);
        return;
    }

    // set all the ASM answer box value paths to blank ('')
    function layoutAnswerButtonValuesHide() {
        mydoc.getElementById(module + '_answer_b0_0').innerHTML = '';
        mydoc.getElementById(module + '_answer_b0_1').innerHTML = '';
        mydoc.getElementById(module + '_answer_b0_2').innerHTML = '';
        mydoc.getElementById(module + '_answer_b1_0').innerHTML = '';
        mydoc.getElementById(module + '_answer_b1_1').innerHTML = '';
        mydoc.getElementById(module + '_answer_b1_2').innerHTML = '';
        mydoc.getElementById(module + '_answer_b2_0').innerHTML = '';
        mydoc.getElementById(module + '_answer_b2_1').innerHTML = '';
        mydoc.getElementById(module + '_answer_b2_2').innerHTML = '';
        mydoc.getElementById(module + '_answer_b3_0').innerHTML = '';
        mydoc.getElementById(module + '_answer_b3_1').innerHTML = '';
        mydoc.getElementById(module + '_answer_b3_2').innerHTML = '';
    }

    // initialize column placeholders paths = 100s, 10s, 1s && set default bkgd
    function layoutPlaceholders() {
        console.log('layoutPlaceholders()');
        var num1 = pathTransform(getNums(1), 'placeholder_num');
        var num0 = pathTransform(getNums(0), 'placeholder_num');
        var sym_s = pathTransform(getSyms('s'), 'placeholder_s');
        var line = RMM_SymsNums.getSyms('line_total');
        mydoc.getElementById('asm_place_100_1').innerHTML = num1;
        mydoc.getElementById('asm_place_100_0_1').innerHTML = num0;
        mydoc.getElementById('asm_place_100_0_2').innerHTML = num0;
        mydoc.getElementById('asm_place_100_s').innerHTML = sym_s;
        mydoc.getElementById('asm_place_10_1').innerHTML = num1;
        mydoc.getElementById('asm_place_10_0').innerHTML = num0;
        mydoc.getElementById('asm_place_10_s').innerHTML = sym_s;
        mydoc.getElementById('asm_place_1_1').innerHTML = num1;
        mydoc.getElementById('asm_place_1_s').innerHTML = sym_s;
        mydoc.getElementById('asm_line_total').innerHTML = line;
        // reset bkgd rect fills
        layoutPlaceholderBkgs(false, false, false);
    }

    // set placeholder bkgds (100s, 10s, 1s) to front or default ('') className
    function layoutPlaceholderBkgs(bool_100, bool_10, bool_1) {
        console.log('layoutPlaceholderBkgs()');
        layoutPlaceholderClass(100, bool_100);
        layoutPlaceholderClass(10, bool_10);
        layoutPlaceholderClass(1, bool_1);
    }

    // set individual placeholder bkgd to front or default ('') className
    function layoutPlaceholderClass(level, front) {
        //console.log('layoutPlaceHolderBkgsASM(level, front)');
        var id = 'asm_place_' + level;
        var cname = front ? 'placeholder_front' : 'placeholder';
        mydoc.getElementById(id).className.baseVal = cname;
    }

    // set the path for the totals line in ASM grid to the line symbol
    function layoutLineTotal() {
        console.log('layoutLineTotal()');
        var line = RMM_SymsNums.getSyms('line_total');
        mydoc.getElementById('asm_line_total').innerHTML = line;
    }

    // set the right/wrong ans verdict mark for either one or all verdicts
    function layoutVerdict(index, type) {
        console.log('layoutVerdict(index, type)');
        var i = 0;
        // if index is not an integer (0-3), then we process all
        if (index !== null) {
            layoutVerdictMark(index, type);
            return;
        } else {
            for (i=0; i<4; i++) {
                layoutVerdictMark(i, type);
            }
        }
    }

    // set individual right/wrong verdict path & x/y postion
    function layoutVerdictMark(index, type) {
        //console.log('layoutVerdictMark(index, type)', index, type);
        var my_id = mod_lo + '_verdict_' + index;
        var my_tform = mod_lo + '_verdict_' + type;
        var verdict = mydoc.getElementById(my_id);
        var xydict = {};
        if (type.length === 0) {
            verdict.innerHTML =  '';
            return;
        }
        verdict.innerHTML =  pathTransform(getSyms(type), my_tform);
        my_id += '_' + type;
        xydict = getOperatorXY(my_id);
        verdict.setAttribute('x', xydict.x);
        verdict.setAttribute('y', xydict.y);
        layoutAnswerNumFill(index, '#888');
    }

    // for one (index) or all (index=null) answer box set num fill value
    function layoutAnswerNumFill(index, color) {
        console.log('layoutAnswerNumFill(index, color)');
        console.log(index, 'index');
        console.log(color, 'color');
        var i = 0;
        // if index is not an integer (0-3), then we process all
        if (index !== null) {
            mydoc.getElementById(mod_lo + '_answer_b' + index + '_0').style.fill = color;
            mydoc.getElementById(mod_lo + '_answer_b' + index + '_1').style.fill = color;
            mydoc.getElementById(mod_lo + '_answer_b' + index + '_2').style.fill = color;
        } else {
            for (i=0; i<4; i++) {
                mydoc.getElementById(mod_lo + '_answer_b' + i + '_0').style.fill = color;
                mydoc.getElementById(mod_lo + '_answer_b' + i + '_1').style.fill = color;
                mydoc.getElementById(mod_lo + '_answer_b' + i + '_2').style.fill = color;
            }
        }
    }

    // init all numbers in ASM grid = random int (for layout testing only)
    function layoutAsmNumShowValue(rand) {
        console.log('layoutAsmNumShowValue(rand)');
        var i = 0;
        var j = 0;
        var id = 'asm_num_';
        var val = null;
        for (i=0; i<3; i++) {
            for (j=0; j<3; j++) {
                if (rand) {
                    val = getNums(getRandInt(0, 10));
                } else {
                    val = '';
                }
                mydoc.getElementById(id+i+j).innerHTML = val;
                mydoc.getElementById(id+i+j).style.display = 'block';
            }
        }

    }
//
// >>> LAYOUT:End
//
// >>> --------------------------------EVENTS:Start (non-answer)
//
    // set the hover className when cursor enters an answer value box
    function answerBoxEnter(ev) {
        //console.log('answerBoxEnter(ev)');
        var id = ev.target['id'];
        var index = parseInt(id.split('_')[2].replace('b', ''), 10);
        var button = mydoc.getElementById(id);
        if (answer_active[index] && over_active) {
            if (module === 'm2') {
                button.className.baseVal = 'answer_button_hover_m2';
            } else {
                button.className.baseVal = 'answer_button_hover';
            }
        }
    }

    // reset the className for the 4 answer buttons to normal (no effects)
    function answerButtonClassReset() {
        //console.log('answerButtonClassReset');
        mydoc.getElementById(mod_lo + '_answer_b0').className.baseVal = 'answer_button';
        mydoc.getElementById(mod_lo + '_answer_b1').className.baseVal = 'answer_button';
        mydoc.getElementById(mod_lo + '_answer_b2').className.baseVal = 'answer_button';
        mydoc.getElementById(mod_lo + '_answer_b3').className.baseVal = 'answer_button';
        mydoc.getElementById(mod_lo + '_answer').style.opacity = 1.0;
    }

    // reset (off) answer box hover class when cursor enters answers svg rect
    function answerAreaEnter(ev) {
        //console.log('answerAreaEnter(ev)');
        //console.log(answer_active);
        answerButtonClassReset();
    }
//
// >>> EVENTS:End (non-answer)
//
// >>> --------------------------------DEVELOPER:start
//
    // initialize ASM grid with some value to assess layout (dev only fnc)
    function showAllASM(ev, show_note) {
        console.log('showAllASM(ev)');
        var myrand = getRandInt(0, 3);
        var col_1 = mydoc.getElementById('asm_col1');
        var col_10 = mydoc.getElementById('asm_col10');
        var col_100 = mydoc.getElementById('asm_col100');
        var note_100 = mydoc.getElementById('asm_place_100');
        var note_10 = mydoc.getElementById('asm_place_10');
        var note_1 = mydoc.getElementById('asm_place_1');
        if (myrand === 0) {
            col_1.className.baseVal = 'number_column_front';
            col_10.className.baseVal = 'number_column_back';
            col_100.className.baseVal = 'number_column_back';
            note_1.className.baseVal = 'placeholder_front';
            note_10.className.baseVal = 'placeholder';
            note_100.className.baseVal = 'placeholder';
        }
        if (myrand === 1) {
            col_1.className.baseVal = 'number_column_back';
            col_10.className.baseVal = 'number_column_front';
            col_100.className.baseVal = 'number_column_back';
            note_1.className.baseVal = 'placeholder';
            note_10.className.baseVal = 'placeholder_front';
            note_100.className.baseVal = 'placeholder';
        }
        if (myrand === 2) {
            col_1.className.baseVal = 'number_column_back';
            col_10.className.baseVal = 'number_column_back';
            col_100.className.baseVal = 'number_column_front';
            note_1.className.baseVal = 'placeholder';
            note_10.className.baseVal = 'placeholder';
            note_100.className.baseVal = 'placeholder_front';
        }
        layoutAsmNumShowValue(true);
        //if (ev === null) { return; }
        operatorSet('plus');
        layoutPlaceholders();
        layoutLineTotal();
        correct = 5;
        // answers
        answers = [[199, 99, -9, -5]];
        layoutAnswerButtons();
        responses = [answers[0], answers[1], answers[2], answers[3]];
        answer_active = [true, true, true, true];
        mydoc.getElementById('asm_bc_0_num_0').innerHTML = pathTransform(getSyms('minus'), 'borrow_carry_minus');
        mydoc.getElementById('asm_bc_0_num_1').innerHTML = pathTransform(getNums(8), 'borrow_carry_number');
        mydoc.getElementById('asm_bc_1_num_0').innerHTML = pathTransform(getNums(8), 'borrow_carry_number');
        mydoc.getElementById('asm_bc_1_num_1').innerHTML = pathTransform(getNums(9), 'borrow_carry_number');
        mydoc.getElementById('asm_bc_2_num_0').innerHTML = pathTransform(getNums(8), 'borrow_carry_number');
        mydoc.getElementById('asm_bc_2_num_1').innerHTML = pathTransform(getNums(9), 'borrow_carry_number');
        mydoc.getElementById('asm_bc_0_slash_1').innerHTML = pathTransform(getSyms('slash'), 'borrow_carry_slash');
        mydoc.getElementById('asm_bc_1_slash_1').innerHTML = pathTransform(getSyms('slash'), 'borrow_carry_slash');
        mydoc.getElementById('asm_bc_2_slash_1').innerHTML = pathTransform(getSyms('slash'), 'borrow_carry_slash');
        mydoc.getElementById('asm_bc_0_slash_num').innerHTML = pathTransform(getSyms('slash'), 'borrow_carry_slash_num');
        mydoc.getElementById('asm_bc_1_slash_num').innerHTML = pathTransform(getSyms('slash'), 'borrow_carry_slash_num');
        mydoc.getElementById('asm_bc_2_slash_num').innerHTML = pathTransform(getSyms('slash'), 'borrow_carry_slash_num');
        for (i=0; i<4; i++) {
            if (i === 1) {
                layoutVerdictMark(i, 'check');
            } else {
                layoutVerdictMark(i, 'multiply');
            }
        }
        layoutAnswerNumFill(null, '#000');
        layoutBorrowCarry([0, 1, 2], true, true);
        mydoc.getElementById('svg_asm_container').style.display = 'block';
        mydoc.getElementById('asm').style.display = 'block';
        mydoc.getElementById('asm_answer').style.display = 'block';
        if (show_note) {
            mydoc.getElementById('div_note').style.visibility = 'visible';
            console.log('hundreds in answer');
            mydoc.getElementById('b_next').innerHTML = getStr('TXT_next_10');
            mydoc.getElementById('svg_next').style.display = 'block';
        }
    }
//
// >>> DEVELOPER:end
//
// >>> --------------------------------GETSET:start
//

    // get problem_str
    function getProblemStr() {
        return problem_str;
    }

    // get level var
    function getName() {
        return name;
    }

    // set iduser
    function setIduser(iduser_in) {
        iduser = iduser_in;
    }

    // get iduser
    function getIduser() {
        return iduser;
    }

    // set name
    function setName(name_in) {
        name = name_in;
    }

    // get level var
    function getLevel() {
        return level;
    }

    // set problem using pdata input
    function setProblem(pdata) {
        console.log('setProblem(pdata)');
        console.log(pdata, 'pdata');
        hideAll();
        if (pdata.module === 'a') {
            if (pdata.digits === 1) { levelA1Init(); }
            if (pdata.digits === 2) { levelA2Init(); }
            if (pdata.digits === 3) { levelA3Init(); }
            return;
        }
        if (pdata.module === 's') {
            subborrow = pdata.subborrow;
            if (pdata.digits === 1) { levelS1Init(); }
            if (pdata.digits === 2) { levelS2Init(); }
            if (pdata.digits === 3) { levelS3Init(); }
            if (pdata.subneg_pct ) {
                subneg_pct = parseFloat(pdata.subneg_pct / 10, 10);
            }
        }
        if (pdata.module === 'm') {
            m1_digit = pdata.m1_digit;
            m1_order = pdata.m1_order === 'ordered';
            m1_row1_min = pdata.m1_row1_min;
            m1_row1_max = pdata.m1_row1_max;
            // need to set m1_order_count to -1 when initiating an m1 problem
            // because first step in levelM1Problem() is to increment by one
            // to get next ordered value
            m1_order_count = m1_row1_min - 1;
            RMM_M2.setCounters();
            levelM1Init();
        }
        if (pdata.module === 'm2b') {
            module = 'm2';
            RMM_MENU.setNextProblemOnclickM2(RMM_M2.nextM2Equation);
            RMM_M2.setLevel('m2b');
            RMM_M2.setCounters();
            RMM_M2.nextM2Equation();
        }
        if (pdata.module === 'm2c') {
            module = 'm2';
            RMM_MENU.setNextProblemOnclickM2(RMM_M2.nextM2Equation);
            RMM_M2.setLevel('m2c');
            RMM_M2.setCounters();
            RMM_M2.nextM2Equation();
        }
        if (pdata.module === 'd3') {
            module = 'd3';
            RMM_MENU.setNextProblemOnclickD3(RMM_D3.nextD3Equation);
            RMM_D3.setCounters();
            RMM_D3.setEquationVars(pdata);
            RMM_D3.nextD3Equation();
        }
    }

    // set any of the notes control vars based on input received
    function setToggleNotes(id, is_on) {
        console.log('setToggleNotes(id, is_on) = ', id, is_on);
        if (id === 'b_tog_numpos') { shnote_numpos = is_on; }
        if (id === 'b_tog_next') { shnote_next = is_on; }
        if (id === 'b_tog_carry') { shnote_carry = is_on; }
        if (id === 'b_tog_chunk') { shnote_chunk = is_on; }
        if (id === 'b_tog_borrow') { shnote_borrow = is_on; }
        if (id === 'b_tog_bpopup') { shnote_bpopup = is_on; }
    }

    // set module to control what answers are operated on
    function setModule(mod_in) {
        console.log('setModule(mod_in)', mod_in);
        module = mod_in;
        mod_lo = module.toLowerCase();
    }

    function getModule() {
        return module;
    }

    // set answers array for index position 0 only
    function setAnswers(array_in) {
        console.log('setAnswers(array_in)');
        answers = [];
        answers.push(array_in);
    }

    // set level_done
    function setLevelDone(val) {
        console.log('setLevelDone(val)');
        level_done = val;
    }

    // set correct
    function setCorrect(val) {
        console.log('setCorrect(val)');
        correct = val;
    }

    // set complete
    function setComplete(val) {
        console.log('setComplete(val)');
        complete = val;
    }

    // set printmode
    function setPrintmode(val) {
        printmode = val;
    }

    //set session
    function setSessionCount() {
    session = Date.now();
    count_problem = 0; // count is incremented at problem init
    }

    // get printmode
    function getPrintmode() {
        return printmode;
    }

    // return true if Guest iduser is active
    function getGuestActive() {
        console.log('getGuestActive()');
        return iduser === RMM_DB.getIDGUEST();
    }
//
// >>> GETSET:end
//
// >>> --------------------------------OKTODEL:start
//
    function OKTODEL_ClickReset(ev) {
        console.log('OKTODEL_ClickReset()', '--------------------------------------------------');
        subneg_pct = 0.2;
        m1_digit = 9;
        m1_order = false;
        m1_order_count = 9;
        m1_row1_max = 20;
        m1_row1_min = 10;
        levelA2Init();
    }

//
// >>> OKTODEL:end
//
    return {
        init : init,
        hideAll : hideAll,
        showAnimationBox : showAnimationBox,
        answerBoxEnter : answerBoxEnter,
        answerAreaEnter : answerAreaEnter,
        answerClick : answerClick,
        OKTODEL_ClickReset : OKTODEL_ClickReset,
        blockAllClick : blockAllClick,
        showAllASM : showAllASM,
        pathTransform : pathTransform,
        printProblemSetup : printProblemSetup,
        getProblemStr : getProblemStr,
        chunkShow : chunkShow,
        getRandInt : getRandInt,
        layoutAnswerButtons : layoutAnswerButtons,
        layoutVerdict: layoutVerdict,
        layoutAnswerNumFill : layoutAnswerNumFill,
        answerButtonClassReset : answerButtonClassReset,
        setResponsesAnswersActive : setResponsesAnswersActive,
        chunkHtml : chunkHtml,
        showNotesSetValues : showNotesSetValues,
        showNotesSetHtml : showNotesSetHtml,
        levelA1Init : levelA1Init, // remove after debugging display m2 issues
        //async
        initReadUserLast : initReadUserLast,
        initSetupDBSet : initSetupDBSet,
        // getter & setters
        setProblem : setProblem,
        setIduser : setIduser,
        getIduser : getIduser,
        setName : setName,
        getLevel : getLevel,
        getName : getName,
        getGuestActive : getGuestActive,
        setToggleNotes : setToggleNotes,
        setModule : setModule,
        getModule : getModule,
        setAnswers : setAnswers,
        setLevelDone : setLevelDone,
        setCorrect : setCorrect,
        setComplete : setComplete,
        getPrintmode : getPrintmode,
        setPrintmode : setPrintmode,
        setSessionCount : setSessionCount
    };
})();
