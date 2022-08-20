import json
import urllib.parse
from random import randint
import datetime
import glob
import sys
import os
import shutil
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
            'ptype_m1' : None, # digit value + r/o eg. 3r=ThreesRandom 40=FoursOrdered
            'ptype_a1' : None, # +++ +-+ +-- --- based on pos/neg vals: 5+-6=-1 : +--
            'ptype_s1' : None, # +-+ +-- --- based on pos/neg vals: 6-5=1 : +-+
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
            'device' : None
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

    def copyPrevious(self):
        previous_path = self.output_path / 'previous'
        previous_path.mkdir(exist_ok=True)
        for src_file in self.output_path.glob('*.txt'):
            file_fr = str(src_file)
            file_to = str(previous_path / src_file.name)
            shutil.move(file_fr, file_to)
        charts_path_fr = self.output_path / 'charts'
        if not charts_path_fr.exists(): return
        charts_path_to = previous_path / 'charts'
        charts_path_to.mkdir(exist_ok=True)
        for src_file in charts_path_fr.glob('*.png'):
            file_fr = str(src_file)
            file_to = str(charts_path_to / src_file.name)
            shutil.move(file_fr, file_to)

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
        if not idlevel in not_asm: # == a1, a2, a3, s1, s2, s3, m1 problem
            my_df['steps_total'] = int(vars[1])
            my_df['steps_count'] = int(vars[2]) + 1 # change to 1=start index
            vars = parts[1].split('|')
            my_df['op1'] = int(vars[0])
            my_df['op2'] = int(vars[1])
            my_df['answer'] = int(vars[2])
            my_df['op'] = vars[3]
            if idlevel in ['a1', 's1']:
                ptype = '+' if my_df['op1'] > -1 else '-'
                if idlevel == 'a1':
                    ptype += '+' if my_df['op2'] > -1 else '-'
                else:
                    ptype += '-' # s1 second operand alwasy neg
                ptype += '+' if my_df['answer'] > -1 else '-'
                my_df['ptype_%s' % (idlevel)] = ptype
                if idlevel == 'a1': print(ptype, '---------', r_str)
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
        if idlevel == 'm1':
            my_df['ordered'] = parts[2] == 'true'
            if my_df['ordered']:
                my_df['ptype_m1'] = '%s%s' % (str(my_df['op1']), 'o')
            else:
                my_df['ptype_m1'] = '%s%s' % (str(my_df['op1']), 'r')
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
            dvars = rec['device_iduser'].split('_')
            my_df['device'] = dvars[0]

            #tttttt
            dpct = randint(1,10)
            if dpct < 2:
                my_df['device'] = 'phone.876'
            if dpct == 3:
                my_df['device'] = 'pad.123'
            #tttttt

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

            #if my_df['date_week'] > 10: continue #ttttt

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
    def __init__(self, dframe_in, year, root, output_path):
        self.root = root
        self.dfc = dframe_in
        self.save_flag = 'D' # D=display only, B=display & save S=save only
        self.output_charts = self.setOutputCharts(output_path)
        self.year = year
        self.wsplits = self.getWeekSplits(year)
        self.order = ['a1', 'a2', 'a3', 's1', 's2', 's3', 'm1', 'm2', 'd3']
        self.show = True #show plot on screen
        self.savePlt = False # save plt to a file
        self.limits_time = {} # loaded from limits_time_default.txt file

    def setSaveFlag(self):
        ok = {1:'D', 2:'B', 3:'S'}
        err_str = ''
        while True:
            print('%s%s%s%s' % ('\n\n', '-'*18, 'CHART HANDLING', '-'*18))
            print('Select the option for how to handle charts:')
            print('-'*50)
            print('1) Display Charts (do not save)')
            print('2) Display & Save Charts')
            print('3) Save Charts (do not display)')
            print('[Return to Quit]')
            print('-'*50)
            if len(err_str) > 0:
                print(err_str)
                err_str = ''
            choice = input('Enter your choice (1, 2, 3):')
            if len(choice) == 0:
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
            self.save_flag = ok[choice]
            return

    def setOutputCharts(self, output_path):
        mypath = output_path / 'charts'
        mypath.mkdir(exist_ok=True)
        return mypath

    def parseTimeLimitsFile(self, limits_file):
        keys_check = [ 'a1', 's1', 'm1', 'a2', 's2', 'a3', 's3', 'm2', 'd3' ]
        myfile = self.root / 'parameters_limits' / limits_file
        with myfile.open() as f:
            lines = f.readlines()
        i = 1
        for line in lines:
            vars = line.split('=')
            if len(vars) != 2:
                print('\nERROR in file at line: %d' % (i))
                return False
            try:
                self.limits_time[vars[0]] = int(vars[1].rstrip())
            except:
                print('\nERROR in file at line: %d' % (i))
                return False
        for key in keys_check:
            if not key in self.limits_time:
                print('\nERROR: %s line is missing' % (key))
                return False
        print('\n\n%sTIME LIMITS%s' % ('-'*20, '-'*20))
        print('The following time limits will be applied using file:')
        print(str(myfile))
        print('-'*10)
        for key in keys_check:
            print('%s = %d' % (key, self.limits_time[key]))
        print('For more information refer to:')
        print('%s\nin the folder: %s' % ('readme_for_limits_time.txt', str(myfile.parent)))
        return True
        

    def getTimeLimits(self):
        mypath = self.root / 'parameters_limits'
        files_all = list(mypath.glob('*.txt'))
        files = []
        for fname in files_all:
            if str(fname.name)[0:12] != 'limits_time_': continue
            files.append(str(fname.name))
        print('-'*50)
        if len(files) == 0:
            print('\n\nError: No limits_time_default.txt file was found.')
            print('The files need to be in this folder:')
            print(str(mypath))
            print('Please download the following two files into the folder')
            print('above:')
            print('NEED URL FOR TIME_LIMITS')
            print('NEED URL FOR limits readme')
            print('\nRead the second (readme) file for more information.')
            print('-'*50)
            return False
        if len(files) == 1:
            if files[0] == 'limits_time_default.txt':
                return self.parseTimeLimitsFile(files[0])
        sorted(files)
        print('\n\n%sCHOOSE TIME LIMITS FILE%s' % ('-'*13, '-'*14))
        err_str = ''
        while True:
            ok = []
            i = 1
            if len(err_str) > 0:
                print('-'*50)
                print(err_str)
                err_str = ''
            for file in files:
                print('%d) %s' % (i, file))
                ok.append(i)
                i += 1
            ok_str = ', '.join([str(i) for i in ok])
            choice = input('Enter the number of the file to use (%s):' % (ok_str))
            try:
                choice = int(choice)
            except:
                err_str = 'Please enter an integer value'
                continue
            if not choice in ok:
                err_str = 'Please limit entry to numbers shown'
                continue
            print('-'*50)
            return self.parseTimeLimitsFile(files[choice-1])

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

    def processChartChoice(self, mlevel, type, num):
        print('\n\n', '<>'*20)
        print('processChartChoice')
        print(mlevel, type, num, 'mlevel, type, num------------------')
        print('\n...processing')
        print('\n\n', '<>'*20)
        if mlevel == 'top':
            if type == 't01':
                if num == 1: self.totalProblemsStackedBar(self.order, 'All')
            if type == 't02':
                if num == 1: self.chartLifetimeDevice()
        if mlevel == 'level2':
            if type == 'add' and num == 1:
                self.totalProblemsStackedBar(['a1', 'a2', 'a3'], 'Addition')
            if type == 'sub' and num == 1:
                self.totalProblemsStackedBar(['s1', 's2', 's3'], 'Subtraction')
        if mlevel == 'level3':
            if type == 'add' and num == 1:
                self.chartTimesTries('a1', 'Addition', 'start1', 'end1')
            if type == 'add' and num == 2:
                self.chartTimesTries('a1', 'Addition', 'start2', 'end2')
            if type == 'sub' and num == 1:
                self.chartTimesTries('s1', 'Subtraction', 'start1', 'end1')
            if type == 'sub' and num == 2:
                self.chartTimesTries('s1', 'Subtraction', 'start2', 'end2')

    # 1-26 & 27-52 week stacked bar showing count of problems by idlevel
    def totalProblemsStackedBar(self, my_order, type):
        start = self.wsplits['start1']
        end = self.wsplits['end1']
        wmax = self.dfc['date_week'].max()
        # set matplotlib parameters
        rcparams = {'legend.fontsize':8,
                    'legend.title_fontsize':6,
                    'axes.labelsize':8,
                    'axes.titlesize':10,
                    'xtick.labelsize':8,
                    'ytick.labelsize':8,
                    'xtick.major.size':8,
                    'ytick.major.size':8
                  }
        plt.rcParams.update(rcparams)
        if wmax > 26:
            sb_index = pd.RangeIndex(start, end, name='week')
            fig, axes = plt.subplots(2, 1, figsize=(8,5), sharey=False)
            ax1 = axes[0]
            ax2 = axes[1]
        else:
            fig, ax1 = plt.subplots(1, 1, figsize=(8,5), sharey=False)
            sb_index = pd.RangeIndex(start, wmax+1, name='week')
        # ax1 data
        sbdata = {}
        ymax = 0.0
        for lvl in my_order:
            myseries = self.weekStackBarData(lvl, start, end)
            if wmax < 26:
                sbdata[lvl] = myseries[:wmax]
            else:
                sbdata[lvl] = myseries
            if sbdata[lvl].max() > ymax:
                ymax = sbdata[lvl].max()
        # ax1 stacked bar plot
        df_sb = pd.DataFrame(sbdata, index=sb_index)
        ax1 = df_sb.plot(kind='bar', stacked=True, ax=ax1)
        ######ax1.yaxis.set_tick_params(labelsize=8)
        ax1.set_ylabel('problems')
        if wmax > 26:
            ax1.set_title('%s Weekly Problems Month 1-26' % (type))
        else:
            ax1.set_title('%s Weekly Problems Month 1-%d' % (type, wmax))
        ax1.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
        ax1.legend(title='level', bbox_to_anchor=(1.0, 1), loc='upper left')
        ax1.invert_xaxis()
        tic = '' if start == 1 else '-'
        tic2 = '' if start == 1 else 's'
        hdr = '%s%d week%s' % (tic, start, tic2)
        plt.figtext(0.86,0.9, hdr, fontsize=8, va="bottom", ha="left")
        hdr = '-%d weeks' % (end-1)
        plt.figtext(0.13,0.9, hdr, fontsize=8, va="bottom", ha="left")
        # ax2 data
        if wmax > 26:
            sbdata = {}
            start = self.wsplits['start2']
            end = self.wsplits['end2']
            sb_index = pd.RangeIndex(start, end, name='week')
            ymax = 0.0
            for lvl in my_order:
                sbdata[lvl] = self.weekStackBarData(lvl, start, end)
                if sbdata[lvl].max() > ymax:
                    ymax = sbdata[lvl].max()
            # ax2 stacked bar plot
            df_sb = pd.DataFrame(sbdata, index=sb_index)
            ax2 = df_sb.plot(kind='bar', stacked=True, ax=ax2)
            ax2.set_ylabel('problems')
            ax2.set_title('%s Weekly Problems Month 27-52' % (type))
            ax2.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
            ax2.legend(title='level', bbox_to_anchor=(1.0, 1), loc='upper left')
            ax2.invert_xaxis()
            hdr = '-%d weeks' % (start)
            plt.figtext(0.86,0.42, '-27 weeks', fontsize=8, va="bottom", ha="left")
            hdr = '-%d weeks' % (end-1)
            plt.figtext(0.13,0.42, hdr, fontsize=8, va="bottom", ha="left")
            # adjust white space
            fig.subplots_adjust(hspace=0.6)
        #show and or save
        if self.save_flag == 'S' or self.save_flag == 'B':
            fname = 'c01_%s_ProblemsStackedBar.png' % (type)
            plt_path = self.output_charts / fname
            plt.savefig(str(plt_path))
            print('\nOUTPUT saved chart: %s' % (str(plt_path.name)))
        if self.save_flag == 'D' or self.save_flag == 'B':
            plt.show(block=False)
        print('\nchart completed & closed')

    def weekStackBarData(self, idlevel, start, end):
        # create a dict for making a df that has 26 weeks (no gaps)
        week_dict = {
            'date_week':list(range(start, end)),
            'idproblem_count':[0]*26
        }
        sb_index = pd.RangeIndex(start, end, name='date_week')
        qstr = '(date_week >= %d & date_week < %d)' % (start, end)
        qstr += ' and (idlevel in [ "%s" ])' % (idlevel)
        # get the session week total for the idlevel - note my have gaps
        temp = self.dfc.query(qstr).groupby('date_week')['idproblem_count'].sum()
        # create 26 week frame with all zeros then update with session data
        temp_all = pd.DataFrame(week_dict)
        temp_all.index = sb_index
        temp_all.update(temp)
        # return the 26 slot series with the problem counts
        return temp_all['idproblem_count']

    def chartTimesTries(self, idlevel, type, start_str, end_str):
        print('def chartTimesTries(self, idlevel):')
        qstr = '(idlevel == "%s" )' % (idlevel)
        wmax = self.dfc.query(qstr)['date_week'].max()
        start = self.wsplits[start_str]
        end = self.wsplits[end_str]
        week_dict = {
            'date_week':list(range(start, end)),
            'elapsed':[0.0]*26
        }
        sb_index = pd.RangeIndex(start, end, name='date_week')
        tlimit = self.limits_time[idlevel] * 1000
        qstr = '(date_week >= %d & date_week < %d)' % (start, end)
        qstr += ' and (idlevel in [ "%s" ])' % (idlevel)
        qstr += ' and (time < %d)' % (tlimit)
        times = self.dfc.query(qstr).groupby('date_week')['elapsed'].mean()
        #times.set_index('date_week')
        times_all = pd.DataFrame(week_dict)
        times_all.index = sb_index
        times_all.update(times)
        times_all['elapsed'] = times_all['elapsed'] / 1000
        if wmax < 26:
            times_all = times_all[:wmax]
        std_times = self.dfc.query(qstr).groupby('date_week')['elapsed'].std(ddof=0)
        std_times_all = pd.DataFrame(week_dict)
        std_times_all.index = sb_index
        std_times_all.update(std_times)
        std_times_all['elapsed'] = std_times_all['elapsed'] / 1000
        if wmax < 26:
            std_times_all = std_times_all[:wmax]
        tries = self.dfc.query(qstr).groupby('date_week')['tries'].mean()
        week_dict = {
            'date_week':list(range(start, end)),
            'tries':[0.0]*26
        }
        tries_all = pd.DataFrame(week_dict)
        tries_all.index = sb_index
        tries_all.update(tries)
        if wmax < 26:
            tries_all = tries_all[:wmax]
        rcparams = {'legend.fontsize':8,
                    'legend.title_fontsize':6,
                    'axes.labelsize':8,
                    'axes.titlesize':10,
                    'xtick.labelsize':8,
                    'ytick.labelsize':8,
                    'xtick.major.size':8,
                    'ytick.major.size':8
                  }
        plt.rcParams.update(rcparams)
        fig, axes = plt.subplots(2, 1, figsize=(8,6), sharey=False)
        #ax1
        ax1 = axes[0]
        ax2 = axes[1]
        x = times_all['date_week']
        y = times_all['elapsed']
        y_error = std_times_all['elapsed']
        ax1.bar(x,y)
        ax1.set_xticks(x)
        ax1.set_xlabel('week', fontsize=5)
        ax1.set_ylabel('seconds (std dev)', fontsize=8)
        ax1.errorbar(x, y, yerr=y_error, fmt='none', ecolor='r')
        ax1.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
        ax1.set_title('%s Avg Time to Right Answer (with std dev)' % (type), fontsize=8)
        ax1.invert_xaxis()
        x_axis = ax1.axes.get_xaxis()
        x_label = x_axis.get_label()
        x_label.set_visible(False)
        tic = '' if start == 1 else '-'
        tic2 = '' if start == 1 else 's'
        hdr = '%s%d week%s' % (tic, start, tic2)
        plt.figtext(0.86,0.89, hdr, fontsize=8, va="bottom", ha="left")
        hdr = '-%d weeks' % (end-1)
        plt.figtext(0.13,0.89, hdr, fontsize=8, va="bottom", ha="left")
        #ax2
        x = tries_all['date_week']
        y = tries_all['tries']
        ax2.bar(x,y)
        ax2.set_xticks(x)
        ax2.set_xlabel('week', fontsize=5)
        ax2.set_ylabel('tries', fontsize=8)
        ax2.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
        ax2.set_title('%s Avg Number of Tries to Right Answer' % (type), fontsize=8)
        ax2.invert_xaxis()
        x_axis = ax2.axes.get_xaxis()
        x_label = x_axis.get_label()
        x_label.set_visible(False)
        hdr = '%s%d week%s' % (tic, start, tic2)
        plt.figtext(0.84,0.43, hdr, fontsize=8, va="bottom", ha="left")
        hdr = '-%d weeks' % (end-1)
        plt.figtext(0.13,0.43, hdr, fontsize=8, va="bottom", ha="left")
        fig.subplots_adjust(hspace=0.5)
        if self.save_flag == 'S' or self.save_flag == 'B':
            fname = 'c03_%s_TimesTries.png' % (type)
            plt_path = self.output_charts / fname
            plt.savefig(str(plt_path))
            print('\nOUTPUT saved chart: %s' % (str(plt_path.name)))
        if self.save_flag == 'D' or self.save_flag == 'B':
            plt.show(block=False)
        print('\nchart completed & closed')


    def chartLifetimeDevice(self): 
        rcparams = {'legend.fontsize':8,
                    'legend.title_fontsize':6,
                    'axes.labelsize':8,
                    'axes.titlesize':10,
                    'xtick.labelsize':8,
                    'ytick.labelsize':8,
                    'xtick.major.size':8,
                    'ytick.major.size':8
                  }
        plt.rcParams.update(rcparams)
        tot = self.dfc.groupby(['date_yyyymm','device'])['idproblem_count'].sum().groupby(level=[1]).cumsum()
        tot = tot.unstack()
        fig, ax1 = plt.subplots(1, 1, figsize=(9,6), sharey=False)
        ax1 = tot.plot(kind='bar', stacked=True, ax=ax1)
        ax1.xaxis.set_tick_params(labelsize=8, labelrotation=60)
        ax1.yaxis.set_tick_params(labelsize=8)
        ax1.set_ylabel('problems')
        ax1.set_title('Lifetime Cumulative Problems by Device')
        ax1.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
        ax1.legend(title='device', loc='best')
        x_axis = ax1.axes.get_xaxis()
        x_label = x_axis.get_label()
        x_label.set_visible(False)
        if self.save_flag == 'S' or self.save_flag == 'B':
            fname = 'c02_ProblemsLifetimeDevice.png'
            plt_path = self.output_charts / fname
            plt.savefig(str(plt_path))
            print('\nOUTPUT saved chart: %s' % (str(plt_path.name)))
        if self.save_flag == 'D' or self.save_flag == 'B':
            plt.show(block=False)

def getInputFile(path_inputs):
    files = list(path_inputs.glob('*.txt'))
    if len(files) == 0:
        print('\n\nError: No downloaded .txt files were found')
        print('Please use the RightMindMath app to export a file.')
        print('Be sure you save it in the inputs folder located in')
        print('the same folder as this Python (.py) file.')
        return ''
    sorted(files)
    myfiles = []
    for file in files:
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
        print('-'*50)
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
        self.wsplits = self.getWeekSplits()
        self.levels = {} # initialized & updated using year idelevel/problems
        self.counts = {} # stores year (52 wks), months (26 wks) & weeks (4 wks)
        # yearly total of m1 problem counts by 1st ord digit & random/ordered
        self.mcounts = { '1r':0, '1o':0, '2r':0, '2o':0, '3r':0, '3o':0,
                         '4r':0, '4o':0, '5r':0, '5o':0, '6r':0, '6o':0,
                         '7r':0, '7o':0, '8r':0, '8o':0, '9r':0, '9o':0 }

    def setMcounts(self):
        for key in self.mcounts.keys():
            qstr = '(idlevel == "m1") and (ptype_m1 == "%s")' % (key)
            c = self.dfm.query(qstr)['idproblem_count'].sum()
            self.mcounts[key] = c

    def setIdlevelCounts(self):
        # uses the levels {} items to provide easy access to idlevels problem
        # totals. Splits are: year=52wks, months=26wks, weeks=4wks 
        self.counts = {'tot':{'year':0, 'months':0, 'weeks':0},
                       'add':{'year':0, 'months':0, 'weeks':0},
                       'sub':{'year':0, 'months':0, 'weeks':0},
                       'd3':{'year':0, 'months':0, 'weeks':0},
                       'a1':{'year':0, 'months':0, 'weeks':0},
                       'a2':{'year':0, 'months':0, 'weeks':0},
                       'a3':{'year':0, 'months':0, 'weeks':0},
                       's1':{'year':0, 'months':0, 'weeks':0},
                       's2':{'year':0, 'months':0, 'weeks':0},
                       's3':{'year':0, 'months':0, 'weeks':0},
                       'm1':{'year':0, 'months':0},
                       'm2':{'year':0, 'months':0},
                       'all':{'count':0}}
        all = self.dfm['idproblem_count'].sum()
        self.counts['all']['count'] = all
        for k, v in self.levels.items():
            self.counts['tot']['year'] += v['year']
            self.counts['tot']['months'] += v['months']
            self.counts['tot']['weeks'] += v['weeks']
            if k[0:1] == 'a':
                self.counts['add']['year'] += v['year']
                self.counts['add']['months'] += v['months']
                self.counts['add']['weeks'] += v['weeks']
            if k[0:1] == 's':
                self.counts['sub']['year'] += v['year']
                self.counts['sub']['months'] += v['months']
                self.counts['sub']['weeks'] += v['weeks']
            if k[0:1] == 'm':
                if k[1:2] == '1':
                    self.counts['m1']['year'] += v['year']
                    self.counts['m1']['months'] += v['months']
                    continue
                if k[1:2] == '2':
                    self.counts['m2']['year'] += v['year']
                    self.counts['m2']['months'] += v['months']
                    continue
            self.counts[k]['year'] += v['year']
            self.counts[k]['months'] += v['months']
            self.counts[k]['weeks'] += v['weeks']

    def getWeekSplits(self):
        splits = {}
        if self.year == 1:
            splits = {'start1':1, 'end1':27, 'start2':27, 'end2':53}
        if self.year == 2:
            splits = {'start1':53, 'end1':79, 'start2':79, 'end2':105}
        if self.year == 3:
            splits = {'start1':157, 'end1':183, 'start2':183, 'end2':209}
        if self.year == 4:
            splits = {'start1':209, 'end1':235, 'start2':235, 'end2':261}
        return splits

    def getLevelsCount(self):
        for idlevel in self.order:
            self.levels[idlevel] = {'year':0, 'months':0, 'weeks':0}
        ystart = self.wsplits['start1']
        yend = self.wsplits['end2']
        mstart = self.wsplits['start1']
        mend = self.wsplits['end1']
        dftemp = self.dfm['idproblem_count'].groupby([self.dfm['idlevel'],
                                                      self.dfm['date_week']]).sum()
        for k, mycount in dftemp.iteritems():
            mylevel = k[0]
            myweek = k[1]
            if myweek >= ystart and myweek < yend:
                self.levels[mylevel]['year'] += mycount
            if myweek >= mstart and myweek < mend:
                self.levels[mylevel]['months'] += mycount
            if myweek < (mend - 22):
                self.levels[mylevel]['weeks'] += mycount

    def choiceLevel2Chart(self, idchoice):
        print('choiceLevel2Chart')
        titles = {'add':'ADDITION', 'sub':'SUBTRACTION', 'm1':'MULTIPLY 1-Digit',
                  'm2':'MULTIPLY 2-Digits', 'd3':'LONG DIVISION'}
        order = ['add', 'sub', 'm1', 'm2', 'd3']
        choices = {
            'add' : [['1) Yearly Problems by Type', '(12 mns)', 'add', 'year'],
                     ['2) 1-Digit Analyses', '(6 mns)', 'a1', 'months', 'a1'],
                     ['3) 2-Digit Analyses', '(6 mns)', 'a2', 'months', 'a2'],
                     ['4) 3-Digit Analyses', '(6 mns)', 'a3', 'months', 'a3']],
            'sub' : [['1) Yearly Problems by Type', '(12 mns)', 'add', 'year'],
                     ['2) 1-Digit Analyses', '(6 mns)', 'a1', 'months', 'a1'],
                     ['3) 2-Digit Analyses', '(6 mns)', 'a2', 'months', 'a2'],
                     ['4) 3-Digit Analyses', '(6 mns)', 'a3', 'months', 'a3']]
        }
        ok_list = {
            'add':[1, 2, 3, 4],
            'sub':[1, 2, 3, 4],
            'm1':[],
            'm2':[],
            'd3':[]}
        ok = ok_list[idchoice]
        ok_str = ', '.join([str(i) for i in ok_list[idchoice]])
        err_str = ''
        mytitle = titles[idchoice]
        mychoice = choices[idchoice]
        lmax = 0
        nmax = 0
        # find the longest title text to enable padding to numbers colum
        for a in mychoice:
            if len(a[0]) > lmax: lmax = len(a[0])
            if len(str(self.counts[idchoice][a[3]])) > nmax:
                nmax = len(str(self.counts[idchoice][a[3]]))
        while True:
            print('-'*50)
            len_dash = int((50 - len(mychoice)) / 2)
            print('\n\n%s%s%s' % ('-'*len_dash, mytitle, '-'*len_dash))
            for a in mychoice:
                count = self.counts[a[2]][a[3]]
                npad = nmax - len(str(count))
                npad += lmax - len(a[0])
                print('%s%s%d problems %s' % (a[0], ' '*(npad+5), count, a[1] ))
            print('[Return to Exit, Q to quit]')
            print('-'*50)
            if len(err_str) > 0:
                print('-'*50)
                print(err_str)
                err_str = ''
            choice = input('Please enter your choice (%s):' % (ok_str))
            if len(choice) == 0:
                return idchoice, 0
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
            return idchoice, choice

    def singleDigitMenu(self, idlevel):
        print('singleDigitMenu')
        types = {'add':'ADDITION (1-digit)', 'sub':'SUBTRACTION (1-digit)'}
        count = self.counts[idlevel]['months']
        choices = [
            '1) Times & Tries (weeks  1-26)',
            '2) Times & Tries (weeks 27-52)',
            '3) Problem Type',
            '4) Outliers'
        ]
        ok = [1, 2, 3, 4]
        ok_str = ', '.join([str(i) for i in ok])
        err_str = ''
        mytype = types[idlevel]
        while True:
            print('-'*50)
            mytitle = '%s : %d Problems' % (mytype, count)
            len_dash = int((50 - len(mytitle)) / 2)
            print('\n\n%s%s%s' % ('-'*len_dash, mytitle, '-'*len_dash))
            for a in choices:
                print('%s' % (a))
            print('[Return to Exit, Q to quit]')
            print('-'*50)
            if len(err_str) > 0:
                print('-'*50)
                print(err_str)
                err_str = ''
            choice = input('Please enter your choice (%s):' % (ok_str))
            if len(choice) == 0:
                return idlevel, 0
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
            return idlevel, choice

    def choiceTopMenu(self):
        ok = [1, 2, 3, 4, 5, 6, 7]
        ok_str = ', '.join([str(i) for i in ok])
        err_str = ''
        order = ['t01', 't02', 'add', 'sub', 'm1', 'm2', 'd3']
        titles = {
            't01':['1) Yearly Problems Done by Type', '(12 mns)', 'tot', 'year'],
            't02':['2) Lifetime Total by Device', '(all mns)', 'all', 'count'],
            'add':['3) Addition Menu', '(6 mns)', 'add', 'months'],
            'sub':['4) Subtraction Menu', '(6 mns)', 'sub', 'months'],
            'm1':['5) Multiply 1-digit Menu', '(6 mns)', 'm1', 'months'],
            'm2':['6) Multiply 2-digit Menu', '(6 mns)', 'm2', 'months'],
            'd3':['7) Long Division Menu', '(6 mns)', 'd3', 'months']
        }
        lmax = 0
        nmax = len(str(self.counts['all']['count']))
        # find the longest title text to enable padding to numbers colum
        for k, v in titles.items():
            if len(v[0]) > lmax: lmax = len(v[0])
        while True:
            print('-'*50)
            print('\n\n%s%s :: Year %d%s' % (
                '-'*20, 'MAIN MENU', self.year, '-'*21))
            for k in order:
                count = self.counts[titles[k][2]][titles[k][3]]
                npad = nmax - len(str(count))
                npad += lmax - len(titles[k][0])
                print('%s%s%d problems %s' % (
                    titles[k][0], ' '*(npad+5), count, titles[k][1] ))
            print('[Return to Exit, Q to quit]')
            print('-'*60)
            if len(err_str) > 0:
                print('-'*60)
                print(err_str)
                err_str = ''
            choice = input('Please enter your choice (%s):' % (ok_str))
            if len(choice) == 0:
                return 'exit'
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
            if choice == 3 and self.counts['add']['months'] == 0:
                err_str = 'Sorry no problems'
            if choice == 4 and self.counts['sub']['months'] == 0:
                err_str = 'Sorry no problems'
            if choice == 5 and self.counts['m1']['months'] == 0:
                err_str = 'Sorry no problems'
            if choice == 6 and self.counts['m2']['months'] == 0:
                err_str = 'Sorry no problems'
            if choice == 7 and self.counts['d3']['months'] == 0:
                err_str = 'Sorry no problems'
            if len(err_str) > 0: continue
            return order[choice-1]

    def getYear(self):
        self.year = 1
        # skip menu if only one year of data
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
    if not output.exists():
        output.mkdir()
        print('%s%s' % ('\n\n', '-'*50))
        print('OUTPUT: Created the outputs sub-folder:')
        print(str(output))
        print('-'*50)
    first = True
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
        pjf.copyPrevious()
        pjf.writeLinesStats()
        pjf.buildDataFrame()
        return
        if pjf.week_last == -1:
            print('\nSorry no records were loaded.')
            print('Please check your download.')
            print('\nGoodbye')
            return
        am = AnalysisMenus(pjf.dframe, pjf.week_last)
        am.getYear() # year choice if week_last > 52
        print('\n\nYear %d being analyzed' % (am.year))
        am.getWeekSplits() # must follow getYear() as self.year is used
        am.getLevelsCount() 
        am.setMcounts()
        return
        am.setIdlevelCounts() # must follow getLevelsCount()
        ca = ChartAnalysis(pjf.dframe, am.year, root, pjf.output_path)
        ca.setSaveFlag()
        if not ca.getTimeLimits():
            print('\nGoodbye')
            return
        menu_top = True
        while menu_top:
            c_top = am.choiceTopMenu()
            if c_top == 'exit':
                menu_top = False
                continue
            if c_top == 't01' or c_top == 't02':
                print('---------A')
                ca.processChartChoice('top', c_top, 1)
                continue
            print('---------B')
            lvl, choice = am.choiceLevel2Chart(c_top)
            print(lvl, choice,'lvl, choice,---------B')
            if choice == 0: continue
            menu2 = True
            while menu2:
                print('while menu2')
                if choice == 0:
                    menu2 = False
                    continue
                if choice == 1: # yearly totals stacked bar chart
                    ca.processChartChoice('level2', lvl, choice)
                    print('---------C')
                    lvl, choice = am.choiceLevel2Chart(lvl)
                    print(lvl, choice, '---------C')
                    continue
                if choice == 2: # single digit add/sub/mul
                    menu3 = True
                    while menu3:
                        print('---------D')
                        lvl, choice = am.singleDigitMenu(lvl)
                        print(lvl, choice, '---------D')
                        if choice == 0:
                            menu3 = False
                            lvl, choice = am.choiceLevel2Chart(lvl)
                            continue
                        if choice == 1 or choice == 2:
                            ca.processChartChoice('level3', lvl, choice)
                        print(lvl, choice, '---------F')
    print('\nAnalysis Complete')

if __name__ == '__main__':
    print(sys.platform)
    processAnalysis()

