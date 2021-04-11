var poNum = 'PO0011561';
var prjNum = 'PRJ0017079';
var poLineGR = new GlideRecord('proc_po_item');
poLineGR.addQuery('purchase_order.number', poNum);
poLineGR.query();
while (poLineGR.next()){	
	poLineGR.u_project = '';
	poLineGR.update();
}

var poGR = new GlideRecord('proc_po');
poGR.get('number', poNum);

if (poGR.init_request){
	var reqGR = poGR.init_request.getRefRecord();
	reqGR.u_project = '';
	reqGR.u_project_number = '';
	reqGR.u_project_task = '';
	reqGR.update();
}

