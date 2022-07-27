<hr>
<p>For the next step you must both RMM &amp; your RightMindMath sheet open at the same time.</p>

<hr><hr>
<div class="step">Step 1</div>
<p>Navigate to the <u>Control</u> sheet in your RightMindMath browser window.</p>
<p>Click into cell <b>A1</b> and change the value to 1 (one) from 0 (zero).</p>
<p>Note: When cell A1 is zero you API is effectively closed. You should only change it to a one when you are doing sync activities.</p>
<p>In the next few steps RMM will check the sync inputs for Maria. So cell A1 needs to be one.</p>
<p><img src="../../images/img_en_us/06_01_rmm_a1_to_one.jpg"  class="img_responsive"></p></p>

<hr><hr>
<div class="step">Step 2</div>
<p>Return to RMM and click the <u>Add / Edit User Google Sheet Links</u> button inside the Sync Setting menu.</p>
<p><img src="../../images/img_en_us/06_02_click_sheet_links.jpg"  class="img_responsive"></p></p>

<hr><hr>
<div class="step">Step 3</div>
<p>A dialog appears that allows you to click to <u>Add Link</u> for your new user (Maria in this case).</p>
<p>Note: Since this is the first setup for Maria the button is green.</p>
<p>Click the <u>Add Link</u> button.</p>
<p><img src="../../images/img_en_us/06_03_click_maria.jpg"  class="img_responsive"></p></p>

<hr><hr>
<div class="step">Step 4</div>
<p>A dialog appears with two text boxes you need to fill from the RightMindMath sheet.</p>
<p>Navigate to the <u>Control</u> sheet of RightMindMath.</p>
<p>Copy the long string value from cell A8 (the sheet URL).</p>
<p>Return to RMM and paste the URL string into the lower text box.</p>
<p>Again navigate to RightMindMath, and open the sheet whose title is equal to your user&#039;s 9-digit <b>Iduser</b>.</p>
<p>Copy the pass code from cell A1.</p>
<p>Return to RMM and paste the pass code into the top text box.</p>
<p>Note: The image below shows the dialog after both text boxes have been filled for Maria.</p>
<p>Click the <u>Save</u> button.</p>
<p>The links inut dialog is replaced by a notification that RMM is testing the link setup.</p>
<p><img src="../../images/img_en_us/06_04_save_maria_links.jpg"  class="img_responsive"></p></p>

<hr><hr>
<div class="step">Step 4</div>
<p>Once the links test is done, you should see the alert message below.</p>
<p>If you get an alert that starts out "Something is wrong with the Google Sheet..." then either the URL string is wrong, or your sheet API is not running. Carefully check the sheet URL. If it is good, then revisit the Topic titled "2) Setup & Run the Sheet API" and repeat the steps for starting the API.</p>
<p>There are also alerts for the device key being wrong/missing, or the value in <u>Control</u> cell <b>A1</b> not being zero. Revisit the appropriate topics to correct these.</p>
<p>If you corrected an error, simply try the <u>Save</u> button again to re-check the links setup.</p>
<p><img src="../../images/img_en_us/06_05_test_ok_alert.jpg"  class="img_responsive"></p></p>

<hr><hr>
<div class="step">Step 5</div>
<p>After every process in which RMM talks to your Google Sheet you will get the alert below remining you to lock your API.</p>
<p>In the current case, you have no more Sync tasks so you can navigate to the <u>Control</u> sheet of RightMindMath and set cell <b>A1</b> back to zero.</p>
<p>Your sheet API is once again safely locked.</p>
<p><img src="../../images/img_en_us/06_06_change_to_zero_alert.jpg"  class="img_responsive"></p></p>

<hr><hr>
<div class="step">A new Add/Edit Dialog Look</div>
<p>Since you now have your user links setup, the button and presentaion of the user link info is different</p>
<p>For users with good, active links the <u>Edit Link</u> button is smaller, and blue.</p>
<p>The small text box to the right of the user name has the URL string (it is all there, just not all showing).</p>
<p><img src="../../images/img_en_us/06_07_maria_new_edit_button_dialog.jpg"  class="img_responsive"></p></p>
