var tbl = 'cmn_location';
var dup = new GlideAggregate(tbl);
dup.groupBy('u_podio_id');
dup.query();
while(dup.next()) {
	var dup1 = new GlideRecord(tbl);
	dup1.addQuery('u_podio_id', dup.u_podio_id);
	dup1.query();
	dup1.next();
	while(dup1.next()){
		gs.print(dup1.getDisplayValue() + ' - ' + dup1.u_podio_id + ' - ' + dup1.sys_id);
	//	dup1.deleteRecord();
		
	}
}