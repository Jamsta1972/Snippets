var locGR = new GlideRecord('cmn_location');
var qStr = 'sys_created_byLIKEPortal';
locGR.addEncodedQuery(qStr);
locGR.query();
while (locGR.next()){
	locGR.u_managing_agent = locGR.company;
	locGR.udpate();
}