var serviceManagementReporting = {
	//serviceManagementReporting.getUptime(startDate,endDate,locations);
	//gs.print(serviceManagementReporting.getUptime('2017-04-01','2017-04-30','26795a09db379e0003a77a0bbf961988,ee795a09db379e0003a77a0bbf96198a'));
	getUptime: function(startDate,endDate,locations) {

		var startDate_duration = new GlideDateTime();
		var endDateRes_duration = new GlideDateTime();
//gs.info('JW_startDate1: ' + startDate);	
		startDate_duration.setDisplayValueInternal(startDate + ' 00:00:00');
		endDateRes_duration.setDisplayValueInternal(endDate + ' 23:59:59');
//gs.info('JW_startDate_duration: ' + startDate_duration);
//gs.info('JW_endDateRes_duration: ' + endDateRes_duration);
		var availableDuration = gs.dateDiff(startDate_duration.getDisplayValue(), endDateRes_duration.getDisplayValue(), true) / 60;

		var totalUnits = 0; //total units for all selected locations.
		var locs = new GlideRecord('cmn_location');
		locs.addQuery('u_number_of_rooms','!=','');
		locs.addQuery('sys_id','IN',locations);
		locs.query();
		while(locs.next()) {
			if(locs.getValue('u_number_of_rooms')!='')
				totalUnits += parseInt(locs.getValue('u_number_of_rooms'));
		}

		var overalPercentageUptime = 100;
		
		/*VERSION OF CALCULATION TO INCLUDE CORE OUTAGES ref STRY0011281,June 2019.
		This version aligns with the calculations in 'locationUptime' script include
		which is used by the Service Availability widget.
		*/
		//Loop through the Affected locations.
		var affLocGR = new GlideRecord('u_incident_tasklocation_left');
		var affLocQstr = "tloc_locationIN" + locations
		+ "^tloc_u_outage_start<javascript:gs.dateGenerate('" + endDate + "','23:59:59')"
		+ "^tloc_u_outage_end>javascript:gs.dateGenerate('" + startDate + "','00:00:00')^ORtloc_u_outage_endISEMPTY"
		+ "^inc_u_subcat_sm_category!=Ignore"
		+ "^inc_u_res_sm_categoryNOT INPower Restored,Power Testing,Site Maintenance,Power Cut,Power Issue,Ignore^ORinc_u_res_sm_categoryISEMPTY"
		+ "^inc_priority=1"
		+ "^inc_resolved_at>javascript:gs.dateGenerate('2017-08-31','12:00:00')^ORinc_resolved_atISEMPTY";
		
		affLocGR.addEncodedQuery(affLocQstr);
		affLocGR.query();
		while (affLocGR.next()) {

			//'Measure' start and end for INC, default to start and end of the selected period:
			var incMeasureStart = new GlideDateTime(startDate_duration.getValue());
			var incMeasureEnd = new GlideDateTime(endDateRes_duration.getValue());
			
			var incOutageStart = affLocGR.tloc_u_outage_start.getGlideObject();
			var incOutageEnd = affLocGR.tloc_u_outage_end.getGlideObject();

			//Update measure start and end for INC, if they are inside the selected period.
			if (incOutageStart.after(incMeasureStart))
				incMeasureStart = incOutageStart;				
			
			if (affLocGR.tloc_u_outage_end){
				if (incOutageEnd.before(incMeasureEnd))
					incMeasureEnd = incOutageEnd;
			}
//logStr += '\n' + affLocGR.inc_number + ' - ' + affLocGR.tloc_location.name + ': incMeasureStart: ' + incMeasureStart + ', incMeasureEnd: ' + incMeasureEnd;
			
			var outageDurationMins = gs.dateDiff(incMeasureStart.getDisplayValue(), incMeasureEnd.getDisplayValue(), true) / 60;
//logStr+= '\n' + affLocGR.inc_number + ': outageDurationMins: ' + outageDurationMins;
			
			//Scale the downtime for INC:
			var u_number_of_rooms = parseInt(affLocGR.tloc_location.u_number_of_rooms);
			var INCUserweighting = 1;

			if (u_number_of_rooms > 0) //If this is empty, we should use a default. Otherwise, will count as downtime for totalUnits (all users in all locations) 
				INCUserweighting = u_number_of_rooms / totalUnits;
			
			var INCPcntgeDowntime = outageDurationMins / availableDuration * INCUserweighting * 100;
			overalPercentageUptime -= INCPcntgeDowntime;
			
		}		
		return overalPercentageUptime.toFixed(4);	
	},	

	//serviceManagementReporting.callCloseCodes(startDate,endDate,locations);
	//gs.print(JSON.stringify(serviceManagementReporting.callCloseCodes('2017-06-01','2017-06-30','26fe226e37e8ea000587772a53990e02')));
	callCloseCodes: function(startDate,endDate,locations) {

		var incidentObj = {};
		//Could put something here to pre-pop all the categories to ZERO, if you always want to display them all.

		var inc = new GlideRecord('u_incident_tasklocation_left');
		var qStr = "inc_resolved_atBETWEENjavascript:gs.dateGenerate('"+startDate+"','00:00:00')@javascript:gs.dateGenerate('"+endDate+"','23:59:59')"
							+"^inc_locationIN"+locations+"^ORtloc_locationIN"+locations
							+"^inc_stateIN6,7"
							+"^inc_priorityNOT IN4,5^ORinc_priorityISEMPTY"
							+"^inc_u_subcat_sm_category!=Ignore"
							+"^inc_u_res_sm_category!=Ignore^ORinc_u_res_sm_categoryISEMPTY";
		inc.addEncodedQuery(qStr);

		var incNumbers = [];
		inc.query();
		//var logStr = '';
		while (inc.next()){
			if (incNumbers.indexOf(inc.getValue('inc_number')) == -1){
				//logStr += inc.inc_number + ', subcat: ' + inc.getValue('inc_u_subcat_sm_category') + '\n';
				incNumbers.push(inc.getValue('inc_number'));
				if (!incidentObj[inc.getValue('inc_u_res_sm_category')])
					incidentObj[inc.getValue('inc_u_res_sm_category')] = 1;
				else
					incidentObj[inc.getValue('inc_u_res_sm_category')] ++;
			}
		}
//gs.info('JW_incsRes SubCat: ' + incNumbers);
		
		delete incidentObj['Ignore'];
		
		//Convert this object to an array, sorted by category in alphabetical order (for the table):
		var propList = Object.keys(incidentObj).sort();
		var callCloseCodesArray = [];
		propList.forEach(function(el){
			var obj = {
				"category": el,
				"count": incidentObj[el],
				"query": qStr + "^inc_u_res_sm_category=" + el
			};
			callCloseCodesArray.push(obj);
			
		});
		
		var returnObj = {"callCloseCodesArray" : callCloseCodesArray, "incidentObj": incidentObj};
		return returnObj;

	},

	//serviceManagementReporting.callOpenCodes(startDate,endDate,locations);
	//gs.print(JSON.stringify(serviceManagementReporting.callOpenCodes('2017-06-01','2017-06-30','26fe226e37e8ea000587772a53990e02')));
	callOpenCodes: function(startDate,endDate,locations) {
		
		var incidentObj = {};   
		//Could put something here to pre-pop all the categories to ZERO, if you always want to display them all.
		
		var inc = new GlideRecord('u_incident_tasklocation_left');
		var qStr = "inc_sys_created_onBETWEENjavascript:gs.dateGenerate('"+startDate+"','00:00:00')@javascript:gs.dateGenerate('"+endDate+"','23:59:59')"
							+"^inc_locationIN"+locations+"^ORtloc_locationIN"+locations
							+"^inc_priorityNOT IN4,5^ORinc_priorityISEMPTY"
							+"^inc_u_subcat_sm_category!=Ignore"
							+"^inc_u_res_sm_category!=Ignore^ORinc_u_res_sm_categoryISEMPTY";
		inc.addEncodedQuery(qStr);
							
		var incNumbers = [];
		inc.query();
		//var logStr = '';
		while (inc.next()){
			if (incNumbers.indexOf(inc.getValue('inc_number')) == -1){
				//logStr += inc.inc_number + ', subcat: ' + inc.getValue('inc_u_subcat_sm_category') + '\n';
				incNumbers.push(inc.getValue('inc_number'));
				if (!incidentObj[inc.getValue('inc_u_subcat_sm_category')])
					incidentObj[inc.getValue('inc_u_subcat_sm_category')] = 1;
				else
					incidentObj[inc.getValue('inc_u_subcat_sm_category')] ++;
			}
		}
		//gs.info('JW_logStr Res: ' + logStr);

		delete incidentObj['Ignore'];
		delete incidentObj['IgnoreQuery'];
		//Convert this object to an array, sorted by category in alphabetical order (for the table):
		var propList = Object.keys(incidentObj).sort();
		var callOpenCodesArray = [];
		propList.forEach(function(el){
			var obj = {
				"category": el,
				"count": incidentObj[el],
				"query": qStr + "^inc_u_subcat_sm_category=" + el
			};
			callOpenCodesArray.push(obj);
			
		});
		
		var returnObj = {"callOpenCodesArray" : callOpenCodesArray, "incidentObj": incidentObj};
		return returnObj;
	},

	//serviceManagementReporting.callPriority(startDate,endDate,locations);
	//gs.print(JSON.stringify(serviceManagementReporting.callPriority('2017-06-01','2017-06-30','26fe226e37e8ea000587772a53990e02')));
	callPriority: function(startDate,endDate,locations) {

		var incidentObj = {};  
		incidentObj['1 - Critical'] = 0;
		incidentObj['2 - High'] = 0;
		incidentObj['3 - Moderate'] = 0;	
		
		var inc = new GlideAggregate('u_incident_tasklocation_left');
		inc.addEncodedQuery("inc_locationIN"+locations+"^ORtloc_locationIN"+locations
							+"^inc_sys_created_onBETWEENjavascript:gs.dateGenerate('"+startDate+"','00:00:00')@javascript:gs.dateGenerate('"+endDate+"','23:59:59')"
							+"^inc_priorityNOT IN4,5^ORinc_priorityISEMPTY"
							+"^inc_u_subcat_sm_category!=Ignore"
							+"^inc_u_res_sm_category!=Ignore^ORinc_u_res_sm_categoryISEMPTY");
		inc.groupBy('inc_priority');
		inc.addAggregate('COUNT(DISTINCT','inc_number');
		inc.query();
		while(inc.next()) {
			incidentObj[inc.inc_priority.getDisplayValue()] = inc.getAggregate('COUNT(DISTINCT','inc_number');
		}
		
		//Workaround to account for incidents without a priority. Count them as P3s:
		var inc = new GlideAggregate('u_incident_tasklocation_left');
		inc.addEncodedQuery("inc_locationIN"+locations+"^ORtloc_locationIN"+locations
							+"^inc_sys_created_onBETWEENjavascript:gs.dateGenerate('"+startDate+"','00:00:00')@javascript:gs.dateGenerate('"+endDate+"','23:59:59')"
							+"^inc_priorityISEMPTY"
							+"^inc_u_subcat_sm_category!=Ignore"
							+"^inc_u_res_sm_category!=Ignore^ORinc_u_res_sm_categoryISEMPTY");
		inc.addAggregate('COUNT(DISTINCT','inc_number');
		inc.query();
		if (inc.next()){
			var noPCount = inc.getAggregate('COUNT(DISTINCT','inc_number');
			incidentObj['3 - Moderate'] = parseInt(incidentObj['3 - Moderate']) + parseInt(noPCount);
		}
		
		return incidentObj;
	},
	
	callHighPriority: function(startDate,endDate,locations) {

		var incidentObj = {};  
		incidentObj['1 - Critical'] = 0;
		incidentObj['2 - High'] = 0;

		var inc = new GlideAggregate('u_incident_tasklocation_left');
		inc.addEncodedQuery("inc_locationIN"+locations+"^ORtloc_locationIN"+locations
							+"^inc_sys_created_onBETWEENjavascript:gs.dateGenerate('"+startDate+"','00:00:00')@javascript:gs.dateGenerate('"+endDate+"','23:59:59')"
							+"^inc_priorityNOT IN3,4,5"
							+"^inc_u_subcat_sm_category!=Ignore"
							+"^inc_u_res_sm_category!=Ignore^ORinc_u_res_sm_categoryISEMPTY");
		inc.groupBy('inc_priority');
		inc.addAggregate('COUNT(DISTINCT','inc_number');
		inc.query();
		while(inc.next()) {
			incidentObj[inc.inc_priority.getDisplayValue()] = inc.getAggregate('COUNT(DISTINCT','inc_number');
		}

		return incidentObj;
	},


	//serviceManagementReporting.highPriorityCalls(startDate,endDate,locations);
	//gs.print(JSON.stringify(serviceManagementReporting.highPriorityCalls('2017-06-01','2017-06-30','26fe226e37e8ea000587772a53990e02')));
	highPriorityCalls: function(startDate,endDate,locations) {

		/*
		 * VERSION OF CALCULATION WHICH ONLY INCLUDES OUTAGES DIRECTLY SET ON LOCATION
		 */
		/*var gr = new GlideRecord('incident');
	gr.addEncodedQuery("locationIN"+locations+"^sys_created_onBETWEENjavascript:gs.dateGenerate('"+startDate+"','00:00:00')@javascript:gs.dateGenerate('"+endDate+"','23:59:59')^priorityIN1,2^u_resolutionNOT INSpam,Duplicate^ORu_resolutionISEMPTY^u_resolution_sm_category!=Ignore^ORu_resolution_sm_categoryISEMPTY");
		gr.orderBy('priority');
		gr.orderBy('sys_created_on');
		gr.query();

		//  start building response object
		var resultsArr = [];
		//  iterate over incident records and build JSON representations to be streamed out.
		while (gr.next()) {
			var endDateRes = new GlideDateTime();
			var startDateRes = new GlideDateTime();
			endDateRes.setDisplayValueInternal(gr.getValue('u_outage_end'));
			startDateRes.setDisplayValueInternal(gr.getValue('u_outage_start'));

			var diffSeconds = gs.dateDiff(startDateRes.getDisplayValue(), endDateRes.getDisplayValue(), true);

			var incidentObj = {};

			incidentObj['number'] = gr.getValue('number');
			incidentObj['outage_start'] = gr.getDisplayValue('u_outage_start');
			incidentObj['outage_end'] = gr.getDisplayValue('u_outage_end');
			incidentObj['short_description'] = gr.getValue('short_description');
			incidentObj['category'] = gr.getDisplayValue('u_custom_category');
			incidentObj['location'] = gr.getDisplayValue('location');
			incidentObj['subcategory'] = gr.getDisplayValue('u_custom_subcategory');
			incidentObj['sm_resolution'] = gr.getDisplayValue('u_resolution_sm_category');
			incidentObj['difference_in_minutes'] = Math.floor(diffSeconds/60);

			resultsArr.push(incidentObj);
		}*/

		/*
		 * VERSION OF CALCULATION WHICH INCLUDES CORE OUTAGES
		 */
		var gr = new GlideRecord('u_incident_tasklocation_left');	
		gr.addEncodedQuery("inc_locationIN"+locations
						   +"^ORtloc_locationIN"+locations
						   +"^inc_sys_created_onBETWEENjavascript:gs.dateGenerate('"+startDate+"','00:00:00')@javascript:gs.dateGenerate('"+endDate+"','23:59:59')"
						   +"^inc_priorityIN1,2"
						  // +"^inc_stateIN6,7" //Commented out: table to include in-flight incidents at Racheal's request, ref STRY0011281.
							+"^inc_u_subcat_sm_category!=Ignore"
							+"^inc_u_res_sm_category!=Ignore^ORinc_u_res_sm_categoryISEMPTY");

		gr.orderBy('inc_priority');
		gr.orderBy('inc_u_outage_start');
		gr.query();
		//  start building response object
		var resultsArr = {};
		//  iterate over incident records and build JSON representations to be streamed out.
		while (gr.next()) {
			if (resultsArr[gr.getValue('inc_number')]) //we are iterating through a DB view, and we only want to consider 
			//each incident once, so skip if this incident has already been been added to the resultsArr object.
				continue;
			
			var endDateRes = new GlideDateTime();
			var startDateRes = new GlideDateTime();
			startDateRes.setDisplayValueInternal(gr.getValue('inc_u_outage_start'));
			var diffSeconds = 0;
			
			if (gr.getDisplayValue('inc_u_outage_end')){
				endDateRes.setDisplayValueInternal(gr.getValue('inc_u_outage_end'));
				diffSeconds = gs.dateDiff(startDateRes.getDisplayValue(), endDateRes.getDisplayValue(), true);
			}
			
			//Gather up list of affected locations, for this incident:
			var affectedLocsGR = new GlideRecord('task_location');
			affectedLocsGR.addQuery('task', gr.inc_sys_id);
			affectedLocsGR.addQuery('location', 'IN', locations);
			//affectedLocsGR.addQuery('location', '!=', gr.inc_location);
			var affectedlocations = [];
			affectedLocsGR.query();
			while(affectedLocsGR.next()){
				affectedlocations.push(affectedLocsGR.getDisplayValue('location'));
			}

			var incidentObj = {};
			
			var affectLocationDisplay = ''; //List of affected locations that will be displayed.
			if (affectedlocations.length > 20){
				affectLocationDisplay = 'More than 20 Locations';				
			}
			else{
				affectLocationDisplay = affectedlocations.join(',\n');				
			}

			incidentObj['number'] = gr.getValue('inc_number');
			incidentObj['outage_start'] = gr.getDisplayValue('inc_u_outage_start');			
			incidentObj['short_description'] = gr.getValue('inc_short_description');
			//incidentObj['category'] = gr.getDisplayValue('inc_u_custom_category');
			incidentObj['location'] = gr.getDisplayValue('inc_location');
			incidentObj['affectedlocations'] = affectLocationDisplay;
			incidentObj['subcategory'] = gr.getDisplayValue('inc_u_subcat_sm_category');
			//var subcat = gr.getDisplayValue('inc_u_custom_subcategory');
			//incidentObj['subcategory'] = subcat=='Network Outage' ? 'Full' : 'Partial';
			//incidentObj['sm_resolution'] = gr.getDisplayValue('inc_u_resolution_sm_category');
			
			if (gr.getValue('inc_state') == 6 || gr.getValue('inc_state') == 7){
				incidentObj['sm_resolution'] = gr.getDisplayValue('inc_u_sm_outage_res');
			}
			else{
				incidentObj['sm_resolution'] = 'Under Investigation';
			}
			
			if (gr.getDisplayValue('inc_u_outage_end')){
				incidentObj['outage_end'] = gr.getDisplayValue('inc_u_outage_end');
				incidentObj['difference_in_minutes'] = Math.floor(diffSeconds/60);
				
			}
			else{
				incidentObj['outage_end'] = 'Ongoing';
				incidentObj['difference_in_minutes'] = 'Ongoing';
				incidentObj['sm_resolution'] = 'Ongoing';				
			}
			
			/*
			if (gr.getValue('inc_state') == 6 || gr.getValue('inc_state') == 7){
				incidentObj['sm_resolution'] = resarr[gr.getDisplayValue('inc_u_cause')+':'+gr.getDisplayValue('inc_u_reason')+':'+gr.getDisplayValue('inc_u_resolution')+':'+gr.getDisplayValue('inc_u_resolution_sm_category')];
				incidentObj['outage_end'] = gr.getDisplayValue('inc_u_outage_end');
				incidentObj['difference_in_minutes'] = Math.floor(diffSeconds/60);			
			}
			else{ //defaults for ongoing incidents:
				incidentObj['sm_resolution'] = 'Ongoing';
				incidentObj['outage_end'] = 'Ongoing';
				incidentObj['difference_in_minutes'] = 'Ongoing';
			}
			*/
			
			//Allow each table row 4 line rows by default, but adjust that if the number of affected locations > 4. If there are more than 20 affeced locations, we do not list them all so they'll only take one line row.
			var lineRowsPerTableRow = 4;
			if (affectedlocations.length > 4 && affectedlocations.length < 21)
				lineRowsPerTableRow = affectedlocations.length;
			
			if (incidentObj['sm_resolution'].length > 40){	
				var extraLines = Math.ceil((incidentObj['sm_resolution'].length - 40) / 10);	
				if (extraLines + 4 > lineRowsPerTableRow)	
					lineRowsPerTableRow = extraLines + 4;	
			}			
			
			incidentObj['lineRows'] = lineRowsPerTableRow;

			resultsArr[gr.getValue('inc_number')] = incidentObj;
		}		
		
		//gs.info('JW_resultsArr: ' + JSON.stringify(resultsArr));
		return resultsArr;	
	},

	//serviceManagementReporting.callsByLocation(startDate,endDate,locations);
	//gs.print(JSON.stringify(serviceManagementReporting.callsByLocation('2017-06-01','2017-06-30','26fe226e37e8ea000587772a53990e02')));
	callsByLocation: function(startDate,endDate,locations) {
		
		//set up results object:
		var resultsArr = {};

		var locGR = new GlideRecord('cmn_location');
		locGR.addEncodedQuery("sys_idIN"+locations);
		locGR.query();
		while(locGR.next()) {			
			resultsArr[locGR.getDisplayValue('name')] = {cnt: 0, cnt2: 0, cnt3: 0};
			//cnt, cnt2, cnt3 = logged, resolved, open
		}
		 
		 //Get counts of incidents logged:
		var inc = new GlideRecord('u_incident_tasklocation_left');
		inc.addEncodedQuery("inc_locationIN"+locations+"^ORtloc_locationIN"+locations
							+"^inc_sys_created_onBETWEENjavascript:gs.dateGenerate('"+startDate+"','00:00:00')@javascript:gs.dateGenerate('"+endDate+"','23:59:59')"
							+"^inc_priorityNOT IN4,5^ORinc_priorityISEMPTY"
							+"^inc_u_subcat_sm_category!=Ignore"
							+"^inc_u_res_sm_category!=Ignore^ORinc_u_res_sm_categoryISEMPTY");
		inc.query();

		while(inc.next()) {
			if(locations.indexOf(inc.getValue('tloc_location')) > -1) {
				resultsArr[inc.getDisplayValue('tloc_location')].cnt += 1;
			}
		}
		
		//Get counts of incidents resolved: (Notice: this counts the number of incidents resolved in the period, NOT the number of incidents created in the period which then happen to have been resolved).
		var inc2 = new GlideRecord('u_incident_tasklocation_left');
		inc2.addEncodedQuery("inc_locationIN"+locations+"^ORtloc_locationIN"+locations
							+"^inc_resolved_atBETWEENjavascript:gs.dateGenerate('"+startDate+"','00:00:00')@javascript:gs.dateGenerate('"+endDate+"','23:59:59')"
							+"^inc_stateIN6,7"
							+"^inc_priorityNOT IN4,5^ORinc_priorityISEMPTY"
							+"^inc_u_subcat_sm_category!=Ignore"
							+"^inc_u_res_sm_category!=Ignore^ORinc_u_res_sm_categoryISEMPTY");

		inc2.query();

		while(inc2.next()) {
			if(locations.indexOf(inc2.getValue('tloc_location')) > -1) {
				resultsArr[inc2.getDisplayValue('tloc_location')].cnt2 += 1;
			}
		}			
		
		//Get counts of incidents open at the end of the period.
		var inc3 = new GlideRecord('u_incident_tasklocation_left');
		inc3.addEncodedQuery("inc_locationIN"+locations+"^ORtloc_locationIN"+locations
							+"^inc_u_subcat_sm_category!=Ignore"
							+"^inc_u_res_sm_category!=Ignore^ORinc_u_res_sm_categoryISEMPTY"
							+"^inc_priorityNOT IN4,5^ORinc_priorityISEMPTY"
							+"^inc_resolved_at>javascript:gs.dateGenerate('"+endDate+"','23:59:59')^ORinc_resolved_atISEMPTY"
							+"^inc_sys_created_on<javascript:gs.dateGenerate('"+endDate+"','23:59:59')");
		inc3.query();

		while(inc3.next()) {
			if(locations.indexOf(inc3.getValue('tloc_location')) > -1) {
				resultsArr[inc3.getDisplayValue('tloc_location')].cnt3 += 1;
			}
		}	
		
		var orderedLocs = Object.keys(resultsArr).sort();
		
	//gs.info('JW_resultsArr: ' + JSON.stringify(resultsArr));
		return {resultsArr: resultsArr, orderedLocs: orderedLocs};
	},

	//serviceManagementReporting.callsByResolutionSpeed(startDate,endDate,locations);
	//gs.print(JSON.stringify(serviceManagementReporting.callsByResolutionSpeed('2017-06-01','2017-06-30','26fe226e37e8ea000587772a53990e02')));
	callsByResolutionSpeed: function(startDate,endDate,locations) {
		var zeroToTwo =0;
		var threeToFive = 0;
		var moreThanFive = 0;


		/*
		 * VERSION OF CALCULATION WHICH ONLY INCLUDES OUTAGES DIRECTLY SET ON LOCATION
		 */
		//var gr = new GlideRecord('incident');

		/*
		 * VERSION OF CALCULATION WHICH ONLY INCLUDES OUTAGES DIRECTLY SET ON LOCATION
		 */
		/*gr.addEncodedQuery("resolved_atBETWEENjavascript:gs.dateGenerate('"+startDate+"','00:00:00')@javascript:gs.dateGenerate('"+endDate+"','23:59:59')"
						   +"^locationIN"+locations
						   +"^priorityNOT IN4,5"
						   +"^u_resolutionNOT INSpam,Duplicate^ORu_resolutionISEMPTY"
						   +"^u_resolution_sm_category!=Ignore^ORu_resolution_sm_categoryISEMPTY");
		gr.query();

		while (gr.next()) {

			var diffSeconds = gs.dateDiff(gr.getDisplayValue('sys_created_on'), gr.getDisplayValue('resolved_at'), true);   
			//var msg = (diffSeconds <= 0) ? ' is on or after ' : ' is before ';
			//gs.print(incidentLogged.getDisplayValue() + msg + incidentResolved.getDisplayValue());
			var daysOpen = parseInt(diffSeconds/86400);
			if(daysOpen > 5){
				moreThanFive ++;
			}		

			else if(daysOpen >= 3){
				threeToFive ++;
			}

			else {
				zeroToTwo ++;
			}
		}*/

		/*
		 * VERSION OF CALCULATION WHICH INCLUDES CORE OUTAGES
		 */
		var temp = {};
		var gr = new GlideRecord('u_incident_tasklocation_left');
		gr.addEncodedQuery("inc_resolved_atBETWEENjavascript:gs.dateGenerate('"+startDate+"','00:00:00')@javascript:gs.dateGenerate('"+endDate+"','23:59:59')"
						   +"^inc_locationIN"+locations+"^ORtloc_locationIN"+locations
						   +"^inc_priorityNOT IN4,5^ORinc_priorityISEMPTY"
						   +"^inc_u_res_sm_category!=Ignore^inc_u_subcat_sm_category!=Ignore");
		gr.query();


		while (gr.next()) {
			var diffSeconds = gs.dateDiff(gr.getDisplayValue('inc_sys_created_on'), gr.getDisplayValue('inc_resolved_at'), true);   
			//var msg = (diffSeconds <= 0) ? ' is on or after ' : ' is before ';
			//gs.print(incidentLogged.getDisplayValue() + msg + incidentResolved.getDisplayValue());
			var daysOpen = parseInt(diffSeconds/86400);
			temp[gr.getDisplayValue('inc_number')] = daysOpen;
		}

		for( var k in temp)
		{
			if(temp[k] > 5){
				moreThanFive ++;
			}		

			else if(temp[k] >= 3){
				threeToFive ++;
			}

			else {
				zeroToTwo ++;
			}
		}


		var resArr = {};
		resArr['5+']=moreThanFive;
		resArr['3-5']=threeToFive;
		resArr['0-2']=zeroToTwo;


		return resArr;		
	},
	
	techOpsTickets: function(startDate,endDate,locations) {
	//return list of tickets with view = Work Request
		var resArr = {};
		var ticketGR = new GlideRecord('ticket');
		ticketGR.addEncodedQuery("locationIN"+locations
							+"^sys_created_onBETWEENjavascript:gs.dateGenerate('"+startDate+"','00:00:00')@javascript:gs.dateGenerate('"+endDate+"','23:59:59')"
							+"^u_ticket_view=Work Request");
		ticketGR.query();
		while(ticketGR.next()) {
			var openedAt = ticketGR.getDisplayValue('sys_created_on');
			var openedAtFmt = openedAt.split(' ')[0].split('-').reverse().join('-') + ' ' + openedAt.split(' ')[1].slice(0,5); //converts to dd-mm-yyyy hh:mm
			
			var ticketObj = {
				number: ticketGR.getDisplayValue(),
				opened: openedAtFmt,
				location: ticketGR.getDisplayValue('location'),
				shortDescription: ticketGR.getValue('short_description') || '-'
			};
			resArr[ticketGR.getUniqueValue()] = ticketObj;
		}
		
		return resArr;
	}
};