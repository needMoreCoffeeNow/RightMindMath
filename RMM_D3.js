var RMM_D3 = (function() {
    var mydoc = window.document;
    var module = 'd3';
    var session = Date.now(); // keypath id for indexedDB idsession
    var problem_str = ''; // problem as delimited string
    var count_problem = 0; // unique counters added to idsession per problem
    var chunk_counter = 0; // count number of times chunk clicked during equation
    var time_start = -1; // -1 designates first equation else Date.now()
    var bkgds_rows = 8; // used to block change bkgds for m2 or d3
    var bkgds_cols = 4; // used to block change bkgds for m2 or d3
    var step = 0; // place keeper for process
    var step_max = 9; // exit process control
    var eqz = {}; // will store the divisor, dividend, and quotient values
    var correct = 0; // process step correct answer
    var answers = []; // array of correct + 3 possibles for user choice
    var subval0 = 0; // top number in subtraction step
    var subval1 = 0; // bottom number in subtraction step
    var subval2 = 0; // answer to substraction step
    var cols_active = []; // the active columns for subtraction
    var decimal_pct = 0; // pct as int (0, 25, 50, 75, 100) for decimal quotient
    var divisor_pct = 0; // pct as int (0, 25, 50, 75, 100) for 2-digit divisor
    var process = {
        'step_00' : step00,
        'step_01' : step01,
        'step_02' : step02,
        'step_03' : step03,
        'step_04' : step04,
        'step_05' : step05,
        'step_06' : step06,
        'step_07' : wrap07
    };
    // function aliases
    function getStr(id) { return RMM_CFG.getStr(id); }
    function getNums(id) { return RMM_SymsNums.getNums(id); }
    function getSyms(id) { return RMM_SymsNums.getSyms(id); }
    function getTransforms(id) { return RMM_SymsNums.getTransforms(id); }
    function getRandInt(min, max) { return RMM_ASM.getRandInt(min, max); }
    function numAtIndex(num_in, index) { return RMM_M2.numAtIndex(num_in, index); }
    // from M2
    function lo_bkgdNumsSet(ids_in, class_str) { return RMM_M2.lo_bkgdNumsSet(ids_in, class_str); }
//
// >>> EQUATION:start
//

    // return decimal part of number after place position
    function decimalStrip(val, place) {
        // if place=10 and val=123.456 return 56 (decimal part after 10s place)
        return (val * place) - parseInt((val * place), 10);
    }

    // package equation components into a dict
    function pkgEq(dr, dd, qt, dc) {
        console.log('pkgEq(dr, dd, qt, dc)');
        var dict = {
            'divisor' : dr,
            'dividend' : dd,
            'quotient' : qt,
            'decimal' : dc
        };
        return dict;
    }

    function findDecimalEq(digits) {
        console.log('findDecimalEq(digits)');
        var tries = 0;
        var todo = true;
        var decimal = 0;
        var quotient = 0;
        var divisor = 0;
        var dividend = 0;
        var check = 0;
        if ([1, 10].indexOf(digits) === -1) { return {}; }
        while (todo && tries < 1000) {
            tries += 1;
            if (digits === 10) {
                divisor = RMM_ASM.getRandInt(10, 100);
            } else {
                divisor = RMM_ASM.getRandInt(1, 10);
            }
            decimal = RMM_ASM.getRandInt(1, 10) / 10;
            if (digits === 10) {
                quotient = RMM_ASM.getRandInt(10, 100) + decimal;
            } else {
                quotient = RMM_ASM.getRandInt(1, 100) + decimal;
            }
            dividend = divisor * quotient;
            if (parseInt(dividend, 10) != dividend) { continue }
            if (dividend > 999.9 || dividend < 100) { continue; }
            check = decimalStrip(dividend, 10) * 10;
            if (decimalStrip(check, 10) !== 0) { continue; }
            todo = false;

        }
        return pkgEq(divisor, dividend, quotient, decimal);
    }

    function findNotDecimalEq(dr_two) {
        console.log('findNotDecimalEq(dr_two)');
        var divisor = 0;
        var dividend = 0;
        var quotient = 0;
        var todo = true;
        var tries = 0;
        while (todo && tries < 1000) {
            if (dr_two) {
                divisor = getRandInt(10, 100);
            } else {
                divisor = getRandInt(2, 10);
            }
            dividend = getRandInt(100, 1000);
            quotient = dividend / divisor;
            if (decimalStrip(quotient, 1) === 0) { todo = false; }
            tries += 1;
        }
        return pkgEq(divisor, dividend, quotient, 0);
    }

    // create concatenated str with user/prob/ans data & push() it is testing
    function recordAnswer() {
        console.error('recordAnswer()');
        var time_stop = Date.now();
        var data = {'idsession' : '' + session + '_' + count_problem};
        var r_str = '';
        var tic = '^';
        var iduser = RMM_ASM.getIduser();
        console.log(RMM_ASM.getGuestActive());
        if (RMM_ASM.getGuestActive()) { return; }
        data['iduser'] = iduser;
        data['idlevel'] = module;
        data['device_iduser'] = RMM_DB.getDevice() + '_' + iduser;
        data['tstamp'] = time_stop;
        data['time'] = time_stop - time_start;
        data['elapsed'] = time_stop - time_start;
        r_str += module;
        r_str += tic + eqz.dividend + '/' + eqz.divisor;
        r_str += tic + chunk_counter;
        data['r_str'] = r_str;
        console.log('%c' + r_str, 'color:#009933;');
        RMM_DB.addSessionRec(data);
    }

    function equationSetup() {
        console.log('equationSetup()');
        var is_dec = false;
        var dr_two = false;
        // set divisor number of digits and decimal answer
        if (divisor_pct > 0) { dr_two = getRandInt(0, 100) <= divisor_pct; }
        if (decimal_pct > 0) { is_dec = getRandInt(0, 100) <= decimal_pct; }
        // one digit no decimal is easy
        if (is_dec) {
            if (dr_two) {
                eqz = findDecimalEq(10);
            } else {
                eqz = findDecimalEq(1);
            }
        } else {
                eqz = findNotDecimalEq(dr_two);
        }
        //eqz = {'divisor':2, 'dividend':353, 'quotient':176, 'decimal':5};
        //eqz = {'divisor':14, 'dividend':777, 'quotient':55, 'decimal':5};
        //eqz = {'divisor':92, 'dividend':460, 'quotient':5, 'decimal':0};
        //eqz = {'divisor':90, 'dividend':468, 'quotient':5, 'decimal':2};
        //eqz = {'divisor':5, 'dividend':487, 'quotient':97, 'decimal':4};
        //eqz = {'divisor':55, 'dividend':781, 'quotient':14, 'decimal':2};
        eqz = {'divisor':15, 'dividend':384, 'quotient':25, 'decimal':6};
    }

    // start a long division problem
    function nextD3Equation() {
        console.warn('nextD3Equation');
        console.warn('nextD3Equation');
        console.warn('nextD3Equation');
        console.warn('nextD3Equation');
        console.warn('nextD3Equation');
        // some housekeeping first to setup M2 controllers
        RMM_M2.setModule('d3');
        RMM_M2.setBkgdsRowsCols(bkgds_rows, bkgds_cols);
        equationSetup();
        // kludge: nextM2Equation 1st so M2_container renders properly
        //////RMM_M2.setModule('m2'); // kludge
        //RMM_M2.nextM2Equation(); // kludge
        RMM_M2.showAllM2(); // kludge needed else positions all messed up
        //////RMM_M2.setModule('d3');
        RMM_ASM.setModule('d3');
        // now layout equation
        mydoc.getElementById('div_m2_instruct_container').style.marginTop = '-400px';
        time_start = Date.now();
        chunk_counter = 0;
        count_problem += 1;
        console.log(time_start, 'time_start');
        step = 0;
        nextStep();
        //showAllD3();
    }

    // return the number path with transform
    function numPath(num, place) {
        //console.log('numPath(num, place)', num, place);
        var tform = getTransforms('d3_number');
        var path = getNums(numAtIndex(num, place));
        return path.replace('/>', ' ' + tform + '/>');
    }

    // use random percentiles around correct answer to fill out answers
    function answersArrayFill() {
        console.log('answersArrayFill()', correct, 'correct');
        var i = 0;
        var len = 3;
        var slot = -1; // will have the available answers index to fill
        var todo = true;
        var alt = 0;
        var factor = 0;
        var sign = 1;
        var tries = 0;
        var found = {};
        answers = [null, null, null, null];
        answers[getRandInt(0, 4)] = correct;
        for (i=0; i<len; i++) {
            slot = findAnswersSlot();
            if (slot === null) {
                alert('could not find answer slot');
                continue;
            }
            todo = true;
            tries = 0;
            while (todo && tries < 20) {
                tries += 1;
                sign = getRandInt(0, 2) === 1 ? 1 : -1;
                factor = getRandInt(1, 8);
                alt = correct + (factor * sign);
                if (found[alt]) { continue; }
                if (alt > 0 && alt < 10) {
                    todo = false;
                    found[alt] = true;
                }
            }
            answers[slot] = alt;
        }
    }

    // find the first of three possible answers array slots to fill
    function findAnswersSlot() {
        console.log('findAnswersSlot()');
        var i = 0;
        var len = answers.length;
        for (i=0; i<len; i++) {
            if (answers[i] === null) { return i; }
        }
        return null;
    }

    // setup the answers using RMM_ASM functions
    function answersSetup() {
        console.log('answersSetup()');
        RMM_ASM.setModule('d3');
        RMM_ASM.setAnswers(answers);
        RMM_ASM.setLevelDone(0);
        RMM_ASM.answerButtonClassReset();
        RMM_ASM.layoutAnswerButtons();
        RMM_ASM.setResponsesAnswersActive();
        RMM_ASM.layoutVerdict(null, ''); // empty string blanks verdict
        //layoutAnswerNumFill must follow layoutVerdict
        RMM_ASM.layoutAnswerNumFill(null, '#000');
    }

    // set answers (final processing at the end of each process step
    function asmAnswerSetup() {
        console.log('asmAnswerSetup()');
        RMM_ASM.setCorrect(correct);
        RMM_ASM.setComplete(false);
        answersArrayFill();
        answersSetup();
        lo_setStyleDisplay('m2_answer', 'block');
    }

    // display chunk message after button click
    function chunkShow(ev) {
        console.log('chunkShow(ev)');
        chunk_counter += 1;
        lo_setStyleDisplay('div_chunkit', 'block');
    }

    // check if chunk needed & generate chunk html with button and chunk text
    function chunkHtml(font_pct) {
        console.log('-----------------------------------------------------------chunkHtml(col, font_pct)');
        console.log('-----------------------------------------------------------chunkHtml(col, font_pct)');
        console.log('-----------------------------------------------------------chunkHtml(col, font_pct)');
        console.log('-----------------------------------------------------------chunkHtml(col, font_pct)');
        console.log(eqz.divisor, correct, subval0);
        var tens = parseInt(eqz.divisor / 10, 10) * 10;
        var ones = eqz.divisor % 10;
        var txt = '';
        if (correct * eqz.divisor < 11 || step % 2 !== 0) {
            console.log('no chunk');
            mydoc.getElementById('div_m2_chunk').style.visibility = 'hidden';
            return;
        }
        console.log(ones, 'ones', tens, 'tens', correct, 'correct', eqz.divisor, 'divisor');
        txt = '<button class="chunk" '
        txt += 'onclick="RMM_D3.chunkShow(event);">'
        txt += getStr('TXT_chunk_it') + '</button>';
        txt += '<div id="div_chunkit" style="margin-top:10px;display:none;';
        txt += 'font-size:' + font_pct + '%;">';
        //txt += '<hr style="border: 1px solid black;">';
        txt += '&nbsp;';
        txt += (tens * correct);
        txt += '&nbsp;=&nbsp;' + correct + '&nbsp;x&nbsp;' + tens;
        txt += '<br>&nbsp;';
        txt += (ones * correct);
        txt += '&nbsp;=&nbsp;' + correct + '&nbsp;x&nbsp;' + ones;
        txt += '<br><span style="color:#cc0000;">';
        txt += subval2 + '&nbsp;=&nbsp;' + getStr('TXT_Remainder');
        txt += '&nbsp;[&nbsp;' + subval0 + '&nbsp;-&nbsp;(';
        txt += (tens * correct) + '&nbsp;+&nbsp;' + (ones * correct);
        txt += ')&nbsp;]</span>';
        txt += '</div>';
        console.warn(txt);
        lo_setInnerHtml('div_m2_chunk', txt);
        mydoc.getElementById('div_m2_chunk').style.visibility = 'visible';
        //////lo_setStyleDisplay('div_m2_chunk', 'block');
    }

    // setup a print problem such that the problem_str is available
    function printProblemSetup() {
        console.log('printProblemSetup()');
        equationSetup();
        problem_str = '';
        problem_str += eqz.divisor + '|';
        problem_str += eqz.dividend + '|';
        problem_str += eqz.quotient + '|';
        problem_str += eqz.decimal + '|';
        problem_str += '/';
    }
//
// >>> EQUATION:end
//
//
// >>> PROCESS:start
//

    // wrap07 is done only as last part of decimal answer
    function wrap07() {
        console.log('wrap07()');
        var fnum = correct * eqz.divisor;
        var txt = getStr('D3_wrap_07');
        recordAnswer();
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        lo_setStyleDisplay('m2_answer', 'none');
        lo_divisorToggle('r2white');
        lo_bkgdNumsSet('', 'r2white');
        lo_setInnerHtml('d3_num03', numPath(eqz.decimal, 1));
        txt = txt.replace('REPLACE_num0', ''+subval0);
        txt = txt.replace('REPLACE_num1', ''+eqz.divisor);
        txt = txt.replace('REPLACE_num2', ''+eqz.decimal);
        lo_setInnerHtml('div_m2_step', txt);
    }

    // step06 (only occurs when decimal answer)
    function step06() {
        console.log('step06()');
        console.log('----------------------------------------------------------------step06()');
        console.log('----------------------------------------------------------------step06()');
        console.log('----------------------------------------------------------------step06()');
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        var bkgds = '';
        var txt = getStr('D3_06');
        var bkgds = '72.73.03';
        var down = -1;
        if (eqz.decimal === 0) {
            wrap05();
            return;
        }
        // initiale layout
        lo_divisorToggle('r2bkgd');
        lo_bkgdNumsSet('', 'r2white');
        lo_setInnerHtml('d3_num02', numPath(eqz.quotient, 1));
        lo_setInnerHtml('d3_num72', numPath(subval2, 1));
        lo_setInnerHtml('d3_num73', numPath(0, 1));
        correct = eqz.decimal;
        subval0 = subval2 * 10;
        subval1 = eqz.decimal * eqz.divisor;
        subval2 = subval0 - subval1;
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        lo_bkgdNumsSet(bkgds, 'r2bkgd');
        // instruction text
        txt = txt.replace('REPLACE_step', ''+(step+1));
        txt = txt.replace('REPLACE_num0', ''+eqz.divisor);
        txt = txt.replace('REPLACE_num1', ''+subval0);
        lo_setInnerHtml('div_m2_step', txt);
        // answers array
        asmAnswerSetup();
        dynamicMultiply();
    }

    // wrap05
    function wrap05() {
        console.log('wrap05()');
        console.log('----------------------------------------------------------------wrap05()');
        console.log('----------------------------------------------------------------wrap05()');
        console.log('----------------------------------------------------------------wrap05()');
        var fnum = correct * eqz.divisor;
        var txt = getStr('D3_wrap');
        recordAnswer();
        lo_setStyleDisplay('m2_answer', 'none');
        lo_divisorToggle('r2white');
        lo_bkgdNumsSet('', 'r2white');
        lo_setStyleDisplay('d3_line_3', 'block');
        if (eqz.decimal === 0) {
            lo_setInnerHtml('d3_num02', numPath(eqz.quotient, 1));
            lo_setInnerHtml('d3_num51', numPath(fnum, 10));
            lo_setInnerHtml('d3_num52', numPath(fnum, 1));
            lo_setInnerHtml('d3_num61', numPath(fnum, 10));
            lo_setInnerHtml('d3_num62', numPath(fnum, 1));
            lo_setInnerHtml('d3_num72', numPath(0, 1));
        }
        console.log(eqz.decimal, eqz.quotient, 'check');
        if (eqz.decimal > 0 && eqz.quotient < 100) {
            lo_setInnerHtml('d3_num03', numPath(eqz.decimal, 1));
            lo_setInnerHtml('d3_num62', numPath(fnum, 10));
            lo_setInnerHtml('d3_num63', numPath(fnum, 1));
            lo_setInnerHtml('d3_num73', numPath(0, 1));
            console.log('here', subval1, subval1 > 99)
            if (subval1 > 99) {
                console.log('yep');
                lo_setInnerHtml('d3_num61', numPath(subval1, 100));
            }
        }
        lo_setInnerHtml('div_m2_step', txt);
    }

    // step six
    function step05() {
        console.log('----------------------------------------------------------------step05()');
        console.log('----------------------------------------------------------------step05()');
        console.log('----------------------------------------------------------------step05()');
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        var bkgds = '';
        var txt = getStr('D3_05');
        var bkgds = '51.52.61.62';
        var down = -1;
        if (eqz.decimal === 0 || (eqz.quotient < 100 && eqz.decimal > 0)) {
            wrap05();
            return;
        }
        lo_setStyleDisplay('d3_line_3', 'block');
        // initiale layout
        dynamicSubtract();
        lo_setInnerHtml('d3_num02', numPath(eqz.quotient, 1));
        correct = subval2;
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        lo_bkgdNumsSet(bkgds, 'r2bkgd');
        // instruction text
        txt = txt.replace('REPLACE_step', ''+(step+1));
        txt = txt.replace('REPLACE_num0', ''+subval0);
        txt = txt.replace('REPLACE_num1', ''+subval1);
        lo_setInnerHtml('div_m2_step', txt);
        // answers array
        asmAnswerSetup();
    }

    // step five need to handle equation where this is decimal step
    function step04d() {
        console.log('step04d()');
        console.log('----------------------------------------------------------------step04d()');
        console.log('----------------------------------------------------------------step04d()');
        console.log('----------------------------------------------------------------step04d()');
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        var bkgds = '';
        var txt = getStr('D3_04d');
        var bkgds = '52.53.03';
        // initiale layout
        lo_divisorToggle('r2bkgd');
        lo_bkgdNumsSet('', 'r2white');
        lo_setInnerHtml('d3_num52', numPath(subval2, 1));
        lo_setInnerHtml('d3_num53', numPath(0, 1));
        if (subval2 > 9) {
            lo_setInnerHtml('d3_num51', numPath(subval2, 10));
            bkgds += '.51';
        }
        correct = eqz.decimal;
        subval0 = subval2 * 10;
        subval1 = eqz.decimal * eqz.divisor;
        subval2 = subval0 - subval1;
        lo_bkgdNumsSet(bkgds, 'r2bkgd');
        // instruction text
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        console.log(eqz);
        txt = txt.replace('REPLACE_step', ''+(step+1));
        txt = txt.replace('REPLACE_num0', ''+eqz.divisor);
        txt = txt.replace('REPLACE_num1', ''+subval0);
        lo_setInnerHtml('div_m2_step', txt);
        // answers array
        asmAnswerSetup();
        dynamicMultiply();
    }

    // step five
    function step04() {
        console.log('----------------------------------------------------------------step04()');
        console.log('----------------------------------------------------------------step04()');
        console.log('----------------------------------------------------------------step04()');
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        var bkgds = '';
        var txt = getStr('D3_04');
        var bkgds = '51.52';
        var down = numAtIndex(eqz.dividend, 1);
        if (eqz.decimal > 0 && eqz.quotient < 100) {
            step04d();
            return;
        }
        lo_divisorToggle('r2bkgd');
        lo_bkgdNumsSet('', 'r2white');
        lo_setInnerHtml('d3_num52', numPath(down, 1));
        subval0 = down;
        subval0 += subval2 * 10;
        lo_setInnerHtml('d3_num51', numPath(subval2, 1));
        correct = parseInt(subval0 / eqz.divisor, 10);
        subval1 = correct * eqz.divisor;
        subval2 = subval0 - subval1;
        lo_bkgdNumsSet(bkgds, 'r2bkgd');
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        // instruction text
        txt = txt.replace('REPLACE_step', ''+(step+1));
        txt = txt.replace('REPLACE_num0', ''+down);
        txt = txt.replace('REPLACE_num1', ''+eqz.divisor);
        txt = txt.replace('REPLACE_num2', ''+subval0);
        lo_setInnerHtml('div_m2_step', txt);
        // answers array
        asmAnswerSetup();
        dynamicMultiply();
    }

    function dynamicSubtract() {
        console.log('----------------------------------------------------------------dynamicSubtract()');
        console.log('----------------------------------------------------------------dynamicSubtract()');
        console.log('----------------------------------------------------------------dynamicSubtract()');
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        console.log(eqz);
        var bkgds = '';
        var path = '';
        var id = '';
        var row = step;
        var i = 0;
        var len = 0;
        mydoc.getElementById('div_m2_chunk').style.visibility = 'hidden';
        colsActiveSet();
        len = cols_active.length;
        lo_divisorToggle('r2white');
        for (i=0; i<len; i++) {
            console.log('---', i, '---');
            if (bkgds.length > 0) { bkgds += '.'; }
            bkgds += '' + row + cols_active[i] + '.';
            console.log(bkgds);
            bkgds += '' + (row + 1) + cols_active[i] + '.';
            console.log(bkgds);
            bkgds += '' + (row + 2) + cols_active[i];
            console.log(bkgds);
        }
        console.log('---');
        console.log('---');
        console.log('---');
        console.log('---');
        console.log('---');
        for (i=0; i<len; i++) {
            console.log('---', i, '---');
            id = 'd3_num' + (row + 1) + cols_active[i];
            console.log(id, 'id', row, i, 'i');
            path = numPath(subval1, (Math.pow(10, i)));
            lo_setInnerHtml(id, path);
        }
        console.warn(bkgds, 'bkgds');
        lo_bkgdNumsSet(bkgds, 'r2bkgd');
    }

    // wrap03
    function wrap03() {
        console.log('wrap03()');
        var fnum = correct * eqz.divisor;
        var txt = getStr('D3_wrap');
        recordAnswer();
        console.log(eqz);
        lo_setStyleDisplay('m2_answer', 'none');
        lo_divisorToggle('r2white');
        lo_bkgdNumsSet('', 'r2white');
        lo_setStyleDisplay('d3_line_2', 'block');
        if (eqz.decimal === 0) {
            console.log('no decimal');
            lo_setInnerHtml('d3_num02', numPath(eqz.quotient, 1));
            lo_setInnerHtml('d3_num41', numPath(fnum, 10));
            lo_setInnerHtml('d3_num42', numPath(fnum, 1));
            lo_setInnerHtml('d3_num52', numPath(0, 1));
        } else {
            fnum = eqz.decimal * eqz.divisor;
            console.log('yes decimal');
            lo_setInnerHtml('d3_num03', numPath(eqz.decimal, 1));
            lo_setInnerHtml('d3_num43', numPath(fnum, 1));
            lo_setInnerHtml('d3_num42', numPath(fnum, 10));
            if (fnum > 99) {
                lo_setInnerHtml('d3_num41', numPath(fnum, 100));
            }
            lo_setInnerHtml('d3_num53', numPath(0, 1));
        }
        lo_setInnerHtml('div_m2_step', txt);
    }

    // step four
    function step03() {
        console.log('----------------------------------------------------------------step03()');
        console.log('----------------------------------------------------------------step03()');
        console.log('----------------------------------------------------------------step03()');
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2', currentCol(), 'col')
        console.log(eqz);
        var bkgds = '';
        var txt = getStr('D3_03');
        var bkgds = '30.31.41';
        var down = -1;
        lo_setStyleDisplay('d3_line_2', 'block');
        if (eqz.decimal === 0 && eqz.quotient < 100) {
            wrap03();
            return;
        }
        if (eqz.decimal !== 0 && eqz.quotient < 10) {
            wrap03();
            return;
        }
        dynamicSubtract();
        if (eqz.divisor > 9 || eqz.quotient < 100) {
            lo_setInnerHtml('d3_num02', numPath(correct, 1));
        } else {
            lo_setInnerHtml('d3_num01', numPath(eqz.quotient, 10));
        }
        correct = subval2;
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        // instruction text
        txt = txt.replace('REPLACE_step', ''+(step+1));
        txt = txt.replace('REPLACE_num0', ''+subval0);
        txt = txt.replace('REPLACE_num1', ''+subval1);
        lo_setInnerHtml('div_m2_step', txt);
        // answers array
        asmAnswerSetup();
    }

    // step three
    function step02() {
        console.log('----------------------------------------------------------------step02()');
        console.log('----------------------------------------------------------------step02()');
        console.log('----------------------------------------------------------------step02()');
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2');
        console.log(eqz);
        var txt = getStr('D3_02');
        var down = -1;
        lo_divisorToggle('r2bkgd');
        lo_setStyleDisplay('d3_line_1', 'block');
        if (eqz.quotient < 10) {
            down = 0;
        }
        if (eqz.quotient < 100 && eqz.quotient > 9) {
            down = numAtIndex(eqz.dividend, 1);
        }
        if (eqz.quotient > 99 && eqz.quotient > 9) {
            down = numAtIndex(eqz.dividend, 10);
        }
        subval0 = (subval2 * 10) + down;
        if (subval0 === 0) {
            corrrect = 0;
        } else {
            correct = parseInt(subval0 / eqz.divisor, 10);
        }
        subval2 = subval0 - (correct * eqz.divisor);
        subval1 = subval0 - subval2;
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        // instruction text
        txt = txt.replace('REPLACE_step', ''+(step+1));
        txt = txt.replace('REPLACE_num0', ''+down);
        txt = txt.replace('REPLACE_num1', ''+eqz.divisor);
        txt = txt.replace('REPLACE_num2', ''+subval0);
        lo_setInnerHtml('div_m2_step', txt);
        // answers array
        asmAnswerSetup();
        dynamicMultiply();
    }

    // wrap01 occurs when two digit divisors goes into quotient < 10 times
    function wrap01() {
        console.log('wrap01()');
        var fnum = eqz.quotient * eqz.divisor;
        var txt = getStr('D3_wrap');
        recordAnswer();
        lo_setStyleDisplay('m2_answer', 'none');
        lo_divisorToggle('r2white');
        lo_bkgdNumsSet('', 'r2white');
        lo_setInnerHtml('d3_num02', numPath(eqz.quotient, 1));
        lo_setInnerHtml('d3_num20', numPath(fnum, 100));
        lo_setInnerHtml('d3_num21', numPath(fnum, 10));
        lo_setInnerHtml('d3_num22', numPath(fnum, 1));
        lo_setInnerHtml('d3_num32', numPath(0, 1));
        lo_setInnerHtml('div_m2_step', txt);

    }

    function colsActiveSet() {
        console.log('colsActiveSet()');
        var col = currentCol();
        var len = numLength(subval0);
        var i = 0;
        console.log(col, 'col');
        cols_active = [];
        for (i=0; i<len; i++) {
            cols_active.push(col - i);
        }
        console.error(cols_active, 'cols_active');
        return cols_active;
    }

    // step two
    function step01() {
        console.log('----------------------------------------------------------------step01()');
        console.log('----------------------------------------------------------------step01()');
        console.log('----------------------------------------------------------------step01()');
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2', currentCol(), 'col')
        console.log(eqz);
        var txt = getStr('D3_01');
        lo_divisorToggle('r2white');
        lo_setStyleDisplay('d3_line_1', 'block');
        if (eqz.quotient < 10 && !eqz.decimal) {
            wrap01();
            return;
        }
        dynamicSubtract();
        if (eqz.quotient < 10) {
            lo_setInnerHtml('d3_num02', numPath(eqz.quotient, 1));
        }
        if (eqz.quotient < 100 && eqz.quotient > 9) {
            lo_setInnerHtml('d3_num01', numPath(eqz.quotient, 10));
        }
        if (eqz.quotient > 99) {
            lo_setInnerHtml('d3_num00', numPath(eqz.quotient, 100));
        }
        correct = subval2;
        // instruction text
        txt = txt.replace('REPLACE_step', ''+(step+1));
        txt = txt.replace('REPLACE_num0', ''+subval0);
        txt = txt.replace('REPLACE_num1', ''+subval1);
        lo_setInnerHtml('div_m2_step', txt);
        // answers array
        asmAnswerSetup();
    }

    function currentCol() {
        console.log('currentCol()');
        var q0 = mydoc.getElementById('d3_num00').innerHTML.length === 0;
        var q1 = mydoc.getElementById('d3_num01').innerHTML.length === 0;
        var q2 = mydoc.getElementById('d3_num02').innerHTML.length === 0;
        var q3 = mydoc.getElementById('d3_num03').innerHTML.length === 0;
        if (q0 && q1 && q2 && q3) {
            if (numLength(eqz.quotient) === 3) { return 0; }
            if (numLength(eqz.quotient) === 2) { return 1; }
            if (numLength(eqz.quotient) === 1) { return 2; }
        }
        // work backwards
        if (!q2) { return 3; }
        if (!q1) { return 2; }
        if (!q0) { return 1; }
        return 0;
    }

    function numLength(num_in) {
        //console.log('numLength(num_in)');
        var num_str = '' + num_in;
        return num_str.length;
    }

    function dynamicMultiply() {
        console.warn('dynamicMultiply()');
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        var txt = '';
        var bkgds = '';
        var id = '';
        var col = currentCol();
        var row = step + 1;
        var i = 0;
        var len = numLength(subval0);
        console.warn(col, 'col');
        //lo_divisorToggle('r2bkgd');
        lo_bkgdNumsSet('', 'r2white');
        chunkHtml(90);
        len = numLength(subval0);
        for (i=0; i<len ; i++) {
            if (bkgds.length > 0) { bkgds += '.'; }
            if (col - i < 0) {
                bkgds += '' + row + (col + i);
            } else {
                bkgds += '' + row + (col - i);
            }
        }
        // add in the quotient number if decimal
        if (col === 3) { bkgds += '.03'; }
        console.warn(bkgds, '--------------------------------------------------------------------bkgds');
        lo_bkgdNumsSet(bkgds, 'r2bkgd');
        if (row === 1) { return; } // no need to set dividend row values
        for (i=0; i<len; i++) {
            id = 'd3_num' + row + (col - i);
            console.warn(id, 'id', subval0, 'subval0', Math.pow(10, i), 'pow', i);
            lo_setInnerHtml(id, numPath(subval0, Math.pow(10, i)));
            console.warn(id, 'id');
        }
    }

    // step one
    function step00() {
        console.log('----------------------------------------------------------------step00()');
        console.log('----------------------------------------------------------------step00()');
        console.log('----------------------------------------------------------------step00()');
        var txt = getStr('D3_00');
        if (eqz.quotient > 99) {
            correct = parseInt(eqz.quotient / 100, 10);
            subval0 = parseInt(eqz.dividend / 100, 10);
        }
        if (eqz.quotient < 100 && eqz.quotient > 9) {
            correct = parseInt(eqz.quotient / 10, 10);
            subval0 = parseInt(eqz.dividend / 10, 10);
        }
        if (eqz.quotient < 10) {
            correct = eqz.quotient;
            subval0 = eqz.dividend;
        }
        subval1 = correct * eqz.divisor;
        subval2 = subval0 - subval1;
        // instruction text
        txt = txt.replace('REPLACE_step', ''+(step+1));
        txt = txt.replace('REPLACE_num0', ''+eqz.divisor);
        txt = txt.replace('REPLACE_num1', ''+subval0);
        lo_setInnerHtml('div_m2_step', txt);
        // initial equation setup
        lo_clearEquation();
        lo_setEqNumbers(eqz);
        lo_divisorToggle('r2bkgd');
        lo_showContainer();
        // answers array
        asmAnswerSetup();
        console.log(eqz, 'eqz');
        console.log(correct, 'correct', subval0, 'subval0', subval1, 'subval1', subval2, 'subval2')
        dynamicMultiply();
        mydoc.getElementById('asm_answer').style.display = 'block';
    }

    // handle correct answer
    function correctAnswerHandler() {
        console.log('correctAnswerHandler()');
        step += 1;
        nextStep();
    }

    // process next step
    function nextStep() {
        console.warn('nextStep()');
        var tic = step < 10 ? '0' : '';
        var pid = ('step_' + tic + step);
        console.warn(step, step_max[step]);
        console.log(pid, 'pid');
        if (step > step_max[step]) {
            finalMessage();
        } else {
            process[pid]();
        }
    }
//
// >>> PROCESS:end
//
//
// >>> LAYOUT:start
//

    // show the D3 container components
    function lo_showContainer() {
        console.log('lo_showContainer()');
        mydoc.getElementById('svg_m2_container').style.visibility = 'hidden';
        mydoc.getElementById('div_m2_instruct_container').style.display = 'block';
        mydoc.getElementById('div_m2_container').style.display = 'block';
        mydoc.getElementById('div_d3_container').style.display = 'block';
    }

    // toggle the divisor bkgds
    function lo_divisorToggle(class_str) {
        console.log('lo_divisorToggle(class_str)');
        var bkgds = '1';
        if (eqz.divisor > 9) { bkgds += '.0'; }
        lo_bkgdsDivisor(bkgds, class_str);
    }

    // set the paths for the divisor and quotient & initial bkgd colors
    function lo_setEqNumbers() {
        console.log('lo_setEqNumbers()');
        lo_setInnerHtml('d3_numdr1', numPath(eqz.divisor, 1));
        if (eqz.divisor > 9) {
            lo_setInnerHtml('d3_numdr0', numPath(eqz.divisor, 10));
        }
        lo_setInnerHtml('d3_num12', numPath(eqz.dividend, 1));
        lo_setInnerHtml('d3_num11', numPath(eqz.dividend, 10));
        lo_setInnerHtml('d3_num10', numPath(eqz.dividend, 100));

    }

    // set innerHTML
    function lo_setInnerHtml(id, val) {
        if (!mydoc.getElementById(id)) { return; }
        mydoc.getElementById(id).innerHTML = val;
    }

    // set style.display
    function lo_setStyleDisplay(id, val) {
        if (!mydoc.getElementById(id)) { return; }
        mydoc.getElementById(id).style.display = val;
    }

    // set attribute such as class name
    function lo_setAttribute(id, type, val) {
        if (!mydoc.getElementById(id)) { return; }
        mydoc.getElementById(id).setAttribute(type, val);
    }

    // clear equation bkgds & nums & lines
    function lo_clearEquation() {
        console.log('lo_clearEquation()');
        lo_bkgdNumsSet('', 'r2white');
        lo_bkgdsDivisor('', 'r2white');
        lo_numClearAll();
        lo_setStyleDisplay('d3_line_1', 'none');
        lo_setStyleDisplay('d3_line_2', 'none');
        lo_setStyleDisplay('d3_line_3', 'none');
        lo_setInnerHtml('d3_numdr0', '');
        lo_setInnerHtml('d3_numdr1', '');
    }

    // clear all numbers
    function lo_numClearAll() {
        console.log('lo_numClearAll()');
        var i = 0;
        var j = 0;
        var id = 'd3_num';
        for (i=0; i<bkgds_rows; i++) {
            for (j=0; j<bkgds_cols; j++) {
                lo_setInnerHtml(id+i+j, '');
            }
        }
    }
    
    // set bkgd for divisor bkgds
    function lo_bkgdsDivisor(ids_in, class_str) {
        console.log('lo_bkgdsDivisor(ids_in, class_str)');
        console.log(ids_in, 'ids_in', class_str, 'class_str');
        var both = ids_in.length === 0;
        if (ids_in.indexOf('0') > -1 || both) {
            lo_setAttribute('d3_bkgd_dr_0', 'class', class_str);
        }
        if (ids_in.indexOf('1') > -1 || both) {
            lo_setAttribute('d3_bkgd_dr_1', 'class', class_str);
        }
    }
//
// >>> LAYOUT:end
//
//
// >>> GETSET:start
//
    // set equation vars
    function setEquationVars(pdata_in) {
        console.log('setEquationVars(pdata_in)');
        decimal_pct = pdata_in.decimal_pct;
        divisor_pct = pdata_in.divisor_pct;
    }

    // initial counters & controls when starting D3 session
    function setCounters() {
        console.log('setCounters()');
        session = Date.now();
        count_problem = 0;
        chunk_counter = 0;
        time_start = -1;
    }

    // get problem_str
    function getProblemStr() {
        return problem_str;
    }

//
// >>> GETSET:end
//
//
// >>> DEVELOPER:start
//

    function testModf(ev) {
        console.log('testModf(ev)');
        var total = 0;
        var start = Date.now();
        var eq = findDecimalEq(10);
        console.log(eq);
        console.log(Date.now() - start, 'milliseconds');
        return;
        for (var i=70; i<81; i++) {
            for (var j=10; j<101; j++) {
                for (var k=1; k<10; k++) {
                    var dec = k / 10;
                    var fact = j + dec;
                    var val = fact * i;
                    if (val > 999.9) { continue; }
                    if (parseInt(val, 10) !== val) { continue; }
                    var check = decimalStrip(val, 10) * 10;
                    if (decimalStrip(check, 10) !== 0) { continue; }
                    console.log(i, j, k, val,' ', fact, ' --- ', total);
                    total += 1;
                }
            }
        }
    }
    
    // initialize D3 grid with some value to assess layout (dev only fnc)
    function showAllD3(ev) {
        console.warn('showAllD3(ev)');
        var tform = getTransforms('d3_number');
        var path = getNums(8);
        path = path.replace('/>', ' ' + tform + '/>');
        RMM_ASM.hideAll();
        mydoc.getElementById('svg_m2_container').style.visibility = 'hidden';
        mydoc.getElementById('div_m2_instruct_container').style.display = 'block';
        mydoc.getElementById('div_m2_container').style.display = 'block';
        mydoc.getElementById('div_d3_container').style.display = 'block';
        // quotient (qt)
        mydoc.getElementById('d3_num00').innerHTML = path;
        mydoc.getElementById('d3_num01').innerHTML = path;
        mydoc.getElementById('d3_num02').innerHTML = path;
        mydoc.getElementById('d3_num03').innerHTML = path;
        // divisor (dr)
        mydoc.getElementById('d3_numdr0').innerHTML = path;
        mydoc.getElementById('d3_numdr1').innerHTML = path;
        // dividend (dd)
        mydoc.getElementById('d3_num10').innerHTML = path;
        mydoc.getElementById('d3_num11').innerHTML = path;
        mydoc.getElementById('d3_num12').innerHTML = path;
        // answer0 (an)
        mydoc.getElementById('d3_num20').innerHTML = path;
        mydoc.getElementById('d3_num21').innerHTML = path;
        mydoc.getElementById('d3_num22').innerHTML = path;
        // answer1 (an)
        mydoc.getElementById('d3_num30').innerHTML = path;
        mydoc.getElementById('d3_num31').innerHTML = path;
        mydoc.getElementById('d3_num32').innerHTML = path;
        mydoc.getElementById('d3_num33').innerHTML = path;
        // answer2 (an)
        mydoc.getElementById('d3_num40').innerHTML = path;
        mydoc.getElementById('d3_num41').innerHTML = path;
        mydoc.getElementById('d3_num42').innerHTML = path;
        mydoc.getElementById('d3_num43').innerHTML = path;
        // answer3 (an)
        mydoc.getElementById('d3_num50').innerHTML = path;
        mydoc.getElementById('d3_num51').innerHTML = path;
        mydoc.getElementById('d3_num52').innerHTML = path;
        mydoc.getElementById('d3_num53').innerHTML = path;
        // answer4 (an)
        mydoc.getElementById('d3_num60').innerHTML = path;
        mydoc.getElementById('d3_num61').innerHTML = path;
        mydoc.getElementById('d3_num62').innerHTML = path;
        mydoc.getElementById('d3_num63').innerHTML = path;
        // answer4 (an)
        mydoc.getElementById('d3_num70').innerHTML = path;
        mydoc.getElementById('d3_num71').innerHTML = path;
        mydoc.getElementById('d3_num72').innerHTML = path;
        mydoc.getElementById('d3_num73').innerHTML = path;
    }
//
// >>> DEVELOPER:end
//
    return {
        showAllD3 : showAllD3,
        nextD3Equation : nextD3Equation,
        correctAnswerHandler : correctAnswerHandler,
        setEquationVars : setEquationVars,
        chunkShow : chunkShow,
        printProblemSetup : printProblemSetup,
        getProblemStr : getProblemStr,
        testModf : testModf,
        // setters getters
        setCounters : setCounters
    };
})();
