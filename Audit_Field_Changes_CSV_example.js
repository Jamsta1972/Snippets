
var auditGR = new GlideRecord('sys_audit');
auditGR.addQuery('tablename', 'cmn_location');
auditGR.addQuery('fieldname', 'u_wi_fi_vendor');
auditGR.addEncodedQuery("sys_created_on>javascript:gs.dateGenerate('2019-11-25','10:00:00')");
auditGR.orderBy('sys_created_on');
auditGR.query();
var str = '"location","time","oldValue","newValue"';
while (auditGR.next()){
	var lcnGR = new GlideRecord('cmn_location');
	lcnGR.get(auditGR.getValue('documentkey'));
	var oldList = auditGR.getValue('oldvalue') || '';
	var oldList = oldList.split(',');
	var dispOldList = [];
	oldList.forEach(function(ov){
		var chGR = new GlideRecord('sys_choice');
		chGR.get(ov);
		dispOldList.push(chGR.getValue('label'));
	});
	var newList = auditGR.getValue('newvalue') || '';
	var newList = newList.split(',');
	var dispNewList = [];
	newList.forEach(function(ov){
		var chGR = new GlideRecord('sys_choice');
		chGR.get(ov);
		dispNewList.push(chGR.getValue('label'));
	});
	
	str +=  '\n"' + lcnGR.getDisplayValue() + '","' + auditGR.getDisplayValue('sys_created_on') + '","' + dispOldList + '","' + dispNewList + '"';
}
gs.print('JW_audit_str:\n ' + str);



