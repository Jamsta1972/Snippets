var rGR = new GlideAggregate('u_opportunity');
rGR.addAggregate('COUNT', 'u_podio_id');
rGR.addHaving('COUNT', 'u_podio_id', '>', '1');
rGR.query();

var arDupes = [];
while (rGR.next()) { 
  arDupes.push(rGR.getValue('u_podio_id'));    
}

gs.info('Dupes: ' + arDupes);