var po = 'PO0011316';

var r = new GlideRecord('proc_po');
r.get('number', po);
r.status = 'canceled';
r.update();

var r = new GlideRecord('proc_po_item');
r.addQuery('purchase_order.number', po);
r.query();
while (r.next()){
	r.status = 'canceled';
	r.setWorkflow(false);
	r.update();
}
