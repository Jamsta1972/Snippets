var userGR = new GlideRecord('sys_user');
userGR.addEncodedQuery('sys_created_byLIKEportal^user_nameISEMPTY');
userGR.query();
while (userGR.next()){	
	userGR.user_name = userGR.getValue('email') || gs.generateGUID();
	userGR.setWorkflow(false);
	userGR.update();
}