var ritmNo = 'RITM0023173';
var ritmGR = new GlideRecord('sc_req_item');
ritmGR.get('number', ritmNo);
ritmGR.state = '3';
ritmGR.stage = 'closed_incomplete';
ritmGR.setWorkflow(false);
ritmGR.update();

var bomLineGR = new GlideRecord('u_bom_line');
bomLineGR.addQuery('u_ritm', ritmGR.getUniqueValue());
bomLineGR.setLimit(1);
bomLineGR.query();
if (bomLineGR.next()){
	bomLineGR.u_request = '';
	bomLineGR.u_ritm = '';
	bomLineGR.update();
}