//Reset PO:
var poNum = 'PO0010036';
var poGR = new GlideRecord('proc_po');
poGR.get('number', poNum);
poGR.status = 'ordered';
poGR.update();

var rcGR = new GlideRecord('proc_rec_slip');
rcGR.addQuery('purchase_order', poGR.getUniqueValue());
rcGR.query();
rcGR.deleteMultiple();

var assGR = new GlideRecord('alm_asset');
assGR.addQuery('purchase_line.purchase_order', poGR.getUniqueValue());
assGR.query();
assGR.deleteMultiple();

var poLGR = new GlideRecord('proc_po_item');
poLGR.addQuery('purchase_order', poGR.getUniqueValue());
poLGR.query();
while (poLGR.next()){
	poLGR.status = 'ordered';
	poLGR.received_quantity = 0;
	poLGR.remaining_quantity = poLGR.ordered_quantity;
	poLGR.u_x3_quantity = 0;
	poLGR.u_x3_order_number = '';
	poLGR.update();	
}


///Copy PO:

var poNum = 'PO0010233';
var poGR = new GlideRecord('proc_po')
poGR.get('number', poNum);
poGR.number = '';
var newpoGR = poGR.insert();
var newsys = newpoGR;

var poGR = new GlideRecord('proc_po')
poGR.get('number', poNum);
var poLineGR = new GlideRecord('proc_po_item');
poLineGR.addQuery('purchase_order', poGR.getUniqueValue());
poLineGR.query();
while (poLineGR.next()){
	poLineGR.purchase_order = newsys;
	poLineGR.number = '';
	poLineGR.insert();
}

///Update PO Line in ServiceNow with X3 data:

var poLineNum = 'POL0010749';
var x3Quant = 10;
var x3Refs = 'CCNL2011POH00016';
var poLineGR = new GlideRecord('proc_po_item');
poLineGR.get('number', poLineNum);
poLineGR.u_x3_quantity = x3Quant;
poLineGR.u_x3_order_number = x3Refs;
poLineGR.setWorkflow(false);
poLineGR.autoSysFields(false);
poLineGR.update();

var poLineNum = 'POL0010751';
var x3Quant = 200;
var x3Refs = 'CCNL2011POH00016';
var poLineGR = new GlideRecord('proc_po_item');
poLineGR.get('number', poLineNum);
poLineGR.u_x3_quantity = x3Quant;
poLineGR.u_x3_order_number = x3Refs;
poLineGR.setWorkflow(false);
poLineGR.autoSysFields(false);
poLineGR.update();
