var qStr = 'titleLIKEWeekly^sys_created_by=Racheal.Birt^table=incident';
var rGR = new GlideRecord('sys_report');
rGR.addEncodedQuery(qStr);
rGR.query();
while (rGR.next()){
	var fldList = rGR.getValue('field_list');
	gs.print('before: ' + fldList);
	if (!fldList.includes('opened_at')){
		fldList = fldList.replace('number,', 'number,opened_at,');
	}
	if (!fldList.includes('caller_id')){
		fldList = fldList.replace('number,', 'number,caller_id,');
	}
	rGR.setValue('field_list', fldList);
	rGR.update();
}