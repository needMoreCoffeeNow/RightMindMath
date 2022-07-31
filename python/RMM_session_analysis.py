import json
import urllib.parse
from random import randint

def randomizedNotes():
    limit_1 = 7
    my_n = ''
    my_n += 't' if randint(1, 10) < limit_1 else 'f'
    my_n += '.'
    my_n += 't' if randint(1, 10) < limit_1 else 'f'
    my_n += '.'
    my_n += 't' if randint(1, 10) < limit_1 else 'f'
    my_n += '.'
    my_n += 't' if randint(1, 10) < limit_1 else 'f'
    my_n += '.'
    my_n += 't' if randint(1, 10) < limit_1 else 'f'
    my_n += '.'
    my_n += 't' if randint(1, 10) < limit_1 else 'f'
    return my_n

class ProcessJsonFile():
    def __init__(self, file_input):
        self.file_input = file_input
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
                        'm1':[0,0], 'm2':0, 'm3':0,
                        'd3':0}
        self.dframe_dict = {
            # r_str vars start
            'idlevel_rstr' : None,
            'steps_total' : None,
            'steps_count' : None,
            'session_problem' : None,
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
            'session_multi' : None,
            'session_problem' : None,
            'idlevel' : None,
            'idproblem' : None,
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
            'note_borrow' : None,
            'note_bpopup' : None,
            'note_carry' : None,
            'note_chunk' : None,
            'note_next' : None,
            'note_numpos' : None,
            'chunk_count' : None,
        }


    def parseRstr(self, r_str, tstamp, time):
        multi = {'d3':True, 'm2':True}
        my_fr = self.dframe_dict.copy()
        parts = r_str.split('^')
        vars = parts[0].split('.')
        # strip the b/c from M2b M2c
        my_fr['idlevel_rstr'] = vars[0]
        idlevel = vars[0][0:2]
        if (idlevel == 'm2'):
            my_fr['m2_basic'] = vars[0][2:3] == 'b'
        if not idlevel in multi:
            my_fr['steps_total'] = int(vars[1])
            my_fr['steps_count'] = int(vars[2]) + 1 # change to 1=start index
            vars = parts[1].split('|')
            my_fr['op1'] = int(vars[0])
            my_fr['op2'] = int(vars[1])
            my_fr['answer'] = int(vars[2])
            my_fr['op'] = vars[3]
            if idlevel == 'm1':
                my_fr['chunk_count'] = int(parts[4])
            else:
                my_fr['chunk_count'] = int(parts[3])
        else:
            my_fr['session_multi'] = True
            if idlevel == 'd3':
                vars = parts[1].split('/')
                my_fr['op1'] = int(vars[0])
                my_fr['op2'] = int(vars[1])
                my_fr['answer'] = float(my_fr['op1']) / float(my_fr['op2'])
                my_fr['op'] = '/'
            else:
                vars = parts[1].split('x')
                my_fr['op1'] = int(vars[0])
                my_fr['op2'] = int(vars[1])
                my_fr['answer'] = my_fr['op1'] * my_fr['op2']
                my_fr['op'] = 'x'
        if idlevel == 'm':
            my_fr['ordered'] = parts[2] == 'true'
        if my_fr['op1'] < 0: my_fr['neg_op1'] = True
        if my_fr['op2'] < 0: my_fr['neg_op2'] = True
        if my_fr['answer'] < 0: my_fr['neg_ans'] = True
        if idlevel in multi:
            my_fr['chunk_count'] = int(parts[2])
            return my_fr # no answers for multi-digit problems
        # break out the answers for 1-digit problems
        if not idlevel ==  'm1':
            answers = parts[2].split('|')
        else:
            answers = parts[3].split('|')
        # tstamp = now() when rec was written (ie. time of answer)
        # timet = time problem was entered - tstamp
        # so to get tstamp of time problem was entered we do this math...
        ts_last = tstamp - time
        my_fr['problem_start'] = ts_last
        i = 0
        for answer in sorted(answers):
            vars = answer.split('_')
            if len(vars) == 1: continue
            ts_ans = int(vars[0])
            delta = ts_ans - ts_last
            vname = 'ans_elapsed_%d%d' % (i, (i+1))
            my_fr[vname] = delta
            ts_last = ts_ans
            i += 1
        if idlevel == 's2' or idlevel == 's3':
            sop1 = my_fr['op1']
            sop2 = my_fr['op2']
            if (sop1 % 10) < (sop2 % 10): my_fr['borrow_01'] = True
            if idlevel == 's3':
                sop1 = int(sop1 / 10)
                sop2 = int(sop2 / 10)
                if (sop1 % 10) < (sop2 % 10): my_fr['borrow_10'] = True
        return my_fr

    def buildDataFrame(self):
        id_last = '0_0'
        output = []
        for key, rec in sorted(self.problems_d.items()):
            vars = rec['idsession'].split('_')
            id_this = '%s_%s' % (vars[0], vars[1])
            if id_this != id_last: #reset multi accumulators
                time_last = 0
                tries_last = 0
            ######print('-'*100)
            ######print(rec['idsession'], rec['r_str'])
            ######print('-'*100)
            # run parseRstr() first to get a copy() of this.dframe_dict
            my_fr = self.parseRstr(rec['r_str'], rec['tstamp'], rec['time'])
            rec['idproblem'] = '%s_%s' % (vars[0], vars[1])
            for key, val in rec.items():
                if key in my_fr:
                    my_fr[key] = val
            # accumulate multi idsession times / tries -- start
            if rec['idlevel'] in self.p_multi:
                my_fr['session_multi'] = True
                my_fr['session_problem'] = id_this
                if id_this != id_last: # start of multi problem
                    ######print('---first')
                    my_fr['total_time'] = rec['time']
                    my_fr['total_tries'] = rec['tries']
                else:
                    ######print('---next')
                    my_fr['total_time'] = rec['time'] + time_last
                    my_fr['total_tries'] = rec['tries'] + tries_last
                time_last += rec['time']
                tries_last += rec['tries']
                ######print(rec['time'], rec['tries'], "rec['time']", "rec['tries']")
                ######print(time_last, tries_last, 'time_last', 'tries_last')
                ######print(my_fr['total_time'], my_fr['total_tries'], "my_fr['total_time']", "my_fr['total_tries']")
            id_last = '%s_%s' % (vars[0], vars[1])
            # accumulate multi idsession times / tries -- end
            ######print('-'*100)
            for key, val in sorted(my_fr.items()):
                if val is None: continue
                ######print(key, '---', val)
            ######print('-'*100)
            for key, val in sorted(my_fr.items()):
                if not val is None: continue
                ######print(key, '---', val)
        return my_fr

    def readFile(self):
        uniques = {}
        with open(self.file_input) as f:
            lines = f.readlines()
        print(self.file_input, 'file')
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
        order = ['a1', 'a2', 'a3', 's1', 's2', 's3', 'm1', 'm2', 'm3', 'd3']
        for key in order:
            print('-----')
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

if __name__ == '__main__':
    pjf = ProcessJsonFile('RMM_shp+_JSON_notes_chunk.txt')
    pjf.readFile()
    pjf.processLines()
    pjf.printLinesStats()
    my_fr = pjf.buildDataFrame()
