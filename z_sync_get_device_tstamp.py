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

#https://script.google.com/macros/s/AKfycbzqRLajo6-w9zHO8wPI0wAzpk4c0nsQKqvPp5kNmTHsbkqKNuo/exec?idtype=getDeviceTstamp&sheet=442135493&device=mac.952

payload = {
    'sheet' : 442135493,
    'device' : 'mac.952',
    'idtype': 'getDeviceTstamp'
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
print('\n')
