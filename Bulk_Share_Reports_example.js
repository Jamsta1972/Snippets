var rptGR = new GlideRecord('sys_report');
var qStr = 'sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()^sys_created_byLIKEwildish';
rptGR.addEncodedQuery(qStr);
rptGR.query();

while(rptGR.next()){
	var rptShareGR = new GlideRecord('sys_report_users_groups');
	rptShareGR.newRecord();
	rptShareGR.setValue('report_id' , rptGR.getUniqueValue());
	rptShareGR.setValue('group_id', '9137b58ddbf39e0003a77a0bbf961928');
	rptShareGR.insert();
}


