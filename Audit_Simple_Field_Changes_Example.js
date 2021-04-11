
var auditGR = new GlideRecord('sys_audit');
auditGR.addQuery('tablename', 'ast_contract');
auditGR.addQuery('documentkey', '44150eb9db7bd4503e0e055cd3961965');
auditGR.orderBy('sys_created_on');
auditGR.query();
var str = '"field","time","oldValue","newValue"';
while (auditGR.next()){
	var oldV = auditGR.getValue('oldvalue') || '';
	var newV = auditGR.getValue('newvalue') || '';
	
	str +=  '\n"' + auditGR.fieldname + '","' + auditGR.getDisplayValue('sys_created_on') + '","' + oldV + '","' + newV + '"';
}
gs.print('JW_audit_str:\n ' + str);



