<hr>
<p>After you have saved your copy of <u>RightMindMath</u> you need to setup and run the Appliction Program Interface (API) that the RMM app will use to sync. There are a number of steps below, but most simply involve clicking dialog buttons.<br><br>One reason for all the clicks is that Google wants to be sure that you acknowledge that creating an API can create a security risk. This is a good warning. RMM&#039;s API has been very carefully programmed to avoid these issues so you can feel safe.</p>

<hr><hr>
<div class="step">Step 1</div>
<p>Once you saved RightMindMath a windows opens with <b>your own RightMindMath</b> sheet.</p>
<p>Click on the sheet&#039;s <u>Extensions</u> menu and select <u>Apps Script</u> option. This will open the Apps Script editor in a new tab.<span style="font-size:90%;"> Note: The extensions load slowly after the sheet itself is open.  If the tab does not open, wait a minute and try again.</span></p>
<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_01a_click_apps_script.jpg"  class="img_responsive"></p></p>

<hr><hr>
<div class="step">Step 2</div>
<p>Change to the <u>Apps Script</u> tab, and click the blue <u>Deploy</u> button and select <u>New deployment</u>.</p>
<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_02a_click_deploy.jpg"  class="img_responsive"></p></p>

<hr><hr>
<div class="step">Step 3</div>
<p>After clicking <u>New deployment</u> you will be presented with the dialog box shown below. Note: initially the <u>New description</u> box will be empty.</p>
<p>Type <b>RMMSync</b> into this description box.</p>
<p>Leave the <u>Execute as</u> option as &#039;Me&#039; (or select this option if another is shown). Also leave the <u>Who has access</u> option to &#039;Anyone&#039; (or select this option if another is shown).</p>
<p>Once these options have all been set, click the big blue <u>Deploy</u> button at the bottom-right.</p>
<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_03a_describe_deploy.jpg"  class="img_responsive"></p>

<hr><hr>
<div class="step">Step 4</div>
<p>After clicking <u>Deploy</u> you will be presented with the dialog box shown below. Click the big blue <u>Authorize access</u> button.</p>
<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_04a_authorize_access.jpg"  class="img_responsive"></p>

<hr><hr>
<div class="step">Step 5</div>
<p>After clicking <u>Authorize access</u> you will be presented with the account sign-in dialog box shown below. The account listed should be the same account you use to access your Google Sheets. Click on this account to continue.</p>
<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_05a_authorize_access_sign_in.jpg"  class="img_responsive"></p>

<hr><hr>
<div class="step">Step 6</div>
<p>When you click your account name, the dialog inside the current dialog box will change to the one shown below. Ignore the big blue <u>BACK TO SAFETY</u> button. Click on the tiny, not-all-caps link that says <u>Advanced</u>.</p>
<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_06a_advanced_click.jpg"  class="img_responsive"></p>

<hr><hr>
<div class="step">Step 7</div>
<p>When you click <u>Advanced</u> the Google dialog adds a sentence about risks & trust, and another link. Click this new <u>Go to sync2_v2 (unsafe)</u> link. As noted above, the sync API has been carefully coded to be safe.</p>
<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_07a_click_goto_sync_v2.jpg"  class="img_responsive"></p>

<hr><hr>
<div class="step">Step 8</div>
<p>Finally you have clicked thru enough warnings &amp; confirmations to be ready to setup the sync_v2 API to run with your RightMindMath sheet.</p>
<p>Click the <u>Allow</u> button.</p>
<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_08a_click_allow_sync_v2.jpg"  class="img_responsive"></p>

<hr><hr>
<div class="step">Step 9</div>
<p>After clicking <u>Allow</u> in the previous step, you go back the the original Authorize dialog which will change into the <u>New deployment</u> dialog below. Ignore the long string at the top with the ID.</p>
<p>Click the <u>copy</u> button that is below the long URL in the <u>Web app</u> section.</p>
<p>After you have made sure you clicked copy (no penalty for multiple clicks), click the big blue <u>Done</u> button in the bottom-right. This will close the dialog, and leave the <u>Apps Script</u> window open.</p>
<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_09a_click_copy_url.jpg"  class="img_responsive"></p>

<hr><hr>
<div class="step">Step 10</div>
<p>Navigate back the the RightMindMath sheet window from the Apps Script window.</p>
<p>Once you are back to the RightMindMath window, paste the URL copied in the last step into cell <b>A8</b>.</p>
<p>Cell A8 is the first blue-background cell just above the text in cell A9 that starts out &#039;Copy/Paste into cell A8...&#039;. In the image below cell A8 starts out with <b>https&#058;//script.google.com</b> Your URL will start the same way, but change from that point.</p>
<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_10a_copy_paste_url.jpg"  class="img_responsive"></p>

<hr><hr>
<div class="step">Step 11</div>
<p>Navigate back to the <u>Apps Script</u> window (e.g. click its tab). You are now going to start your API. If you do not start it, it will not be active. You cannot run any sync activities from the app unless the API is running. The API stays active once you start it even after you close the sheet window, so you only need to do this once.</p>
<p>Locate the <u>Run</u> button. The button to the right if <u>Run</u> is <u>Debug</u>. Ignore Debug.</p>
<p>Immediately to the right of Debug is a drop-down selector. This selector may already show <u>aa_setup</u>. If <u>aa_setup</u> is not shown, click the selector and choose <u>aa_setup</u>.</p>
<p>Once <u>aa_setup</u> is showing, click the <u>Run</u> button. When you do this you should see an <u>Execution Log</u> pane similar to the one below (with different ID numbers, times, etc.)</p>
<p>You RMMSync API is now active, and will stay active even when you close the RightMindMath sheet.</p>

<p>You can now close the <u>Apps Script</u> window.</p>

<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_11a_run_aa_setup.jpg"  class="img_responsive"></p>
<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_11b_execution_log.jpg"  class="img_responsive"></p>


<hr><hr>
<div class="step">Accessing the URL at a later date</div>
<p>If at some later date you need the API URL string, you can access the copy dialog again. To do so, click the <u>Extensions >> Apps Script</u> menu choice. When that Apps Script window opens, click the big blue <u>Deploy</u> button and select <u>Manage deployments</u> (image one below).</p>

<p>Once <u>Manage deployments</u> is clicked, you get a dialog showing your API deployments. Click on <b>RMMSync</b> (which should already be selected). You can then copy the URL string using the <u>copy</u> button (image two below).</p>

<p>Be sure to <b><u>Cancel</u></b> the deployments dialog box &amp; close the <u>Apps Script</u> window once your copy/paste process is complete</p>

<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_12a_manage_deploy.jpg"  class="img_responsive"></p>

<p><img src="https://rightmindmath.com/html_sync//images/img_en_us/02_12b_manage_deploy_detail.jpg"  class="img_responsive"></p>
