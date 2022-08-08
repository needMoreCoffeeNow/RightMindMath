import json
import urllib.parse
from random import randint
import datetime
import glob

import matplotlib.pyplot as plt
import pandas as pd

PARAMS_FILE = 'parameters_analysis.txt'

class ProcessJsonFile():
    def __init__(self, input_file):
        self.filepath = './inputs/%s' % (input_file)
        self.week_first = 999999
        self.week_last = -1
        self.problems_d = {}
        self.expected = {}
        self.prob_level = {}
        self.steps_done = {}
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

    def dframeAddRec(self, my_df):
        for key, val in sorted(my_df.items()):
            array = self.dframe.setdefault(key, [])
            array.append(val)
            self.dframe[key] = array

    def readFile(self):
        uniques = {}
        with open(self.filepath) as f:
            lines = f.readlines()
        print('-'*50)
        print('%s FILE-STATS' % (self.filepath.split('/')[-1]))
        print('-'*50)
        print(len(lines), 'records loaded')
        for line in lines:
            dict = json.loads(line.rstrip())
            self.problems_d[dict['idsession']] = dict
            idsession = dict['idsession']
            parts = idsession.split('_')
            idsession = parts[0] + '_' + parts[1]
            if not idsession in uniques:
                uniques[idsession] = True
        print('%s total problems' % (len(uniques)))

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

    def printLinesStats(self):
        self.findIncompletes()
        order = ['a1', 'a2', 'a3', 's1', 's2', 's3', 'm1', 'm2', 'd3']
        for key in order:
            print('-'*30)
            if key == 'm1':
                val = self.p_count[key][0]
                mtot = val
                print('%d %s ordered problems' % (val, key)) 
                val = self.p_count[key][1]
                mtot += val
                print('%d %s random problems' % (val, key)) 
                print('%d %s total problems' % (mtot, key))
            else:
                val = self.p_count[key]
                print('%d %s problems' % (val, key))
            # 1-digit problems will never have incompletes
            if not key in self.p_multi: continue
            steps = int(key[1:2])
            tic = ' ' * (len(str(val)) - len(str(self.complete[key])))
            print('%s%d completed %d of %d steps' % (tic, 
                                                     self.complete[key],
                                                     steps,
                                                     steps))
            if val == self.complete[key]: continue
            tic = ' ' * (len(str(val)) - len(str(self.incomplete[key][0])))
            print('%s%d step 1 of %s completed' % (tic,
                                                   self.incomplete[key][0],
                                                   steps))
            if len(self.incomplete[key]) < 2: continue
            tic = ' ' * (len(str(val)) - len(str(self.incomplete[key][1])))
            print('%s%d step 2 of %s completed' % (tic, 
                                                   self.incomplete[key][1],
                                                   steps))
        print('-'*30)

class ChartAnalysis():
    def __init__(self, dfc, year):
        self.dfc = dfc;
        self.wsplits = self.setWeekSplits(year)
        self.show = True #show plot on screen
        self.savePlt = False # save plt to a file

    def setWeekSplits(self, year):
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
        fig, axes = plt.subplots(2, 1, figsize=(7,7), sharey=False)
        ax1 = axes[0]
        ax2 = axes[1]
        # need a 26 week index to match series returned by weeStackBarData()
        sb_index = pd.RangeIndex(1, 27, name='week')
        # ax1 graph
        sb_data = {}
        start = self.wsplits['start1']
        end = self.wsplits['end1']
        sb_data['a1'] =  self.weekStackBarData('a1', start, end)
        sb_data['a2'] =  self.weekStackBarData('a2', start, end)
        sb_data['a3'] =  self.weekStackBarData('a3', start, end)
        sb_data['s1'] =  self.weekStackBarData('s1', start, end)
        sb_data['s2'] =  self.weekStackBarData('s2', start, end)
        sb_data['s3'] =  self.weekStackBarData('s3', start, end)
        sb_data['m1'] =  self.weekStackBarData('m1', start, end)
        sb_data['m2'] =  self.weekStackBarData('m2', start, end)
        sb_data['d3'] =  self.weekStackBarData('d3', start, end)
        # stacked bar plot
        df_sb = pd.DataFrame(sb_data, index=sb_index)
        ax1 = df_sb.plot(kind='bar', stacked=True, ax=ax1)
        ax1.set_ylabel('problems')
        ax1.set_title('Weekly Problems Month 1-6')
        ax1.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
        ax1.legend(title='level', bbox_to_anchor=(1.0, 1), loc='upper left')
#        # ax2 graph
        sb_data = {}
        start = self.wsplits['start2']
        end = self.wsplits['end2']
        sb_data['a1'] =  self.weekStackBarData('a1', start, end)
        sb_data['a2'] =  self.weekStackBarData('a2', start, end)
        sb_data['a3'] =  self.weekStackBarData('a3', start, end)
        sb_data['s1'] =  self.weekStackBarData('s1', start, end)
        sb_data['s2'] =  self.weekStackBarData('s2', start, end)
        sb_data['s3'] =  self.weekStackBarData('s3', start, end)
        sb_data['m1'] =  self.weekStackBarData('m1', start, end)
        sb_data['m2'] =  self.weekStackBarData('m2', start, end)
        sb_data['d3'] =  self.weekStackBarData('d3', start, end)
        # stacked bar plot
        df_sb = pd.DataFrame(sb_data, index=sb_index)
        ax2 = df_sb.plot(kind='bar', stacked=True, ax=ax2)
        ax2.set_ylabel('problems')
        ax2.set_title('Weekly Problems Month 27-52')
        ax2.grid(color='#444', linestyle='--', linewidth=1, axis='y', alpha=0.4)
        ax2.legend(title='level', bbox_to_anchor=(1.0, 1), loc='upper left')
        fig.subplots_adjust(hspace=0.4)
        plt.show()

    def weekStackBarData(self, idlevel, wk_start, wk_end):
        # create a dict for making a df that has 26 weeks (no gaps)
        week_dict = {'date_week':list(range(1,27)), 'idproblem_count':[0]*26}
        sb_index = pd.RangeIndex(1, 27, name='date_week')
        qstr = '(date_week >= %d & date_week < %d)' % (wk_start, wk_end)
        qstr += 'and (idlevel in [ "%s" ])' % (idlevel)
        # get the session week total for the idlevel - note my have gaps
        temp_idl = self.dfc.query(qstr).groupby('date_week')['idproblem_count'].sum()
        # create 26 week frame with all zeros then update with session data
        temp_all = pd.DataFrame(week_dict)
        temp_all.index = sb_index
        temp_all.update(temp_idl)
        # return the 26 slot series with the problem counts
        return temp_all['idproblem_count']

def getInputFile():
    files = glob.glob('./inputs/*.txt')
    if len(files) == 0:
        print('\nError: No downloaded .txt files were found')
        print('Please use the RightMindMath app to export a file.')
        print('Be sure you save it in the inputs folder located in')
        print('the same folder as this Python (.py) file.')
        return('')
    sorted(files)
    myfiles = []
    for filepath in files:
        file = filepath.split('/')[-1]
        if file == PARAMS_FILE: continue
        myfiles.append(file)
    # exit loop by entering number or Return to exit
    err_str = ''
    while True:
        ok = []
        i = 1
        print('-'*50)
        if len(err_str) > 0:
            print(err_str)
            err_str = ''
        print('-'*50)
        for file in myfiles:
            print('%d) %s' % (i, file))
            ok.append(i)
            i += 1
        print('[Return to Exit]')
        choice = input('Enter the number of the file to use (1-%d):' % (i-1))
        try:
            choice = int(choice)
        except:
            return ''
        if choice in ok: return myfiles[choice-1]
        err_str = 'Please limit entry to numbers shown'

def getYear(week_last):
    ok = [1, 2, 3, 4]
    # exit loop by entering number or Return to exit
    err_str = ''
    while True:
        print('-'*50)
        print('1) Year 1 (1-52 weeks previous)')
        if week_last > 52: print('2) Year 2 (53-104 weeks previous)')
        if week_last > 104: print('3) Year 3 (105-156 weeks previous)')
        if week_last > 156: print('4) Year  (157-208 weeks previous)')
        print('[Return to Exit]')
        if len(err_str) > 0:
            print('-'*50)
            print(err_str)
            err_str = ''
        choice = input('Enter the year number to analyze (1, 2, or 3):')
        try:
            choice = int(choice)
        except:
            return ''
        if choice in ok: return choice
        err_str = 'Please limit entry to numbers shown'

def validInputsOutputs():
    flist = glob.glob('*')
    count = 0
    for name in flist:
        if name == 'inputs': count += 1
        if name == 'outputs': count += 1
    if count != 2:
        print('%s%s' % ('\n', '-'*40))
        print('The required sub-folders are missing.')
        print('Please create two sub-folders in')
        print('the same folder as the Python (.py) file.')
        print('(note: names must be lower case)')
        print('-'*40)
        print('Name one folder: inputs')
        print('Name one folder: outputs')
        print('-'*40)
        print('\nGoodbye')
        return False
    return True

def processAnalysis():    
    if not validInputsOutputs(): return
    input_file = getInputFile()
    if len(input_file) == 0:
        print('\nGoodbye')
        return
    pjf = ProcessJsonFile(input_file)
    pjf.readFile()
    pjf.processLines()
    pjf.printLinesStats()
    pjf.buildDataFrame()
    if pjf.week_last == -1:
        print('\nSorry no records were loaded. Please check your download.')
        return
    year = 1
    if pjf.week_last > 52:
        year = getYear(pjf.week_last)
        if len(str(year)) == 0:
            print('\nGoodbye')
            return
    print('Year %d being analyzed' % (year))
    print('-'*50)
    df = pd.DataFrame(pjf.dframe)
    ca = ChartAnalysis(df, year)
    ca.totalProblemsStackedBar()
    print('done')

if __name__ == '__main__':
    processAnalysis()


