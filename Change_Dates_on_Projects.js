var pldTskGR = new GlideRecord('planned_task');
pldTskGR.addQuery('top_task', '74b768591b514450e7bec8017e4bcb70');
//9fed50f2db09c0507023f1286896191d
//74b768591b514450e7bec8017e4bcb70
pldTskGR.query();

while(pldTskGR.next()){
	var dtSt = pldTskGR.start_date.getGlideObject();
	var dtEn = pldTskGR.end_date.getGlideObject();
	dtSt.addDaysUTC(199);
	dtEn.addDaysUTC(199);
	pldTskGR.setValue('start_date', dtSt);
	pldTskGR.setValue('end_date', dtEn);
	pldTskGR.setWorkflow(false);
	pldTskGR.update();
}
