var prjList = 'PRJ0016502,PRJ0016504,PRJ0016505,PRJ0016507,PRJ0016509,PRJ0016510';

var prjTGR = new GlideRecord('pm_project_task');
var qStr = 'top_task.numberIN' + prjList + '^short_description!=Project Start';
prjTGR.addEncodedQuery(qStr);
prjTGR.query();
gs.print(prjTGR.getRowCount());
while (prjTGR.next()){
	//prjTGR.time_constraint = 'start_on';
	prjTGR.time_constraint = 'asap';
	prjTGR.autoSysFields(false);
	prjTGR.setWorkflow(false);
	prjTGR.update();
}
