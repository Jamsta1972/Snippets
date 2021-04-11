var X3apiUTIL = Class.create();
X3apiUTIL.prototype = {
    initialize: function() {
    },

    type: 'X3apiUTIL',
	
	createPO: function(poGR){
		try {
			var wFile = this.populateWFile(poGR);
			
			var s = new sn_ws.SOAPMessageV2('SAGE X3 - Purchase Orders', 'Create PO (Datel Version)');
			s.setStringParameterNoEscape('wFile', wFile);
			var response = s.execute();
			var responseBody = response.getBody(); 
			var status = response.getStatusCode();
gs.info('JW_X3 PO Response:\n' + responseBody);
			//ERROR HANDLING:	 
			if (status != 200){
				var theMessage = 'Non 200 Response- X3: Create Purchase Order: ' + poGR.getDisplayValue(); 
				var x3Message = 'X3 Message: ' + gs.getXMLText(responseBody, "//message"); 
				theMessage += '<BR>' + x3Message;
				gs.info(theMessage);
				gs.eventQueue('sagex3.api.issue', poGR, theMessage, "");
				poGR.u_x3_fail = true;
				poGR.autoSysFields(false);
				poGR.setWorkflow(false);
				poGR.update();
				return;
			}

			//NB: The X3 API returns 200, even in cases where the call has 'failed' in the business sense. And, it even returns status == 1 (success) when there has been an error creating the record. So we have to check if the 'Message' element contains 'ERROR'.
			var msg = gs.getXMLText(responseBody, "//message") || '';
			if (msg.includes('ERROR')){
				var theMessage = 'X3 Response - ERROR: Create Purchase Order: ' + poGR.getDisplayValue(); 
				theMessage += '<BR>' + 'X3 Message: ' + msg;
				gs.info(theMessage);
				gs.eventQueue('sagex3.api.issue', poGR, theMessage, ""); 
				poGR.u_x3_fail = true;	
			}
			else{
				poGR.u_x3_fail = false;				
				//Grab the X3 PO Reference:
				var resultXml = gs.getXMLText(responseBody, "//resultXml");
				var reg = /CCNL\d{4}POH\d{5}/m; //e.g. CCNL1805POH01048.
				var x3PORef = resultXml.match(reg) || '';
				if (x3PORef)
					poGR.u_x3_order_number = x3PORef[0];
			}
			
			poGR.autoSysFields(false);
			poGR.setWorkflow(false);
			poGR.update();	 
		}

		catch(ex) { 
			var message = ex.message;
			var theMessage = 'Error in X3: Create Purchase Order: ' + message;
			gs.info(theMessage);
			gs.eventQueue('sagex3.api.issue', poGR, theMessage, ""); 
		}		
	},
	
	populateWFile: function(poGR){ //For Purchase Order.
		var wFile = ''; /*Data to send.
		This matches the spec of the X3 Import/Export template 'YPOHFLNOCR'.
		Columns are comma separated. Rows are pipe separated.*/
		
		//-----set up E row---------->
		var purchasingSite = 'CCNL1';	
		var x3orderNo = poGR.u_x3_order_number || '';
		
		var orderDate = (poGR.po_date) ? 
			poGR.po_date.getGlideObject().getDate().toString().split('-').join('') 
			: ''; //formatted as YYYYMMDD.
				
		var supplier = poGR.vendor.u_x3_code || '';	
		
		var poPrjGR = (poGR.init_request.u_project) ? poGR.init_request.u_project.getRefRecord() : '';
		var reference = (poPrjGR) ? poPrjGR.number : poGR.getDisplayValue(); 
		//Use the Project Ref if one is available, otherwise use the PO Ref itself.
		
		var ERow = 'E,' + purchasingSite + ',' + x3orderNo + ',' + orderDate + ',' + supplier + ',' + reference + ',GBP|';
		wFile += ERow;
		
		//-----set up L and LC rows---------->
		var dimCodes = ',PRJ,PJT,LOC,PMA,CST,MKT,';	
		var receivingSite = 'CCNL1'; //const in L row.
		var ref = 'CC1'; //const in LC row.
		
		var poLineGR = new GlideRecord('proc_po_item');
		poLineGR.addQuery('purchase_order', poGR.getUniqueValue());
		poLineGR.query();
		while(poLineGR.next()){
			//----L row--->
			var product = poLineGR.model.u_x3_code || '';		
			var quantity = poLineGR.ordered_quantity || 1;
			var grossPrice = poGR.total_cost || 0;
			var vendorTC = poLineGR.vendor.u_tax_code;
			var taxCode = (vendorTC == 'vat') ? 'GB001' : (vendorTC == 'non_vat') ? 'GBNIL' : ''; //Vat registered = GB001 / Non-VAT registered = GBNIL.
			
			var LRow = 'L,' + product + ',' + receivingSite + ',' + quantity + ',' + grossPrice + ',' + taxCode + '|';
			wFile += LRow;
			
			//----LC row--->		
			var acc = poLineGR.model.u_gl_code || ''; // G/L account = value stored in field on model (but is overwritten below if PRJ related).
			var costType = this.getCostType(poLineGR.u_cost_type || ''); //Cost Type – if the Product Model is Opex, u_cost_type = requestor's Department is used. If Capex then u_cost_type = model category.			
			
			//Default X3 dimension values. (XXXX = Non Project):
			var prjRef = '', prjType = 'XXXX', locRef = '', prjMan= 'TBA', mktSector = 'XXXX'; 
			
			var prjGR = (poLineGR.u_project) ? poLineGR.u_project.getRefRecord() : '';
			
			if (prjGR){
				prjRef = prjGR.number;		
				
				var prjTypeValue = (prjGR.project_type || '').toLowerCase();
				var choiceGR = new GlideRecord('sys_choice'); //look up the X3 code for the project type.
				var qStr = 'element=project_type^inactive=false^name=pm_project^value=' + prjTypeValue; 
				choiceGR.addEncodedQuery(qStr);
				choiceGR.setLimit(1);
				choiceGR.query();
				prjType = (choiceGR.next()) ? choiceGR.getValue('u_correlation_id') || '' : '';			
				
				locRef = prjGR.location.u_number || '';
				mktSector = prjGR.location.u_market_sector.u_x3_code || '';
				acc = (prjTypeValue.includes('cabling')) ? '700100' : '116000'; //Value depends on project type (Cabling or Non-Cabling).
			}
			
			var LCRow = 'LC,' + ref + ',' + acc + dimCodes + prjRef + ','
			+ prjType + ',' + locRef + ',' + prjMan + ',' + costType + ',' + mktSector + '|';
			
			wFile += LCRow;
		}

		return wFile;
	},
	
	getCostType: function(costType){
		//Look up X3 Code against the department table. If not found, find in model category hash table:
		var x3Code = '';
		var deptGR = new GlideRecord('cmn_department');
		deptGR.addQuery('name', costType);
		deptGR.setLimit(1);
		deptGR.query();
		if (deptGR.next())
			x3Code = deptGR.getValue('u_x3_code') || "XXXX";
		
		else{			
			var catMap = { //ServiceNow Model Category v X3 CST DIM Code:
				"Fixings": "FFE",
				"Circuit": "CIR",
				"Circuit (install)": "CIRINSTALL",
				"SFP": "SFP",
				"Cabling": "CAB",
				"Cabinet": "CABINET",
				"Panel": "PANEL",
				"Patch lead": "PATCHLD",
				"TV": "TV",
				"Controller": "LAN",
				"Access Point": "AP",
				"Wireless": "WIR",
				"Power": "POW",
				"Switch": "SWI",
				"Firewall": "FIR",
				"Server": "SER",
				"Services": "SERVI",
				"Module": "MOD",
				"Router": "ROU",
				"Router (refurbished)": "RTREFURB",
				"Project Software/Licence": "PRJLIC",
				"Fan": "FAN",
				"Project Services": "PRJSERV",
				"Telephone": "TELEPHONE",
				"Switch (refurbished)": "SWIRF",
				"Licence": "LIC",
				"Work Order": "WORK"
			};
			
			//costType might be a list of categories. We want to use the first one that's found in the map. OR 'XXXX' if none are found.
			var costTypeArr = costType.split(',');
			for (var i = 0, length = costTypeArr.length; i < length; i++){
				x3Code = catMap[costTypeArr[i]] || '';
				if (x3Code)
					break;
			}						
		}
		
		return x3Code || 'XXXX';
	},	
	
	
	createProduct: function(modelGR){ //Create New Product (Model ID) in X3.
		try {
			var wFile = this.populateProductWFile(modelGR);
			var s = new sn_ws.SOAPMessageV2('SAGE X3 - Purchase Orders', 'Create Product');
			s.setStringParameterNoEscape('wFile', wFile);
			var response = s.execute();
			var responseBody = response.getBody(); 
			var status = response.getStatusCode();
gs.info('JW_X3 Product Response:\n' + responseBody);			
			//ERROR HANDLING:	 
			if (status != 200){
				var theMessage = 'Non 200 Response- X3: Create Model ID: ' + modelGR.getDisplayValue(); 
				var x3Message = 'X3 Message: ' + gs.getXMLText(responseBody, "//message"); 
				theMessage += '<BR>' + x3Message;
				gs.info(theMessage);
				gs.eventQueue('sagex3.api.issue', modelGR, theMessage, "");
				modelGR.u_x3_fail = true;
				modelGR.autoSysFields(false);
				modelGR.setWorkflow(false);
				modelGR.update();
				return;
			}

			//NB: The X3 API returns 200, even in cases where the call has 'failed' in the business sense. And, it even returns status == 1 (success) when there has been an error creating the record. So we have to check if the 'Message' element contains 'ERROR'.
			var msg = gs.getXMLText(responseBody, "//message") || '';
			if (msg.includes('ERROR')){
				var theMessage = 'X3 Response - ERROR: Create Model ID: ' + modelGR.getDisplayValue();
				theMessage += '<BR>' + 'X3 Message: ' + msg;
				gs.info(theMessage);
				gs.eventQueue('sagex3.api.issue', modelGR, theMessage, ""); 
				modelGR.u_x3_fail = true;	
			}
			else{
				modelGR.u_x3_fail = false;				
			}
			
			modelGR.autoSysFields(false);
			modelGR.setWorkflow(false);
			modelGR.update();	 
		}

		catch(ex) { 
			var message = ex.message;
			var theMessage = 'Error in X3: Create Model ID: ' + message;
			gs.info(theMessage);
			gs.eventQueue('sagex3.api.issue', modelGR, theMessage, ""); 
		}		
	},
	
	populateProductWFile: function(modelGR){ //For new Product (Model).
		var wFile = ''; //Data to send.
		//This matches the SPEC of the ITM import template in X3.
		var modelCats = (modelGR.getValue('cmdb_model_category') || '').split(',');
		var modelCat = '';
		
		//modelCats may contain more than 1 model category. Use the first in the list that has an X3 code.
		for (var i = 0, length = modelCats.length; i < length; i++){
			var catGR = new GlideRecord('cmdb_model_category');
			catGR.get(modelCats[i]);
			modelCat = catGR.u_x3_code || '';
			if (modelCat)
				break;
		}
		
		var productID = modelGR.u_x3_code || '';
		
		var modelDescription = modelGR.getValue('short_description') || modelGR.getValue('description') ||  '';
		modelDescription = modelDescription.split(',').join('.'); //Replace commas with full stops.
		var desc1 = modelDescription.slice(0,30);
		var desc2 = '', desc3 = '';
		if (modelDescription.length > 30)
			desc2 = modelDescription.slice(30,60);
		if (modelDescription.length > 60)
			desc3 = modelDescription.slice(60,90);
		
		wFile = 'I,' + modelCat + ',' + productID + ',' + desc1 + ',' + desc2 + ',' + desc3 + ',UN,,0,UN,1,UN,1,,0,,0,STD,NOR,,,0,0,,,,|';
		return wFile;
	}
};