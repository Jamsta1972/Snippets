/*
Ref STRY0013257. Spurious entries in the activities, where the value has not changed and the old value shows as null.
Find all entries on sys_audit for pm_project table where the old value is null, but this is NOT the initial entry for this field.
Then delete them.
*/

var auditGR = new GlideRecord('sys_audit');
var qStr =  "tablename=pm_project^oldvalue=null^ORnewvalue=null"
	+ "^sys_created_onONThis year@javascript:gs.beginningOfThisYear()@javascript:gs.endOfThisYear()";

auditGR.addEncodedQuery(qStr);
auditGR.orderBy('documentkey');
auditGR.orderBy('fieldname');
auditGR.orderByDesc('sys_created_on');
auditGR.query();
gs.info('JW_auditGRrows: ' + auditGR.getRowCount());
var spuriousList = []; //List of sys_audit entries for deletion.

while (auditGR.next()){		
	var spuriousObj = {
		sys_id: auditGR.getUniqueValue(),
		created: auditGR.getValue('sys_created_on'),
		docKey: auditGR.getValue('documentkey'),
		fld: auditGR.getValue('fieldname'),
		oldvalue: auditGR.getValue('oldvalue'),
		newvalue: auditGR.getValue('newvalue')
	};
    
	spuriousList.push(spuriousObj);
}

gs.info('JW_JSON 1:\n' + JSON.stringify(spuriousList));

//Filter out entries where the oldvalue is null, if the newvalue of the previous was also null.
spuriousList = spuriousList.filter(function(thisObj, ind){
	if (ind < spuriousList.length - 1){
		var prevObj = spuriousList[ind + 1];
		var samePrjAndFld = (thisObj.docKey == prevObj.docKey && thisObj.fld == prevObj.fld);
		var nullToNull = (thisObj.oldvalue == 'null' && prevObj.newvalue == 'null');
		return !(samePrjAndFld && nullToNull);
	}
});
gs.info('JW_JSON 2:\n' + JSON.stringify(spuriousList));
//Filter out entries where the oldvalue is not null.
spuriousList = spuriousList.filter(function(thisObj){
	return thisObj.oldvalue == 'null';
});
gs.info('JW_JSON 3:\n' + JSON.stringify(spuriousList));
//Filter out entries where the next is for a different prj or fld (as this will be the entry from when the record was created)
spuriousList = spuriousList.filter(function(thisObj, ind){
	if (ind < spuriousList.length - 1){
		var prevObj = spuriousList[ind + 1];
		return (thisObj.docKey == prevObj.docKey && thisObj.fld == prevObj.fld);
	}
});

gs.info('JW_JSON 4:\n' + JSON.stringify(spuriousList));


//Create a list of sys_ids of sys_audit records to delete:
var auditDeleteList = spuriousList.map(function(spuriousObj){
	return spuriousObj.sys_id;
});

//Delete them:
var auditGR = new GlideRecord('sys_audit');
auditGR.addQuery('sys_id', 'IN', auditDeleteList);
auditGR.query();
//auditGR.deleteMultiple();
