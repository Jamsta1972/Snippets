var r = new GlideRecord('resource_plan');
r.get('number', 'RPLN0005564');
r.state = '3';
r.setWorkflow(false);
r.update();