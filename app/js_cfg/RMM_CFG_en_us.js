 RMM_CFG = (function() {
    var str = {
        TXT_tens : 'tens',
        TXT_hundreds : 'hundreds',
        TXT_continue : 'Continue',
        TXT_start : 'Start',
        TXT_off : 'off',
        TXT_on : 'on',
        TXT_history : 'History',
        TXT_eq_off : '=&nbsp;off',
        TXT_eq_on : '=&nbsp;on',
        TXT_add_link : 'Add Link',
        TXT_edit_link : 'Edit Link',
        TXT_exit : 'Exit',
        TXT_Total : 'Total',
        TXT_Plural_s : '&#039;s',
        TXT_Ordered : 'Ordered',
        TXT_Random : 'Random',
        TXT_Records : 'Records',
        TXT_Seconds : 'Seconds',
        TXT_Remainder : 'Remainder',
        TXT_next_prob : 'Next Problem',
        TXT_next_10 : 'Do 10s next',
        TXT_next_100 : 'Do 100s next',
        TXT_borrow_needed : 'Borrowing is needed',
        TXT_borrow_continue : 'click to continue',
        TXT_settings_current : 'Current Settings:',
        TXT_user_name : 'User name',
        TXT_user_current : '<span style="font-size:80%;">(<span style="color:#0000e6">REPLACE_user</span> is the current user.)</span>',
        TXT_problem_type : 'Problem type',
        TXT_level_not_set : 'Not setup',
        TXT_include_answers : 'Include Answers',
        TXT_data_loading : 'Loading Data <span style="font-size:75%;">( REPLACE_count )</span>',
        TXT_data_deleting : 'Delete Processing <span style="font-size:75%;">( REPLACE_count )</span>',
        TXT_delete_all_prints : 'Delete All Prints',
        TXT_print_page_exit : '&nbsp;&nbsp;<span style="font-size:80%;">(click to exit)</span>',
        TXT_input_device : 'Please enter a simple device name like PC, Phone, or Tablet.<br>You will only do this once on this device.<br><span style="font-size:90%;">(limit entry to: a-z, A-Z, 0-9, or - [dash] )</span>',
        TXT_input_user : 'Please enter a user name - simple names or nick-names work best.<br><span style="font-size:90%;">(limit entry to: a-z, A-Z, 0-9, or - [dash] )</span>',
        TXT_after_borrow : 'after borrowing a ten',
        TXT_borrow_receives : 'To subtract REPLACE_row1 from REPLACE_row0<span style="font-size:70%;">REPLACE_after_borrow</span><br>you <span style="color:#0000e6">borrow</span><span style="font-size:70%;"> (regroup)</span> <span style="color:#0000e6">one ten</span> from the  <span style="background-color:#ddd;">&nbsp;REPLACE_c_gives&nbsp;</span>.<br>The new numbers are:<br><span style="color:#0000e6"><b>REPLACE_n_gets</b></span>REPLACE_dbl_note in the <span style="background-color:#ddd;">&nbsp;REPLACE_c_gets&nbsp;</span><br><span style="color:#0000e6"><b>REPLACE_n_gives</b></span> in the <span style="background-color:#ddd;">&nbsp;REPLACE_c_gives&nbsp;</span>',
        TXT_carry_add : 'The answer is <b>REPLACE_ANSWER</b> (<span style="font-weight:bold;color:#0000e6">REPLACE_ONES </span><span style="font-size:80%;background-color:#ddd;"> REPLACE_COLA</span> + <span style="font-weight:bold;color:#0000e6">1 </span><span style="font-size:80%;background-color:#ddd;"> REPLACE_COLB</span>).<br>The <b>REPLACE_VALUE</b> stays in the <span style="font-size:80%;background-color:#ddd;">REPLACE_COLA</span> column.<br></b>The <b>1</b> is carried forward above the <span style="font-size:80%;background-color:#ddd;">REPLACE_COLB</span> column.<br>This <span style="color:#0000e6">carry forward</span> is added into the <span style="font-size:80%;background-color:#ddd;">REPLACE_COLB</span> column.',
        TXT_carry_next : 'Remember the <span style="color:blue;">carry forward</span><br>when adding the column.',
        TXT_carry_remember : '<span style="font-size:85%;">Remember to add the <span style="color:blue;">carry forward</span> to the product.</span>',
        TXT_final_message : 'Congratulations this problem is solved.<br><br>Click the New Problem button above to do another.',
        TXT_usage_days : 'Days Previous',
        TXT_usage_problems : 'Problems Done',
        TXT_usage_stats_for : 'Stats for',
        TXT_stats_type_charts : 'Problem Solving Charts',
        TXT_chunk_it : 'Chunk It',
        TXT_level : 'Level',
        TXT_level_a1 : 'Addition (one digit)',
        TXT_level_a2 : 'Addition (two digits)',
        TXT_level_a3 : 'Addition (three digits)',
        TXT_level_s1 : 'Subtraction (one digit)',
        TXT_level_s2 : 'Subtraction (two digits)',
        TXT_level_s3 : 'Subtraction (three digits)',
        TXT_level_m1 : 'Multiplication (one digit)',
        TXT_level_m2b : 'Multiplication Steps (two digits)',
        TXT_level_m2c : 'Multiplication Chunk (two digits)',
        TXT_level_d3 : 'Long Division',
        // the following are used for usage stats detail
        // leading number is used for final sort() so do not change 00_, 01_, etc.
        TXT_use_a1 : '00_Add 1-digit',
        TXT_use_a2 : '01_Add 2-digits',
        TXT_use_a3 : '02_Add 3-digits',
        TXT_use_s1 : '03_Subtract 1-digit',
        TXT_use_s2 : '04_Subtract 2-digits',
        TXT_use_s3 : '05_Subtract 3-digits',
        TXT_use_m1 : '06_Multiply 1-digit',
        TXT_use_m2 : '07_Multiply 2-digits',
        TXT_use_d3 : '08_Long Division',
        TXT_user_delete_info : 'Select the user name you want to <span style="color:#0000e6;">Delete</span>.',
        TXT_user_load_info : 'Select the user name you want to use.<br>The current user is: <span style="color:#0000e6;">REPLACE_name</span>.',
        TXT_print_load_info : 'Select the print page you want to <span style="color:#0000e6;">Load</span> using the ID at the top left corner on the printed page.',
        TXT_print_delete_info : 'Select the print page you want to <span style="color:#0000e6;">Delete</span> using the ID at the top left corner on the printed page.',
        TXT_print_confirm_delete_all : 'Are you sure you want to delete all prints ?',
        TXT_asm_test_stats : 'Congratulations you finished. Your test measures are:<br><br>REPLACE_avg = average seconds to answer<br><br>REPLACE_min1&#8212;REPLACE_min2 = 1st&#8212;2nd fastest answers<br><br>REPLACE_max1&#8212;REPLACE_max2 = 1st&#8212;2nd slowest answers<br><br>Tries needed:  One=REPLACE_ans1,  Two=REPLACE_ans2,  Three=REPLACE_ans3, Four=REPLACE_ans4',
        TXT_print_menu_text : '<b>Print Worksheets</b><div style="font-size:90%;margin-top:15px;text-align:left;">When you create a new print worksheet, the problems match your current problems setting:&nbsp;&nbsp;<span style="font-weight:bold;font-size:85%;color:#0000e6;">REPLACE_LEVEL</span>. To see a sheet with answers use <u>Load Previous</u>.</div>',
        TXT_chart_basic : 'This chart is a <u>very good</u> measure of capability. The <span style="color:blue;">blue line</span> is answer time. <b><span style="color:red">Red</span></b> circles are number of tries to answer (1-4). <b>Black</b> circles are answers > 30 seconds (click to show value).',
        TXT_chart_advanced : 'This chart is an approximate measure of capability. The <span style="color:blue;">blue line</span> is total time to solve a problem with multiple steps. <b>Black</b> circles are answers > 60 seconds (click to show value). ',
        TXT_chart_avg : 'Note: REPLACE_times answers were averaged to fit 100 chart data points.',
        TXT_chart_pts : 'Note: there are REPLACE_times chart data points.',
        TXT_stats_lifetime : 'Lifetime Total:<br>',
        TXT_sync_link_text : 'Click the Add/Edit button next to the <span style="color:blue;">User Name</span> (9 digit id) to set up the Google Sheet link. <span style="font-size:80%;">Note: You must first have the sheet link info:<br>&nbsp;&nbsp;&nbsp;1) The <u>passcode</u> in user sheet cell A1, and<br>&nbsp;&nbsp;&nbsp;2) The long <u>link url</u> you should have in control sheet cell A7.</span>',
        TXT_sync_process_select : 'Click on the User <span style=font-size:80%>(ID)</span> to sync that user.<br><br><span style="color:#a10000;">Note:</span>&nbsp;&nbsp;It can take a minute or more to complete the sync. The longest duration steps will have the message: <u>Please be Patient</u>.',
        //////INF_test_intro : 'Welcome to the proficiency test.<br><br>Please try to answer each problem quickly and accurately.||The timer starts when the problem starts.<br>It stops when you answer correctly.<br><br>So you can relax when <b>Next</b> or <b>Start</b> are displayed.||When the <b>Next</b> or <b>Start</b> buttons show,<br>click anywhere for the next problem.<br><br>To move to the right answer quickly,<br>you should click in the middle of the answers box.||The Start button, and a blank problem are next.<br><br>This is the start of the test.',
        MSG_level_not_set : 'You need to choose a Problem Type for this user',
        MSG_no_usage_data : 'Sorry there is no usage data.',
        MSG_no_session_data : 'Sorry there is no usage data. You need to do some problems first (not as Guest user).',
        MSG_answers_access : 'If you need the answers for this page, use the Load Previous Prints option to open it.',
        MSG_user_name_exists : 'Sorry that name has already been setup.',
        MSG_print_level_needed : 'Sorry, you have to set up your Problem Type before creating a page of printed problems.',
        MSG_moment_please : 'Moment Please',
        MSG_print_moment : 'Moment Please:<br>Building print problems',
        MSG_double_borrow : 'Remember the 10s number was -1 so it is now 9 (0-1+10)',
        MSG_db_not_supported : 'Your browser does not support local database storage. The only user will be Guest. Usage analysis will not be available.',
        MSG_db_timeout : 'Sorry there was a database timeout. Please close then reopen the app.',
        MSG_db_setup_nf : 'Sorry the database setup record was not found. Guest will be the user.',
        MSG_m1_startend_mismatch : 'Sorry when start is 10 end must be 20.',
        MSG_input_needed : 'Please make an entry.',
        MSG_user_needed : 'Please enter the user name.',
        MSG_iduser_needed : 'Please enter the 9-digit User ID.',
        MSG_9digits_needed : 'User ID must be exactly 9 digits (no spaces, letters, or leading zeros).',
        MSG_leading_digit_error : 'Sorry that 9-digit number is invalid',
        MSG_no_special_characters : 'Please limit entry to the characters shown.',
        MSG_sync_iduser_exists : 'That ID User has already been entered.',
        MSG_sync_user_added : 'The user has been added. Please note that we added a "+" to the name (REPLACE_NAME) to mark it as a sync user from another device.',
        MSG_sync_process_step1 : 'Syncing Data<br><span style="color:#0000b3;">(step 1 of 6)</span><br>Moment Please',
        MSG_sync_process_step2 : 'Syncing Data<br><span style="color:#0000b3;">(step 2 of 6)</span><br>Please Be Patient',
        MSG_sync_process_step3 : 'Syncing Data<br><span style="color:#0000b3;">(step 3 of 6)</span><br>Adding Records',
        MSG_sync_process_step4 : 'Syncing Data<br><span style="color:#0000b3;">(step 4 of 6)</span><br>Please Be Patient',
        MSG_sync_process_step5 : 'Syncing Data<br><span style="color:#0000b3;">(step 5 of 6)</span><br>Moment Please',
        MSG_sync_process_step6 : 'Syncing Data<br><span style="color:#0000b3;">(step 6 of 6)</span><br>Moment Please',
        MSG_sync_process_step99 : 'Syncing Data<br><span style="color:#0000b3;">finished</span><br>Moment Please',
        MSG_sync_process_final_ok : 'OK: Sync upload for REPLACE_user completed successfully.',
        MSG_sync_process_final_no_recs : 'OK: Sync upload for REPLACE_user already complete - skipping third step.',
        MSG_sync_process_final_err : 'ERROR: Sync upload for REPLACE_user did not complete.',
        MSG_name_not_guest : 'Sorry, but the name Guest is reserved. Please use another name.',
        MSG_guest_no_delete : 'Sorry, but the Guest name is reserved, and cannot be deleted.',
        MSG_no_print_recs : 'Sorry no print records were found. Please create one.',
        MSG_no_user_recs : 'Sorry no user records were found. Please create one.',
        MSG_no_link_user_recs : 'Sorry no sync capable users were found. Please add the Google Sheet link to at least one user.',
        MSG_print_delete_warning : 'Warning: you are about to delete print worksheets.',
        MSG_invalid_chars : 'Please limit entry using a-z, A-Z, 0-9, or - (dash). We updated your entry by removing these.',
        MSG_user_add_done : '<span style="font-weight:bold;color:#0000e6">REPLACE_name</span> has been created, and is now the current user.',
        MSG_device_entry_done : 'The device name is set. To change your problem type, user name &amp; other stuff by clicking the gear icon to access the <span class="help_hi">Settings</span> menu (opens next).',
        MSG_user_delete_confirm : 'Please confirm you want to delete all data for user: REPLACE_name',
        MSG_user_delete_complete : 'REPLACE_name has been deleted, and Guest has been set as the current user.',
        MSG_change_to_sync_user_add : 'Click on the Sync button, and add a sync user. Note: you will need the user name and id number from the other device.',
        MSG_export_not_supported : 'Sorry but this device does not support the commonly used process to save files. Please try again using a personal computer.',
        MSG_sync_key_update_failed : 'Sorry could not update the sync_key',
        DAT_guest : 'Guest',
        HLP_m1_options : '<span class="help_hi">Number</span> is the number to pactice: 5 for example.<br><br><span class="help_hi">Ordered or Random</span> When ordered is selected, the problems advance from zero to the highest number: 5x0=0, 5x1=5, 5x2=10, etc.<br><br><span class="help_hi">Start Number</span> determines if the problems start at zero or eleven.<br><br><span class="help_hi">End Number</span> determines if the problems end at ten or twenty.<br><br><span style="font-size:80%;">Note: When starting out, it is easiest to do 0-10 ordered. Then do 11-20 ordered. Once you are good at both, do some additional practice using 0-20 random.</span>',
        HLP_tog_notes : '<div class="help_notes_header">Popups</div><div class="help_notes_line"><span class="help_hi">Number Position</span> identifies the next number position (10s or 100s) to be answered when doing multi-step addition or subtraction problems. Click/tap anywhwere to advance.</div><div class="help_notes_line"><span class="help_hi">Borrow Needed</span> shows the <u>Borrowing Needed</u> popup when the upcoming problem is a multi-step subtraction requiring borrows. Click/tap anywhere to advance.</div><div class="help_notes_line"><span class="help_hi">Next Problem</span> is shown after completing the problem. It allows the final solution to be viewed prior to moving on to the next problem. Click/tap anywhere to advance.</div><div class="help_notes_empty_line"></div><div class="help_notes_header">Explanations</div><div class="help_notes_line"><span class="help_hi">Carry Forward</span> appears below 2-digit and 3-digit addition problems when a carry forward is made.<span style="font-size:90%;"> <b>Note:</b> when the carry forward explanation is shown, the <u>Number Position</u> popup will always show when a carry is made.</span></div><div class="help_notes_line"><span class="help_hi">Borrow Explanation</span> is a note shown below a subtraction problems explaining how borrows between the ones, tens, and hundreds is done.</div><div class="help_notes_empty_line"><div class="help_notes_header">Helpers</div><div class="help_notes_line"><span class="help_hi">Chunk It</span> is information shown for a one-digit multiply problems explaining how to break the problem into its ones plus tens components.</div><div class="help_notes_footer">Note: When starting out, it is best to show all the <u>notes &amp; popups.</u> They do, though, slow down problem solving, so try to turn them off once the process for each level of arithmetic is well-understood. <u>Chunk It</u> has value by helping to see how to simplify a problem. Be careful, though, ensure it is not over-used.</div>',
        D3_wrap : 'Congratulations. The final subtraction result is zero, so this problem is finished.',
        D3_wrap_07 : 'Congratulations. The final subtraction is zero:<br><span style="color:blue;">&nbsp;&nbsp;&nbsp;REPLACE_num0&nbsp;-&nbsp;(REPLACE_num1&nbsp;x&nbsp;REPLACE_num2)&nbsp;=&nbsp;0</span><br>so this problem is finished. <span style="font-size:75%;"><br>(We did not have room to show this.)</span>',
        D3_00 : 'Step REPLACE_step: How many times does <span style="color:blue;">REPLACE_num0</span> go into <span style="color:blue;">REPLACE_num1</span>?',
        D3_01 : 'Step REPLACE_step: Now subtract <span style="color:blue;">REPLACE_num0</span> - <span style="color:blue;">REPLACE_num1</span>.',
        D3_02 : 'Step REPLACE_step: Move the <span style="color:blue;">REPLACE_num0</span> down <span style="font-size:75%;">(we did this for you)</span>. How many times does <span style="color:blue;">REPLACE_num1</span> go into <span style="color:blue;">REPLACE_num2</span>?',
        D3_03 : 'Step REPLACE_step: Now subtract <span style="color:blue;">REPLACE_num0</span> - <span style="color:blue;">REPLACE_num1</span>.',
        D3_04 : 'Step REPLACE_step: Move the <span style="color:blue;">REPLACE_num0</span> down <span style="font-size:75%;">(we did this for you)</span>. How many times does <span style="color:blue;">REPLACE_num1</span> go into <span style="color:blue;">REPLACE_num2</span>?',
        D3_04d : 'Step REPLACE_step: Move a <span style="color:blue;">0</span> down from the <span style="color:blue;">tenths</span> position <span style="font-size:75%;">(we did this for you)</span>. How many times does <span style="color:blue;">REPLACE_num0</span> go into <span style="color:blue;">REPLACE_num1</span>?',
        D3_05 : 'Step REPLACE_step: Now subtract <span style="color:blue;">REPLACE_num0</span> - <span style="color:blue;">REPLACE_num1</span>.',
        D3_06 : 'Step REPLACE_step: Move a <span style="color:blue;">0</span> down from the <span style="color:blue;">tenths</span> position <span style="font-size:75%;">(we did this for you)</span>. How many times does <span style="color:blue;">REPLACE_num0</span> go into <span style="color:blue;">REPLACE_num1</span>?',
        BASIC_M2_00 : 'Step REPLACE_step: Multiply <span style="color:blue;">REPLACE_num0 x REPLACE_num1</span>. <span style="font-size:85%;">(Put the ones answer in the totals line.)</span>',
        BASIC_M2_01 : 'Step REPLACE_step: Multiply <span style="color:blue;">REPLACE_num0 x REPLACE_num1</span>. <span style="font-size:85%;">(Put answer in the totals line starting in the tens position.)</span>',
        BASIC_M2_02 : 'Step REPLACE_step: Multiply <span style="color:blue;">REPLACE_num0 x REPLACE_num1</span>. <span style="font-size:85%;">(Put answer in the totals line starting in the tens position.)</span>',
        BASIC_M2_03 : 'Step REPLACE_step: Multiply <span style="color:blue;">REPLACE_num0 x REPLACE_num1</span>. <span style="font-size:85%;">(Put answer in the totals line starting in the tens position.)</span>',
        BASIC_M2_04 : 'Step REPLACE_step: We now start adding. Move the <span style="color:blue;">REPLACE_ones</span> to the new totals line (we did that for you). Next add <span style="color:blue;">REPLACE_num0 + REPLACE_num1</span>.',
        BASIC_M2_05 : 'Step REPLACE_step: Add <span style="color:blue;">REPLACE_num0 + REPLACE_num1</span>.',
        BASIC_M2_05c : 'Step REPLACE_step: Put the sum of the <span style="color:blue;">REPLACE_num0</span> and the carry value <span style="color:blue;">1</span> into the hundreds answer. (We did this for you.)',
        BASIC_M2_05m : 'Step REPLACE_step: Move the hundreds value <span style="color:blue;">REPLACE_num0</span> to the totals line. (We did this for you.)',
        BASIC_M2_06c : 'Step REPLACE_step: Put the sum of the <span style="color:blue;">REPLACE_num0</span> and the carry value <span style="color:blue;">REPLACE_num1</span> into the thousands answer. (We did this for you.)',
        BASIC_M2_06cm : 'Step REPLACE_step: Move the carry value <span style="color:blue;">REPLACE_num0</span> into the total list. (We did this for you.)',
        BASIC_M2_06 : 'Step REPLACE_step: Move the <span style="color:blue;">REPLACE_num0</span> into the thousands answer. (We did this for you.)',
        CHUNK_M2_00 : 'Step REPLACE_step: Multiply <span style="color:blue;">REPLACE_num0 x REPLACE_num1</span>.',
        CHUNK_M2_01 : 'Step REPLACE_step: Multiply <span style="color:blue;">REPLACE_num0 x REPLACE_num1</span>.',
        CM2_multiply : '<span style="color:blue;">Note:&nbsp</span>The REPLACE_place value from <span style="color:blue;">REPLACE_correct</span> (<span style="color:blue;">REPLACE_carryint</span>) is a carry forward. It is added to the next product.',
        // need double quotes here as SYNC_link_saved is shown in an alert()
        SYNC_link_saved : "REPLACE_sync_user's sync URL and password were validated and saved.",
        SYNC_test_error_404 : 'The Google Sheet URL is incorrect, or you are not on-line. The link test failed, so the user link was not saved.',
        SYNC_src_error_404 : 'You are not on-line, or the Google Sheet URL is no longer available. Please investigate, and try again later.',
        SYNC_error_offline : 'It appears you are not on-line. Please investigate, and try later.',
        SYNC_error_pwd : 'The password is incorrect. The link test failed, so the user link was not saved.',
        SYNC_error_control : 'Cell A1 in the control sheet of the Google Sheet is not set to the unlocked integer value: 1',
        SYNC_error_syncKey : 'Cell A4 in the control sheet of the Google Sheet does not match your 60 charcter sync_key. Use the "Show Sync Key" button to get the correct 60 character sync key value. Copy this and paste in into cell A4 in the control sheet. ',
        SYNC_error_sheetNF : 'The Google Sheet does not have a sheet named: REPLACE_sync_iduser (the user ID). The link test failed, so the user link was not saved.',
        SYNC_error_other : 'Something is wrong with the Google Sheet (REPLACE_error). The link test failed, so the user link was not saved.'
        };
    // innerHtml is used to localize buttons, divs, etc.
    var innerHtml = {
        b_m2_type_basic : 'Basic process with carries',
        b_m2_type_chunk : 'Advanced chunking process',
        b_menu_add : 'Addition',
        b_menu_sub : 'Subtraction',
        b_menu_mul : 'Multiply One Number',
        b_menu_m2 : 'Multiply Two Numbers',
        b_menu_d3 : 'Long Division',
        b_menu_notes : 'Notes &amp; Popups',
        b_menu_user : 'User Setup',
        b_menu_levels : 'Problem Type',
        b_menu_levels_exit : 'Exit',
        b_menu_digits_exit : 'Exit',
        b_menu_subneg_exit : 'Exit',
        b_menu_subborrow_exit : 'Exit',
        b_menu_m1_options_exit : 'Exit',
        b_menu_print : 'Pencil &amp; Paper',
        b_menu_stats : 'Stats',
        b_menu_sync : 'Sync',
        b_menu_exit : 'Exit',
        b_menu_help : 'Continue',
        b_print_create : 'New Worksheet',
        b_print_load : 'Load Previous',
        b_print_delete : 'Delete Previous',
        b_print_exit : 'Exit',
        b_user_create : 'Create New User',
        b_user_load : 'Change Current User',
        b_user_delete : 'Delete a User',
        b_user_exit : 'Exit',
        b_input1 : 'Continue',
        b_input1_exit : 'Exit',
        b_msg_exit : 'OK',
        b_m1_options_help : 'Help',
        b_digits_1 : 'One (1)',
        b_digits_2 : 'Two (2)',
        b_digits_3 : 'Three (3)',
        b_m1_options : 'Continue',
        b_tog_numpos : 'Number Position',
        b_tog_next : 'Next Problem',
        b_tog_carry : 'Carry Forward',
        b_tog_chunk : 'Chunk It',
        b_tog_borrow : 'Borrow Explanation',
        b_tog_bpopup : 'Borrow Needed',
        b_tog_exit : 'Save',
        b_tog_help : 'Help',
        b_m2_next : 'New Problem',
        b_d3_next : 'New Problem',
        div_tog_text : 'Click item below to switch it on<span style="font-size:80%;"> / </span>off',
        div_tog_popups : 'Popups',
        div_tog_explanations : 'Explanations',
        div_tog_helpers : 'Helpers',
        div_menu_main_header : 'Settings',
        div_menu_basics : 'Master Basic Arithmetic',
        div_menu_advanced : 'Use Basics to Solve Harder Problems',
        div_menu_levels_text : 'Choose Problem Type',
        div_menu_digits_text : 'Number of Digits in Problem',
        div_menu_subneg_text : 'Select how many negative answer problems you want for every 10 one-digit subtraction problems shown.',
        div_menu_subborrow_text : 'Do you want some of the subtractions to require borrowing?',
        div_menu_m1_options_text : 'Select the options for your<br>one-digit multiplication problems.',
        div_user_menu_text : 'Select the user action you want below',
        div_stats_export_close_txt : '<span style="font-size:80%;"><p>CSV Export Info (non-obvious fields)</p><hr><p><b>iduser:</b> the numeric id for the idname.<p><p><b>days:</b> days since starting RMM for this session.<p><p><b>idlevel:</b> problem type (a/s/m/d) followed by the number of digits in the problem.<p><p><b>chunked:</b> m2 problem dialog presented where <b>c</b> = Chunkit button, <b>b</b> = Basic explanation.<p><b>timestamp:</b> timestamp marking start of a problem sesssion.</p><p><b>problemNum:</b> problem number for the session.</p><p><b>Date:</b> session start date/time. <span style="font-size:80%;"><br>(Note: select either MM/DD/YYYY or DD/MM/YYYY format.)</p><p><b>time:</b> total amount of time to answer a problem.</p><p><p><b>tries:</b> for single-digit problems tries needed (1-4) to answer correctly.</p><p><p><b>ordered:</b> for single-digit multiplication the value is True for ordered (not random) equation presentation such as 2x1, 2x2, 2x3, ...</p><p><hr><p>Sort the data first on <u>idlevel</u> then <u>timestamp</u> then <u>probNum</u> to chart your child&#039;s work.<hr></span>',
        m1_digit_txt : 'Number&nbsp;&nbsp;&nbsp;',
        m1_order_txt : 'Ordered or Random&nbsp;&nbsp;&nbsp;',
        m1_start_txt : 'Start Number&nbsp;&nbsp;&nbsp;',
        m1_end_txt : 'End Number&nbsp;&nbsp;&nbsp;',
        d3_divisor_txt : 'Percent',
        d3_decimal_txt : 'Percent',
        div_menu_d3_divisor : 'Problems with a 2-digit divisor?',
        div_menu_d3_decimal : 'Problems with a decimal answer?',
        b_menu_d3_options_exit : 'Exit',
        div_menu_d3_options_text : 'Long Division',
        b_d3_options : 'Continue',
        div_stats_user_select_text : 'Stats: Select a user <span style="font-size:70%;"><br>(only users with data are shown)</span>',
        div_stats_level_select_text : 'Select the type of problem',
        div_stats_m1_select_text : 'Select the one-digit multiplication problem',
        b_chart_exit : 'Close',
        b_menu_sync_exit : 'Close',
        b_menu_sync_orig_exit : 'Close',
        b_menu_sync_user : 'Add User IDs from another device',
        b_menu_sync_orig : 'Show User IDs set up on this device',
        b_menu_sync_link : 'Add / Edit User Google Sheet Links',
        b_menu_sync_process : 'Sync this Device',
        b_menu_sync_key : 'Sync Key : Create / Update',
        div_sync_note : 'Before using Sync follow the setup procedures using at the link below <span style="font-size:80%;">(opens in a new window)</span><div style="text-align:center;margin-top:10px;"><span style="background-color:#ffffcc"><a target="_blank" href="./sync/sync_instructions_en_us.html">Click Here for Sync Setup Instructions</a></span></div>',
        div_sync_orig_note : 'The user name &amp; numeric IDs for users that were <u>originally setup</u> on this device <span style="font-size:80%;">(no &#039;name+&#039; names)</span> are shown below.<br><br>Carefully copy these fields to set up a sync user on another device. <span style="font-size:80%;"><br>(Note: Do not incude the equal (=) sign if you copy all the fields at once.)</span>',
        b_stats_type_exit : 'Exit',
        b_stats_usage_exit : 'Exit',
        b_stats_export_close_exit: 'Close',
        b_stats_type_history : 'Usage History',
        b_stats_export : 'Export Detail to CSV File',
        cb_usage_detail_txt : 'Include Problem Detail',
        cb_export_txt : 'DD/MM/YY format (MM/DD = default)',
        div_sync_add_text : 'Carefully enter the user name and User ID from another device in the fields below, then click <u>Add</u>.',
        div_sync_link_add_text : 'Carefully enter the <u>link passcode</u> and <u>link url</u>. Be sure to test the link before saving.',
        label_sync_input_iduser : 'ID User (9 digit number)',
        label_sync_input_user : 'User Name<br><span style="font-size:70%;">(limit entry to: a-z, A-Z, 0-9, or - [dash] )</span>',
        b_sync_add_user : 'Add',
        b_sync_add_user_exit : 'Cancel',
        b_sync_link_exit : 'Close',
        label_sync_input_pwd : 'Password',
        label_sync_input_url : 'Google Sheet URL',
        b_sync_add_link_test : 'Save',
        b_sync_add_link_exit : 'Cancel',
        b_sync_key_menu_exit : 'Exit',
        b_subborrow_0 : 'No',
        b_subborrow_1 : 'Yes'
    };
    // charRange is a series of strings that will be expanded into a dict
    // of numbers against which valid string entries will be verifies
    // use fromNum-toNum for a range to be expanded on single digit strings
    var charRange = ['45', '48-57', '65-90', '97-122' ];
    var print_margins = {
        page_left : 20,
        transforms : [20, 65, 110, 155, 200, 245], // transform x-position shift for each problem
        row_gap : 25,
        page_margin_top : 30,
        page_margin_left : 30
    }
    // end vars
    function getStr(id) {
        return str[id];
    }
    function getInnerHtmlDict(id) {
        return innerHtml;
    }
    function getCharRange() {
        return charRange;
    }
    function getPrintMargins() {
        return print_margins;
    }
    return {
        getStr : getStr,
        getInnerHtmlDict : getInnerHtmlDict,
        getCharRange : getCharRange,
        getPrintMargins : getPrintMargins
    };
})();
