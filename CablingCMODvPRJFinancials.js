var qStr = 'u_stageNOT IN-10,5,100^project_type=Cabling Install^u_opportunityISNOTEMPTY^u_opportunity.u_proposalISNOTEMPTY';
var prjGR = new GlideRecord('pm_project');
prjGR.addEncodedQuery(qStr);
prjGR.query();
var str = 'PRJ,CMOD,PRJ last updated,CMOD last updated,CMOD Internal Cost,CMOD Total Cost,PRJ Internal Cost,PRJ Total Capex,OK?';
while(prjGR.next()){
	var cmodGR = prjGR.u_opportunity.u_proposal.getRefRecord();
	var cmodIntCost = cmodGR.getValue('u_infrastructure_internal_labour');
	var cmodTotalCost = cmodGR.getValue('u_total_cost');
	var prjIntCost = prjGR.getValue('u_internal_labour_budget');
	var prjTotCapex = prjGR.getValue('u_total_capex');
	
	str += '\n' + prjGR.getValue('number') + ',' + cmodGR.getValue('u_number') + ',' + prjGR.getDisplayValue('sys_updated_on') + ',' + cmodGR.getDisplayValue('sys_updated_on')
	+ ',' + cmodIntCost + ',' + cmodTotalCost + ',' + prjIntCost + ',' + prjTotCapex;
	
	if ((cmodIntCost == prjIntCost) && (cmodTotalCost == prjTotCapex))
		str += ',OK';
	else
		str += ',ISSUE';
}

gs.info('JW_str:\n' + str);