var tbl = 'cmn_location'
var cnt = 0;

var rGR = new GlideAggregate(tbl);
rGR.addNotNullQuery('u_podio_id');
rGR.addAggregate('COUNT', 'u_podio_id');
rGR.addHaving('COUNT', 'u_podio_id', '>', '1');
rGR.query();

while (rGR.next()) { 
  var rDup = new GlideRecord(tbl);
  rDup.addQuery('u_podio_id', rGR.u_podio_id);
  rDup.orderBy('sys_created_on');
  rDup.query();
  rDup.next();
  while (rDup.next()){
	  //gs.print(rDup.u_podio_id);
	  rDup.setWorkflow(false);
	  rDup.deleteRecord();
	 cnt++
  }
}

gs.print('cnt: ' + cnt);