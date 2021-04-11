var lcnGR = new GlideRecord('cmn_location');
var qStr = "u_support_start_dateONThis month@javascript:gs.beginningOfThisMonth()@javascript:gs.endOfThisMonth()^u_status=20";
lcnGR.addEncodedQuery(qStr);
//lcnGR.setLimit(100);
lcnGR.query();
var str = '';
var nowDate = new GlideDate();

while(lcnGR.next()){	
	var auditGR = new GlideRecord('sys_audit');
	auditGR.addQuery('tablename', 'cmn_location');
	auditGR.addQuery('fieldname', 'u_support_start_date');
	auditGR.addQuery('documentkey', lcnGR.getUniqueValue());
	auditGR.orderBy('sys_created_on');
	auditGR.setLimit(1);
	auditGR.query();
	if (auditGR.next()){
		var newValue = auditGR.getValue('newvalue');
		var oldValue = auditGR.getValue('oldvalue');
		
		if (oldValue && oldValue != lcnGR.getValue('u_support_start_date') && oldValue < nowDate){
			str += lcnGR.getValue('u_number') + '-' + lcnGR.getValue('u_support_start_date') + '-' + lcnGR.getUniqueValue() + ', oldValue: ' + oldValue + '\n';
			lcnGR.setValue('u_support_start_date', oldValue);
		}		
			
		else if (newValue && newValue != lcnGR.getValue('u_support_start_date') && newValue < nowDate){
			str += lcnGR.getValue('u_number') + '-' + lcnGR.getValue('u_support_start_date') + '-' + lcnGR.getUniqueValue() + ', newValue: ' + newValue + '\n';
			lcnGR.setValue('u_support_start_date', newValue);
		}	
		lcnGR.setWorkflow(false);
		//lcnGR.autoSysFields(false);
		lcnGR.update();
	}
	//else
		//str += lcnGR.getValue('u_number') + '-' + lcnGR.getUniqueValue() + ' - No entry\n';

}

gs.info('JW_str:\n' + str);


