var RMM_M2 = (function() {
    var mydoc = window.document;
    var session = Date.now(); // keypath id for indexedDB idsession
    var problem_str = ''; // problem as delimited string
    var count_problem = 0; // unique counters added to idsession per problem
    var chunk_counter = 0; // count number of times chunk clicked during equation
    var time_start = -1; // -1 designates first equation else Date.now()
    var timervar = null; // use for setTimeout and clearTimeout functions
    var rows = {'r0':0, 'r1':0, 'r2':0, 'r3':0, 'r4':0};
    var nums = {}; // will store each individual row number zero-indexed
    var carry = {}; // has carries for both mult and add steps (row/num indexed)
    var answers = [];
    var correct = null; // will have the correct answer for process step
    var finalstep = false; // set to true when final step
    var process = {
        'm2b_00' : basic_step00,
        'm2b_01' : basic_step01,
        'm2b_02' : basic_step02,
        'm2b_03' : basic_step03,
        'm2b_04' : basic_step04,
        'm2b_05' : basic_step05,
        'm2b_06' : basic_step06,
        'm2c_00' : chunk_step00,
        'm2c_01' : chunk_step01,
        'm2c_02' : basic_step04, // now we can do basic column adds
        'm2c_03' : basic_step05,
        'm2c_04' : basic_step06
    };
    var step = 0; // used to control process zero indexed
    var step_max = {'m2b' : 7, 'm2c' : 5}; // max step zero indexed
    var level = 'm2b'; // use m2b or m2c to access process dict steps
    var module = 'm2'; // m2 or d3
    var bkgds_rows = 5; // used to block change bkgds for m2 or d3
    var bkgds_cols = 4; // used to block change bkgds for m2 or d3
    // function aliases
    function getStr(id) { return RMM_CFG.getStr(id); }
    function getNums(id) { return RMM_SymsNums.getNums(id); }
    function getSyms(id) { return RMM_SymsNums.getSyms(id); }
    function getTransforms(id) { return RMM_SymsNums.getTransforms(id); }
    function getRandInt(min, max) { return RMM_ASM.getRandInt(min, max); }
//
// >>> CHUNK:start
//

    // chunk step two (index 01)
    function chunk_step01() {
        console.log('------------------------------------------------------------chunk_step01()');
        var txt = '';
        var bkgds = '03.02.12.32.31';
        if (nums.n30) { bkgds += '.30'; }
        correct = rows.r3;
        txt = chunkHtml(2, 100);
        mydoc.getElementById('div_m2_chunk').innerHTML = txt;
        mydoc.getElementById('div_m2_chunk').style.visibility = 'visible';
        // format the instruction & bakgds
        txt = getStepText('CHUNK_M2_01');
        txt = txt.replace('REPLACE_num0', ('' + rows.r0));
        txt = txt.replace('REPLACE_num1', ('' + nums.n12));
        stepInit(bkgds, txt);
    }

    // chunk step one (index 00)
    function chunk_step00() {
        console.log('------------------------------------------------------------chunk_step00()');
        var txt = '';
        var bkgds = '03.02.13.23.22';
        if (nums.n21) { bkgds += '.21'; }
        correct = rows.r2;
        txt = chunkHtml(3, 100);
        mydoc.getElementById('div_m2_chunk').innerHTML = txt;
        mydoc.getElementById('div_m2_chunk').style.visibility = 'visible';
        // format the instruction & bakgds
        txt = getStepText('CHUNK_M2_00');
        txt = txt.replace('REPLACE_num0', ('' + rows.r0));
        txt = txt.replace('REPLACE_num1', ('' + nums.n13));
        stepInit(bkgds, txt);
    }

    // generate chunk html with button and chunk text
    function chunkHtml(col, font_pct) {
        console.log('chunkHtml(col, font_pct)');
        var tens = 0; // row1 integer in tens
        var val0 = rows.r0 % 10;
        var val1 = col === 3 ? nums.n13 : nums.n12;
        var txt = '';
        var result = val0 * val1;
        var total = rows.r0 * val1;
        tens = parseInt(result / 10) * 10;
        txt = '<button class="chunk" '
        txt += 'onclick="RMM_M2.chunkShow(event);">'
        txt += getStr('TXT_chunk_it') + '</button>';
        txt += '<div id="div_chunkit" style="margin-top:10px;display:none;';
        txt += 'font-size:' + font_pct + '%;">';
        txt += '&nbsp;';
        txt += result;
        txt += '&nbsp;=&nbsp;' + val0;
        txt += '&nbsp;x&nbsp;' + val1; 
        val0 = (parseInt(rows.r0 / 10, 10) * 10);
        result = val0 * val1;
        txt += '<br>+&nbsp;' + result;
        txt += '&nbsp;=&nbsp;' + val0;
        txt += '&nbsp;x&nbsp;' + val1; 
        txt += '<br>' + total + '&nbsp;=&nbsp' + getStr('TXT_Total');
        txt += '</div>';
        return txt;
    }

    // display chunk message after button click
    function chunkShow(ev) {
        console.log('chunkShow(ev)');
        chunk_counter += 1;
        lo_setStyleDisplay('div_chunkit', 'block');
    }
//
// >>> CHUNK:end
//
//
// >>> BASIC:start
//

    // create concatenated str with user/prob/ans data & push() it is testing
    function recordAnswer() {
        console.log('recordAnswer()');
        console.log(nums);
        var time_stop = Date.now();
        var data = {'idsession' : '' + session + '_' + count_problem};
        var r_str = '';
        var tic = '^';
        var iduser = RMM_ASM.getIduser();
        console.log(RMM_ASM.getGuestActive());
        if (RMM_ASM.getGuestActive()) { return; }
        count_problem += 1;
        data['iduser'] = iduser;
        data['idlevel'] = module;
        data['device_iduser'] = RMM_DB.getDevice() + '_' + iduser;
        data['tstamp'] = time_stop;
        data['time'] = time_stop - time_start;
        data['elapsed'] = time_stop - time_start;
        r_str += level;
        r_str += tic + nums.n02 + nums.n03 + 'x' + nums.n12 + nums.n13;
        r_str += tic + chunk_counter;
        data['r_str'] = r_str;
        console.log('%c' + r_str, 'color:#009933;');
        RMM_DB.addSessionRec(data);
        RMM_STATSLIVE.displayUserCounts('m2', true);
    }

    // basic step seven (index 06)
    function basic_step06() {
        console.log('------------------------------------------------------------basic_step06()');
        var txt = '';
        var bkgds = '30.40';
        recordAnswer();
        correct = nums.n30;
        if (carry.c20) {
            correct += carry.c20;
            carryShowSpecific('20', 1);
        }
        lo_numberSet('41', nums.n41); // need this here for chunk
        if (rows.r4 < 1000) {
            recordAnswer();
            finalMessage();
            return;
        }
        if (carry.c20 && nums.n30 === null) {
            txt = getStepText('BASIC_M2_06cm');
            txt = txt.replace('REPLACE_num0', ('' + carry.c20));
            mydoc.getElementById('div_m2_step').innerHTML = txt;
            continueNoAnswer('40', '');
            finalstep = true;
            return;
        }
        if (carry.c20) {
            txt = getStepText('BASIC_M2_06c');
            txt = txt.replace('REPLACE_num1', ('' + carry.c20));
        } else {
            txt = getStepText('BASIC_M2_06');
        }
        txt = txt.replace('REPLACE_num0', ('' + nums.n30));
        lo_numberSet('40', correct);
        if (!nums.n20) { finalstep = true; }
        stepInit(bkgds, txt);
        finalButtonDisplay(getStr('TXT_Continue'));
    }

    // basic step six is final when answer is only 3 digits
    function basic_step05c() {
        console.log('------------------------------------------------------------basic_step05c()');
        var txt = '';
        var bkgds = '31.41';
        if (nums.n21) { bkgds += '.21'; }
        correct = nums.n31;
        if (nums.n21) {
            correct += nums.n21;
            bkgds += '.21';
        }
        if (carry.c21) {
            correct += carry.c21;
            carryShowSpecific('21', 1);
        }
        if (nums.n21 === null) {
            if (carry.c21) {
                txt = getStepText('BASIC_M2_05c');
            } else {
                txt = getStepText('BASIC_M2_05m');
            }
            txt = txt.replace('REPLACE_num0', ''+nums.n31);
            finalstep = true;
            lo_numberSet('41', correct);
        }
        stepInit(bkgds, txt);
        if (finalstep) { finalButtonDisplay(getStr('TXT_Continue')); }
    }

    // basic step six (index 05)
    function basic_step05() {
        console.log('------------------------------------------------------------basic_step05()');
        var txt = '';
        var bkgds = '21.31.41';
        correct = nums.n21 + nums.n31;
        if (carry.c21) {
            correct += carry.c21;
            carryShowSpecific('21', 1);
        }
        lo_numberSet('42', nums.n42); // need this here for chunk
        if (rows.r4 < 1000 && nums.n21 === null) {
            basic_step05c();
            return;
        }
        if (nums.n21 === null && nums.n30 === null) {
            if (carry.c21) {
                txt = getStepText('BASIC_M2_05c');
                txt = txt.replace('REPLACE_num1', ('' + carry.c21));
            } else {
                txt = getStepText('BASIC_M2_05m');
            }
            txt = txt.replace('REPLACE_num0', ('' + nums.n31));
            mydoc.getElementById('div_m2_step').innerHTML = txt;
            continueNoAnswer('41', '31.41');
            return;
        }
        if (nums.n21 === null && carry.c21 && nums.n30) {
            txt = getStepText('BASIC_M2_05c');
            txt = txt.replace('REPLACE_num0', ('' + nums.n31));
            txt = txt.replace('REPLACE_num1', ('' + carry.c21));
            mydoc.getElementById('div_m2_step').innerHTML = txt;
            continueNoAnswer('41', '31.41');
            return;
        }
        txt = getStepText('BASIC_M2_05');
        txt = txt.replace('REPLACE_num0', ('' + nums.n21));
        txt = txt.replace('REPLACE_num1', ('' + nums.n31));
        if (carry.c21) {
            txt +=  carryReminder('TXT_carry_next', 10);
        }
        stepInit(bkgds, txt);
    }

    // basic step five (index 04)
    function basic_step04() {
        console.log('------------------------------------------------------------basic_step04()');
        var txt = '';
        var bkgds = '22.32.42';
        correct = nums.n22 + nums.n32;
        mydoc.getElementById('m2_hide').style.display = 'block';
        mydoc.getElementById('m2_line_total2').style.display = 'block';
        lo_numberSet('43', nums.n43); // need this here for chunk
        mydoc.getElementById('div_m2_chunk').innerHTML = '';
        txt = getStepText('BASIC_M2_04');
        txt = txt.replace('REPLACE_ones', ('' + nums.n43));
        txt = txt.replace('REPLACE_num0', ('' + nums.n22));
        txt = txt.replace('REPLACE_num1', ('' + nums.n32));
        stepInit(bkgds, txt);
    }

    // basic step four (index 03)
    function basic_step03() {
        console.log('------------------------------------------------------------basic_step03()');
        var txt = '';
        var bkgds = '02.12.31';
        correct = nums.n02 * nums.n12;
        if (carry.c01) { correct += carry.c01; }
        if (correct > 9) { bkgds += '.30'; }
        // format the instruction & bakgds allowing for 1 or 2 digits
        txt = getStepText('BASIC_M2_03');
        txt = txt.replace('REPLACE_num0', ('' + nums.n02));
        txt = txt.replace('REPLACE_num1', ('' + nums.n12));
        if (carry.c01) { txt += carryReminder('TXT_carry_remember', 10); }
        stepInit(bkgds, txt);
    }

    // basic step three (index 02)
    function basic_step02() {
        console.log('------------------------------------------------------------basic_step02()');
        var txt = '';
        var bkgds = '03.12.32';
        correct = nums.n03 * nums.n12;
        // format the instruction & bakgds allowing for 1 or 2 digits
        txt = getStepText('BASIC_M2_02');
        txt = txt.replace('REPLACE_num0', ('' + nums.n03));
        txt = txt.replace('REPLACE_num1', ('' + nums.n12));
        stepInit(bkgds, txt);
    }

    // basic step two (index 01)
    function basic_step01() {
        console.log('------------------------------------------------------------basic_step01()');
        var txt = '';
        var bkgds = '02.13.22';
        correct = nums.n02 * nums.n13;
        if (carry.c02) { correct += carry.c02; }
        if (correct > 9) { bkgds += '.21'; }
        // format the instruction & bakgds allowing for 1 or 2 digits
        txt = getStepText('BASIC_M2_01');
        txt = txt.replace('REPLACE_num0', ('' + nums.n02));
        txt = txt.replace('REPLACE_num1', ('' + nums.n13));
        if (carry.c02) { txt += carryReminder('TXT_carry_remember', 10); }
        stepInit(bkgds, txt);
    }

    // basic step one (index 00)
    function basic_step00() {
        console.log('------------------------------------------------------------basic_step00()');
        var txt = '';
        var bkgds = '03.13.23';
        correct = nums.n03 * nums.n13;
        // format the instruction & bakgds
        txt = getStepText('BASIC_M2_00');
        txt = txt.replace('REPLACE_num0', ('' + nums.n03));
        txt = txt.replace('REPLACE_num1', ('' + nums.n13));
        mydoc.getElementById('div_m2_chunk').innerHTML = '';
        stepInit(bkgds, txt);
    }
//
// >>> BASIC:end
//
//
// >>> EQUATION:start
//

    // process common functions to initialize a step
    function stepInit(bkgds, txt) {
        console.log('stepInit(bkgds)');
        lo_linesAndOperatorSetup();
        if (!finalstep) {
            RMM_ASM.setCorrect(correct);
            RMM_ASM.setComplete(false);
            answersArrayFill();
            answersSetup();
        }
        lo_bkgdNumsSet('', 'r2white');
        lo_bkgdNumsSet(bkgds, 'r2bkgd');
        mydoc.getElementById('div_m2_step').innerHTML = txt;
        mydoc.getElementById('div_m2_chunk').style.display = 'block';
        if (finalstep) {
            mydoc.getElementById('m2_answer').style.display = 'none';
        } else {
            mydoc.getElementById('m2_answer').style.display = 'block';
        }
    }

    // 
    function continueNoAnswer(idnum, idbkgds) {
        console.log('continueNoAnswer(idnum)');
        var btxt = '';
        lo_bkgdNumsSet('', 'r2white');
        if (idbkgds.length > 0) { lo_bkgdNumsSet(idbkgds, 'r2bkgd'); }
        lo_numberSet(idnum, correct);
        btxt = '<button class="carrynote" '
        btxt += 'onclick="RMM_M2.continueNoAnswerClick(event);">'
        btxt += getStr('TXT_continue') + '</button>';
        mydoc.getElementById('m2_answer').style.display = 'none';
        mydoc.getElementById('div_m2_chunk').innerHTML = btxt;
    }

    // handle continue button click when continueNoAnswer has been shonw
    function continueNoAnswerClick() {
        console.log('continueNoAnswerClick()');
        if (finalstep) {
            recordAnswer();
            finalMessage();
            return;
        }
        step += 1;
        nextStep();
    }

    // get the step text and insert the current step number (+1)
    function getStepText(id) {
        console.log('getStepText(id)');
        var txt = getStr(id);
        txt = txt.replace('REPLACE_step', '' + (step + 1));
        return txt;
    }

    // handle correct answer
    function correctAnswerHandler() {
        console.log('correctAnswerHandler()');
        var carried = false; // set to true if carry is shown
        if (level === 'm2b') { answerDisplayBasic(); }
        if (level === 'm2c') {
            answerHandleChunk();
            return;
        }
        carried = carryNoteShow();
        if (carried) { return; } // nextStep will be after carry continue click
        step += 1;
        nextStep();
    }

    // remember carry text as div text for innerHTML
    function carryReminder(id, mleft) {
        console.log('carryReminder(id, mleft)');
        var txt = '';
        txt += '<div style="margin-left:' + mleft + 'px;';
        txt += 'margin-top:10px;">';
        txt += getStr(id);
        txt += '</div>';
        return txt;
    }

    // clear step instruction and chunk button by setting to ''
    function resetInstruction() {
        console.log('resetInstruction()');
        mydoc.getElementById('div_m2_step').innerHTML = '';
        mydoc.getElementById('div_m2_chunk').innerHTML = '';
    }

    // goto next step in process
    function nextStep() {
        console.log('nextStep()');
        var tic = step < 10 ? '0' : '';
        var pid = level + ('_' + tic + step);
        if (step > step_max[level]) {
            recordAnswer();
            finalMessage();
        } else {
            process[pid]();
        }
    }

    // continue after user clicks carry note continue button
    function carryNoteContinue(ev) {
        console.log('carryNoteContinue(ev)');
        resetInstruction();
        step += 1;
        nextStep();
    }

    // show a specific carry box
    function carryShowSpecific(id, carryint) {
        console.log('carryShowSpecific(id, value)');
        var path = getNums(carryint);
        var tform = getTransforms('borrow_carry_number');
        var idnum = 'm2_c' + id + '_num';
        var idbox = 'm2_c' + id + '_box';
        path = path.replace('/>', ' ' + tform + '/>');
        mydoc.getElementById(idnum).innerHTML = path;
        mydoc.getElementById(idnum).style.display = 'block';
        mydoc.getElementById(idbox).style.display = 'block';
        mydoc.getElementById(idnum).style.visibility = 'visible';
        mydoc.getElementById(idbox).style.visibility = 'visible';
    }

    // show carry note before next step
    function carryNoteShow() {
        console.log('carryNoteShow()');
        var carryint = parseInt(correct / 10, 10);
        var place = '';
        var txt = '';
        if (step === 0 && carry.c02) {
            place = getStr('TXT_tens');
            txt = getStr('CM2_multiply');
            carryShowSpecific('02', carryint);
        }
        if (step === 2 && carry.c01) {
            place = getStr('TXT_hundreds');
            txt = getStr('CM2_multiply');
            carryShowSpecific('01', carryint);
        }
        if (txt.length === 0) { return false; }
        txt = txt.replace('REPLACE_place', place);
        txt = txt.replace('REPLACE_correct', correct);
        txt = txt.replace('REPLACE_carryint', carryint);
        carryNoteDisplay(txt);
        mydoc.getElementById('m2_answer').style.display = 'none';
        return true;
    }

    // display correct answer digits for chunk process
    function answerHandleChunk() {
        console.log('answerHandleChunk()');
        if (step === 0) {
            lo_numberSet('23', nums.n23);
            lo_numberSet('22', nums.n22);
            if (nums.n21) { lo_numberSet('21', nums.n21); }
        }
        if (step === 1) {
            lo_numberSet('32', nums.n32);
            lo_numberSet('31', nums.n31);
            if (nums.n30) { lo_numberSet('30', nums.n30); }
        }
        step += 1;
        nextStep();
    }

    // display correct answer digits for basic process
    function answerDisplayBasic() {
        console.log('answerDisplayBasic()');
        if (step === 0) { lo_numberSet('23', correct % 10); }
        if (step === 1) { lo_numberSet('22', correct % 10); }
        if (step === 2) { lo_numberSet('32', correct % 10); }
        if (step === 3) {
            lo_numberSet('31', correct % 10);
            lo_numberSet('43', nums.n43 % 10);
        }
        if (step === 4) { lo_numberSet('42', correct % 10); }
        if (step === 5) { lo_numberSet('41', correct % 10); }
        // exit if doing multiplcation carries and no carries to show
        if (correct < 10 && step < 4) { return; }
        if (step === 1) { lo_numberSet('21', parseInt(correct / 10, 10)); }
        if (step === 3) { lo_numberSet('30', parseInt(correct / 10, 10)); }
    }

    // display completed equation text
    function finalMessage(ev) {
        console.log('finalMessage(ev)');
        var txt = getStr('TXT_final_message');
        lo_bkgdNumsSet('', 'r2white');
        mydoc.getElementById('div_m2_chunk').style.display = 'none';
        mydoc.getElementById('m2_answer').style.display = 'none';
        mydoc.getElementById('div_m2_step').innerHTML = txt;
    }

    // display continue button at final step
    function finalButtonDisplay(id) {
        console.log('finalButtonDisplay()');
        var txt = getStr(id);
        var btxt = '';
        mydoc.getElementById('div_m2_chunk').innerHTML = txt;
        btxt = '<button class="carrynote" '
        btxt += 'onclick="RMM_M2.finalMessage(event);">'
        btxt += getStr('TXT_continue') + '</button>';
        mydoc.getElementById('div_m2_chunk').innerHTML = btxt;
    }

    // disply carry note
    function carryNoteDisplay(txt) {
        console.log('carryNoteDisplay(txt)');
        var btxt = '';
        mydoc.getElementById('div_m2_step').innerHTML = txt;
        btxt = '<button class="carrynote" '
        btxt += 'onclick="RMM_M2.carryNoteContinue(event);">'
        btxt += getStr('TXT_continue') + '</button>';
        mydoc.getElementById('div_m2_chunk').innerHTML = btxt;
    }

    // setup the answers using RMM_ASM functions
    function answersSetup() {
        console.log('answersSetup()');
        RMM_ASM.setModule('m2');
        RMM_ASM.setAnswers(answers);
        RMM_ASM.setLevelDone(0);
        RMM_ASM.answerButtonClassReset();
        RMM_ASM.layoutAnswerButtons();
        RMM_ASM.setResponsesAnswersActive();
        RMM_ASM.layoutVerdict(null, ''); // empty string blanks verdict
        //layoutAnswerNumFill must follow layoutVerdict
        RMM_ASM.layoutAnswerNumFill(null, '#000');
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

    // find a good alternative answer
    function answerAltFind() {
        console.log('answerAltFind()');
        var todo = true;
        var sign = 1; // set randomly to -1 or 1
        var pct = 0.0; // random percentage adjust +- to correct
        var pct_max = 7; // limit pct to 3 digit vals
        var alt = -1;
        var tries = 0;
        while (todo) {
            tries += 1;
            if (tries > 100) { return 0; }
            if (correct < 10) { alt = getRandInt(1, 10); }
            sign = getRandInt(0, 2) === 1 ? 1 : -1;
            if (correct > 9 && correct < 100) {
                alt = correct + (getRandInt(2, 50) * sign);
            }
            if (correct > 99) {
                small = getRandInt(0, 2) === 1;
                if (correct * 1.7 > 999) {
                    pct_max = parseInt((1 - (correct / 999)) * 10, 10);
                } else {
                    pct_max = 7;
                }
                pct = getRandInt(1, pct_max) / 10;
                // add a 100th of a percent
                pct += getRandInt(0, 10) / 100;
                // allow something close to correct 1/3rd of time
                if (getRandInt(0, 3) === 1) { pct = pct / 10; }
                alt = parseInt(correct * (1 + (pct * sign)), 10);
            }
            if (alt === correct) { continue; }
            if (alt < 1) { continue; }
            if (alt > 999) { continue; }
            if (correct > 9 && alt < 10 && !finalstep) { continue; } // finalstep will be addition so allow single digits
            if (correct < 25 && alt > 50) { continue; }
            if (correct > 99 && alt < 99) { continue; } // no 2 digit alts when correct is 3 digits
            if (correct < 100 && alt > 99) { continue; } // no 3 digit alts when correct is 2 digits
            if (answers.indexOf(alt) > -1) { continue; }
            todo = false;
        }
        return alt;
    }

    // use random percentiles around correct answer to fill out answers
    function answersArrayFill() {
        console.log('answersArrayFill()', correct, 'correct');
        var i = 0;
        var len = 3;
        var slot = -1; // will have the available answers index to fill
        answers = [null, null, null, null];
        answers[getRandInt(0, 4)] = correct;
        for (i=0; i<len; i++) {
            slot = findAnswersSlot();
            if (slot === null) {
                alert('could not find answer slot');
                continue;
            }
            answers[slot] = answerAltFind();
        }
    }

    // reset the nums indexes to nulls (keeps full symmetry tho not all used)
    function resetEqNums() {
        console.log('resetEqNums()');
        var i = 0;
        var j = 0;
        for (i=0; i<4; i++) {
            for (j=0; j<4; j++) {
                nums['n' + i + j] = null
            }
        }
    }

    // setup the equation numbers
    function equationSetup() {
        console.error('equationSetup()');
        resetEqNums();
        nums.n03 = getRandInt(0,9);
        nums.n02 = getRandInt(1,9);
        nums.n13 = getRandInt(0,9);
        nums.n12 = getRandInt(1,9);

        //////nums.n03 = 4;
        //////nums.n02 = 8;
        //////nums.n13 = 5;
        //////nums.n12 = 1;
        //////console.error(nums);

        rows.r0 = (nums.n02 * 10) + nums.n03;
        rows.r1 = (nums.n12 * 10) + nums.n13;
        rows.r2 = rows.r0 * nums.n13;
        rows.r3 = rows.r0 * nums.n12;
        rows.r4 = rows.r0 * rows.r1;
        nums.n23 = numAtIndex(rows.r2, 1);
        nums.n22 = numAtIndex(rows.r2, 10);
        if (rows.r2 > 99) { nums.n21 = numAtIndex(rows.r2, 100); }
        nums.n32 = numAtIndex(rows.r3, 1);
        nums.n31 = numAtIndex(rows.r3, 10);
        if (rows.r3 > 99) { nums.n30 = numAtIndex(rows.r3, 100); }
        nums.n43 = numAtIndex(rows.r4, 1);
        nums.n42 = numAtIndex(rows.r4, 10);
        nums.n41 = numAtIndex(rows.r4, 100);
        if (rows.r4 > 999) { nums.n40 = numAtIndex(rows.r4, 1000); }
        console.warn(nums, 'nums (problem setup)');
    }

    // set up next M2 equation
    function nextM2Equation(ev) {
        console.error('nextM2Equation(ev)');
        console.log(module, 'module in nextM2Equation');
        chunk_counter = 0;
        mydoc.getElementById('div_m2_chunk').style.visibility = 'visible';
        finalstep = false;
        RMM_ASM.setModule('asm');
        lo_centerContainer();
        lo_clearEquation();
        equationSetup();
        setCarry();
        mydoc.getElementById('div_m2_instruct_container').style.marginTop = '-310px';
        mydoc.getElementById('div_asm_container').style.display = 'block';
        mydoc.getElementById('div_asm_container').style.visibility = 'hidden';
        RMM_ASM.showAllASM(true);
        timervar = window.setTimeout(kludge1_clearASM, 10);
    }

    function kludge1_clearASM(ev) {
        console.log('kludge1_clearASM(ev)');
        window.clearTimeout(timervar);
        mydoc.getElementById('div_asm_container').style.visibility = 'visible';
        mydoc.getElementById('div_asm_container').style.display = 'none';
        finishM2Equation();
    }

    function finishM2Equation() {
        console.log('finishM2Equation()');
        lo_rows0And1();
        lo_showM2();
        time_start = Date.now();
        step = 0;
        nextStep();
    }

    function setCarry() {
        console.log('setCarry()');
        var val = 0;
        carry = { 'c01':null, 'c02':null, 'c20':null, 'c21':null };
        val = nums.n03 * nums.n13;
        if (val > 9) { carry.c02 = numAtIndex(val, 10); }
        val = nums.n03 * nums.n12;
        if (val > 9) { carry.c01 = numAtIndex(val, 10); }
        val = nums.n22 + nums.n32;
        if (val > 9) { carry.c21 = numAtIndex(val, 10); }
        // must follow n22/32 calc
        val = nums.n21 + nums.n31;
        if (carry.c21) { val += carry.c21; }
        if (val > 9) { carry.c20 = numAtIndex(val, 10); }
    }

    // return a position digit in an integer where index is 1, 10, 100, 1000
    function numAtIndex(num_in, index) {
        //console.log('numAtIndex(num_in, index)');
        //console.log(num_in, index);
        if (index === 1 || num_in < 10) { return num_in % 10; }
        // move tens to ones spot
        num_in = parseInt(num_in / 10, 10);
        if (index === 10 || num_in < 10) { return num_in % 10; }
        // move hundreds to ones spot
        num_in = parseInt(num_in / 10, 10);
        if (index === 100 || num_in < 10) { return num_in % 10; }
        return parseInt(num_in / 10, 10);
        if (index === 1000 || num_in < 10) { return num_in % 10; }
        return parseInt(num_in / 10, 10);
    }

    // setup a print problem such that the problem_str is available
    function printProblemSetup() {
        console.log('printProblemSetup()');
        equationSetup();
        problem_str = '' + rows.r0 + '|';
        problem_str += rows.r1 + '|' + rows.r4 + '|x';
        console.log(problem_str);
    }
//
// >>> EQUATION:end
//
//
//
// >>> LAYOUT:start
//

    // set a number to the path
    function lo_numberSet(id, value) {
        console.log('lo_numberSet(id, value)');
        var path = getNums(value);
        var idnum = 'm2_num_' + id;
        mydoc.getElementById(idnum).innerHTML = path;
    }


    // show the M2 container elements
    function lo_showM2() {
        console.log('lo_showM2()');
        mydoc.getElementById('m2_bkgds').style.display = 'block';
        mydoc.getElementById('m2_bkgds').style.visibility = 'visible';
        mydoc.getElementById('m2_numbers').style.display = 'block';
        mydoc.getElementById('m2_numbers').style.visibility = 'visible';
        mydoc.getElementById('m2_operator').style.visibility = 'visible';
        mydoc.getElementById('m2_line_total').style.visibility = 'visible';
        mydoc.getElementById('m2').style.display = 'block';
        mydoc.getElementById('svg_m2_container').style.display = 'block';
        mydoc.getElementById('div_m2_container').style.display = 'block';
        mydoc.getElementById('m2_num_03').style.display = 'block';
    }

    // layout row0 and row1 (above first total line numbers)
    function lo_rows0And1() {
        console.log('lo_rows0And1()');
        mydoc.getElementById('m2_num_03').innerHTML = getNums(nums.n03);
        mydoc.getElementById('m2_num_02').innerHTML = getNums(nums.n02);
        mydoc.getElementById('m2_num_13').innerHTML = getNums(nums.n13);
        mydoc.getElementById('m2_num_12').innerHTML = getNums(nums.n12);
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

    // set num bkgds eg ids_in = 03.13 sets 03+13 if is '' then all are set
    function lo_bkgdNumsSet(ids_in, class_str) {
        console.log('lo_bkgdNumsSet(ids_in, class_str)', ids_in, class_str);
        var i = 0;
        var j = 0;
        var id = '';
        for (i=0; i<bkgds_rows; i++) {
            for (j=0; j<bkgds_cols; j++) {
                id = module + '_bkgd_' + i + j;
                if (ids_in.length === 0) {
                    lo_setAttribute(id, 'class', class_str);
                } else {
                    if (ids_in.indexOf(''+i+j) > -1) {
                        lo_setAttribute(id, 'class', class_str);
                    }
                }
            }
        }
    }

    // clear all elements of M2 equation svg elements
    function lo_clearEquation() {
        console.log('lo_clearEquation(ev)');
        var i = 0;
        var j = 0;
        var id = '';
        lo_bkgdNumsSet('', 'r2white');
        for (i=0; i<5; i++) {
            for (j=0; j<4; j++) {
                id = 'm2_num_' + i + j;
                lo_setInnerHtml(id, '');
                id = 'm2_c' + i + j + '_num';
                lo_setInnerHtml(id, '');
                id = 'm2_c' + i + j + '_box';
                lo_setStyleDisplay(id, 'none');
            }
        }
        mydoc.getElementById('m2_hide').style.display = 'none';
        mydoc.getElementById('m2_line_total2').style.display = 'none';
    }

    // set paths for total lines and operator
    function lo_linesAndOperatorSetup() {
        console.log('lo_linesAndOperatortSetup()');
        var path = getSyms('multiply');
        var tform = getTransforms('multiply');
        path = path.replace('/>', ' ' + tform + '/>');
        mydoc.getElementById('m2_operator').innerHTML = path;
        path = getSyms('line_total');
        tform = getTransforms('linem2');
        path = path.replace('/>', ' ' + tform + '/>');
        mydoc.getElementById('m2_line_total').innerHTML = path;
        mydoc.getElementById('m2_line_total2').innerHTML = path;
    }

    // center the m2 container
    function lo_centerContainer() {
        console.log('lo_centerContainer()');
        var cwidth = mydoc.body.clientWidth;
        var mleft = parseInt((cwidth-600)/2, 10);
        mydoc.getElementById('div_m2_container').style.left = '0px';
        mydoc.getElementById('div_d3_container').style.left = '0px';
        if (cwidth > 602) {
            mydoc.getElementById('div_m2_container').style.left = mleft + 'px';
            mydoc.getElementById('div_d3_container').style.left = mleft + 'px';
        } else {
            mydoc.getElementById('div_m2_container').style.left = '0px';
            mydoc.getElementById('div_d3_container').style.left = '0px';
        }
    }
//
// >>> LAYOUT:end
//
//
// >>> --------------------------------GETSET:start
//

    // set level
    function setLevel(value) {
        level = value;
    }

    // set bkgd rows & cols count
    function setBkgdsRowsCols(rows, cols) {
        bkgds_rows = rows;
        bkgds_cols = cols;
    }

    // set module (m2 or d3)
    function setModule(mod_in) {
        console.log('setModule()', mod_in);
        module = mod_in;
        RMM_STATSLIVE.displayUserCounts(mod_in, false);
    }

    // initial counters & controls when starting M2 session
    function setCounters() {
        console.log('setCounters()');
        session = Date.now();
        console.warn(session, 'session');
        count_problem = 1;
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

    // initialize M2 grid with some value to assess layout (dev only fnc)
    function showAllM2(ev) {
        console.log('showAllM2(ev)');
        var i = 0;
        var j = 0;
        var id = 'm2_num_';
        var val = null;
        var path = getSyms('multiply');
        var tform = getTransforms('multiply');
        path = path.replace('/>', ' ' + tform + '/>');
        lo_centerContainer();
        lo_showM2();
        // ASM functions
        RMM_ASM.setModule('m2');
        //RMM_ASM.setAnswers([758, 826, 456, 578]);
        RMM_ASM.setAnswers([678, 678, 678, 678]);
        RMM_ASM.setLevelDone(0);
        RMM_ASM.answerButtonClassReset();
        RMM_ASM.layoutAnswerButtons();
        RMM_ASM.layoutVerdict(null, 'check');
        //layoutAnswerNumFill must follow layoutVerdict
        RMM_ASM.layoutAnswerNumFill(null, '#000');
        mydoc.getElementById('m2_operator').innerHTML = path;
        path = getSyms('line_total');
        tform = getTransforms('linem2');
        path = path.replace('/>', ' ' + tform + '/>');
        mydoc.getElementById('m2_line_total').innerHTML = path;
        mydoc.getElementById('m2_line_total2').innerHTML = path;
        for (i=0; i<5; i++) {
            for (j=0; j<4; j++) {
                val = getNums(RMM_ASM.getRandInt(0, 10));
                try {
                    mydoc.getElementById(id+i+j).innerHTML = val;
                } catch(err) {
                }
            }
        }
        RMM_ASM.hideAll();
        path = getNums(8);
        tform = getTransforms('borrow_carry_number');
        path = path.replace('/>', ' ' + tform + '/>');
        mydoc.getElementById('m2_c01_num').innerHTML = path;
        mydoc.getElementById('m2_c02_num').innerHTML = path;
        mydoc.getElementById('m2_c21_num').innerHTML = path;
        mydoc.getElementById('m2_c20_num').innerHTML = path;
        mydoc.getElementById('m2_c01_num').style.display = 'block';
        mydoc.getElementById('m2_c02_num').style.display = 'block';
        mydoc.getElementById('m2_c21_num').style.display = 'block';
        mydoc.getElementById('m2_c20_num').style.display = 'block';
        mydoc.getElementById('m2_c01_box').style.display = 'block';
        mydoc.getElementById('m2_c02_box').style.display = 'block';
        mydoc.getElementById('m2_c21_box').style.display = 'block';
        mydoc.getElementById('m2_c20_box').style.display = 'block';
        mydoc.getElementById('div_m2_container').style.display = 'block';
        mydoc.getElementById('svg_m2_container').style.display = 'block';
        mydoc.getElementById('m2').style.display = 'block';
        mydoc.getElementById('div_m2_container').style.display = 'block';
        mydoc.getElementById('m2_verdict_0').style.display = 'block';
        mydoc.getElementById('m2_verdict_1').style.display = 'block';
        mydoc.getElementById('m2_verdict_2').style.display = 'block';
        mydoc.getElementById('m2_verdict_3').style.display = 'block';
    }
//
// >>> DEVELOPER:end
//
    return {
        showAllM2 : showAllM2,
        nextM2Equation : nextM2Equation,
        correctAnswerHandler : correctAnswerHandler,
        carryNoteContinue : carryNoteContinue,
        numAtIndex : numAtIndex,
        lo_centerContainer : lo_centerContainer,
        lo_bkgdNumsSet : lo_bkgdNumsSet,
        lo_setAttribute : lo_setAttribute,
        finalMessage : finalMessage,
        continueNoAnswerClick : continueNoAnswerClick,
        chunkShow : chunkShow,
        printProblemSetup : printProblemSetup,
        getProblemStr : getProblemStr,
        // getters + setters
        setLevel : setLevel,
        setBkgdsRowsCols : setBkgdsRowsCols,
        setModule : setModule,
        setCounters : setCounters
    };
})();
