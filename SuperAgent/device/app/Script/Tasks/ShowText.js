var title;
var back;

function OnLoading() {
	title = Translate["#TextMes#"];
	back = Translate["#back#"];
}
function GetCurrentTask(){
	return GlobalWorkflow.GetCurrentTask();
}
