var poGR = new GlideRecord('proc_po');
poGR.addQuery('init_request', '2c4150701bc32890fb50f9f5464bcb4f');
poGR.query();
while (poGR.next()){
  poGR.status = 'ordered';
  poGR.autoSysFields(false);
  poGR.setWorkflow(false);
  poGR.update();
  
  var poLGR = new GlideRecord('proc_po_item');
  poLGR.addQuery('purchase_order', poGR.getUniqueValue());
  poLGR.query();
  while (poLGR.next()){
    poLGR.status = 'ordered';
    poLGR.autoSysFields(false);
    poLGR.setWorkflow(false);
    poLGR.update();
  }
}