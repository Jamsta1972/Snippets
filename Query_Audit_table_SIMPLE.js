
	var auditGR = new GlideRecord('sys_audit');
	auditGR.addQuery('tablename', 'pm_project');
	auditGR.addQuery('fieldname', 'u_total_capex');
	auditGR.addQuery('documentkey', 'a28c805a4ff6378013e4ecd18110c72a');
	auditGR.orderBy('sys_created_on');
	auditGR.query();
	var str = '';
	while (auditGR.next()){
		str +=  '\n' + auditGR.getDisplayValue('sys_created_on') + ': oldValue: ' + auditGR.getValue('oldvalue') + ', newValue: ' + auditGR.getValue('newvalue');
	}
	gs.print('JW_audit_str: ' + str);



