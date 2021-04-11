/*
USE this for debugging the calcs on a specific CMOD.
Update the current CMOD number below.
And run this in a background script.
The following are printed out:
- Inputs to the lookup.
- Outputs of the lookup.
- The resuls of each of the tests to detemine manual / auto approval.
*/

var current = new GlideRecord('u_proposal');
current.get('u_number', 'CMOD0004474');

(function executeRule(current) {
	var rooms = parseInt(current.getValue('u_rooms'));
	var months = parseInt(current.getValue('u_term'));
	var years = months/12;
	var finance = parseFloat(current.getValue('u_finance'));

	// Roll up Capex and Opex from the selected BOMs
	var bomCapex = 0;
	var bomOpex = 0;
	var exclCapex = 0;
	var exclOpex = 0;
	var intlabour = 0;
	var extlabour = 0;
	var licencing = 0;
	var infrastructure = 0;

	if (current.getValue('u_selected_boms')) {
		var bomIds = current.getValue('u_selected_boms').split(',');
		bomIds.forEach(function (bomId) {
			var bom = new GlideRecord('u_bom');
			if (bom.get(bomId)) {
				bomCapex += parseFloat(bom.u_capex.getReferenceValue());
				bomOpex += parseFloat(bom.u_opex.getReferenceValue());
				exclCapex += parseFloat(bom.u_excluded_capex.getReferenceValue());
				exclOpex += parseFloat(bom.u_excluded_opex.getReferenceValue());
				licencing += parseFloat(bom.u_licencing_and_support.getReferenceValue());
				intlabour += parseFloat(bom.u_internal_labour.getReferenceValue());
				extlabour += parseFloat(bom.u_external_labour.getReferenceValue());
				infrastructure += parseFloat(bom.u_infrastructure.getReferenceValue());
			}
		});
	}
	
	if (current.getValue('u_selected_boms') || current.getValue('u_commercial_model') == 'managed_service') {
		current.u_bom_capex = bomCapex;
		current.u_bom_opex = bomOpex;
		current.u_excluded_capex = exclCapex;
		current.u_excluded_opex = exclOpex;
		current.u_labour_internal = intlabour;
		current.u_labour_external = extlabour;
		current.u_licencing_and_support = licencing;
		current.u_infrastructure = infrastructure;
	}
	else{ //in the case of an indicative BoM, set variables to the values manually entered on the form, for the calculations later in this BRule:
		bomCapex = parseFloat(current.u_bom_capex.getReferenceValue());
		bomOpex = parseFloat(current.u_bom_opex.getReferenceValue());
	}

	// Get circuits
	var annualFees = 0;
	var installationCosts = 0;

	if (current.getValue('u_selected_circuit_quotes')) {
		
		var circuitIds = current.getValue('u_selected_circuit_quotes').split(',');
		circuitIds.forEach(function (circuitId) {
			var circuit = new GlideRecord('u_provisioning_request');
			if (circuit.get(circuitId)) {
				var quote = circuit.u_quote.getRefRecord();
				annualFees += parseFloat(quote.u_annual_fee.getReferenceValue());
				installationCosts += parseFloat(quote.u_installation_cost.getReferenceValue());
			}
		});
		
		current.u_circuit_capex = installationCosts;
		current.u_circuit_opex = annualFees;
	}
	
	else{
		current.u_circuit_capex = 0;
		current.u_circuit_opex = 0;
	}

	// Calculate total capex as (BOM Capex + Installation costs) * Finance
	//var totalCapex = bomCapex + ((installationCosts + bomCapex) * (finance / 100));
	var totalCapex = bomCapex + installationCosts;
	current.u_total_capex = totalCapex;
	// Calculate total opex as (BOM Opex + Annual Fees) * Years
	var opex = bomOpex + annualFees;
	var totalOpex = opex * years;
	current.u_opex = opex;
	current.u_total_opex = totalOpex;
	
//Set up and get the lookup values from the price parameters table:
	var units = current.getValue('u_rooms').replace(",","");
	var new_renewal = 'New';
	var u_delivery_type = current.u_parent.getRefRecord().getValue('u_delivery_type').toLowerCase();
	if (u_delivery_type.includes('renewal') || u_delivery_type.includes('existing'))
		new_renewal = 'Renewal';	
	
	var market = current.u_parent.getRefRecord().getValue('u_market_sector');

	var year;

	var d = new GlideDate();
	d.setValue(current.u_parent.getRefRecord().getValue('u_commencement_date'));
	
	//if commencement date is between Nov 2018 and Feb 2019, set the year to 20192020.
	//This is to cover a change in the financial year start/end from Nov to Feb,
	//and to catch those that would otherwise fall 'inbetween' 20182019 and 20192020.
	if ((d.getMonthNoTZ() >= 11 && d.getYearNoTZ() == 2018) || (d.getMonthNoTZ() == 1 && d.getYearNoTZ() == 2019))
		year = "20192020";
	
	else{	
		if(d.getMonthNoTZ() >= 2)
		{
			year = d.getYearNoTZ() +""+ (d.getYearNoTZ()+1);
		}
		else{
			year = (d.getYearNoTZ()-1) +""+ d.getYearNoTZ();
		}
	}

	current.setValue('u_state','in progress');
	var u_annual_unit_rate = parseFloat(current.getValue('u_annual_unit_rate'));

gs.print('market: ' + market);
gs.print('u_annual_unit_rate: ' + u_annual_unit_rate);
gs.print('units: ' + units);
gs.print('new_renewal: ' + new_renewal);
gs.print('year: ' + year);


	var result = JSON.parse(unitPriceTargetNonAjax.getTargets(market, u_annual_unit_rate, units, new_renewal, year));
gs.print('result: ' + JSON.stringify(result));

	//Dig out the 'answer' attribute, which is what our function returns. 
	current.setValue('u_target_contract_contribution',result.contract_contribution);
	current.setValue('u_target_capex_per_unit',result.capex_per_unit);
	current.setValue('u_market_unit_rate_annual',result.market_price);
	current.setValue('u_internal_labour_allocation',result.internal_labour_rate * units);
	current.setValue('u_national_network',result.national_network_rate * units);
	current.setValue('u_payback_period',result.target_payback);

/*DEBUG the results:	
var str = 'u_target_contract_contribution: ' + 	result.contract_contribution
+ '\nu_target_capex_per_unit: ' + result.capex_per_unit
+ '\nu_market_unit_rate_annual: ' + result.market_price
+ '\nu_internal_labour_allocation: ' + result.internal_labour_rate * units
+ '\nu_national_network: ' + result.target_payback;
gs.log('JW_the string: ' + str);
*/

//finished setting the fields that are directly populated from the priceParams lookup table

	/* EF BRING CALCULATION UPDATE INTO SERVICE */

	var u_capital_contribution = parseFloat(current.getValue('u_capital_contribution').replace(",",""));
	
	var u_total_opex = parseFloat(current.getValue('u_circuit_opex')) + parseFloat((current.getValue('u_other_opex')));
	var u_total_capex = parseFloat(current.getValue('u_bom_capex')) +
		parseFloat(current.getValue('u_internal_labour_allocation')) +
		parseFloat(current.getValue('u_labour_external')) +
		parseFloat(current.getValue('u_infrastructure')) +
		parseFloat(current.getValue('u_other_capex')) +
		parseFloat(current.getValue('u_licencing_and_support')) +
		parseFloat(current.getValue('u_circuit_capex'));
	
	

	//monthly unit rate = annual unit rate / 12
	current.setValue('u_unit_rate',(u_annual_unit_rate / 12).toFixed(2));

	//Total Opex = circuit opex + other opex
	current.setValue('u_total_opex', u_total_opex);

	//Total Capex = Hardware Capex + Internal Labour + External Labour + Other Capex + Circuit Install Capex		
	current.setValue('u_total_capex', u_total_capex);

	//Actual Unit Rate (Annual) =  ( ( Capital Contribution / Term (Months) / Units ) * 12  + Annual Unit Rate)
	var contribByTermUnits = (u_capital_contribution / parseFloat(current.getValue('u_term')) / parseFloat(units));
	//g_form.addInfoMessage(contribByTermUnits+':'+u_capital_contribution+':'+parseFloat(g_form.getValue('u_term'))+':'+parseFloat(units));

	var u_actual_unit_rate_annual =  (contribByTermUnits * 12  + u_annual_unit_rate).toFixed(2);
	current.setValue('u_actual_unit_rate_annual','GBP;'+parseFloat(u_actual_unit_rate_annual));

	//Annual Revenue = Actual Unit Rate (Annual) * Units
	var u_annual_revenue = u_actual_unit_rate_annual * units;
	current.setValue('u_annual_revenue', 'GBP;'+u_annual_revenue);

	//Annual Gross Profit = Annual Revenue - Total Opex (per year)
	var u_annual_gross_profit = parseFloat(u_annual_revenue - u_total_opex);
	current.setValue('u_annual_gross_profit', 'GBP;'+u_annual_gross_profit);

	//Annual Gross Margin = u_annual_gross_profit / u_annual_revenue
	current.setValue('u_annual_gross_margin', ((u_annual_gross_profit / u_annual_revenue) * 100).toFixed(2));

	//Contract Revenue = (Annual Revenue / 12) * Term (Months)
	//Do NOT calculate Contract Revenue for Infrastructure CMODs, as this field is entered manuall for those:
	if (current.u_commercial_model != 'manual_infrastructure'){
		var u_revenue = ((u_annual_revenue / 12) * parseFloat(current.getValue('u_term'))).toFixed(2);
		current.setValue('u_revenue', u_revenue);
	}
	//Contract Gross Profit = (Annual Gross Profit / 12) * Term (Months)
	var u_contract_gross_profit = ((u_annual_gross_profit / 12) * parseFloat(current.getValue('u_term'))).toFixed(2);
	current.setValue('u_gross_margin', u_contract_gross_profit);

	//Contract Contribution = Contract Gross Profit - Total Capex
	current.setValue('u_contract_contribution', 'GBP;'+(u_contract_gross_profit - u_total_capex));

	//Contract Contribution % = Contract Contribution / Contract Revenue
	current.setValue('u_contract_contribution_percentage', (((u_contract_gross_profit - u_total_capex) / u_revenue)*100).toFixed(2));

	//Payback = Total Capex / Annual Gross Profit
	//As of STRY0011536, this field is being set via lookup against a metric in target price parameters.
	//current.setValue('u_payback_period', (u_total_capex /  u_annual_gross_profit).toFixed(2));
	
	//Set Sub-Total:	
	var u_bom_capex = parseFloat(current.u_bom_capex.getReferenceValue());
	var u_licencing_and_support = parseFloat(current.u_licencing_and_support.getReferenceValue());
	var u_infrastructure = parseFloat(current.u_infrastructure.getReferenceValue());
	var u_labour_external = parseFloat(current.u_labour_external.getReferenceValue());
	var u_circuit_capex = parseFloat(current.u_circuit_capex.getReferenceValue());	
	
	var subT = u_bom_capex + u_licencing_and_support + u_infrastructure + u_labour_external + u_circuit_capex;
	var subTF = parseFloat(subT).toFixed(2);
	current.u_sub_total = subTF;
	
	//Set Capex with Internal Labour: Sub Total + Internal Labour Allocation
	var u_internal_labour_allocation = parseFloat(current.u_internal_labour_allocation.getReferenceValue());
	var capWithInt = subT + u_internal_labour_allocation;
	var capWithIntTF = parseFloat(capWithInt).toFixed(2);
	current.u_capex_with_internal_labour = capWithIntTF;
	
	//Set Capex with Network Costs: Sub Total + National Network
	var u_national_network = parseFloat(current.u_national_network.getReferenceValue());	
	var capWithNet = subT + u_national_network;
	var capWithNetTF = parseFloat(capWithNet).toFixed(2);
	current.u_capex_with_network_costs = capWithNetTF;
	//finished setting Sub-Total, and the calculated 'Fixed Cost' fields.
	
	//Contract Capex per unit = Capex with Internal Labour / Units
	current.setValue('u_contract_capex_per_unit',
					 'GBP;'+(current.getValue('u_capex_with_internal_labour') /
							 units).toFixed(2));	
	
	//Payback (including National Network) = Capex(with Internal labour) / (Annual Gross Profit - National Network)
	var payBack = (capWithIntTF / (u_annual_gross_profit - u_national_network)).toFixed(2);
	current.setValue('u_payback_including_national_network', payBack);
	//Annual EBITDA = Annual Revenue - Annual Cicuit Cost - National Network Cost:
	//u_annual_revenue - u_circuit_opex - u_national_network:
	var u_annual_ebitda = u_annual_revenue - 
	annualFees -
	(result.national_network_rate * units);
	current.setValue('u_annual_ebitda', 'GBP;'+(u_annual_ebitda));

	var approval_required = false;
	var actual_unit_rate_annual = current.getValue('u_actual_unit_rate_annual');
	var unitrate = getPercentageDifference(actual_unit_rate_annual,result.market_price).toFixed(2);
	if(parseFloat(unitrate) < -3) {
		//current.showFieldMsg('u_actual_unit_rate_annual', 'Actual Unit Rate is too low, this will require approval.','error');
		approval_required = true;		
	}
/*
	var contract_contribution = getPercentageDifference(current.getValue('u_contract_contribution_percentage'),result.contract_contribution).toFixed(2);
	if(parseFloat(contract_contribution) < -3) {
		//current.showFieldMsg('u_contract_contribution_percentage', 'Contract Contribution is too low, this will require approval.','error');
		approval_required = true;			
	}
*/
	var capex_per_unit = current.getValue('u_contract_capex_per_unit');
	var capex = getPercentageDifference(capex_per_unit,result.capex_per_unit).toFixed(2);
	if(parseFloat(capex) > 3) {
		//current.showFieldMsg('u_contract_capex_per_unit', 'Contract capex per unit is too low, this will require approval.','error');
		approval_required = true;		
	}	
	//Check if Payback (Including National Network) > Target Payback (years)
	if(payBack > parseFloat(result.target_payback)) {
		//current.showFieldMsg('u_payback_including_national_network', 'Payback is longer than target payback, this will require approval.','error');
		approval_required = true;		
	}
	//The three test results are here:
	gs.print('unitrate: ' + parseFloat(unitrate));
	gs.print('capex: ' + parseFloat(capex));
	gs.print('payBack v target payback: ' + payBack + ' v ' + result.target_payback);
	/*
	Original Calc for suggested rate:
	//Suggested Unit Rate (Annual) = ( Contract Capex per room - Target Capex per room ) * ( Units / Term (Months) ) * 12 / Units + Actual Unit Rate (Annual)
	
	After discussion with Phil/Michelle, ref STRY0011536, replaced Actual Unit Rate with Market Unit Rate:
	//Suggested Unit Rate (Annual) = ( Contract Capex per room - Target Capex per room ) * ( Units / Term (Months) ) * 12 / Units + Market Unit Rate (Annual)

	and the 'Units' part is superfluous, as this is per unit anyway and we're otherwise just multiplying by number of units and then dividing by number of units (ie the terms cancel each other out). So, units expressions removed from the formula.
	
	AND, agreed to set a min limit for the suggested rate, so that it cannot be less than that market rate.
	
	*/			
	var suggested = (( parseFloat(capex_per_unit) - parseFloat(result.capex_per_unit) ) / parseFloat(current.getValue('u_term') )  * 12  + parseFloat(result.market_price)).toFixed(2);
	
	if (parseFloat(suggested) < parseFloat(result.market_price)){ //Suggested Rate cannot be less than the market rate.
		suggested = parseFloat(result.market_price).toFixed(2);
	}
	current.setValue('u_suggested_unit_rate_annual','GBP;'+suggested);
	
	if (u_delivery_type == 'existing site - early renewal upgrade' || u_delivery_type == 'existing site - early renewal extension'){
		approval_required = true;
		//gs.addInfoMessage('NB: \'Renewal - Early Upgrade\' and \'Renewal - Early extension\' opportunities always require approval, regardless of commercials.');
	}
	
	//set approval status of record
	if(approval_required){
		current.setValue('u_approval_required','Approval Required');
	}
	else
		current.setValue('u_approval_required','Automatic Approval');


	function getPercentageDifference(oldNumber, newNumber){
		var decreaseValue = parseFloat(oldNumber) - parseFloat(newNumber);

		return (decreaseValue / oldNumber) * 100;
	}
	
	gs.print('approval_required: ' + approval_required);

	//current.update();

})(current);