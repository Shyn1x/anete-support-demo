"""Bounded owner-authorized audit, Python stdlib only. No deployment or limit changes."""
import argparse, datetime, getpass, hashlib, json, os, pathlib, time, urllib.error, urllib.parse, urllib.request

ANSWER_KEYS = ('locale','text','cardIds','sources','handoff','mode','topic','providerUsed','conversational','fallbackReason','validationReason','validationDetail','catalogRevision','productRead','catalogURLs','productURL','readFailures','catalogReadDiagnostics','catalogMetadataOnly','catalogSnapshot','checked','error','reason')
def utc(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def body_bytes(body): return json.dumps(body, ensure_ascii=False, separators=(',',':')).encode('utf-8')
def safe_answer(data): return {k:data[k] for k in ANSWER_KEYS if k in data}
def assess(case, data, allowed_hosts):
    flags=[]; expect=case['expect']; text=data.get('text','')
    if data.get('locale')!=case['expectedLocale']: flags.append('wrong_locale_field')
    if not isinstance(text,str) or not text.strip(): flags.append('empty_answer')
    if expect.get('noQuestion') and ('?' in text or '？' in text): flags.append('question_after_farewell')
    if expect.get('noProvider') and data.get('providerUsed'): flags.append('unnecessary_provider_attempt')
    if expect.get('noHandoff') and data.get('handoff'): flags.append('handoff_after_farewell')
    if expect.get('handoff') and not data.get('handoff'): flags.append('missing_individual_or_safety_review')
    if expect.get('safetyMode') and data.get('mode')!='safety': flags.append('personal_data_not_blocked')
    product_sources={s.get('url') for s in data.get('sources',[]) if s.get('kind')=='product'}
    if expect.get('selection') and not product_sources: flags.append('no_product_candidates_for_selection')
    if expect.get('twoProductSources') and not set(case['expectedProductURLs']).issubset(product_sources): flags.append('two_supplied_products_not_covered')
    if data.get('fallbackReason'): flags.append('fallback:'+str(data['fallbackReason']))
    for s in data.get('sources',[]):
        try:
            u=urllib.parse.urlsplit(s.get('url',''))
            if u.scheme!='https' or u.hostname not in allowed_hosts or u.username or u.password: flags.append('unexpected_source')
        except (ValueError,TypeError): flags.append('invalid_source')
    return {'contractFlags':sorted(set(flags)), 'manualReview':'pending', 'factualAccuracy':'not_automatically_scored'}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl): return None
class Transport:
    def __init__(self): self.opener=urllib.request.build_opener(NoRedirect)
    def request(self, base, route, body=None, cookie=None):
        headers={'User-Agent':'Mozilla/5.0','Accept':'application/json'}
        if body is not None: headers.update({'Origin':base,'Content-Type':'application/json'})
        if cookie: headers['Cookie']=cookie
        req=urllib.request.Request(base+route,data=body_bytes(body) if body is not None else None,headers=headers,method='POST' if body is not None else 'GET')
        try:
            with self.opener.open(req,timeout=35) as r: return r.status,json.load(r),r.headers
        except urllib.error.HTTPError as e:
            try: data=json.loads(e.read(50000))
            except (ValueError,UnicodeError): data={'error':'non_json_http_error'}
            return e.code,data,e.headers

def compatible(config,tenant,plan):
    return config.get('tenant')==tenant and config.get('ready') is True and config.get('locked') is True and config.get('mode')=='ai' and config.get('conversationEnabled') is True and config.get('conversationRevision')=='context-v2' and config.get('catalogRevision') in plan['acceptedCatalogRevisions'] and config.get('perCallMicroUSD')==10000

def run(args, credentials=None, transport=None, wait=time.sleep, clock=time.monotonic):
    if not args.run or not args.allow_paid or not 1<=args.max_requests<=50: raise ValueError('Explicit --run --allow-paid --max-requests 1..50 required')
    if args.delay<7: raise ValueError('Minimum spacing is seven seconds')
    raw=pathlib.Path(args.plan).read_bytes(); plan=json.loads(raw)
    if plan.get('schema')!='buyer-conversation-audit-v1' or len(plan.get('cases',[]))!=50 or len({c['id'] for c in plan['cases']})!=50: raise ValueError('Invalid plan')
    path=pathlib.Path(args.report); path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists(): raise ValueError('Output exists. Never overwrite or automatically resume a paid audit.')
    if (path.parent/'.live-50.lock').exists(): raise ValueError('Another legacy live run may be active; stopped')
    lock_path=path.parent/'.buyer-audit.lock'; lock=lock_path.open('x',encoding='utf-8'); lock.write(str(os.getpid())); lock.close()
    report={'schema':'buyer-conversation-audit-v1','startedAt':utc(),'planSha256':hashlib.sha256(raw).hexdigest(),'authorization':{'maxChatRequests':args.max_requests,'maxReservationMicroUSD':args.max_requests*10000,'retries':False,'budgetChanges':False},'scope':plan['scope'],'missing':plan['missing'],'configs':[],'rows':[]}
    owns_report=False
    def save(initial=False):
        nonlocal owns_report
        data=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
        if initial:
            with path.open('x',encoding='utf-8') as f:f.write(data)
            owns_report=True
        else:
            if not owns_report:raise RuntimeError('This run does not own the output file')
            temp=path.with_suffix('.tmp');temp.write_text(data,encoding='utf-8');os.replace(temp,path)
    sessions={}; transport=transport or Transport(); sent=0; last_start=None
    try:
        save(True)
        # All supported shops are checked and authenticated before the first chat.
        for tenant in plan['shops']:
            base='https://support-demo-'+tenant+'.fshyn1x.workers.dev'
            status,cfg,_=transport.request(base,'/api/config')
            if status!=200 or not compatible(cfg,tenant,plan): raise RuntimeError(tenant+': server settings/version mismatch; no chat sent')
            report['configs'].append({k:cfg.get(k) for k in ('tenant','catalogRevision','conversationRevision','perCallMicroUSD','auditRevision')});save()
            secret=credentials[tenant] if credentials is not None else getpass.getpass('Demo password '+tenant+': ')
            status,data,headers=transport.request(base,'/api/login',{'password':secret});secret=None
            cookie=headers.get('Set-Cookie','').split(';')[0]
            if status!=200 or not cookie.startswith('demo_session='): raise RuntimeError(tenant+': login failed HTTP '+str(status)+'; no retry')
            hosts={urllib.parse.urlsplit(s['url']).hostname for s in cfg['sources']}
            sessions[tenant]={'base':base,'cookie':cookie,'allowedHosts':hosts,'locale':'ru','previousTopic':None,'productURL':None,'catalogURLs':[],'history':[],'catalogRevision':cfg['catalogRevision']}
        print('Preflight passed; starting bounded buyer conversations.',flush=True)
        for planned in plan['cases']:
            if sent>=args.max_requests: report['stoppedReason']='Local request allowance reached';break
            c=dict(planned);s=sessions[c['tenant']]
            if c.get('adaptiveSecond') and len(s['catalogURLs'])>=2:
                c.update(c['adaptiveSecond']);c['branch']='second_choice_from_actual_list'
            elif c.get('adaptiveSecond'): c['branch']='explicit_link_after_no_list'
            if 'https://' in c['message'] or 'www.' in c['message']:s['productURL']=None;s['catalogURLs']=[]
            body={'tenant':c['tenant'],'locale':s['locale'],'message':c['message'],'previousTopic':s['previousTopic'],'productURL':s['productURL'],'catalogURLs':s['catalogURLs'],'history':s['history']}
            if last_start is not None:wait(max(0,args.delay-(clock()-last_start)))
            row={'id':c['id'],'tenant':c['tenant'],'goal':c['goal'],'question':c['message'],'expectedLocale':c['expectedLocale'],'expect':c['expect'],'branch':c.get('branch'),'serverCatalogRevision':s['catalogRevision'],'state':'pending','startedAt':utc(),'requestBodySha256':hashlib.sha256(body_bytes(body)).hexdigest(),'inputContext':{k:body[k] for k in ('locale','previousTopic','productURL','catalogURLs','history')}}
            report['rows'].append(row);save();sent+=1;last_start=clock()
            try:status,data,_=transport.request(s['base'],'/api/chat',body,s['cookie'])
            except Exception as error:
                row.update(state='ambiguous',elapsedMs=round((clock()-last_start)*1000),errorType=type(error).__name__);report['stoppedReason']='Ambiguous chat response; may have consumed reserve; never retried';save();break
            row.update(state='complete',httpStatus=status,elapsedMs=round((clock()-last_start)*1000),answer=safe_answer(data),assessment=assess(c,data,s['allowedHosts']))
            if row['elapsedMs']>22000:row['assessment']['contractFlags'].append('browser_22s_timeout_exceeded')
            save()
            print(json.dumps({'case':c['id'],'elapsedMs':row['elapsedMs'],'provider':data.get('providerUsed'),'flags':row['assessment']['contractFlags'],'text':data.get('text','')[:1600]},ensure_ascii=False),flush=True)
            if status!=200 or 'budget' in str(data.get('fallbackReason','')) or data.get('error')=='budget_exhausted':report['stoppedReason']='HTTP error or existing budget/rate limit';save();break
            if data.get('locale') in ('ru','lv','en'):s['locale']=data['locale']
            old_choices=s['catalogURLs']
            if isinstance(data.get('catalogURLs'),list):incoming=[u for u in data['catalogURLs'] if urllib.parse.urlsplit(u).hostname in s['allowedHosts']][:3]
            elif data.get('mode')=='catalog' and data.get('productURL'):incoming=[data['productURL']]
            else:incoming=[]
            if data.get('mode')!='social':
                # Match the revised browser only on the explicitly versioned server.
                preserve=s['catalogRevision'] in ('buyer-v3','buyer-v4','buyer-v5','buyer-v6','buyer-v7','buyer-v8') and not data.get('catalogMetadataOnly') and len(incoming)==1 and len(old_choices)>1 and incoming[0] in old_choices
                s['catalogURLs']=old_choices if preserve else incoming
            if data.get('mode')=='catalog' and data.get('productURL'):s['productURL']=data['productURL']
            elif data.get('mode')!='social':s['productURL']=None
            if data.get('mode')!='social':s['previousTopic']=data.get('topic')
            s['history']=(s['history']+[{'role':'user','text':c['message'][:400]},{'role':'assistant','text':data.get('text','')[:400]}])[-4:]
    except (Exception,KeyboardInterrupt) as error:
        if not owns_report:raise
        if report['rows'] and report['rows'][-1]['state']=='pending':report['rows'][-1]['state']='ambiguous'
        report['stoppedReason']=str(error) if isinstance(error,(ValueError,RuntimeError)) else type(error).__name__;save();print('Stopped: '+report['stoppedReason'],flush=True)
    finally:
        sessions.clear()
        if owns_report:
            report['finishedAt']=utc();report['summary']={'chatRequestsSent':sent,'providerAttemptsReported':sum(r.get('answer',{}).get('providerUsed') is True for r in report['rows']),'ambiguous':sum(r['state']=='ambiguous' for r in report['rows']),'contractFlagged':sum(bool(r.get('assessment',{}).get('contractFlags')) for r in report['rows']),'accuracy':'requires_source_and_human_review'};save();print('REPORT '+str(path),flush=True)
        lock_path.unlink()
    return report

def options(argv=None):
    p=argparse.ArgumentParser();p.add_argument('--plan',required=True);p.add_argument('--report',required=True);p.add_argument('--run',action='store_true');p.add_argument('--allow-paid',action='store_true');p.add_argument('--max-requests',type=int,required=True);p.add_argument('--delay',type=float,default=7);return p.parse_args(argv)
if __name__=='__main__':run(options())
