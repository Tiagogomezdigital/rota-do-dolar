"""Integration checks for the local development server and its local D1 database."""
import json, urllib.request, urllib.error, http.cookiejar
BASE='http://localhost:5173'
def client(): return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def call(op,path,body=None,origin=BASE):
 req=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json','Origin':origin})
 try:
  with op.open(req) as r:return r.status,json.loads(r.read())
 except urllib.error.HTTPError as e:
  raw=e.read().decode()
  try: data=json.loads(raw)
  except json.JSONDecodeError: data={"error":raw[:200]}
  return e.code,data
def expect(op,path,body,status=200,origin=BASE):
 code,data=call(op,path,body,origin);assert code==status,(code,status,data);return data
anon=client();expect(anon,'/api/admin',None,401)
expect(anon,'/tiago-gomes/api/journey',{'action':'init'},403,'https://untrusted.example')
expect(anon,'/tiago-gomes/api/journey',{'action':'init'},403,'https://4yousite.com.br.attacker.example')
a=client();s=expect(a,'/tiago-gomes/api/journey',{'action':'init','source':'teste-integracao','device':'mobile'},201);assert s['step']==0
expect(a,'/tiago-gomes/api/journey',{'action':'view','step':12},400)
expect(a,'/tiago-gomes/api/journey',{'action':'answer','questionId':'momento','optionId':'clt'},400)
expect(a,'/tiago-gomes/api/journey',{'action':'view','step':1})
expect(a,'/tiago-gomes/api/journey',{'action':'answer','questionId':'momento','optionId':'invalid'},400)
expect(a,'/tiago-gomes/api/journey',{'action':'view','step':2},400)
answers=[('momento','clt'),('experiencia','primeira'),('motivacao','familia'),('obstaculo','direcao'),('exposicao','privacidade'),('ia','zero'),('estrutura','celular'),('tempo','30-60')]
for i,(q,o) in enumerate(answers):
 data=expect(a,'/tiago-gomes/api/journey',{'action':'answer','questionId':q,'optionId':o});assert data['step']==i+2
snapshot=expect(a,'/tiago-gomes/api/journey',None);assert snapshot['step']==9 and len(snapshot['answers'])==8
assert expect(a,'/tiago-gomes/api/journey',{'action':'init'})['answers']==snapshot['answers']
for step in [10,11,12]:expect(a,'/tiago-gomes/api/journey',{'action':'view','step':step})
expect(a,'/tiago-gomes/api/journey',{'action':'cta'});expect(a,'/tiago-gomes/api/journey',{'action':'cta'})
expect(a,'/tiago-gomes/api/journey',{'action':'view','step':1})
expect(a,'/tiago-gomes/api/journey',{'action':'answer','questionId':'momento','optionId':'autonomo'})
assert expect(a,'/tiago-gomes/api/journey',None)['answers']['momento']=='autonomo'
b=client();expect(b,'/tiago-gomes/api/journey',{'action':'init','source':'teste-parcial'},201);expect(b,'/tiago-gomes/api/journey',{'action':'view','step':1});expect(b,'/tiago-gomes/api/journey',{'action':'answer','questionId':'momento','optionId':'sem-renda'})
assert expect(b,'/tiago-gomes/api/journey',None)['answers']=={'momento':'sem-renda'}
# Documented starter mock sign-in, local only. No production auth bypass.
admin=client();admin.open(BASE+'/signin-with-chatgpt?return_to=/admin').read()
report=expect(admin,'/api/admin?range=all',None)
assert report['totals']['completed']>=1 and report['totals']['cta']>=1
our=next(s for s in report['sessions'] if s['source']=='teste-integracao')
detail=expect(admin,'/api/admin?session='+our['id'],None)
assert len(detail['answers'])==8
assert next(x for x in detail['answers'] if x['question_id']=='momento')['option_id']=='autonomo'
assert len([x for x in report['choices'] if x['question_id']=='momento' and x['option_id']=='autonomo'])==1
expect(admin,'/api/admin?range=invalid',None,400)
expect(admin,'/api/admin?session=invalid',None,400)
print('PASS: anonymous admin rejection, origin rejection, step validation, option validation, persistence/resume, isolated sessions, answer revision without duplication, idempotent CTA, complete/partial analytics and individual details.')
