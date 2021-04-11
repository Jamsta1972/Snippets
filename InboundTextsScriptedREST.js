(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

	var queryParams = request.queryParams;

	//var username = queryParams.username.toString();
	//var password = queryParams.password.toString();
	var message = queryParams.message.toString();
	var mobile = queryParams.number.toString();
	
	if(mobile.match(/^(44)/)) {
		mobile = mobile.replace(/^.{2}/g, '0');
	}

	/*
	var usernameTest = 'hQk5Rq';
	var passwordTest = 'iig8Vw';

	
	if((username != usernameTest) || (password != passwordTest)){
		return;
	}
	*/
	
	//Create object to represent inbound text, with which to create a new 'u_inbound_text_message' record:
	var inBoundTextObj = {
		message: message,
		mobile_number: mobile,
		outage_notification: '',
		incident: '',
		user: '',
		setUser: function(userIn){this.user = userIn;},
		setIncident: function(incIn){this.incident = incIn;},
		setOutage_notification: function(outageIn){this.outage_notification = outageIn;}    
	};
	

	var textMessagesGR = new GlideRecord('u_text_messages');	
	textMessagesGR.addEncodedQuery('sys_created_onRELATIVEGE@dayofweek@ago@2^u_state=processed^u_mobile_number='+mobile);
	textMessagesGR.orderByDesc('sys_created_on');
	textMessagesGR.setLimit(1);
	textMessagesGR.query();
	if(textMessagesGR.next()){
		// Is the text part of an outage? 
		if(textMessagesGR.getValue('u_outage_notification')){	
			var incidentSys = textMessagesGR.u_outage_notification.getRefRecord().getValue('u_incident_sys');
			
			//Update value(s) in inBoundText object:
			inBoundTextObj.setOutage_notification(textMessagesGR.getValue('u_outage_notification'));	
			inBoundTextObj.setIncident(incidentSys);
			
			var incidentGR = new GlideRecord('incident');
			incidentGR.get(incidentSys);
			if(incidentGR.caller_id.getRefRecord().getValue('mobile_phone') == mobile){
				//Update value(s) in inBoundText object:
				inBoundTextObj.setUser(incidentGR.caller_id);
				
				// if we can - let's add the text to the incident and set the state
				if(incidentGR.getValue('active') == false){ // if the incident is closed - create a new one
					createIncident();
				}else{
					if(incidentGR.getValue('state') == '4'){ // if the incident is awaiting user info
						incidentGR.setValue('state','2'); // set active to true 
						incidentGR.setValue('u_cc_response_required', true); // set response required to true 
					}
					new GlideImpersonate().impersonate(incidentGR.getValue('caller_id'));
					incidentGR.work_notes = message;
					incidentGR.update();					
				}
			}
		}else{
			// is there an active incident with this mobile number? 
			var incidentGR = new GlideRecord('incident');
			incidentGR.addQuery('caller_id.mobile_phone', mobile);
			incidentGR.orderByDesc('sys_created_on');
			incidentGR.setLimit(1);
			incidentGR.query();
			if(incidentGR.next()){
				// if the incident is active - let's add the message
				if(incidentGR.getValue('active') == true){
					if(incidentGR.getValue('state') == '4'){ // if the incident is awaiting user info
						incidentGR.setValue('state','2'); // set active to true 
						incidentGR.setValue('u_cc_response_required', true); // set response required to true 
					}
					new GlideImpersonate().impersonate(incidentGR.getValue('caller_id'));
					incidentGR.work_notes = message;
					incidentGR.update();
					//Update value(s) in inBoundText object:	
					inBoundTextObj.setIncident(incidentGR.getUniqueValue());
					inBoundTextObj.setUser(incidentGR.caller_id);
				}else if(incidentGR.getValue('active') == false){
					// if the incident is not active - create a new one
					createIncident();
				}
			}else{
				// if we cannot find an incident pertaining to a caller with that mobile - create one
				createIncident();
			}
		}
	}
	else{//where there is NOT a recent outbound text message to THIS mobile number.
		createIncident();		
	}
	
	
	//create inBoundText record:
	var inBoundTextGR = new GlideRecord('u_inbound_text_message');
	inBoundTextGR.newRecord();
	inBoundTextGR.u_message = inBoundTextObj.message;
	inBoundTextGR.u_incident = inBoundTextObj.incident;
	inBoundTextGR.u_outage_notification = inBoundTextObj.outage_notification;
	inBoundTextGR.u_user = inBoundTextObj.user;
	inBoundTextGR.u_mobile_number = inBoundTextObj.mobile_number;
	inBoundTextGR.insert();

	function createIncident(){
		// do we know the user? 
		var userLookup = new GlideRecord('sys_user');
		userLookup.addQuery('mobile_phone', mobile);
		userLookup.query();
		if(userLookup.next()){
			// create incident for the user
			var incidentGR = new GlideRecord('incident');
			incidentGR.initialize();
			incidentGR.caller_id = userLookup.getUniqueValue();
			incidentGR.opened_by = userLookup.getUniqueValue();
			incidentGR.u_incident_view = 'Default';
			incidentGR.comments = "Text received from: " + userLookup.getValue('first_name')+' '+ userLookup.getValue('last_name') + "\n\n" + message;
			incidentGR.short_description = 'Text recieved from '+ userLookup.getValue('first_name')+' '+ userLookup.getValue('last_name');
			incidentGR.incident_state = 1;
			incidentGR.notify = 2;
			incidentGR.contact_type = "text_message";
			incidentGR.assignment_group ="f037758ddbf39e0003a77a0bbf9619be"; //ServiceDesk
			incidentGR.u_cc_response_required = true;
			incidentGR.insert();
			//Update value(s) in inBoundText object:
			inBoundTextObj.setUser(userLookup.getUniqueValue());
			
		}else{
			// create a user then create an incident
			var sysUser = new GlideRecord('sys_user');
			sysUser.initialize();
			sysUser.u_user_type = 'C2 Customer';
			sysUser.user_name = 'g'+gs.generateGUID();
			sysUser.first_name = mobile;
			sysUser.mobile_phone = mobile;

			var userSys = sysUser.insert();
			var incidentGR = new GlideRecord('incident');
			incidentGR.initialize();
			incidentGR.caller_id = userSys;
			incidentGR.opened_by = userSys;
			incidentGR.u_incident_view = 'Default';
			incidentGR.comments = "Text received from: " + mobile + "\n\n" + message;
			incidentGR.short_description = "Text received from: "+mobile+" "+message;
			incidentGR.incident_state = 1;
			incidentGR.notify = 2;
			incidentGR.contact_type = "text_message";
			incidentGR.assignment_group ="f037758ddbf39e0003a77a0bbf9619be"; //ServiceDesk
			incidentGR.u_cc_response_required = true;
			incidentGR.insert();			
			//Update value(s) in inBoundText object:
			inBoundTextObj.setUser(userSys);
		}
		//Update value(s) in inBoundText object:
		inBoundTextObj.setIncident(incidentGR.getUniqueValue());
	}

})(request, response);