import json
import urllib.parse
from random import randint
import datetime
import glob
import sys
import os
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

class ProcessJsonFile():
    def __init__(self, root, input_file):
        self.root = root
        self.input_file = input_file
        self.file_stem = input_file.stem
        self.output_path = None # set to Path(root/output/input_file.stem
        self.week_first = 999999
        self.week_last = -1
        self.problems_d = {}
        self.expected = {}
        self.prob_level = {}
        self.steps_done = {}
        self.file_stats = { 'lines' : 0, 'problems' : 0 }
        self.complete = {'a2':0, 'a3':0, 's2':0, 's3':0}
        self.incomplete = {'a2':[0], 'a3':[0,0], 's2':[0], 's3':[0,0]}
        self.p_multi = ['s2', 's3', 'a2', 'a3'] # idsession will have 3 parts
        # p_count['m1'] is unique with [0,0] array to sum [ordered,random]
        self.p_count = {'a1':0, 'a2':0, 'a3':0,
                        's1':0, 's2':0, 's3':0,
                        'm1':[0,0], 'm2':0, 'd3':0}
        self.dframe = {} # pandas dataframe built as file is read using df_rec
        self.rec_df = {
            # r_str vars start
            'idlevel_rstr' : None,
            'steps_total' : None,
            'steps_count' : None,
            'op1' : None,
            'op2' : None,
            'answer' : None,
            'op' : None,
            'neg_op1' : None,
            'neg_op2' : None,
            'neg_ans' : None,
            'ordered' : None,
            'm2_basic' : None,
            'ans_elapsed_01' : None,
            'ans_elapsed_12' : None,
            'ans_elapsed_23' : None,
            'ans_elapsed_34' : None,
            'borrow_01' : None,
            'borrow_10' : None,
            'problem_start' : None,
            # r_str vars end
            'idsession' : None,
            'idsession_tstamp' : None,
            'idsession_count' : None,
            'problem_multi' : None,
            'idlevel' : None,
            'idproblem' : None,
            'idproblem_count' : None,
            'problem_m2d3' : None,
            'problem_1digit' : None,
            'time' : None,
            'tries' : None,
            'elapsed' : None,
            'total_time' : None,
            'total_tries' : None,
            'outlier_max' : None,
            'outlier_std' : None,
            'input_max' : None,
            'input_std' : None,
            'tstamp' : None,
            'date_date' : None,
            'date_week' : None,
            'date_weekday' : None,
            'date_yyyymm' : None,
            'note_borrow' : None,
            'note_bpopup' : None,
            'note_carry' : None,
            'note_chunk' : None,
            'note_next' : None,
            'note_numpos' : None,
            'chunk_count' : None,
        }

    def createOutputSubfolder(self, output_in):
        self.output_path = output_in / str(self.file_stem)
        if not self.output_path.exists():
            self.output_path.mkdir()
            print('%s%s' % ('\n\n', '-'*50))
            print('OUTPUT: results for %s' % (str(self.input_file)))
            print('will be saved in the following folder:')
            print('%s' % (str(self.output_path)))
            print('-'*50)

    def parseRstr(self, r_str, tstamp, time):
        my_df = self.rec_df.copy()
        not_asm = {'d3':True, 'm2':True}
        parts = r_str.split('^')
        vars = parts[0].split('.')
        # strip the b/c from M2b M2c
        my_df['idlevel_rstr'] = vars[0]
        idlevel = vars[0][0:2]
        if (idlevel == 'm2'):
            my_df['m2_basic'] = vars[0][2:3] == 'b'
        if not idlevel in not_asm:
            my_df['steps_total'] = int(vars[1])
            my_df['steps_count'] = int(vars[2]) + 1 # change to 1=start index
            vars = parts[1].split('|')
            my_df['op1'] = int(vars[0])
            my_df['op2'] = int(vars[1])
            my_df['answer'] = int(vars[2])
            my_df['op'] = vars[3]
            if idlevel == 'm1':
                my_df['chunk_count'] = int(parts[4])
            else:
                my_df['chunk_count'] = int(parts[3])
        else:
            if idlevel == 'd3':
                vars = parts[1].split('/')
                my_df['op1'] = int(vars[0])
                my_df['op2'] = int(vars[1])
                my_df['answer'] = float(my_df['op1']) / float(my_df['op2'])
                my_df['op'] = '/'
            else:
                vars = parts[1].split('x')
                my_df['op1'] = int(vars[0])
                my_df['op2'] = int(vars[1])
                my_df['answer'] = my_df['op1'] * my_df['op2']
                my_df['op'] = 'x'
        if idlevel == 'm':
            my_df['ordered'] = parts[2] == 'true'
        if my_df['op1'] < 0: my_df['neg_op1'] = 1
        if my_df['op2'] < 0: my_df['neg_op2'] = 1
        if my_df['answer'] < 0: my_df['neg_ans'] = 1
        if idlevel in not_asm:
            my_df['chunk_count'] = int(parts[2])
            return my_df # no answers for multi-digit problems
        # break out the answers for 1-digit problems
        if not idlevel ==  'm1':
            answers = parts[2].split('|')
        else:
            answers = parts[3].split('|')
        # tstamp = now() when rec was written (ie. time of answer)
        # timet = time problem was entered - tstamp
        # so to get tstamp of time problem was entered we do this math...
        ts_last = tstamp - time
        my_df['problem_start'] = ts_last
        i = 0
        for answer in sorted(answers):
            vars = answer.split('_')
            if len(vars) == 1: continue
            ts_ans = int(vars[0])
            delta = ts_ans - ts_last
            vname = 'ans_elapsed_%d%d' % (i, (i+1))
            my_df[vname] = delta
            ts_last = ts_ans
            i += 1
        if idlevel == 's2' or idlevel == 's3':
            sop1 = my_df['op1']
            sop2 = my_df['op2']
            if (sop1 % 10) < (sop2 % 10): my_df['borrow_01'] = 1
            if idlevel == 's3':
                sop1 = int(sop1 / 10)
                sop2 = int(sop2 / 10)
                if (sop1 % 10) < (sop2 % 10): my_df['borrow_10'] = 1
        return my_df

    def buildDataFrame(self):
        id_last = '0_0'
        date_now = datetime.date.today()
        wd_ord = {'Sun':1, 'Mon':2, 'Tue':3, 'Wed':4, 'Thu':5, 'Fri':6, 'Sat':7}
        for key, rec in sorted(self.problems_d.items()):
            # fist process step must be parseRstr() to get copy() of rec_df
            my_df = self.parseRstr(rec['r_str'], rec['tstamp'], rec['time'])
            vars = rec['idsession'].split('_')
            idlevel = rec['idlevel']
            id_this = '%s_%s' % (vars[0], vars[1])
            if id_this != id_last: #reset multi accumulators
                time_last = 0
                tries_last = 0
            my_df['idproblem'] = id_this
            # idsession tstamp is basis for date inputs
            ids_tstamp = int(vars[0])
            my_df['idsession_tstamp'] = ids_tstamp
            dt = datetime.date.fromtimestamp(int(ids_tstamp/1000))
            my_df['date_date'] = int(dt.strftime('%Y%m%d'))
            my_df['date_yyyymm'] = int(my_df['date_date']/100)
            my_wd = dt.strftime('%A')[0:3] #Mon, Tue, Wed, etc.
            my_wd = '%d.%s' % (wd_ord[my_wd], my_wd)
            my_df['date_weekday'] = my_wd
            delta = date_now - dt
            my_df['date_days'] = delta.days
            my_df['date_week'] = int(delta.days/7) + 1
            if my_df['date_week'] < self.week_first:
                self.week_first = my_df['date_week']
            if my_df['date_week'] > self.week_last:
                self.week_last = my_df['date_week']
            if len(vars) == 2:
                my_df['idproblem_count'] = 1
            else:
                # record idproblem_count for first rec in multi step problem
                if int(vars[2]) == 1:
                    my_df['idproblem_count'] = 1
            for key, val in rec.items():
                if key in my_df:
                    my_df[key] = val
            if idlevel == 'm2' or idlevel == 'd3':
                my_df['problem_m2d3'] = 1
                my_df['idsession_count'] = int(vars[1])
            if idlevel == 'a1' or idlevel == 's1' or idlevel == 'm1':
                my_df['problem_1digit'] = 1
                my_df['idsession_count'] = int(vars[1])
            # accumulate multi idsession times / tries -- start
            if idlevel in self.p_multi:
                my_df['problem_multi'] = 1
                if id_this != id_last: # start of multi problem
                    my_df['total_time'] = rec['time']
                    my_df['total_tries'] = rec['tries']
                    my_df['idsession_count'] = int(vars[1])
                else:
                    my_df['total_time'] = rec['time'] + time_last
                    my_df['total_tries'] = rec['tries'] + tries_last
                time_last += rec['time']
                tries_last += rec['tries']
            id_last = id_this
            self.dframeAddRec(my_df)
        self.dframe = pd.DataFrame.from_dict(self.dframe)

    def dframeAddRec(self, my_df):
        for key, val in sorted(my_df.items()):
            array = self.dframe.setdefault(key, [])
            array.append(val)
            self.dframe[key] = array

    def readFile(self):
        uniques = {}
        with self.input_file.open() as f:
            lines = f.readlines()
        self.file_stats['lines'] = len(lines)
        for line in lines:
            dict = json.loads(line.rstrip())
            self.problems_d[dict['idsession']] = dict
            idsession = dict['idsession']
            parts = idsession.split('_')
            idsession = parts[0] + '_' + parts[1]
            if not idsession in uniques:
                uniques[idsession] = True
        self.file_stats['problems'] = len(uniques)

    def processLines(self):
        for key, dict in sorted(self.problems_d.items()):
            idsession = dict['idsession']
            idlevel = dict['idlevel']
            idprob = idsession
            if idlevel in self.p_multi:
                # reset idprob... drop step number (position 2)
                parts = idsession.split('_')
                idprob = parts[0] + '_' + parts[1]
                # set self.expected number of steps & steps done for this problem
                steps = int(idlevel[1:2])
                self.expected[idprob] = steps
                count = self.steps_done.setdefault(idprob, 0)
                count += 1
                self.steps_done[idprob] = count
            if not idprob in self.prob_level: # accumulate ONE problem count
                if idlevel == 'm1':
                    # find the right [ordered, random] array index
                    index = 0 if dict['r_str'].find('true') > -1 else 1
                    self.p_count[idlevel][index] += 1
                else:
                    # one-digit problems always have only one idsession rec
                    self.p_count[idlevel] += 1
                self.prob_level[idprob] = idlevel

    def findIncompletes(self):
        for k, v in self.expected.items():
            idlevel = self.prob_level[k]
            skipped = v - self.steps_done[k]
            if skipped == 0:
                self.complete[idlevel] += 1
                continue
            # there will be either one or two steps skipped [skip=1, skip=2]
            if skipped == 1:
                self.incomplete[idlevel][0] += 1
            if skipped == 2:
                self.incomplete[idlevel][1] += 1

    def writeLinesStats(self):
        self.findIncompletes()
        order = ['a1', 'a2', 'a3', 's1', 's2', 's3', 'm1', 'm2', 'd3']
        lines = []
        lines.append('%s lines in file' % (self.file_stats['lines']))
        lines.append('%s unique problems' % (self.file_stats['problems']))
        for key in order:
            lines.append('-'*50)
            if key == 'm1':
                val = self.p_count[key][0]
                mtot = val
                lines.append('%d %s ordered problems' % (val, key)) 
                val = self.p_count[key][1]
                mtot += val
                lines.append('%d %s random problems' % (val, key)) 
                lines.append('%d %s total problems' % (mtot, key))
            else:
                val = self.p_count[key]
                lines.append('%d %s problems' % (val, key))
            # 1-digit problems will never have incompletes
            if not key in self.p_multi: continue
            steps = int(key[1:2])
            tic = ' ' * (len(str(val)) - len(str(self.complete[key])))
            lines.append('%s%d completed %d of %d steps' % (tic, 
                                                     self.complete[key],
                                                     steps,
                                                     steps))
            if val == self.complete[key]: continue
            tic = ' ' * (len(str(val)) - len(str(self.incomplete[key][0])))
            lines.append('%s%d step 1 of %s completed' % (tic,
                                                   self.incomplete[key][0],
                                                   steps))
            if len(self.incomplete[key]) < 2: continue
            tic = ' ' * (len(str(val)) - len(str(self.incomplete[key][1])))
            lines.append('%s%d step 2 of %s completed' % (tic, 
                                                   self.incomplete[key][1],
                                                   steps))
        lines.append('-'*50)
        mypath = self.output_path / 'File_Statistics.txt'
        mypath.write_text('\n'.join(lines))
        print('%s%s' % ('\n\n', '-'*50))
        path_out = str(mypath)
        print('OUTPUT: Summary Statistics:\n%s' % (path_out))
        print('-'*50)

class ChartAnalysis():
    def __init__(self, dframe_in, year, output_path):
        self.dfc = dframe_in;
        self.output_charts = self.setOutputCharts(output_path)
        self.wsplits = self.getWeekSplits(year)
        self.order = ['a1', 'a2', 'a3', 's1', 's2', 's3', 'm1', 'm2', 'd3']
        self.show = True #show plot on screen
        self.savePlt = False # save plt to a file
        self.limits_time = {'a1':45, 's1':45, 'm1':45,
                            'a2':80, 's2':80,
                            'a3':100, 's3':100,
                            'm2':140, 'd3':150}

    def setOutputCharts(self, output_path):
        mypath = output_path / 'charts'
        mypath.mkdir(exist_ok=True)
        return mypath

    def changeTimeLimits(self):
        order_tl = ['a1', 's1', 'm1', 'a2', 's2', 'a3', 's3', 'm2', 'd3']
        print('\n\n%s%s%s' % ('-'*19, 'TIME LIMITS', '-'*19))
        for k in order_tl:
            print('%d=%s' % (self.limits_time[k], k))
        print('-'*50)
        print('The numbers above are used to ignore problems')
        print('whose response times inidicate you child was')
        print('distracted before answering. For example, the')
        print('for 1-digit addition, subtraction & multiplication')
        print('the value is 45. If your child took longer than 45')
        print('seconds to respond the problem is ignored when')
        print('analyzing response times.')
        print('While not recommended, you can change these limits.')
        print('Refer to the "readme.txt" file for more information.')
        print('-'*50)
        choice = input('Press Return for defaults or enter your changes:')
        if len(choice) == 0: return
        print('ToDo: limits_time changes')

    def getWeekSplits(self, year):
        splits = {}
        if year == 1:
            splits = {'start1':1, 'end1':27, 'start2':27, 'end2':53}
        if year == 2:
            splits = {'start1':53, 'end1':79, 'start2':79, 'end2':105}
        if year == 3:
            splits = {'start1':157, 'end1':183, 'start2':183, 'end2':209}
        if year == 4:
            splits = {'start1':209, 'end1':235, 'start2':235, 'end2':261}
        return splits

    def showChartPrelimNote(self, skip_input):
        if not skip_input: print('%s%s' % ('\n\n', '-'*50))
        print('NOTE: After viewing the chart, you MUST ')
        print('close the window showing the chart, and ')
        print('then click back into the window running ')
        print('your Python script. If you do not do this ')
        print('nothing (no menus) will show in your ')
        print('teminal window. If this happens, simply ')
        print('to the chart window and close it')
        if skip_input:
            return
        print('%s%s' % ('-'*50, '\n'))
        dummy = input('Read the Note above then\nPress Return to view the chart\n(allow a moment for processing)')
        print('\n...processing\n')

    def processChartChoice(self, type, num):
        print('\n...processing\n')
        if type == 'tot':
            if num == 1: self.totalProblemsStackedBar()

    # 1-26 & 27-52 week stacked bar showing count of problems by idlevel
    def totalProblemsStackedBar(self):
        # set matplotlib parameters
        params = {'legend.fontsize': 8,
                  'axes.labelsize': 8,
                  'axes.titlesize': 10,
                  'xtick.labelsize': 8,
                  'ytick.labelsize': 8,
                  'xtick.major.size' : 8,
                  'ytick.major.size' : 8
                  }
        plt.rcParams.update(params)
        fig, axes = plt.subplots(2, 1, figsize=(6,4), sharey=False)
        fig.set_dpi(150)
        ax1 = axes[0]
        ax2 = axes[1]
        # need a 26 week index to match series returned by weeStackBarData()
        # ax1 data
        sb_data = {}
        start = self.wsplits['start1']
        end = self.wsplits['end1']
        sb_index = pd.RangeIndex(start, end, name='week')
        for lvl in self.order:
            sb_data[lvl] = self.weekStackBarData(lvl, start, end)
        # ax1 stacked bar plot
        df_sb = pd.DataFrame(sb_data, index=sb_index)
        ax1 = df_sb.plot(kind='bar', stacked=True, ax=ax1)
        ax1.set_ylabel('problems')
        ax1.set_title('Weekly Problems Month 1-26')
        ax1.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
        ax1.legend(title='level', bbox_to_anchor=(1.0, 1), loc='upper left')
        # ax2 data
        sb_data = {}
        start = self.wsplits['start2']
        end = self.wsplits['end2']
        sb_index = pd.RangeIndex(start, end, name='week')
        for lvl in self.order:
            sb_data[lvl] = self.weekStackBarData(lvl, start, end)
        # ax2 stacked bar plot
        df_sb = pd.DataFrame(sb_data, index=sb_index)
        ax2 = df_sb.plot(kind='bar', stacked=True, ax=ax2)
        ax2.set_ylabel('problems')
        ax2.set_title('Weekly Problems Month 27-52')
        ax2.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
        ax2.legend(title='level', bbox_to_anchor=(1.0, 1), loc='upper left')
        # adjust white space & show()
        fig.subplots_adjust(hspace=0.4)
        plt.show(block=False)
        plt_path = self.output_charts / 'test.png'
        plt.savefig(str(plt_path))
        print('chart completed & closed')

    def weekStackBarData(self, idlevel, wk_start, wk_end):
        # create a dict for making a df that has 26 weeks (no gaps)
        week_dict = {
            'date_week':list(range(wk_start, wk_end)),
            'idproblem_count':[0]*26
        }
        sb_index = pd.RangeIndex(wk_start, wk_end, name='date_week')
        qstr = '(date_week >= %d & date_week < %d)' % (wk_start, wk_end)
        qstr += ' and (idlevel in [ "%s" ])' % (idlevel)
        # get the session week total for the idlevel - note my have gaps
        temp = self.dfc.query(qstr).groupby('date_week')['idproblem_count'].sum()
        # create 26 week frame with all zeros then update with session data
        temp_all = pd.DataFrame(week_dict)
        temp_all.index = sb_index
        temp_all.update(temp)
        # return the 26 slot series with the problem counts
        return temp_all['idproblem_count']

def getInputFile(path_inputs):
    files = list(path_inputs.glob('*.txt'))
    if len(files) == 0:
        print('\n\nError: No downloaded .txt files were found')
        print('Please use the RightMindMath app to export a file.')
        print('Be sure you save it in the inputs folder located in')
        print('the same folder as this Python (.py) file.')
        return('')
    sorted(files)
    myfiles = []
    for file in files:
        #file = filepath.split('/')[-1]
        myfiles.append(file.name)
    # exit loop by entering number or Return to exit
    while True:
        ok = []
        i = 1
        print('\n\n%sCHOOSE INPUT FILE%s' % ('-'*10, '-'*10))
        for file in myfiles:
            print('%d) %s' % (i, file))
            ok.append(i)
            i += 1
        print('[Return to Quit]')
        choice = input('Enter the number of the file to use (1-%d):' % (i-1))
        try:
            choice = int(choice)
        except:
            return True, None
        if choice in ok:
            return False, files[choice-1]
        print('%s%s' % ('\n', '-'*50))
        print('Please limit entry to numbers shown')
        print('-'*50)

class AnalysisMenus():
    def __init__(self, dframe_in, week_last):
        self.dfm = dframe_in;
        self.order = ['a1', 'a2', 'a3', 's1', 's2', 's3', 'm1', 'm2', 'd3']
        self.week_last = week_last
        self.year = 1
        self.levels = {} # initialized & updated using year idelevel/problems

    def getLevelsCount(self):
        for idlevel in self.order:
            self.levels[idlevel] = 0
        dftemp = self.dfm.groupby('idlevel')['idproblem_count'].sum()
        for idlevel, count in dftemp.iteritems():
            self.levels[idlevel] = count

    def choiceLevelChart(self, idchoice):
        titles = {2:'ADDITION', 3:'SUBTRACTION', 4:'MULTIPLY 1-Digit',
                  5:'MULTIPLY 2-Digits', 6:'LONG DIVISION'}
        choices = {
            2:'1) 1-Digit Times & Tries\n2) 2-Digit Problems Analysis\n3) 3-Digit Problems Analysis',
            3:'1) 1-Digit Times & Tries\n2) 2-Digit Problems Analysis\n3) 3-Digit Problems Analysis'
        }
        ok_list = {
            2:[1, 2, 3],
            3:[1, 2, 3],
            4:[],
            5:[],
            6:[]}
        ok = ok_list[idchoice]
        err_str = ''
        while True:
            print('-'*50)
            print('\n\n%s%s%s' % ('-'*10, titles[idchoice], '-'*10))
            print(choices[idchoice])
            print('[Return to Exit, Q to quit]')
            print('-'*50)
            if len(err_str) > 0:
                print('-'*50)
                print(err_str)
                err_str = ''
            ok_str = ', '.join([str(i) for i in ok_list[idchoice]])
            choice = input('Please enter your choice (%s):' % (ok_str))
            if len(choice) == 0:
                return 0
            if choice.lower()[0:1] == 'q':
                print('\nGoodbye')
                sys.exit(0)
            try:
                choice = int(choice)
            except:
                err_str = 'Please enter integer number only'
                continue
            if not choice in ok:
                err_str = 'Please limit entry to numbers shown'
                continue
            print('NEED CHART HERE')

    def choiceTopMenu(self):
        counts = {'total':0, 'add':0, 'sub':0, 'm1':0, 'm2':0, 'div':0}
        for k, v in self.levels.items():
            counts['total'] += v
            if k[0:1] == 'a': counts['add'] += v
            if k[0:1] == 's': counts['sub'] += v
            if k[0:1] == 'd': counts['div'] += v
            if k[0:1] == 'm':
                if k[1:2] == '1': counts['m1'] += v
                if k[1:2] == '2': counts['m2'] += v

        counts['div'] = 0

        ok = [1, 2, 3, 4, 5, 6]
        err_str = ''
        while True:
            print('-'*50)
            lto = len(str(counts['total']))
            print('\n\n%s%s :: Year %d%s' % ('-'*10, 'MAIN MENU', self.year, '-'*10))
            print('1) Total Problems Done Chart%s%d problems' % (' '*5, counts['total']))
            pad = ' '*(lto - len(str(counts['add'])))
            print('2) Addition Menu%s%s%d problems' % (' '*17, pad, counts['add']))
            pad = ' '*(lto - len(str(counts['sub'])))
            print('3) Subtraction Menu%s%s%d problems' % (' '*14, pad, counts['sub']))
            pad = ' '*(lto - len(str(counts['m1'])))
            print('4) Multiply 1-digit Menu%s%s%d problems' % (' '*9, pad, counts['m1']))
            pad = ' '*(lto - len(str(counts['m2'])))
            print('5) Multiply 2-digits Menu%s%s%d problems' % (' '*8, pad, counts['m2']))
            pad = ' '*(lto - len(str(counts['div'])))
            print('6) Long Division Menu%s%s%d problems' % (' '*10, pad, counts['div']))
            print('[Return to Exit, Q to quit]')
            print('-'*50)
            if len(err_str) > 0:
                print('-'*50)
                print(err_str)
                err_str = ''
            choice = input('Please enter your choice (1, 2, 3, 4, 5, 6):')
            if len(choice) == 0:
                return 0
            if choice.lower()[0:1] == 'q':
                print('\nGoodbye')
                sys.exit(0)
            try:
                choice = int(choice)
            except:
                err_str = 'Please enter integer number only'
                continue
            if not choice in ok:
                err_str = 'Please limit entry to numbers shown'
                continue
            if choice == 2 and counts['add'] == 0: err_str = 'Sorry no problems'
            if choice == 3 and counts['sub'] == 0: err_str = 'Sorry no problems'
            if choice == 4 and counts['m1'] == 0: err_str = 'Sorry no problems'
            if choice == 5 and counts['m2'] == 0: err_str = 'Sorry no problems'
            if choice == 6 and counts['div'] == 0: err_str = 'Sorry no problems'
            if len(err_str) > 0: continue
            return choice

    def getYear(self):
        self.year = 1
        if self.week_last < 53: return
        ok = [1, 2, 3, 4]
        err_str = ''
        while True:
            # exit by entering valid number or Return/Q to exit/quit
            print('-'*50)
            print('1) Year 1 (1-52 weeks previous)')
            if self.week_last > 52: print('2) Year 2 (53-104 weeks previous)')
            if self.week_last > 104: print('3) Year 3 (105-156 weeks previous)')
            if self.week_last > 156: print('4) Year  (157-208 weeks previous)')
            print('[Return to Exit, Q to quit]')
            if len(err_str) > 0:
                print('-'*50)
                print(err_str)
                err_str = ''
            choice = input('Enter the year number to analyze (1, 2, 3, 4):')
            if choice.lower()[0:1] == 'q':
                print('\nGoodbye')
                sys.exit(0)
            if len(choice) == 0:
                self.year =  -1
                return
            try:
                choice = int(choice)
            except:
                err_str = 'Please enter integer number only'
                continue
            if not choice in ok:
                err_str = 'Please limit entry to numbers shown'
                continue
            self.year = choice
            return

def processAnalysis():    
    root = Path(Path().resolve())
    print(str(root))
    path_inputs = root / 'inputs'
    if not path_inputs.exists():
        print('%s%s' % ('\n', '-'*50))
        print('The required sub-folder is missing.')
        print('Please create a sub-folder in')
        print('the same folder as the Python (.py) file:')
        print('-'*50)
        print('Name the folder: inputs')
        print('%s' % (str(path_inputs)))
        print('-'*50)
        print('(note: inputs must be lower case)')
        print('\nGoodbye')
        return
    output = root / 'outputs'
    output.mkdir(exist_ok=True)
    print('%s%s' % ('\n\n', '-'*50))
    print('OUTPUT: outputs folder path:')
    print(str(output))
    print('-'*50)
    first = True
    top_codes = {1:'tot', 2:'add', 3:'sub', 4:'m1', 5:'m2', 6:'div'}
    while True:
        if not first:
            print('-'*50)
            choice = input('\n\nTo Load Another File enter y (return=exit):')
            if len(choice) == 0:
                print('\nGoodbye')
                return
            if choice.lower()[0:1] != 'y':
                print('\nGoodbye')
                return
        first = False
        exit, input_file = getInputFile(path_inputs)
        if exit:
            print('\nGoodbye')
            return
        pjf = ProcessJsonFile(root, input_file)
        pjf.readFile()
        pjf.processLines()
        pjf.createOutputSubfolder(output)
        pjf.writeLinesStats()
        pjf.buildDataFrame()
        if pjf.week_last == -1:
            print('\nSorry no records were loaded.')
            print('Please check your download.')
            print('\nGoodbye')
            return
        am = AnalysisMenus(pjf.dframe, pjf.week_last)
        am.getYear() # year choice if week_last > 52
        print('\n\nYear %d being analyzed' % (am.year))
        am.getLevelsCount() # allows hiding menu levels when problem count = 0
        ca = ChartAnalysis(pjf.dframe, am.year, pjf.output_path)
        ca.changeTimeLimits()
        menus_active = True
        while menus_active:
            c_top = am.choiceTopMenu()
            if c_top == 0:
                menus_active = False
                continue
            if c_top == 1:
                ca.processChartChoice(top_codes[c_top], 1)
                #ca.totalProblemsStackedBar()
                continue
            c_chart = am.choiceLevelChart(c_top)
            if c_chart == 0: continue
            #ca.chartFromLevelMenu(c_top, c_chart)
    print('\nAnalysis Complete')

if __name__ == '__main__':
    print(sys.platform)
    processAnalysis()


