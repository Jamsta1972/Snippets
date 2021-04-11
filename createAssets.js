var assetList = [
	{quantity: 307, model: '4a992dbcdb7244946affee71ca961928', location: '34e6c38bdb3b88946affee71ca9619ca'},
	{quantity: 261, model: '3b99e9fcdb7244946affee71ca9619fe', location: '30e6c38bdb3b88946affee71ca9619cf'},
	{quantity: 15, model: '3869a138db7244946affee71ca96193a', location: '34e6c38bdb3b88946affee71ca9619ca'},
	{quantity: 14, model: '16a5a1441b31a4903329a86fe54bcbde', location: '34e6c38bdb3b88946affee71ca9619ca'},
	{quantity: 141, model: '039965fcdb7244946affee71ca9619c4', location: 'b8e6c38bdb3b88946affee71ca9619cc'},
	{quantity: 196, model: '8b99a5fcdb7244946affee71ca9619ec', location: '30e6c38bdb3b88946affee71ca9619cf'},
	{quantity: 50, model: '8e992dbcdb7244946affee71ca9619e1', location: 'b8e6c38bdb3b88946affee71ca9619cc'},
	{quantity: 18, model: 'c0a9adfcdb7244946affee71ca9619a6', location: 'b8e6c38bdb3b88946affee71ca9619cc'},
	{quantity: 43, model: '9f9929fcdb7244946affee71ca961908', location: '34e6c38bdb3b88946affee71ca9619ca'},
	{quantity: 7, model: '4799a5fcdb7244946affee71ca96197d', location: 'b0e6c38bdb3b88946affee71ca9619c3'},
	{quantity: 1, model: 'c2996dbcdb7244946affee71ca96199b', location: '34e6c38bdb3b88946affee71ca9619ca'},
	{quantity: 38, model: 'fe9925fcdb7244946affee71ca961944', location: '30e6c38bdb3b88946affee71ca9619cf'},
	{quantity: 18, model: 'a79969fcdb7244946affee71ca961994', location: '34e6c38bdb3b88946affee71ca9619ca'},
];


assetList.forEach(function(asset){
	
	for (var i = 0; i < asset.quantity ; i++){

		var hwGR = new GlideRecord('alm_hardware');
		hwGR.newRecord();
		hwGR.model = asset.model;
		hwGR.model_category = '6ed2f8d8dbeac8d06affee71ca9619f2'; //Patch Lead.
		hwGR.quantity = 1;
		hwGR.install_status = 6; //In Stock
		hwGR.substatus = 'available';
		hwGR.stockroom = 'a52ac7cfdb3b88946affee71ca961980'; //Kenn Central Stockroom.
		hwGR.location = asset.location;
		hwGR.insert();

	}

});
