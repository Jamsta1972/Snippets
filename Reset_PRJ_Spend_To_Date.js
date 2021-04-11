var listOfPrjs = 'PRJ0015226';
var flds = [
	'u_hardware_spend_to_date',
];

/*
	'u_circuit_capex_spend_to_date',
	'u_external_labour_spend_to_date',
	'u_internal_labour_spend_to_date',
	'u_licensing_and_support_spend_to_date',
	'u_infrastructure_spend_to_date',
	'u_ecc_circuit',
	'u_shipping_spend_to_date',
	'u_total_spend_to_date'
*/

var prjGR = new GlideRecord('pm_project');
prjGR.addQuery('number', 'IN', listOfPrjs);
prjGR.query();
while (prjGR.next()){
	flds.forEach(function(fld){
		prjGR.setValue(fld, 0);
		prjGR.setWorkflow(false);
		prjGR.update();
	});	
}