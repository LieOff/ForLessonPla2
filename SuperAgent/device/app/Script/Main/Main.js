
var summaryScreenIndex = 1;
var leadScreenIndex = 0;
var entered = false;
var sendingRequest;

function OnLoad() {
	var existorno = new Query("Select type From sqlite_master where name = 'UT_answerQuest' And type = 'table'");
	var exorno = existorno.ExecuteCount();
	if (exorno > 0) {
		var checkansquest = new Query("Select id From UT_answerQuest");
		var counnurows = checkansquest.ExecuteCount();
		if (counnurows>0) {
			if (Variables.Exists("planVisit")){
				Variables.Remove("planVisit");
				Workflow.Action("Visits",[]);
			}
				var planVisitquery = new Query("Select refPlan From UT_answerQuest");
				var planVisit = planVisitquery.ExecuteScalar();
				var outletquery = new Query("Select outlet From UT_answerQuest");
				var outlet = outletquery.ExecuteScalar();
				$.AddGlobal("planVisit", planVisit);
				GlobalWorkflow.SetOutlet(outlet);
				Workflow.Action("ShowUncomlitedVisit",[]);
		}
	}
	sendingRequest = false;
	$.swipe_vl.Index = GetFirstScreenIndex();
}

function GetUnscheduledVisits() {
	return Indicators.GetUnscheduledVisits();
}

function GetEncashmentSumm() {
	return Indicators.GetEncashmentSumm();
}

function GetReceivablesSumm() {
	return Indicators.GetReceivablesSumm();
}

function GetTotal(){
	var s = Indicators.GetUnscheduledVisits() + Indicators.GetCommitedScheduledVisits();
	return s + "";
}

function GetVisitsLeft(){
	var c = GetPlannedVisits() - Indicators.GetCommitedScheduledVisits();
	return c + "";
}

function Register() {
	if (!sendingRequest) {
		if (IsFilledCorrectly()) {
			$.btnRegister.CssClass = "register_button_blocked";
			$.btnRegister.Text = Translate["#sending#"];
			$.btnEnterUnregistered.CssClass = "enter_button_blocked";
			$.FullName.CssClass = "edittext_blocked";
			$.Phone.CssClass = "edittext_blocked";
			$.btnRegister.Refresh();
			$.FullName.Enabled = false;
			$.Phone.Enabled = false;
			sendingRequest = true;

			SendContactsRequest(true, RegisterCallback);
		} else {
			Dialog.Message(Translate["#leadFillDataPlease#"]);
		}
	}
}

function EnterUnregistered() {
	if (!sendingRequest) {
		SendContactsRequest(false);
		GoToSummary();
		entered = true;
	}
}

function IsFilledCorrectly() {
	var IsNameFilled = $.FullName.Text != "" && $.FullName.Text != null;
	var IsPhoneFilled = $.Phone.Text != "" && $.Phone.Text != null;
	return IsNameFilled && IsPhoneFilled;
}

function GoToSummary() {
	$.swipe_vl.Index = summaryScreenIndex;
}

function GetFirstScreenIndex() {
	return (IsDemoUser() && !GetContactsSentFlag() && !entered ? leadScreenIndex : summaryScreenIndex);
}

function IsDemoUser() {
	var userRef = $.common.UserRef;
	var username = userRef.UserName;
	var password = userRef.Password;
	return username == 'demo' && password == 'demo';
}

function SetContactsSentFlag() {
	var q = new Query("CREATE TABLE IF NOT EXISTS USR_ContactsSent  (" +
	"ID INT PRIMARY KEY NOT NULL)");
	q.Execute();
}

function GetContactsSentFlag() {
	var q = new Query("SELECT name FROM sqlite_master " +
	  "WHERE type='table' AND name='USR_ContactsSent'");
	var ContactsSent = q.ExecuteCount() == 1;
	return ContactsSent;
}

function SendContactsRequest(registered, callback) {
	var headers = [];
	headers.push(["registered", registered]);
	headers.push(["regdate", DateTime.Now]);
	headers.push(["name", $.FullName.Text]);
	headers.push(["phone", $.Phone.Text]);
	headers.push(["os", $.common.OS]);
	SendRequest("http://demo.superagent.ru", "/demo/hs/DemoAccess", "demoaccess", "password", "00:00:10", headers, callback);
}

function SendRequest(host, address, username, password, timeout, headers, callback) {
	headers = (headers == undefined ? [] : headers);
	callback = (callback == undefined ? Dummy : callback);

	var request = Web.Request();
	request.Host = host;
	request.UserName = username;
	request.Password = password;
	request.Timeout = timeout;

	for (var i = 0; i < headers.length; i++) {
		request.AddHeader(headers[i][0], headers[i][1]);
	}

	request.Post(address, "", callback);
}

function RegisterSuccess() {
	SetContactsSentFlag();
	GoToSummary();
	Dialog.Message(Translate["#leadThanks#"]);
}

function SendMail() {
	Email.Create(Translate["#leadMail#"], "", "");
}

function Call() {
	Phone.Call(Translate["#leadPhone#"]);
}

function RegisterCallback(state, args) {
	if (args.Success) {
		RegisterSuccess();
	} else {
		Dialog.Message(Translate["#leadFail#"]);
	}
	$.btnRegister.CssClass = "register_button";
	$.btnRegister.Text = Translate["#register#"];
	$.btnEnterUnregistered.CssClass = "enter_button";
	$.FullName.CssClass = "lead_field";
	$.Phone.CssClass = "lead_field";
	$.FullName.Enabled = true;
	$.Phone.Enabled = true;
	$.btnRegister.Refresh();
	sendingRequest = false;
}

function crutch(sender) {
	// if (sender.Id == "FullName") {
	// 	if (Right(sender.Text, 1) == "\n") {
	// 		$.FullName.Text = StrReplace($.FullName.Text, "\n", "");
	// 	}
	// } else if (sender.Id == "Phone") {
	// 	if (Right(sender.Text, 1) == "\n") {
	// 		$.Phone.Text = StrReplace($.Phone.Text, "\n", "");
	// 	}
	// }
	if (Right(sender.Text, 1) == "\n") {
		sender.Text = StrReplace(sender.Text, "\n", "");
		if (sender.Id == "FullName") {
			$.Phone.SetFocus();
		} else if (sender.Id == "Phone") {
			sender.Enabled = false;
			$.Phone.Refresh();
			sender.Enabled = true;
		}
	}
}

function Dummy() {

}
