var agg = new GlideAggregate('sys_user');
agg.addAggregate('count(distinct','email');
agg.setGroup(false);
agg.query();
if (agg.next())
	gs.print(agg.getAggregate('count(distinct','email'));

