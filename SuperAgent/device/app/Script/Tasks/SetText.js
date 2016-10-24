var task;

function GetTask(){
	task = GlobalWorkflow.GetCurrentTask();
	return task;
}
function SaveText(){
	taskObj = task.GetObject();
	taskObj.TextTask = $.TextForGoalContains.Text;
	taskObj.Save();
}
function DoBackCheckAndSave(){
	if ($.TextForGoalContains.Text.length >250) {
		Dialog.Message(Translate["#TooMoreLetter#"]);
	}else {
		SaveText();
		DoBack();
	}
}
