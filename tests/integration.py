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
expect(anon,'/api/journey',{'action':'init'},403,'https://untrusted.example')
a=client();s=expect(a,'/api/journey',{'action':'init','source':'teste-integracao','device':'mobile'},201);assert s['step']==0
expect(a,'/api/journey',{'action':'view','step':16},400)
expect(a,'/api/journey',{'action':'answer','questionId':'compromisso','optionId':'sim'},400)
expect(a,'/api/journey',{'action':'view','step':1})
expect(a,'/api/journey',{'action':'answer','questionId':'compromisso','optionId':'invalid'},400)
expect(a,'/api/journey',{'action':'view','step':2},400)
answers=[('compromisso','sim'),('momento','clt'),('idade','26-35'),('experiencia','primeira'),('motivacao','familia'),('sentimento','curioso'),('satisfacao','melhorar'),('obstaculo','direcao'),('conquista','familia'),('objetivo','entender'),('tempo','30-60'),('prontidao','conhecer')]
for i,(q,o) in enumerate(answers):
 data=expect(a,'/api/journey',{'action':'answer','questionId':q,'optionId':o});assert data['step']==i+2
snapshot=expect(a,'/api/journey',None);assert snapshot['step']==13 and len(snapshot['answers'])==12
assert expect(a,'/api/journey',{'action':'init'})['answers']==snapshot['answers']
for step in [14,15,16]:expect(a,'/api/journey',{'action':'view','step':step})
expect(a,'/api/journey',{'action':'cta'});expect(a,'/api/journey',{'action':'cta'})
expect(a,'/api/journey',{'action':'view','step':2})
expect(a,'/api/journey',{'action':'answer','questionId':'momento','optionId':'autonomo'})
assert expect(a,'/api/journey',None)['answers']['momento']=='autonomo'
b=client();expect(b,'/api/journey',{'action':'init','source':'teste-parcial'},201);expect(b,'/api/journey',{'action':'view','step':1});expect(b,'/api/journey',{'action':'answer','questionId':'compromisso','optionId':'explorar'})
assert expect(b,'/api/journey',None)['answers']=={'compromisso':'explorar'}
# Documented starter mock sign-in, local only. No production auth bypass.
admin=client();admin.open(BASE+'/signin-with-chatgpt?return_to=/admin').read()
report=expect(admin,'/api/admin?range=all',None)
assert report['totals']['completed']>=1 and report['totals']['cta']>=1
our=next(s for s in report['sessions'] if s['source']=='teste-integracao')
detail=expect(admin,'/api/admin?session='+our['id'],None)
assert len(detail['answers'])==12
assert next(x for x in detail['answers'] if x['question_id']=='momento')['option_id']=='autonomo'
assert len([x for x in report['choices'] if x['question_id']=='momento' and x['option_id']=='autonomo'])==1
expect(admin,'/api/admin?range=invalid',None,400)
expect(admin,'/api/admin?session=invalid',None,400)
print('PASS: anonymous admin rejection, origin rejection, step validation, option validation, persistence/resume, isolated sessions, answer revision without duplication, idempotent CTA, complete/partial analytics and individual details.')
