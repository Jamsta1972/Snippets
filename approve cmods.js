var cmodList = 'CMOD0004550,CMOD0006693';
var cmodGR = new GlideRecord('u_proposal');
cmodGR.addQuery('u_number', 'IN', cmodList);
cmodGR.query();
while(cmodGR.next()){
	cmodGR.u_state = 'Approved';
	cmodGR.update();
}
