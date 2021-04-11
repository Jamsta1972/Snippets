var blGR = new GlideRecord('u_bom_line');
blGR.addNotNullQuery('u_model');
blGR.addQuery('u_bom.u_is_selected', true);
blGR.addQuery('u_bom.u_proposal.u_parent.state', 'NOT IN', '5');
blGR.query();
var CSV = '"BOM","MODEL","CATEGORY","PROJECT","OPPORTUNITY","OPPORTUNITY - CREATED"\n';
while (blGR.next()){
	var modCats = blGR.u_model.cmdb_model_category.toString().split(',');
	if (modCats.length > 1){
		CSV += '"' + blGR.u_bom.u_number + '","' 
		+ blGR.u_model.display_name + '","' 
		+ blGR.u_model.getRefRecord().getDisplayValue('cmdb_model_category') + '","'
		+ (blGR.u_bom.u_proposal.u_parent.u_prj_ref_s || '') + '","'
		+ blGR.u_bom.u_proposal.u_parent.number + '","'
		+ blGR.u_bom.u_proposal.u_parent.sys_created_on + '"\n';
	}
}

gs.print('JW_Output:\n' + CSV);


///

var modGR = new GlideRecord('cmdb_model');
var CSV = '"MODEL","CATEGORY"\n';
modGR.query();
while (modGR.next()){
	var modCats = modGR.cmdb_model_category.toString().split(',');
	if (modCats.length > 1){
		CSV += '"' + modGR.display_name + '","'
		+ modGR.getDisplayValue('cmdb_model_category') + '"\n';
	}
}

gs.print('JW_Output:\n' + CSV);