var poLineGR = new GlideRecord('proc_po_item');
poLineGR.get('number', 'POL0016979');
poLineGR.u_x3_order_number = 'CCNL2011POH03993,CCNL2011POH04148';
poLineGR.u_x3_quantity = 10;
poLineGR.u_last_x3_sync = new GlideDateTime();
poLineGR.setWorkflow(false);
poLineGR.update();


///

var nums ='PO0012347,PO0012473,PO0012199,PO0012271,PO0012465,PO0012425,PO0012365,PO0012259,PO0012464,PO0012390';

poLineGR = new GlideRecord('proc_po_item');
poLineGR.addQuery('purchase_order.number', 'IN', nums);
poLineGR.query();
gs.print(poLineGR.getRowCount());
while (poLineGR.next()){
	poLineGR.u_last_x3_sync = '';
	poLineGR.u_x3_quantity = 0;
	poLineGR.u_x3_order_number = '';
	poLineGR.setWorkflow(false);
	poLineGR.update();
}

//PO0012422 is the _B one

var poList = [
	{snow: 'PO0012469', x3: 'CCNL2011POH04142'},
	{snow: 'PO0012271', x3: 'CCNL2011POH04143'},
	{snow: 'PO0012462', x3: 'CCNL2011POH04144'},
	{snow: 'PO0012464', x3: 'CCNL2011POH04145'},
	{snow: 'PO0012425', x3: 'CCNL2011POH04146'},
	{snow: 'PO0012461', x3: 'CCNL2011POH04147'},
	{snow: 'PO0012347', x3: 'CCNL2011POH04149'},
	{snow: 'PO0012259', x3: 'CCNL2011POH04150'},
	{snow: 'PO0012465', x3: 'CCNL2011POH04151'},
	{snow: 'PO0012365', x3: 'CCNL2011POH04152'},
	{snow: 'PO0012473', x3: 'CCNL2011POH04153'},
	{snow: 'PO0012470', x3: 'CCNL2011POH04154'},
	{snow: 'PO0012199', x3: 'CCNL2010POH04155'},
	{snow: 'PO0012460', x3: 'CCNL2011POH04156'},
	{snow: 'PO0012390', x3: 'CCNL2011POH04157'},
];

poList.forEach(function(po){
	var poLineGR = new GlideRecord('proc_po_item');
	poLineGR.addQuery('purchase_order.number', po.snow);
	poLineGR.query();
	while (poLineGR.next()){
		//gs.print(poLineGR.number + ', ' + poLineGR.purchase_order.number + ', ' + po.snow + ', ' + po.x3);
		poLineGR.u_last_x3_sync = new GlideDateTime();
		poLineGR.u_x3_order_number = po.x3;
		poLineGR.u_x3_quantity = poLineGR.received_quantity;
		poLineGR.setWorkflow(false);
		poLineGR.update();
	}	
});