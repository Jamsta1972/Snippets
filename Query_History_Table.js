
/*
This is how to query the history table for instances of specific things happening.
This example looks at locations with status = IN DELIVERY,
and then finds where they had previously moved from LIVE to IN DELIVERY (which would probably have been in error).
Notice: You reference the sys_id of the parent record with 'set.id' in the encoded query string.
*/

var lcnGR = new GlideRecord('cmn_location');
lcnGR.addQuery('u_status', '10');
lcnGR.query();
var lcnList = [];
while(lcnGR.next()){
	lcnList.push(lcnGR.getUniqueValue());
}
gs.print(lcnList);
	
var histGR = new GlideRecord('sys_history_line');
var qStr = 'field=u_status^newSTARTSWITHIn Delivery^oldSTARTSWITHLive^set.idIN' + lcnList;
histGR.addEncodedQuery(qStr);
histGR.query();
gs.print('no of rows: ' + histGR.getRowCount());

while (histGR.next()){
	var lcnNameGR = new GlideRecord('cmn_location');
	lcnNameGR.get(histGR.set.id);
	gs.print(lcnNameGR.getDisplayValue());
}
