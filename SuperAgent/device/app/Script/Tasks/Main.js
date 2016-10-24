var DateAddTru;

function OnLoading(){
	if ($.workflow.name=='Visit') {
		DateAddTru = GlobalWorkflow.GetDateAdd();
	}
	else {
		DateAddTru = false;
	}
}
function OnLoad(){
	if ($.workflow.curentStep == "Total_Tasks")
		$.btnForward.Text = "";
}

function GetOutlet(){
	return GlobalWorkflow.GetOutlet();
}

function HasMenu(){
	return $.workflow.name == "Main" ? true : false;
}

function GetExecutedTasks() {
	var query = new Query;

	var outlet = "";

	if ($.workflow.name == "Visit"){
		query.AddParameter("outlet", GlobalWorkflow.GetOutlet());
		outlet = " AND DT.Outlet=@outlet ";
	}

	query.Text = "SELECT O.Description AS Outlet, DT.Id, DT.TextTask, DT.EndPlanDate, DT.ExecutionDate " +
		" FROM Document_Task DT " +
		" JOIN Catalog_Outlet O ON DT.Outlet=O.Id " +
		" WHERE DT.Status=1 " +
		" AND DATE(ExecutionDate)=DATE('now', 'localtime') " + outlet +
		" ORDER BY DT.ExecutionDate desc, O.Description";

	return query.Execute();
}

function CompleteTheTask(task){
	var taskObj = task.GetObject();
	taskObj.Status = true;
	taskObj.ExecutionDate = DateTime.Now;
	taskObj.FactExecutor = $.common.UserRef;
	taskObj.Result = $.result.Text;
	taskObj.Save();
	DoRefresh();
}
function RetrieveTask(task){
	var taskObj = task.GetObject();
	taskObj.Status = false;
	taskObj.ExecutionDate = null;
	taskObj.FactExecutor = DB.EmptyRef("Catalog_User");
	taskObj.Result = $.result.Text;
	taskObj.Save();
	DoRefresh();
}
function GetNotExecutedTasks() {
	var q = new Query;

	var outlet = "";

	if ($.workflow.name == "Visit"){
		q.AddParameter("outlet", GlobalWorkflow.GetOutlet());
		outlet = " AND DT.Outlet=@outlet ";
	}

if ($.workflow.name == "Visit") {
	var dateAddNumber = GlobalWorkflow.GetDateAddNumber();
	q.Text = "SELECT O.Description AS Outlet, DT.Id, DT.TextTask " +
		" , CASE WHEN DT.EndPlanDate='0001-01-01 00:00:00' OR DT.StartPlanDate IS NULL THEN 2 ELSE 1 END AS DateOrder " +
		" , CASE WHEN DT.EndPlanDate='0001-01-01 00:00:00' OR DT.EndPlanDate IS NULL THEN @notLimited ELSE DT.EndPlanDate END AS EndPlanDate " +
		" FROM Document_Task DT " +
		" JOIN Catalog_Outlet O ON DT.Outlet=O.Id " +
		" WHERE DT.Status=0 " +
		" AND (DT.StartPlanDate<=@dayPlanVis OR DT.StartPlanDate IS NULL) " + outlet +
		" ORDER BY DateOrder, DT.EndPlanDate, O.Description";
		q.AddParameter("dayPlanVis", DateTime.Now.Date.AddDays(dateAddNumber));
		//Dialog.Message(DateTime.Now.Date.AddDays(dateAddNumber));
}else {
q.Text = "SELECT O.Description AS Outlet, DT.Id, DT.TextTask " +
	" , CASE WHEN DT.EndPlanDate='0001-01-01 00:00:00' OR DT.StartPlanDate IS NULL THEN 2 ELSE 1 END AS DateOrder " +
	" , CASE WHEN DT.EndPlanDate='0001-01-01 00:00:00' OR DT.EndPlanDate IS NULL THEN @notLimited ELSE DT.EndPlanDate END AS EndPlanDate " +
	" FROM Document_Task DT " +
	" JOIN Catalog_Outlet O ON DT.Outlet=O.Id " +
	" WHERE DT.Status=0 " +
	" AND (DATE(DT.StartPlanDate)<=DATE('now', 'localtime') OR DT.StartPlanDate IS NULL) " + outlet +
	" ORDER BY DateOrder, DT.EndPlanDate, O.Description";

}
		q.AddParameter("notLimited", Translate["#notLimited#"]);

	return q.Execute();
}

function FormatDate(datetime) {
	if (datetime == null || datetime == Translate["#notLimited#"])
		return datetime;
	else
		return Translate["#untill#"] + " " + Format("{0:d}", Date(datetime).Date);
}

function AddGlobalAndAction(paramValue){
	GlobalWorkflow.SetCurrentTask(paramValue);
	Workflow.Action('Select', []);
}

function BackAction(){
	if ($.workflow.curentStep == "Visit_Tasks")
		DoBackTo("Outlet");
	else if ($.workflow.curentStep == "Total_Tasks")
		DoBackTo("Total");
	else
		DoBack();

}//DoBackTo(Outlet)
