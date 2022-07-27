<p>When you have multiple devices, you will need to follow a sequential process when syncing them.</p>
<p>The reason is that each sync both uploads records from the device, and downloads records previously uploaded.</p>
<p>So devices that sync first will not have records from later device syncs. They must be synced a second time.</p>
<p>The example below explains this. Assume we have three devices:
<ul>
<li>d_A</li>
<li>d_B</li>
<li>d_C</li>
</ul>
Each device has its own records set:
<ul>
<li>rs_A</li>
<li>rs_B</li>
<li>rs_C</li>
</ul>
</p>
<div style="margin-top:10px;"><hr></div>
<p>Here is the initial state before any syncing is done.</p>
<table>
<tr>
<th>Device</th>
<th>Recs</th>
<th>Gives</th>
<th>Gets</th>
<th>Cloud</th>
</tr>
<tr>
<td>d_A</td>
<td>rs_A</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr>
<td>d_B</td>
<td>rs_B</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr>
<td>d_C</td>
<td>rs_C</td>
<td></td>
<td></td>
<td></td>
</tr>
</table>



<div style="margin-top:25px;"><hr></div>
<p>When Device A first syncs it gives its records to the cloud. It gets nothing from the cloud.</p>
<table>
<tr>
<th>Device</th>
<th>Recs</th>
<th>Gives</th>
<th>Gets</th>
<th>Cloud</th>
</tr>
<tr>
<td>d_A</td>
<td>rs_A</td>
<td>rs_A</td>
<td></td>
<td>rs_A</td>
</tr>
<tr>
<td>d_B</td>
<td>rs_B</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr>
<td>d_C</td>
<td>rs_C</td>
<td></td>
<td></td>
<td></td>
</tr>
</table>


<div style="margin-top:25px;"><hr></div>
<p>When Device B first syncs, it gives its records to the cloud, and gets Device A&#039;s records.</p>
<table>
<tr>
<th>Device</th>
<th>Recs</th>
<th>Gives</th>
<th>Gets</th>
<th>Cloud</th>
</tr>
<tr>
<td>d_A</td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr>
<td>d_B</td>
<td>rs_A<br>rs_B</td>
<td>rs_B</td>
<td>rs_A</td>
<td>rs_A<br>rs_B</td>
</tr>
<tr>
<td>d_C</td>
<td>rs_C</td>
<td></td>
<td></td>
<td></td>
</tr>
</table>




<div style="margin-top:25px;"><hr></div>
<p>When Device C syncs, it gives its records to the cloud. It gets the records from both Device A & B. <u>Device C is 100% synced.</u></p>
<table>
<tr>
<th>Device</th>
<th>Recs</th>
<th>Gives</th>
<th>Gets</th>
<th>Cloud</th>
</tr>
<tr>
<td>d_A</td>
<td>rs_A</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr>
<td>d_B</td>
<td>rs_A<br>rs_B</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr>
<td>d_C</td>
<td>rs_A<br>rs_B<br>rs_C</td>
<td>rs_C</td>
<td>rs_A<br>rs_B</td>
<td>rs_A<br>rs_B<br>rs_C</td>
</tr>
</table>





<div style="margin-top:25px;"><hr></div>
<p>Device B must sync a second time to get the records from Device C which synced after B. <u>Device B is now 100% synced.</u></p>
<table>
<tr>
<th>Device</th>
<th>Recs</th>
<th>Gives</th>
<th>Gets</th>
<th>Cloud</th>
</tr>
<tr>
<td>d_A</td>
<td>rs_A</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr>
<td>d_B</td>
<td>rs_A<br>rs_B<br>rs_C</td>
<td></td>
<td>rs_C</td>
<td>rs_A<br>rs_B<br>rs_C</td>
</tr>
<tr>
<td>d_C</td>
<td>rs_A<br>rs_B<br>rs_C</td>
<td></td>
<td></td>
<td></td>
</tr>
</table>



<div style="margin-top:25px;"><hr></div>
<p>Device A must sync a second time to get the records from Device B &amp; C which both synced after A. <u>Device A is now 100% synced.</u></p>
<table>
<tr>
<th>Device</th>
<th>Recs</th>
<th>Gives</th>
<th>Gets</th>
<th>Cloud</th>
</tr>
<tr>
<td>d_A</td>
<td>rs_A<br>rs_B<br>rs_C</td>
<td></td>
<td>rs_B<br>rs_C</td>
<td>rs_A<br>rs_B<br>rs_C</td>
</tr>
<tr>
<td>d_B</td>
<td>rs_A<br>rs_B<br>rs_C</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr>
<td>d_C</td>
<td>rs_A<br>rs_B<br>rs_C</td>
<td></td>
<td></td>
<td></td>
</tr>
</table>
