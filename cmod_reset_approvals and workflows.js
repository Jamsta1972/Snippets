var sysIDs = [];
var cmods = 'CMOD0006965,CMOD0004118,CMOD0006763,CMOD0006788,CMOD0004115,CMOD0006786,CMOD0006780,CMOD0006753,CMOD0006787';

var cmodGR = new GlideRecord('u_proposal');
cmodGR.addQuery('u_number', 'IN', cmods);
cmodGR.query();
while (cmodGR.next()){
	sysIDs.push(cmodGR.getUniqueValue());
	cmodGR.u_state = 'in_progress';
	cmodGR.update();
}


var wfGR = new GlideRecord('wf_context');
wfGR.addQuery('id', 'IN', sysIDs);
wfGR.query();
gs.print(wfGR.getRowCount());
wfGR.deleteMultiple();

var appGR = new GlideRecord('sysapproval_approver');
appGR.addQuery('document_id', 'IN', sysIDs);
appGR.query();
gs.print(appGR.getRowCount());
appGR.deleteMultiple();

