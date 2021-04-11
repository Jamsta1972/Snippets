var tables = ['ast_contract', 'pm_project', 'cmdb_ci', 'incident', 'change_request', 'ticket'];
tables.forEach(function(table){
	var gr = new GlideRecord(table);
	gr.addQuery('location', '77a6a1d7dbc0660091e4ffa9bf9619df'); //LOC00001474 
	gr.query();
	gs.print(table + ' - ' + gr.getRowCount()); 
	while(gr.next()){
		gr.setValue('location', '64d1e473379866000587772a53990ede'); //LOC00002049
		gr.setWorkflow(false)
		gr.update();
	}
});