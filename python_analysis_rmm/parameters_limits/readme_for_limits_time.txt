The time limits are used to avoid including excessively long answer times.

These most likely occur when your child was distracted when a problem was initially shown.

For example a text hit their phone just when they started a new problem.

It is recommended that you use the default time limits found in the file:
limits_time_default.txt

This file is in the same folder as this readme:
/rmm_analysis_python/parameters_limits

If limits_time_default.txt is the only file with time limits in this folder, the time limits are loaded automatically.

If you want to use different time limits, copy limits_time_default.txt to another file in the same folder.

Change the last part of this file name "default" to your child's name. Then edit the file using any regular text editor.

When editing the file, you will see the lines below:
a1=45
s1=45
m1=45
a2=80
s2=80
a3=100
s3=100
m2=140
d3=150

The only changes you can make to these lines is to change the number value. The numbers represent the time limit that will be classified as an "outlier" and not included in the answer times analyses.

For example: If you child is doing a 1-digit addition problem, got a text, and took 122 seconds to respond, that value is not less than 45 (a1=45), so it is not included in the analysis.

The problem typs are:
a1 : addition 1-digit
s1 : subtraction 1-digit
m1 : multiplication 1-digit
a2 : addition 2-digits
s2 : subtraction 2-digits
a3 : addition 3-digits
s3 : subtraction 3-digits
m2 : multiplication 2-digits
d3 : long division