var impersonateUser = function(userId) {
  var impUser = new GlideImpersonate();
  impUser.impersonate(userId);
 }
var me = gs.getUserID();
impersonateUser('41ffde7adb0d53001b655a84dc9619d2'); //isg

//do stuff.

impersonateUser(me); //me

/* STUFF */

//Initial Receipt:
var tskGR = new GlideRecord('wm_task');
var tskNum = 'WOT0010224';
tskGR.get('number', tskNum);
tskGR.u_isg_reference = 'TEST10002';
tskGR.u_isg_response = '200\nTesting';
tskGR.work_notes = 'ISG Response Received';
tskGR.update();


//ISG update
var isgRef = "TEST10001";
var nt = "CallNum: " + isgRef
			+"\nCallSiteName: " + "CallSiteName"
			+"\nCallProblem: " + "CallProblem"
			+"\nCallStatus: " + "CallStatus"
			+"\nCallInDate: " + "CallInDate2"
			+"\nCallAreaCode: " + "CallAreaCode"
			+"\nCallTCode: " + "CallTCode"
			+"\nFsrStartDate: " + "FsrStartDate"
			+"\nFsrCompleteDate: " + "FsrCompleteDate"
			+"\nFsrSolution: " + "FsrSolution"
			+"\nFsrSymptomCode: " + "FsrSymptomCode";
			
var tskGR = new GlideRecord('wm_task');
tskGR.get('u_isg_reference', isgRef);
tskGR.work_notes = nt;
tskGR.update();
			
//ISG ETA:
var isgRef = "TEST10001";
var nt = "CallNum: " + isgRef
			+"\nCallSiteName: " + "CallSiteName"
			+"\nCallProblem: " + "CallProblem"
			+"\nCallStatus: " + "CallStatus"
			+"\nCallInDate: " + "CallInDate2"
			+"\nCallAreaCode: " + "CallAreaCode"
			+"\nCallTCode: " + "CallTCode"
			+"\nFsrStartDate: " + "FsrStartDate"
			+"\nFsrCompleteDate: " + "FsrCompleteDate"
			+"\nFsrSolution: " + "FsrSolution"
			+"\nFsrSymptomCode: ETA";
			
var tskGR = new GlideRecord('wm_task');
tskGR.get('u_isg_reference', isgRef);
tskGR.work_notes = nt;
tskGR.update();

//ISG Closure:
var isgRef = "TEST10001";
var nt = "CallNum: " + isgRef
			+"\nCallSiteName: " + "CallSiteName"
			+"\nCallProblem: " + "CallProblem"
			+"\nCallStatus: COMP"
			+"\nCallInDate: " + "CallInDate2"
			+"\nCallAreaCode: " + "CallAreaCode"
			+"\nCallTCode: " + "CallTCode"
			+"\nFsrStartDate: " + "FsrStartDate"
			+"\nFsrCompleteDate: " + "FsrCompleteDate"
			+"\nFsrSolution: " + "FsrSolution"
			+"\nFsrSymptomCode: FsrSymptomCode";
			
var tskGR = new GlideRecord('wm_task');
tskGR.get('u_isg_reference', isgRef);
tskGR.work_notes = nt;
tskGR.update();
