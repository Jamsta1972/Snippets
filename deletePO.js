var poNum = 'PO0011974';

var poLineGR = new GlideRecord('proc_po_item');
poLineGR.addQuery('purchase_order.number', poNum);
poLineGR.query();
poLineGR.deleteMultiple();

var recSlipGR = new GlideRecord('proc_rec_slip');
recSlipGR.addQuery('purchase_order.number', poNum);
recSlipGR.query();
recSlipGR.deleteMultiple();

var poGR = new GlideRecord('proc_po');
poGR.get('number', poNum);
poGR.deleteRecord();


//Update PRJ spend to date

/*
var prjNum = 'PRJ0016722';
var prjGR = new GlideRecord('pm_project');
prjGR.get('number', prjNum);
prjGR.u_external_labour_spend_to_date = 1050;
prjGR.update();
*/