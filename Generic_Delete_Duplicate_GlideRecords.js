var table = 'u_opportunity'; //Replace with tablename.

var fieldsArray = ['u_podio_id']; //Replace with list of fields against which to check for dupes.

var grGR = new GlideRecord(table);
var qStr = 'sys_created_byLIKEPortal.Automation^ORDERBYDESCsys_created_on'; //and update this.

grGR.addEncodedQuery(qStr);

var grArray = [];

grGR.query();
while(grGR.next()){
	var str = '';
	fieldsArray.forEach(function(el){
		str += el + grGR.getValue(el);
	});
	
	if (grArray.indexOf(str) > -1){
		grGR.deleteRecord();
	}
	else{
		grArray.push(str);
	}
	
}