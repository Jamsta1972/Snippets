
var oppGR = new GlideRecord('u_opportunity');
oppGR.get('number', 'OPP0002564');
var str = '\\\\cc-fp-02\\files\\company resources\\ServiceNow Locations\\LOC00003250-499\\LOC00003342\\Opportunities\\OPP0002564';
oppGR.setValue('u_copy_path',str);
oppGR.setWorkflow(false);
gs.print(oppGR.number);
//oppGR.update();


/////

var prjGR = new GlideRecord('pm_project');
prjGR.get('number', 'PRJ0013370');
var prjF = '\\\\cc-fp-02\\files\\company resources\\ServiceNow Locations\\LOC00003250-499\\LOC00003342\\Projects\\PRJ0013370';
var oppF = '\\\\cc-fp-02\\files\\company resources\\ServiceNow Locations\\LOC00003250-499\\LOC00003342\\Opportunities\\OPP0002564';

prjGR.setValue('u_copy_path', prjF);
prjGR.setValue('u_opportunity_folder', oppF);
prjGR.setWorkflow(false);
prjGR.update();

