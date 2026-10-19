import argparse, contextlib, importlib.util, io, json, pathlib, tempfile, unittest

spec=importlib.util.spec_from_file_location('buyer_runner',pathlib.Path(__file__).resolve().parents[1]/'scripts/run-buyer-audit.py')
runner=importlib.util.module_from_spec(spec);spec.loader.exec_module(runner)
SHOPS=['bariba','hobbyset','apavi40plus','rotallieta','celotajs']
class FakeTransport:
    def __init__(self, failure=None):self.calls=[];self.chats=0;self.failure=failure
    def request(self,base,route,body=None,cookie=None):
        self.calls.append((route,body));tenant=base.split('support-demo-')[1].split('.')[0]
        if route=='/api/config':return 200,{'tenant':tenant,'ready':True,'locked':True,'mode':'ai','conversationEnabled':True,'conversationRevision':'context-v2','catalogRevision':'retrieval-v1','perCallMicroUSD':10000,'sources':[{'url':'https://merchant.example/'}]},{}
        if route=='/api/login':return 200,{}, {'Set-Cookie':'demo_session=synthetic-cookie; Secure'}
        self.chats+=1
        if self.failure=='timeout':raise TimeoutError()
        if self.failure=='budget':return 429,{'error':'budget_exhausted','reason':'total_budget'},{}
        return 200,{'text':'A synthetic answer.','locale':'en','sources':[],'mode':'ai','topic':'delivery','providerUsed':True,'conversational':True},{}
class AuditTests(unittest.TestCase):
    def fixture(self,root):
        p=pathlib.Path(root);plan={'schema':'buyer-conversation-audit-v1','shops':SHOPS,'scope':'synthetic test only','missing':[],'acceptedCatalogRevisions':['retrieval-v1'],'cases':[{'id':'case-'+str(i),'tenant':SHOPS[i//10],'goal':'test','message':'A test question','expectedLocale':'en','expect':{}} for i in range(50)]};(p/'plan.json').write_text(json.dumps(plan));return argparse.Namespace(plan=str(p/'plan.json'),report=str(p/'new.json'),run=True,allow_paid=True,max_requests=2,delay=7)
    def execute(self,args,transport):
        self.now=0;self.waits=[]
        def wait(seconds):self.waits.append(seconds);self.now+=seconds
        with contextlib.redirect_stdout(io.StringIO()):return runner.run(args,{s:'synthetic-test-password' for s in SHOPS},transport,wait=wait,clock=lambda:self.now)
    def test_explicit_paid_approval_is_required_before_network(self):
        with tempfile.TemporaryDirectory() as root:
            args=self.fixture(root);args.allow_paid=False;t=FakeTransport()
            with self.assertRaises(ValueError):self.execute(args,t)
            self.assertEqual(t.calls,[])
    def test_local_allowance_and_spacing_are_enforced_without_retry(self):
        with tempfile.TemporaryDirectory() as root:
            args=self.fixture(root);t=FakeTransport();r=self.execute(args,t)
            self.assertEqual(t.chats,2);self.assertEqual(r['summary']['chatRequestsSent'],2);self.assertEqual(self.waits,[7]);self.assertEqual(r['rows'][0]['state'],'complete')
    def test_timeout_stops_and_preserves_ambiguous_attempt(self):
        with tempfile.TemporaryDirectory() as root:
            args=self.fixture(root);t=FakeTransport('timeout');r=self.execute(args,t)
            self.assertEqual(t.chats,1);self.assertEqual(r['rows'][0]['state'],'ambiguous');self.assertEqual(r['summary']['ambiguous'],1)
    def test_budget_failure_stops_without_another_chat(self):
        with tempfile.TemporaryDirectory() as root:
            args=self.fixture(root);t=FakeTransport('budget');r=self.execute(args,t)
            self.assertEqual(t.chats,1);self.assertEqual(r['rows'][0]['httpStatus'],429);self.assertIn('limit',r['stoppedReason'])
    def test_existing_report_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as root:
            args=self.fixture(root);p=pathlib.Path(args.report);p.write_bytes(b'previous-results');t=FakeTransport()
            with self.assertRaises(ValueError):self.execute(args,t)
            self.assertEqual(p.read_bytes(),b'previous-results');self.assertEqual(t.calls,[])
    def test_old_report_and_credentials_are_preserved_or_excluded(self):
        with tempfile.TemporaryDirectory() as root:
            args=self.fixture(root);old=pathlib.Path(root)/'live-50.json';old.write_bytes(b'old-27-results');t=FakeTransport();self.execute(args,t);saved=pathlib.Path(args.report).read_text()
            self.assertEqual(old.read_bytes(),b'old-27-results');self.assertNotIn('synthetic-test-password',saved);self.assertNotIn('synthetic-cookie',saved)
    def test_contract_flags_are_not_a_factual_accuracy_grade(self):
        c={'expectedLocale':'en','expect':{}};r=runner.assess(c,{'text':'A factual-looking sentence.','locale':'en'},set())
        self.assertEqual(r['contractFlags'],[]);self.assertEqual(r['manualReview'],'pending');self.assertEqual(r['factualAccuracy'],'not_automatically_scored')
if __name__=='__main__':unittest.main()
