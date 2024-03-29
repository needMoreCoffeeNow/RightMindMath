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
    def __init__(self, root, json_file, limits_time, days52):
        self.root = root
        self.days52 = days52
        self.json_file = json_file
        self.file_stem = json_file.stem
        self.limits_time = limits_time
        self.output_path = None # set to Path(root/output/json_file.stem
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
            'ans_elapsed_01' : None,
            'ans_elapsed_12' : None,
            'ans_elapsed_23' : None,
            'ans_elapsed_34' : None,
            'borrow_01' : None,
            'borrow_10' : None,
            'problem_start' : None,
            'ptype' : None, # eg: +++, +-+ for a1, s1, 2r, 3o for m1
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
            'outlier' : False,
            'outlier_limit' : -1,
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
            print('OUTPUT: results for %s' % (str(self.json_file)))
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

    def borrowsCount(self, r_str):
        eq_str = r_str.split('^')[1]
        parts = eq_str.split('|')
        digits = len(parts[0])
        d1s_top = int(parts[0][digits-1:digits])
        d1s_bot = int(parts[1][digits-1:digits])
        d10s_top = int(parts[0][digits-2:digits-1])
        d10s_bot = int(parts[1][digits-2:digits-1])
        borrows = 0
        if d1s_top < d1s_bot: borrows += 1
        if ((d10s_top - borrows) < d10s_bot): borrows += 1
        return borrows

    def carriesCount(self, r_str):
        eq_str = r_str.split('^')[1]
        parts = eq_str.split('|')
        digits = len(parts[0])
        d1s_top = int(parts[0][digits-1:digits])
        d1s_bot = int(parts[1][digits-1:digits])
        d10s_top = int(parts[0][digits-2:digits-1])
        d10s_bot = int(parts[1][digits-2:digits-1])
        carries = 0
        if (d1s_top + d1s_bot) > 9: carries += 1
        if (d10s_top + d10s_bot + carries) > 9: carries += 1
        return carries

    def d3GetPtype(self, r_str):
        parts = r_str.split('^')
        eq_parts = parts[1].split('/')
        dividend = float(eq_parts[0])
        divisor = float(eq_parts[1])
        dec = 'n' if int(dividend/divisor) == (dividend/divisor) else 'y'
        ptype = 'd3.%d.%s' % (len(eq_parts[1]), dec)
        return ptype

    def parseRstr(self, r_str, tstamp, time):
        my_df = self.rec_df.copy()
        not_asm = {'d3':True, 'm2':True, 'm2b':True, 'm2c':True}
        parts = r_str.split('^')
        vars = parts[0].split('.')
        # strip the b/c from M2b M2c
        my_df['idlevel_rstr'] = vars[0]
        idlevel = vars[0][0:2]
        if idlevel in not_asm:
            my_df['ptype'] = my_df['idlevel_rstr']
            if idlevel == 'd3':
                vars = parts[1].split('/')
                my_df['op1'] = int(vars[0])
                my_df['op2'] = int(vars[1])
                my_df['answer'] = float(my_df['op1']) / float(my_df['op2'])
                my_df['op'] = '/'
                my_df['ptype'] = self.d3GetPtype(r_str)
            else:
                vars = parts[1].split('x')
                my_df['op1'] = int(vars[0])
                my_df['op2'] = int(vars[1])
                my_df['answer'] = my_df['op1'] * my_df['op2']
                my_df['op'] = 'x'
        else: # == a1, a2, a3, s1, s2, s3, m1 problem
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
                my_df['ptype'] = ptype
            if idlevel == 'm1':
                my_df['chunk_count'] = int(parts[4])
                ptype = 'm1.%d' % (my_df['op1'])
            else:
                my_df['chunk_count'] = int(parts[3])
        if idlevel == 'm1':
            my_df['ordered'] = parts[2] == 'true'
            my_df['ptype'] = 'm1.%s' % (str(my_df['op1']))
        if idlevel in ['s2', 's3']:
            my_df['ptype'] = '%sb%d' % (idlevel, self.borrowsCount(r_str))
        if idlevel in ['a2', 'a3']:
            my_df['ptype'] = '%sc%d' % (idlevel, self.carriesCount(r_str))
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
            # we use date_week as the single source for analyzing either day or weeks
            if self.days52:
                my_df['date_week'] = int(delta.days) + 1
            else:
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
            # set outlier boolean and record limit used
            limit_this = int(rec['time']/1000)
            my_df['outlier'] = self.limits_time[idlevel] < limit_this
            my_df['outlier_limit'] = self.limits_time[idlevel]
            # transfer all one-to-one named variables from rec to my_df
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
        with self.json_file.open() as f:
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
    def __init__(self, dframe_in, year, root, output_path, limits_time, days52):
        self.root = root
        self.dfc = dframe_in
        self.tref = 'days' if days52 else 'weeks'
        self.trefcap = 'Days' if days52 else 'Weeks'
        self.trefprefix = 'Dys' if days52 else 'Wks'
        self.limits_time = limits_time
        self.save_flag = 'D' # D=display only, B=display & save S=save only
        self.save_name_prefix = ''
        self.save_name_suffix = ''
        self.output_charts = self.setOutputCharts(output_path)
        self.m1_ordered = {}
        self.m2_basic_chunk = {}
        self.year = year
        self.wsplits = self.getWeekSplits(year)
        self.order = ['a1', 'a2', 'a3', 's1', 's2', 's3', 'm1', 'm2', 'd3']
        self.show = True #show plot on screen
        self.savePlt = False # save plt to a file

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
            print('[Return or Q to Quit]')
            choice = input('Enter your choice (1, 2, 3):')
            print('-'*50)
            if choice.lower() == 'q':
                print('\nGoodbye')
                sys.exit(0)
            if len(err_str) > 0:
                print(err_str)
                err_str = ''
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

    def getM2BasicChunkSplits(self):
        order = ['all', 'm2b', 'm2c']
        for type in order:
            wk_basicchunk = {}
            for x in range(self.wsplits['start1'], self.wsplits['end2']):
                wk_basicchunk[x] = [0, 0]
            self.m2_basic_chunk[type] = wk_basicchunk
        qstr = '(date_week >= %d & date_week < %d)' % (self.wsplits['start1'],
                                                       self.wsplits['end2'])
        qstr += ' and (ptype in ["m2b", "m2c"])'
        temp = self.dfc.query(qstr).groupby(['date_week', 'ptype'])['idproblem_count'].sum()
        for k,v in sorted(temp.items()):
            index = k[0]
            pt = k[1]
            apos = 0 if pt == 'm2b' else 1
            self.m2_basic_chunk['all'][index][apos] += v
            self.m2_basic_chunk[pt][index][apos] += v
        for pt, weeks in self.m2_basic_chunk.items():
            for week, val in weeks.items():
                basic = val[0]
                chunk = val[1]
                if basic == 0 and chunk == 0:
                    pct = 0.0
                else:
                    if chunk == 0:
                        pct = 100.0
                    else:
                        pct = round(basic / (basic + chunk), 2) * 100.0
                self.m2_basic_chunk[pt][week] = [basic, chunk, pct]

    def getM2BasicChunkPctDF(self, type, start, end):
        week_dict = {
            'date_week':list(range(start, end+1)),
            'basic_pct':[0.0]*26
        }
        mydict = self.m2_basic_chunk[type]
        for i in range(start, end+1):
            week_dict['basic_pct'][i-1] = mydict[i][2]
        df = pd.DataFrame(week_dict)
        return df

    def getM1OrdRndSplits(self):
        order = ['all', 2, 3, 4, 5, 6, 7, 8, 9]
        for type in order:
            wk_ordrnd = {}
            for x in range(self.wsplits['start1'], self.wsplits['end2']):
                wk_ordrnd[x] = [0, 0]
            self.m1_ordered[type] = wk_ordrnd
        qstr = '(date_week >= %d & date_week < %d)' % (self.wsplits['start1'],
                                                       self.wsplits['end2'])
        qstr += ' and (ordered in [True, False])'
        temp = self.dfc.query(qstr).groupby(['date_week', 'ptype', 'ordered'])['idproblem_count'].sum()
        for k,v in sorted(temp.items()):
            index = k[0]
            pt = int(k[1].split('.')[1])
            apos = 0 if k[2] == True else 1
            self.m1_ordered['all'][index][apos] += v
            self.m1_ordered[pt][index][apos] += v
        for pt, weeks in self.m1_ordered.items():
            for week, val in weeks.items():
                ord = val[0]
                rnd = val[1]
                if ord == 0 and rnd == 0:
                    pct = 0.0
                else:
                    if rnd == 0:
                        pct = 100.0
                    else:
                        pct = round(ord / (ord + rnd), 2) * 100.0
                self.m1_ordered[pt][week] = [ord, rnd, pct]

    def getM1OrderedPctDF(self, type, start, end):
        week_dict = {
            'date_week':list(range(start, end+1)),
            'ord_pct':[0.0]*26
        }
        mydict = self.m1_ordered[type]
        for i in range(start, end+1):
            week_dict['ord_pct'][i-1] = mydict[i][2]
        df = pd.DataFrame(week_dict)
        return df

    def getM1OrderedTwin(self, type, start, end, i_start):
        x = []
        y = []
        mydict = self.m1_ordered[type]
        # twin index_x will always start at 0
        i = i_start
        for index in range(start, end):
            x.append(i)
            y.append(mydict[index][2])
            i += 1
        return x, y

    def getM1ChartTwinDict(self, type, start_str, end_str):
        start = self.wsplits[start_str]
        end = self.wsplits[end_str]
        x, y = self.getM1OrderedTwin(type, start, end, start)
        return {'x':x, 'y':y}

    def processChartChoice(self, mlevel, mytype, num, digit):
        plt.close()
        if mlevel == 'top':
            self.save_name_prefix = 'all_%s' % (mytype[2:3])
            if mytype == 't01': self.totalProblemsStackedBar(self.order, 'All')
            if mytype == 't02': self.chartLifetimeDevice()
            if mytype == 't03': self.outlierProblemsStackedBar(self.order, 'All')
            return
        if digit:
            self.save_name_prefix = '%s_%d-%d' % (mytype, num, digit)
        else:
            self.save_name_prefix = '%s_%d' % (mytype, num)
        # a1
        if mlevel == 'level2' and mytype == 'a1':
            if num == 1: self.chartTimesTries('a1', 'Add 1-Digit', 'start1', 'end1', False)
            if num == 2: self.chartTimesTries('a1', 'Add 1-Digit', 'start2', 'end2', False)
            if num == 3:
                order = ['+++', '+-+', '+--', '---']
                self.ptypeProblemsStackedBar('a1', order)
            if num == 4:
                order = ['a1']
                self.outlierProblemsStackedBar(order, 'a1')
            return
        # s1
        if mlevel == 'level2' and mytype == 's1':
            if num == 1: self.chartTimesTries('s1', 'Sub 1-Digit', 'start1', 'end1', False)
            if num == 2: self.chartTimesTries('s1', 'Sub 1-Digit', 'start2', 'end2', False)
            if num == 3:
                order = ['+-+', '+--', '---']
                self.ptypeProblemsStackedBar('s1', order)
            if num == 4:
                order = ['s1']
                self.outlierProblemsStackedBar(order, 's1')
            return
        # m1
        if mlevel == 'level2' and mytype == 'm1':
            if num == 1:
                self.m1ProblemsStackedBar()
                return
            # handle specific 2-9 digit analysis
            title = 'Multiply 1-Digit: %ds' % (digit)
            my_ptype = 'm1.%d' % (digit)
            if num == 2:
                m1_twin = self.getM1ChartTwinDict(digit, 'start1', 'end1')
                self.chartTimesTries(my_ptype, title, 'start1', 'end1', m1_twin)
            if num == 3:
                m1_twin = self.getM1ChartTwinDict(digit, 'start2', 'end2')
                self.chartTimesTries(my_ptype, title, 'start2', 'end2', m1_twin)
            return
        # adv
        if mlevel == 'level2' and mytype == 'adv':
            if num == 1: self.advProblemsStackedBar(['a2c0', 'a2c1'], 'a2')
            if num == 2: self.advProblemsStackedBar(['a3c0', 'a3c1', 'a3c2'], 'a3')
            if num == 3: self.advProblemsStackedBar(['s2b0', 's2b1'], 's2')
            if num == 4: self.advProblemsStackedBar(['s3b0', 's3b1', 's3b2'], 's3')
            if num == 5: self.advProblemsStackedBar(['m2b', 'm2c'], 'm2')
            if num == 6: self.advProblemsStackedBar(['d3.1.n', 'd3.1.y', 'd3.2.n', 'd3.2.y'], 'd3')

    def setWeekMax(self, qstr):
        self.wkmax = self.dfc.query(qstr)['date_week'].max()

    def prbcountWeekData(self, qstr, start, end):
        # create a dict for making a df that has 26 weeks (no gaps)
        week_dict = {
            'date_week':list(range(start, end)),
            'idproblem_count':[0]*26
        }
        sb_index = pd.RangeIndex(start, end, name='date_week')
        # get the session week total for the query - note my have gaps
        temp = self.dfc.query(qstr).groupby('date_week')['idproblem_count'].sum()
        # create 26 week frame with all zeros then update with session data
        temp_all = pd.DataFrame(week_dict)
        temp_all.index = sb_index
        temp_all.update(temp)
        # return the 26 slot series with the problem counts
        return temp_all['idproblem_count']

    def getStackedBarParams(self):
        sbparams = {
            'data1' : {},
            'data2'  : {},
            'start1' : -1,
            'start2' : -1,
            'end1' : -1,
            'end2' : -1,
            'index1' : None,
            'index2' : None,
            'title1' : '',
            'title2' : '',
            'xlabel1' : '%s' % (self.tref),
            'xlabel2' : '%s' % (self.tref),
            'ylabel' : '',
            'twin_x1' : None,
            'twin_y1' : None,
            'twin_x2' : None,
            'twin_y2' : None
        }
        return sbparams

    # 1-26 & 27-52 week stacked bar showing count of problems by idlevel
    def m1ProblemsStackedBar(self):
        self.save_name = '%s_%s' % (self.save_name_prefix, 'Problem_Type.png')
        my_order = [2, 3, 4, 5, 6, 7, 8, 9]
        # get the max week number for this year
        qstr = '(date_week >= %d and date_week < %d)' % (self.wsplits['start1'],
                                                         self.wsplits['end2'])
        qstr += ' and (idlevel == "m1")'
        self.setWeekMax(qstr)
        sbparams = self.getStackedBarParams()
        start = self.wsplits['start1']
        end = self.wsplits['end1']
        sbparams['start1'] = start
        sbparams['end1'] = end
        sbparams['twin_x1'], sbparams['twin_y1'] = self.getM1OrderedTwin('all', start, end, 0)
        if self.wkmax > 26:
            sbparams['sbindex1'] = pd.RangeIndex(start, end, name='week')
        else:
            sbparams['sbindex1'] = pd.RangeIndex(start, self.wkmax+1, name='week')
        for num in my_order:
            qstr = '(date_week >= %d & date_week < %d)' % (start, end)
            qstr += ' and (ptype == "m1.%d")' % (num)
            myseries = self.prbcountWeekData(qstr, start, end)
            if self.wkmax < 26:
                sbparams['data1'][num] = myseries[:self.wkmax]
            else:
                sbparams['data1'][num] = myseries
        if self.wkmax > 26:
            sbparams['title1'] = 'M1 Problems %s 1-52' % (self.trefcap)
        else:
            sbparams['title1'] = 'M1 Problems %s 1-26' % (self.trefcap)
        if self.wkmax > 26:
            start = self.wsplits['start2']
            end = self.wsplits['end2']
            sbparams['start2'] = start
            sbparams['end2'] = end
            sbparams['twin_x2'], sbparams['twin_y2'] = self.getM1OrderedTwin('all', start, end, 0)
            sbparams['sbindex1'] = pd.RangeIndex(start, end, name='week')
            for num in my_order:
                qstr = '(date_week >= %d & date_week < %d)' % (start, end)
                qstr += ' and (ptype == "m1.%d")' % (num)
                sbparams['data2'][num] = self.prbcountWeekData(qstr, start, end)
        self.plotStackedBar(sbparams)

    # 1-26 & 27-52 week stacked bar showing count of problems by idlevel
    def ptypeProblemsStackedBar(self, idlevel, my_order):
        self.save_name = '%s_%s' % (self.save_name_prefix, 'Problem_Type.png')
        # get the max week number for this year
        qstr = '(date_week >= %d and date_week < %d)' % (self.wsplits['start1'],
                                                         self.wsplits['end2'])
        qstr += ' and (idlevel == "%s")' % (idlevel)
        self.setWeekMax(qstr)
        sbparams = self.getStackedBarParams()
        start = self.wsplits['start1']
        end = self.wsplits['end1']
        sbparams['start1'] = start
        sbparams['end1'] = end
        if self.wkmax > 26:
            sbparams['sbindex1'] = pd.RangeIndex(start, end, name='week')
        else:
            sbparams['sbindex1'] = pd.RangeIndex(start, self.wkmax+1, name='week')
        for pt in my_order:
            qstr = '(date_week >= %d & date_week < %d)' % (start, end)
            qstr += ' and (ptype == "%s")' % (pt)
            myseries = self.prbcountWeekData(qstr, start, end)
            if self.wkmax < 26:
                sbparams['data1'][pt] = myseries[:self.wkmax]
            else:
                sbparams['data1'][pt] = myseries
        if self.wkmax > 26:
            sbparams['title1'] = '%s Problem Types %s 1-%d' % (idlevel, self.trefcap, self.wkmax)
        else:
            sbparams['title1'] = '%s Problem Types %s 1-26' % (idlevel, self.trefcap)
        if self.wkmax > 26:
            start = self.wsplits['start2']
            end = self.wsplits['end2']
            sbparams['start2'] = start
            sbparams['end2'] = end
            sbparams['sbindex1'] = pd.RangeIndex(start, end, name='week')
            for pt in my_order:
                qstr = '(date_week >= %d & date_week < %d)' % (start, end)
                qstr += ' and (ptype == "%s")' % (pt)
                sbparams['data2'][pt] = self.prbcountWeekData(qstr, start, end)
        self.plotStackedBar(sbparams)

    # 1-26 & 27-52 week bar showing outlier count of problems by idlevel
    def outlierProblemsStackedBar(self, my_order, mytype):
        # get the max week number for this year
        self.save_name = '%s_%s' % (self.save_name_prefix, 'Outliers.png')
        qstr = '(date_week >= %d and date_week < %d)' % (self.wsplits['start1'],
                                                         self.wsplits['end2'])
        self.setWeekMax(qstr)
        sbparams = self.getStackedBarParams()
        start = self.wsplits['start1']
        end = self.wsplits['end1']
        sbparams['start1'] = start
        sbparams['end1'] = end
        if self.wkmax > 26:
            sbparams['sbindex1'] = pd.RangeIndex(start, end, name='week')
        else:
            sbparams['sbindex1'] = pd.RangeIndex(start, self.wkmax+1, name='week')
        for lvl in my_order:
            qstr = '(date_week >= %d & date_week < %d)' % (start, end)
            qstr += ' and (idlevel in [ "%s" ])' % (lvl)
            qstr += ' and (outlier == True)'
            myseries = self.prbcountWeekData(qstr, start, end)
            if self.wkmax < 26:
                sbparams['data1'][lvl] = myseries[:self.wkmax]
            else:
                sbparams['data1'][lvl] = myseries
        if self.wkmax > 26:
            sbparams['title1'] = '%s Outlier Problems %s 1-%d' % (mytype, self.trefcap, self.wkmax)
        else:
            sbparams['title1'] = '%s Outlier Problems %s 1-26' % (mytype, self.trefcap)
        if self.wkmax > 26:
            start = self.wsplits['start2']
            end = self.wsplits['end2']
            sbparams['start2'] = start
            sbparams['end2'] = end
            sbparams['sbindex1'] = pd.RangeIndex(start, end, name='week')
            for lvl in my_order:
                qstr = '(date_week >= %d & date_week < %d)' % (start, end)
                qstr += ' and (idlevel in [ "%s" ])' % (lvl)
                qstr += ' and (outlier == True)'
                sbparams['data2'][lvl] = self.prbcountWeekData(qstr, start, end)
        self.plotStackedBar(sbparams)

    # 1-26 & 27-52 week stacked bar showing count of problems by idlevel
    def totalProblemsStackedBar(self, my_order, mytype):
        # get the max week number for this year
        self.save_name = '%s_%s' % (self.save_name_prefix, 'Total_Problems.png')
        qstr = '(date_week >= %d and date_week < %d)' % (self.wsplits['start1'],
                                                         self.wsplits['end2'])
        self.setWeekMax(qstr)
        sbparams = self.getStackedBarParams()
        start = self.wsplits['start1']
        end = self.wsplits['end1']
        sbparams['start1'] = start
        sbparams['end1'] = end
        if self.wkmax > 26:
            sbparams['sbindex1'] = pd.RangeIndex(start, end, name='week')
        else:
            sbparams['sbindex1'] = pd.RangeIndex(start, self.wkmax+1, name='week')
        for lvl in my_order:
            qstr = '(date_week >= %d & date_week < %d)' % (start, end)
            qstr += ' and (idlevel in [ "%s" ])' % (lvl)
            myseries = self.prbcountWeekData(qstr, start, end)
            if self.wkmax < 26:
                sbparams['data1'][lvl] = myseries[:self.wkmax]
            else:
                sbparams['data1'][lvl] = myseries
        if self.wkmax > 26:
            sbparams['title1'] = '%s Total Problems %s 1-%d' % (mytype, self.trefcap, self.wkmax)
        else:
            sbparams['title1'] = '%s Total Problems %s 1-26' % (mytype, self.trefcap)
        if self.wkmax > 26:
            start = self.wsplits['start2']
            end = self.wsplits['end2']
            sbparams['start2'] = start
            sbparams['end2'] = end
            sbparams['sbindex1'] = pd.RangeIndex(start, end, name='week')
            for lvl in my_order:
                qstr = '(date_week >= %d & date_week < %d)' % (start, end)
                qstr += ' and (idlevel in [ "%s" ])' % (lvl)
                sbparams['data2'][lvl] = self.prbcountWeekData(qstr, start, end)
        self.plotStackedBar(sbparams)

    # 1-26 & 27-52 week stacked bar showing count of problems by idlevel
    def advProblemsStackedBar(self, my_order, mytype):
        self.save_name = '%s_%s' % (self.save_name_prefix, 'Problem_Type.png')
        # get the max week number for this year
        qstr = '(date_week >= %d and date_week < %d)' % (self.wsplits['start1'],
                                                         self.wsplits['end2'])
        self.setWeekMax(qstr)
        sbparams = self.getStackedBarParams()
        start = self.wsplits['start1']
        end = self.wsplits['end1']
        sbparams['start1'] = start
        sbparams['end1'] = end
        if self.wkmax > 26:
            sbparams['sbindex1'] = pd.RangeIndex(start, end, name='week')
        else:
            sbparams['sbindex1'] = pd.RangeIndex(start, self.wkmax+1, name='week')
        times_types = ''
        for ptype in my_order:
            times_types += '"%s", ' % (ptype)
            qstr = '(date_week >= %d & date_week < %d)' % (start, end)
            qstr += ' and (ptype == "%s")' % (ptype)
            myseries = self.prbcountWeekData(qstr, start, end)
            if self.wkmax < 26:
                sbparams['data1'][ptype] = myseries[:self.wkmax]
            else:
                sbparams['data1'][ptype] = myseries
        times_types = times_types[:len(times_types)-2]
        qstr = '(date_week >= %d & date_week < %d)' % (start, end)
        qstr += ' and (ptype in [%s])' % (times_types)
        tlimit = self.limits_time[mytype] * 1000
        qstr += ' and (time < %d)' % (tlimit)
        x, y = self.getAdvTimeTwin(qstr, start, end, 1)
        sbparams['twin_x1'] = x
        sbparams['twin_y1'] = y
        if self.wkmax > 26:
            sbparams['title1'] = '%s Total Problems %s 1-%d' % (mytype, self.trefcap, self.wkmax)
        else:
            sbparams['title1'] = '%s Total Problems %s 1-26' % (mytype, self.trefcap)
        if self.wkmax > 26:
            start = self.wsplits['start2']
            end = self.wsplits['end2']
            sbparams['start2'] = start
            sbparams['end2'] = end
            sbparams['sbindex1'] = pd.RangeIndex(start, end, name='week')
            times_types = ''
            for ptype in my_order:
                times_types += '"%s", ' % (ptype)
                qstr = '(date_week >= %d & date_week < %d)' % (start, end)
                qstr += ' and (ptype == "%s")' % (ptype)
                sbparams['data2'][ptype] = self.prbcountWeekData(qstr, start, end)
            times_types = times_types[:len(times_types)-2]
            qstr = '(date_week >= %d & date_week < %d)' % (start, end)
            qstr += ' and (ptype in [%s])' % (times_types)
            tlimit = self.limits_time[mytype] * 1000
            qstr += ' and (time < %d)' % (tlimit)
            x, y = self.getAdvTimeTwin(qstr, start, end, 1)
            sbparams['twin_x2'] = x
            sbparams['twin_y2'] = y
        self.plotStackedBar(sbparams)

    def getAdvTimeTwin(self, qstr, start, end, i_start):
        times = self.dfc.query(qstr).groupby('date_week')['time'].mean()
        # pad array to allow for twin alignment starting at x=0
        x = [0]
        y = [0.0]
        i = i_start
        for k in range(start, end):
            # need to adjust for 1-26 series vs. 27-52
            index = i + (start - 1)
            x.append(i-1)
            if index in times:
                y.append(round(times[index]/1000.0, 0))
            else:
                y.append(0.0)
            i += 1
        return x, y

    # 1-26 & 27-52 week stacked bar showing count of problems by idlevel
    def plotStackedBar(self, sbparams):
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
        if self.wkmax > 26:
            fig, axes = plt.subplots(2, 1, figsize=(8,5), sharey=False)
            ax_1 = axes[0]
            ax_2 = axes[1]
        else:
            fig, ax_1 = plt.subplots(1, 1, figsize=(8,5), sharey=False)
        # ax1 stacked bar plot
        df_sb = pd.DataFrame(sbparams['data1'], index=sbparams['index1'])
        ax1 = df_sb.plot(kind='bar', stacked=True, ax=ax_1)
        ax1.set_ylabel(sbparams['ylabel'])
        ax1.set_xlabel(sbparams['xlabel1'])
        ax1.set_title(sbparams['title1'])
        ax1.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
        if self.wkmax > 26:
            ax1.legend(loc='upper left', bbox_to_anchor=(0.0, 1.40), ncol=12, fancybox=True, shadow=True)
        else:
            ax1.legend(loc='upper left', bbox_to_anchor=(0.0, 1.15), ncol=12, fancybox=True, shadow=True)
        ax1.invert_xaxis()
        tic = '' if sbparams['start1'] == 1 else '-'
        hdr = '%s%d %s' % (tic, sbparams['start1'], self.tref)
        plt.figtext(0.86,0.9, hdr, fontsize=8, va="bottom", ha="left")
        hdr = '-%d %s' % (sbparams['end1']-1, self.tref)
        plt.figtext(0.13,0.9, hdr, fontsize=8, va="bottom", ha="left")
        if sbparams['twin_x1'] and sbparams['twin_y1']:
            ax_twin1 = ax1.twinx()
            ax_twin1.plot(sbparams['twin_x1'], sbparams['twin_y1'], color='black', linewidth=0.5)
        # ax2 data
        if self.wkmax > 26:
            # ax2 stacked bar plot
            df_sb = pd.DataFrame(sbparams['data2'], index=sbparams['index2'])
            ax2 = df_sb.plot(kind='bar', stacked=True, ax=ax_2)
            ax2.set_ylabel(sbparams['ylabel'])
            ax2.set_xlabel(sbparams['xlabel2'])
            ax2.set_title(sbparams['title2'])
            ax2.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
            #ax2.legend(title='level', bbox_to_anchor=(1.0, 1.05), loc='upper left')
            ax2.get_legend().remove()
            ax2.invert_xaxis()
            hdr = '-%d %s' % (sbparams['start2'], self.tref)
            plt.figtext(0.86,0.42, '-27 %s' % (self.tref), fontsize=8, va="bottom", ha="left")
            hdr = '-%d %s' % (sbparams['end2']-1, self.tref)
            plt.figtext(0.13,0.42, hdr, fontsize=8, va="bottom", ha="left")
            # adjust white space
            fig.subplots_adjust(hspace=0.6)
            if sbparams['twin_x2'] and sbparams['twin_y2']:
                ax_twin2 = ax2.twinx()
                ax_twin2.plot(sbparams['twin_x2'], sbparams['twin_y2'], color='black', linewidth=0.5)
        #show and or save
        if self.save_flag == 'S' or self.save_flag == 'B':
            self.save_name = '%s_%s' % (self.trefprefix, self.save_name)
            plt_path = self.output_charts / self.save_name
            plt.savefig(str(plt_path))
            print('\nOUTPUT saved chart: %s' % (str(plt_path.name)))
        if self.save_flag == 'D' or self.save_flag == 'B':
            plt.show(block=False)
        print('\nchart completed & closed')

    def chartTimesTries(self, idlevel, mytype, start_str, end_str, m1_twin):
        self.save_name = '%s_%s' % (self.save_name_prefix, 'Times_Tries.png')
        # need to set ptype based on m1 idlevel in like m1.2
        my_ptype = None
        if idlevel[:2] == 'm1':
            my_ptype = '' + idlevel
            idlevel = 'm1'
        qstr = '(idlevel == "%s" )' % (idlevel)
        self.wkmax = self.dfc.query(qstr)['date_week'].max()
        start = self.wsplits[start_str]
        end = self.wsplits[end_str]
        week_dict = {
            'date_week':list(range(start, end)),
            'elapsed':[0.0]*26
        }
        sb_index = pd.RangeIndex(start, end, name='date_week')
        tlimit = self.limits_time[idlevel] * 1000
        qstr = '(date_week >= %d & date_week < %d)' % (start, end)
        if my_ptype:
            qstr += ' and (ptype == "%s")' % (my_ptype)
        else:
            qstr += ' and (idlevel in [ "%s" ])' % (idlevel)
        qstr += ' and (time < %d)' % (tlimit)
        times = self.dfc.query(qstr).groupby('date_week')['elapsed'].mean()
        #times.set_index('date_week')
        times_all = pd.DataFrame(week_dict)
        times_all.index = sb_index
        times_all.update(times)
        times_all['elapsed'] = times_all['elapsed'] / 1000
        if self.wkmax < 26:
            times_all = times_all[:self.wkmax]
        std_times = self.dfc.query(qstr).groupby('date_week')['elapsed'].std(ddof=0)
        std_times_all = pd.DataFrame(week_dict)
        std_times_all.index = sb_index
        std_times_all.update(std_times)
        std_times_all['elapsed'] = std_times_all['elapsed'] / 1000
        if self.wkmax < 26:
            std_times_all = std_times_all[:self.wkmax]
        tries = self.dfc.query(qstr).groupby('date_week')['tries'].mean()
        week_dict = {
            'date_week':list(range(start, end)),
            'tries':[0.0]*26
        }
        tries_all = pd.DataFrame(week_dict)
        tries_all.index = sb_index
        tries_all.update(tries)
        if self.wkmax < 26:
            tries_all = tries_all[:self.wkmax]
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
        ax1.set_xlabel('%s' % (self.tref), fontsize=5)
        ax1.set_ylabel('seconds (std dev)', fontsize=8)
        ax1.errorbar(x, y, yerr=y_error, fmt='none', ecolor='r')
        ax1.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
        ax1.set_title('%s Avg Time to Right Answer (with std dev)' % (mytype), fontsize=8)
        ax1.invert_xaxis()
        x_axis = ax1.axes.get_xaxis()
        x_label = x_axis.get_label()
        x_label.set_visible(False)
        tic = '' if start == 1 else '-'
        hdr = '%s%d %s' % (tic, start, self.tref)
        plt.figtext(0.86,0.89, hdr, fontsize=8, va="bottom", ha="left")
        hdr = '-%d %s' % (end-1, self.tref)
        plt.figtext(0.13,0.89, hdr, fontsize=8, va="bottom", ha="left")
        #ax2
        x = tries_all['date_week']
        y = tries_all['tries']
        ax2.bar(x,y)
        ax2.set_xticks(x)
        ax2.set_xlabel('%s' % (self.tref), fontsize=5)
        ax2.set_ylabel('tries', fontsize=8)
        ax2.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
        ax2.set_title('%s Avg Number of Tries to Right Answer' % (mytype), fontsize=8)
        ax2.invert_xaxis()
        if m1_twin:
            ax_twin2 = ax2.twinx()
            ax_twin2.plot(m1_twin['x'], m1_twin['y'], color='red', linewidth=1.0)
        x_axis = ax2.axes.get_xaxis()
        x_label = x_axis.get_label()
        x_label.set_visible(False)
        hdr = '%s%d %s' % (tic, start, self.tref)
        plt.figtext(0.84,0.43, hdr, fontsize=8, va="bottom", ha="left")
        hdr = '-%d %s' % (end-1, self.tref)
        plt.figtext(0.13,0.43, hdr, fontsize=8, va="bottom", ha="left")
        fig.subplots_adjust(hspace=0.5)
        #show and or save
        if self.save_flag == 'S' or self.save_flag == 'B':
            self.save_name = '%s_%s' % (self.trefprefix, self.save_name)
            plt_path = self.output_charts / self.save_name
            plt.savefig(str(plt_path))
            print('\nOUTPUT saved chart: %s' % (str(plt_path.name)))
        if self.save_flag == 'D' or self.save_flag == 'B':
            plt.show(block=False)
        print('\nchart completed & closed')

    def chartLifetimeDevice(self): 
        self.save_name = '%s_%s' % (self.save_name_prefix, 'Lifetime_Problems.png')
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
        #show and or save
        if self.save_flag == 'S' or self.save_flag == 'B':
            self.save_name = '%s_%s' % (self.trefprefix, self.save_name)
            plt_path = self.output_charts / self.save_name
            plt.savefig(str(plt_path))
            print('\nOUTPUT saved chart: %s' % (str(plt_path.name)))
        if self.save_flag == 'D' or self.save_flag == 'B':
            plt.show(block=False)

class AnalysisMenus():
    def __init__(self, dframe_in, week_last, days52):
        self.dfm = dframe_in;
        self.order = ['a1', 'a2', 'a3', 's1', 's2', 's3', 'm1', 'm2', 'd3']
        self.week_last = week_last
        self.year = 1
        self.days51 = days52
        self.tref = 'days' if days52 else 'weeks'
        self.tref12 = '(52 days)' if days52 else '(12 mns)'
        self.tref06 = '(26 days)' if days52 else '(6 mns)'
        self.trefprev = '26 days' if days52 else '6 mns'
        self.wsplits = self.getWeekSplits()
        self.levels = {} # initialized & updated using year idelevel/problems
        self.counts = {} # stores year (52 wks), months (26 wks) & weeks (4 wks)
        # yearly total of m1 problem counts by 1st ord digit & random/ordered
        self.mcounts = { '1r':0, '1o':0, '2r':0, '2o':0, '3r':0, '3o':0,
                         '4r':0, '4o':0, '5r':0, '5o':0, '6r':0, '6o':0,
                         '7r':0, '7o':0, '8r':0, '8o':0, '9r':0, '9o':0 }

    def setMcounts(self):
        for key in self.mcounts.keys():
            qstr = '(idlevel == "m1") and (ptype == "%s")' % (key)
            c = self.dfm.query(qstr)['idproblem_count'].sum()
            self.mcounts[key] = c

    def setIdlevelCounts(self):
        # uses the levels {} items to provide easy access to idlevels problem
        # totals. Splits are: year=52wks, months=26wks, weeks=4wks 
        self.counts = {'tot':{'year':0, 'months':0, 'prev':0, 'weeks':0},
                       'add':{'year':0, 'months':0, 'prev':0, 'weeks':0},
                       'sub':{'year':0, 'months':0, 'prev':0, 'weeks':0},
                       'd3':{'year':0,  'months':0, 'prev':0, 'weeks':0},
                       'a1':{'year':0,  'months':0, 'prev':0, 'weeks':0},
                       'a2':{'year':0,  'months':0, 'prev':0, 'weeks':0},
                       'a3':{'year':0,  'months':0, 'prev':0, 'weeks':0},
                       's1':{'year':0,  'months':0, 'prev':0, 'weeks':0},
                       's2':{'year':0,  'months':0, 'prev':0, 'weeks':0},
                       's3':{'year':0,  'months':0, 'prev':0, 'weeks':0},
                       'm1':{'year':0,  'months':0, 'prev':0, 'weeks':0},
                       'm2':{'year':0,  'months':0, 'prev':0, 'weeks':0},
                       'adv':{'year':0, 'months':0, 'prev':0, 'weeks':0},
                       'all':{'count':0}}
        all = self.dfm['idproblem_count'].sum()
        self.counts['all']['count'] = all
        for k, v in self.levels.items():
            self.counts['tot']['year'] += v['year']
            self.counts['tot']['months'] += v['months']
            self.counts['tot']['weeks'] += v['weeks']
            self.counts['tot']['prev'] += v['prev']
            if k[0:1] == 'a':
                self.counts['add']['year'] += v['year']
                self.counts['add']['months'] += v['months']
                self.counts['add']['weeks'] += v['weeks']
                self.counts['add']['prev'] += v['prev']
            if k[0:1] == 's':
                self.counts['sub']['year'] += v['year']
                self.counts['sub']['months'] += v['months']
                self.counts['sub']['weeks'] += v['weeks']
                self.counts['sub']['prev'] += v['prev']
            if k[0:2] in ['a2', 'a3', 's2', 's3', 'm2', 'd3']:
                self.counts['adv']['year'] += v['year']
                self.counts['adv']['months'] += v['months']
                self.counts['adv']['weeks'] += v['weeks']
                self.counts['adv']['prev'] += v['prev']
            self.counts[k]['year'] += v['year']
            self.counts[k]['months'] += v['months']
            self.counts[k]['weeks'] += v['weeks']
            self.counts[k]['prev'] += v['prev']

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
            self.levels[idlevel] = {'year':0, 'months':0, 'weeks':0, 'prev':0}
        ystart = self.wsplits['start1']
        yend = self.wsplits['end2']
        mstart = self.wsplits['start1']
        mend = self.wsplits['end1']
        dftemp = self.dfm['idproblem_count'].groupby([self.dfm['idlevel'],
                                                      self.dfm['date_week']]).sum()
        for k, mycount in dftemp.iteritems():
            mylevel = k[0]
            myweek = k[1]
            if myweek >= yend: continue
            if myweek >= ystart and myweek < yend:
                self.levels[mylevel]['year'] += mycount
            if myweek >= mstart and myweek < mend:
                self.levels[mylevel]['months'] += mycount
            if myweek < (mend - 22):
                self.levels[mylevel]['weeks'] += mycount
            self.levels[mylevel]['prev'] = self.levels[mylevel]['year'] - self.levels[mylevel]['months']

    def m1ValidMenuChoice(self, choice_str):
        digit_not_needed = [1]
        digits_ok = ['2', '3', '4', '5', '6', '7', '8', '9']
        # first char must be an integer
        try:
            choice = int(choice_str[0:1])
        except:
            return None, None, False
        # if only one char entered exit & leave remaining validation to caller
        if choice in digit_not_needed:
            return choice, None, True
        # handle menu.digit entry
        if len(choice_str) != 3:
            return choice, None, False
        digit_str = choice_str[2:3]
        if not digit_str in digits_ok:
            return choice, None, False
        return choice, int(digit_str), True

    def menuLevel1(self):
        ok = [1, 2, 3, 4, 5, 6, 7]
        ok_str = ', '.join([str(i) for i in ok])
        err_str = ''
        order = ['t01', 't02', 't03', 'a1', 's1', 'm1', 'adv']
        titles = {
            't01':['1) CHART: Problems Done', self.tref12, 'tot', 'year'],
            't02':['2) CHART: Lifetime Total by Device', '(all year)', 'all', 'count'],
            't03':['3) CHART: Outliers', self.tref12, 'tot', 'year'],
            'a1':['4) MENU: Addition 1-Digit', self.tref12, 'add', 'year'],
            's1':['5) MENU: Subtraction 1-Digit', self.tref12, 'sub', 'year'],
            'm1':['6) MENU: Multiply 1-Digit', self.tref12, 'm1', 'year'],
            'adv':['7) MENU: 2-3 Digit Add/Sub/Mult & Division', self.tref12, 'adv', 'year']
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
            if choice == 1 and self.counts['tot']['year'] == 0:
                err_str = 'Sorry no problems'
            if choice == 2 and self.counts['all']['count'] == 0:
                err_str = 'Sorry no problems'
            if choice == 3 and self.counts['tot']['year'] == 0:
                err_str = 'Sorry no problems'
            if choice == 4 and self.counts['a1']['year'] == 0:
                err_str = 'Sorry no problems'
            if choice == 5 and self.counts['s1']['year'] == 0:
                err_str = 'Sorry no problems'
            if choice == 6 and self.counts['m1']['year'] == 0:
                err_str = 'Sorry no problems'
            if choice == 7 and self.counts['adv']['year'] == 0:
                err_str = 'Sorry no problems'
            if len(err_str) > 0: continue
            return order[choice-1]

    def menuLevel2(self, idchoice_in):
        idchoice = '' + idchoice_in
        titles = {'a1':'ADDITION 1-Digit', 's1':'SUBTRACTION 1-Digit', 'm1':'MULTIPLY 1-Digit',
                  'adv':'2/3-Digit Add/Sub/Mult & Division'}
        choices = {
            'a1' : [['1) CHART: Times & Tries (%s  1-26)' % (self.tref), self.tref06, 'a1', 'months'],
                    ['2) CHART: Times & Tries (%s 27-52)' % (self.tref), '(prev %s' % (self.tref06[1:]), 'a1', 'prev'],
                    ['3) CHART: Problem Type', self.tref12, 'a1', 'year'],
                    ['4) CHART: Outliers', self.tref12, 'a1', 'year']],
            's1' : [['1) CHART: Times & Tries (%s  1-26)' % (self.tref), self.tref06, 's1', 'months'],
                    ['2) CHART: Times & Tries (%s 27-52)' % (self.tref), '(%s prev)' % (self.trefprev), 's1', 'prev'],
                    ['3) CHART: Problem Type', self.tref12, 's1', 'year'],
                    ['4) CHART: Outliers', self.tref12, 's1', 'year']],
            'm1' : [['1) CHART: Yearly Problems by Digit', self.tref12, 'm1', 'year'],
                    ['2) CHART: Times & Tries (%s 1-26)' % (self.tref), '(%s)' % (self.trefprev), 'm1', 'months', 'm1'],
                    ['3) CHART: Times $ Tries (%s 27-52)' % (self.tref), '(prev %s)' % (self.trefprev), 'm1', 'prev', 'm1']],
            'adv' : [['1) CHART: A2 Problems & Times', self.tref12, 'a2', 'year'],
                    ['2) CHART: A3 Problems & Times', self.tref12, 'a3', 'year'],
                    ['3) CHART: S2 Problems & Times', self.tref12, 's2', 'year'],
                    ['4) CHART: S3 Problems & Times', self.tref12, 's3', 'year'],
                    ['5) CHART: M2 Problems & Times', self.tref12, 'm2', 'year'],
                    ['6) CHART: LD Problems & Times', self.tref12, 'd3', 'year']]
        }
        ok_list = {
            'a1':[1, 2, 3, 4],
            's1':[1, 2, 3, 4],
            'm1':[1, 2, 3],
            'adv':[1, 2, 3, 4, 5, 6]
            }
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
        digit = None
        while True:
            print('-'*50)
            len_dash = int((50 - len(mychoice)) / 2)
            print('\n\n%s%s%s' % ('-'*len_dash, mytitle, '-'*len_dash))
            for a in mychoice:
                count = self.counts[a[2]][a[3]]
                npad = nmax - len(str(count))
                npad += lmax - len(a[0])
                print('%s%s%d problems %s' % (a[0], ' '*(npad+5), count, a[1] ))
            if idchoice == 'm1':
                print('-'*50)
                print('For Times & Tries (2 & 3) enter Menu.Digit (2.3, 2.5, etc.)')
                print('Example 2.3 = "Times&Tries for 3s" or 2.5 = "Times&Tries for 5s"')
                print('-'*50)
            print('[Return to Exit, Q to quit]')
            print('-'*50)
            if len(err_str) > 0:
                print('\n*** Invalid Entry ***\n')
                print('-'*50)
                print(err_str)
                print('-'*50)
                err_str = ''
            choice = input('Please enter your choice (%s):' % (ok_str))
            if len(choice) == 0:
                return idchoice, 0, digit
            if choice.lower()[0:1] == 'q':
                print('\nGoodbye')
                sys.exit(0)
            if idchoice == 'm1':
                choice, digit, valid = self.m1ValidMenuChoice(choice)
                if choice is None:
                    err_str = 'Your entry must start with %s' % (ok_str)
                    continue
                if valid:
                    return idchoice, choice, digit
                if not valid:
                    err_str = 'For menu choices 2 to 5:\n'
                    err_str += 'Please enter something like 2.3 or 3.5 where\n'
                    err_str += 'The first number is the menu choice & the number\n'
                    err_str += 'following the dot is a 2-9 (digit to analyze)'
                    continue
            try:
                choice = int(choice)
            except:
                err_str = 'Please enter integer number only'
                continue
            if not choice in ok:
                err_str = 'Please limit entry to numbers shown'
                continue
            return idchoice, choice, digit

    def getYear(self, days52):
        self.year = 1
        # skip menu if only one year of data
        if self.week_last < 53 or days52: return
        ok = []
        err_str = ''
        while True:
            # exit by entering valid number or Return/Q to exit/quit
            print('\n\n%s' % ('-'*50))
            print('There is more than 1 year of data.')
            print('Please select the year you want to analyze.')
            print('-'*50)
            print('1) Year 1 (1-52 weeks previous)')
            ok.append(1)
            if self.week_last > 52:
                print('2) Year 2 (53-104 weeks previous)')
                ok.append(2)
            if self.week_last > 104:
                print('3) Year 3 (105-156 weeks previous)')
                ok.append(3)
            if self.week_last > 156:
                print('4) Year 4 (157-208 weeks previous)')
                ok.append(4)
            print('[Return to Exit, Q to quit]')
            if len(err_str) > 0:
                print('-'*50)
                print(err_str)
                err_str = ''
            ok_str = ', '.join([str(i) for i in ok])
            choice = input('Enter the year number to analyze (%s):' % (ok_str))
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

class FileHandler():
    def __init__(self, root):
        self.root = root
        self.json_file = None
        self.limits_time = {} # loaded from limits_time_default.txt file

    def getInputFile(self, path_inputs):
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
            print('[Return or Q to Quit]')
            print('-'*50)
            choice = input('Enter the number of the file to use (1-%d):' % (i-1))
            if choice.lower() == 'q':
                print('\nGoodbye')
                sys.exit(0)
            try:
                choice = int(choice)
            except:
                return True
            if choice in ok:
                self.json_file = files[choice-1]
                return False
            print('%s%s' % ('\n', '-'*50))
            print('Please limit entry to numbers shown')
            print('-'*50)

    def getDays52(self):
        ok = [1, 2]
        while True:
            print('%s%s' % ('\n', '-'*50))
            print('\n\nYou can analyze:\n1) 52 DAYS (current year only)')
            print('2) 52 weeks (any year)')
            print('[Return or Q to Quit]')
            print('-'*50)
            choice = input('Enter the number for the type of analysis:')
            if len(choice) == 0 or choice.lower() == 'q':
                print('\nGoodbye')
                sys.exit(0)
            try:
                choice = int(choice)
            except:
                print('%s%s' % ('\n', '-'*50))
                print('Please limit entry to numbers shown')
                continue
            if not choice in ok:
                print('%s%s' % ('\n', '-'*50))
                print('Please limit entry to numbers shown')
                continue
            print(choice == 1, 'choice == 1')
            return choice == 1

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

def processAnalysis():    
    root = Path(Path().resolve())
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
    fh = FileHandler(root)
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
        exit = fh.getInputFile(path_inputs)
        if exit:
            print('\nGoodbye')
            return
        days52 = fh.getDays52()
        if not fh.getTimeLimits():
            print('\nGoodbye')
            return
        pjf = ProcessJsonFile(root, fh.json_file, fh.limits_time, days52)
        pjf.readFile()
        pjf.processLines()
        pjf.createOutputSubfolder(output)
        pjf.copyPrevious()
        pjf.writeLinesStats()
        pjf.buildDataFrame()
        if pjf.week_last == -1:
            print('\nSorry no records were loaded.')
            print('Please check your download.')
            print('\nGoodbye')
            return
        am = AnalysisMenus(pjf.dframe, pjf.week_last, days52)
        am.getYear(days52) # year choice if week_last > 52
        print('\n\nYear %d being analyzed' % (am.year))
        am.getWeekSplits() # must follow getYear() as self.year is used
        am.getLevelsCount() 
        am.setMcounts()
        am.setIdlevelCounts() # must follow getLevelsCount()
        ca = ChartAnalysis(pjf.dframe, am.year, root, pjf.output_path, fh.limits_time, days52)
        ca.setSaveFlag()
        ca.getM2BasicChunkSplits()
        ca.getM2BasicChunkPctDF('all', 1, 26)
        ca.getM1OrdRndSplits()
        ca.getM1OrderedPctDF('all', 1, 26)
        menu_top = True
        while menu_top:
            c_top = am.menuLevel1()
            if c_top == 'exit':
                menu_top = False
                continue
            if c_top == 't01' or c_top == 't02' or c_top == 't03':
                ca.processChartChoice('top', c_top, 1, None)
                continue
            lvl, choice, digit = am.menuLevel2(c_top)
            if choice == 0: continue
            menu2 = True
            limit = 0
            while menu2:
                limit += 1
                if limit > 10: 
                    sys.exit(0)
                if choice == 0:
                    menu2 = False
                    continue
                ca.processChartChoice('level2', lvl, choice, digit)
                lvl, choice, digit = am.menuLevel2(lvl)
    print('\nAnalysis Complete')

if __name__ == '__main__':
    print(sys.platform)
    processAnalysis()


