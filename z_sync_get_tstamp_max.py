print('sync_get.py');
import requests
import urllib.parse
import json
from codecs import encode, decode

#payload = {
#    'sheet' : 784653983,
#    'pwd' : 'a1234',
#    'tstamps_max' : '%7B%22chrome.526%22:1603384941234%7D',
#    'device' : 'chrome.5269',
#    'idtype': 'getDownload'
#    }
payload = {
    'sync_key' : 'JE*!4daWudS1rl42fQSmOu~b~.mw*8iU~Szwo9`l9)dPPwDr6V13Dn7u*z1q',
    'sheet' : 784653983,
    'pwd' : 'a1234',
    'tstamps_max' : '%7B%22mac.952%22:1653175186956%7D',
    'device' : 'chrome.124',
    'idtype': 'getDownload'
    }
r = requests.get('https://script.google.com/macros/s/AKfycbzqRLajo6-w9zHO8wPI0wAzpk4c0nsQKqvPp5kNmTHsbkqKNuo/exec', params=payload)
#r = requests.get('https://script.google.com/macros/s/AKfycbzqRLajo6-w9zHO8wPI0wAzpk4c0nsQKqvPp5kNmTHsbkqKNuo/exec?sheet=971646815&pwd=a1234&idtype=linkTest')

print('\n\nPrint01\n\n')
for k, v in sorted(payload.items()):
    print(k, v)

#f = open('response.html', 'w')
#f.write(r.text)
#f.close()

print('\n\nPrint02\n\n')
print(r.text)
print('\n')
print(urllib.parse.unquote(r.text))

print('\n\nPrint03\n\n')
rt = r.text
data_str = rt[(rt.find('value":"')+8):(rt.find(',"err')-1)]
print(data_str)
print(urllib.parse.unquote(data_str))


print('\n\nPrint04\n\n')
try:
    data = json.loads(urllib.parse.unquote(data_str))
    print('%d = len(data)' % (len(data)))
except:
    print('EXCEPT: json.loads(urllib.parse.unquote(data_str))')

print('\n\nPrint05\n\n')
for item in data:
    print(urllib.parse.unquote(item))
