var regularAnswers;
var parentId;
var parentGUID;
var obligateredLeft;
var regular_answ;
var regular_total;
var single_answ;
var single_total;
var scrollIndex;
var setScroll;
var curr_sku;
var skuValueGl;
var questionValueGl;
var forwardAllowed;
var parents;
var buferansw;
var relouded;
var answerinsku;
var totalanswerinsku;
var idPar;
var idChail;
var scrollIndex1;
var inref;
var TempControl;
var skuRezTemp;
var kolDoch;
//
//-------------------------------Header handlers-------------------------
//

function OnLoading(){
	obligateredLeft = '0';
	parents = [];
	SetIndicators();
	SetListType();
	if (String.IsNullOrEmpty(setScroll))
		setScroll = true;
	if ($.param2==true) //works only in case of Forward from Filters
		ClearIndex();
	forwardAllowed = true;

}

function OnLoad() {
	relouded = true;
	if (setScroll)
		SetScrollIndex();
	AssignSubmitScope();
}

function SetListType(){
	if (regularAnswers==null)
	{
		if (parseInt(regular_total) == parseInt(0))
			regularAnswers = false;
		else
			regularAnswers = true;
	}
}

function ChangeListAndRefresh(control, param) {
	regularAnswers	= ConvertToBoolean1(param);
	parentId = null;
	parentGUID = null;
	Workflow.Refresh([]);
}

function SetScrollIndex() {

	if (String.IsNullOrEmpty(scrollIndex)){
		$.grScrollView.Index = parseInt(4);
	}
	else{
		//if (inref) {
		//	var s1 = (parseInt(scrollIndex1) * parseInt(2)) + parseInt(6);
		//	$.grScrollView.Index = s1;
		//}
			var s = (parseInt(scrollIndex) * parseInt(2)) - 2;
			if (s<0) {
				s=0;
			}
			$.grScrollView.Index = s;
			//for(control in $.grScrollView.Controls){
      //  control.Visible = true;
			//	}
	}
	inref = false;
}

function CountResultAndForward() {

	parentId = null;

	var q = regular_total + single_total;
	$.workflow.Add("questions_qty_sku", q);

	var a = regular_answ + single_answ;
	$.workflow.Add("questions_answ_sku", a);
	if (obligateredLeft==0) {
		Workflow.Forward([]);
}
}

//
//--------------------------------Questions list handlers--------------------------
//

function HasQuestions(){
	if (regularAnswers && parseInt(regular_total)==parseInt(0))
		return false;
	if (!regularAnswers && parseInt(single_total)==parseInt(0))
		return false;
	return true;
}

function GetAnswerdAndTotal(){
	var q = new Query();
	q.Text="SELECT COUNT(DISTINCT S.Question) AS Total " +
			", COUNT(S.Answer) AS Answered " +
			"FROM USR_SKUQuestions S " +
			"WHERE S.SKU=@sku AND (S.ParentQuestion=@emptyRef" +
			" OR S.ParentQuestion IN (SELECT SS.Question" +
			" FROM USR_SKUQuestions SS WHERE SS.SKU=S.SKU AND (SS.Answer='Yes' OR SS.Answer='Да')))" +
			"GROUP BY S.SKU";
	q.AddParameter("sku",skuValueGl);
	q.AddParameter("emptyRef",DB.EmptyRef("Catalog_Question"));
	var rez = q.Execute();
	//Dialog.Message(rez);

	return rez;
}

function GetSKUsFromQuesionnaires(search) {

	var single = 1;
	if (regularAnswers)
		single = 0;

	// SetIndicators();

	//getting left obligated
	var q = new Query("SELECT DISTINCT S.Question, S.Description, S.SKU " +
			"FROM USR_SKUQuestions S " +
			"WHERE (RTRIM(Answer)='' OR S.Answer IS NULL) AND S.Obligatoriness=1 " +
			"AND (S.ParentQuestion=@emptyRef OR S.ParentQuestion IN (SELECT SS.Question FROM USR_SKUQuestions SS " +
				"WHERE SS.SKU=S.SKU AND (SS.Answer='Yes' OR SS.Answer='Да')))");
	q.AddParameter("emptyRef", DB.EmptyRef("Catalog_Question"));
	obligateredLeft = q.ExecuteCount().ToString();
	forwardAllowed = obligateredLeft == '0';

	//getting SKUs list
	var searchString = "";
	if (String.IsNullOrEmpty(search) == false) {
		search = StrReplace(search, "'", "''");
		searchString = " Contains(SKUDescription, '" + search + "') AND ";
	}

	var filterString = "";

	filterString += AddFilter(filterString, "group_filter", "OwnerGroup", " AND ");
	filterString += AddFilter(filterString, "brand_filter", "Brand", " AND ");

	var q = new Query();
	q.Text="SELECT S.SKU, S.SKUDescription " +
			", COUNT(DISTINCT S.Question) AS Total " +
			", COUNT(S.Answer) AS Answered " +
			", MAX(CAST (Obligatoriness AS INT)) AS Obligatoriness " +
			", (SELECT COUNT(DISTINCT U1.Question) FROM USR_SKUQuestions U1 " +
				" WHERE U1.Single=@single AND (Answer='' OR Answer IS NULL) " +
				" AND U1.SKU=S.SKU AND Obligatoriness = 1 " +
				" AND (ParentQuestion=@emptyRef OR ParentQuestion IN (SELECT Question FROM USR_SKUQuestions " +
				" WHERE SKU=S.SKU AND (Answer='Yes' OR Answer='Да')))) AS ObligateredLeft " +
			", (SELECT MAX(AMS.BaseUnitQty) FROM Catalog_AssortmentMatrix_SKUs AMS " +
				" JOIN Catalog_AssortmentMatrix_Outlets AMO ON AMS.Ref = AMO.Ref AND AMO.Outlet = @outlet " +
				" WHERE S.SKU=AMS.SKU) AS BaseUnitQty " +
			", CASE WHEN S.SKU=@currentSKU THEN 1 ELSE 0 END AS ShowChild " +

			"FROM USR_SKUQuestions S " +

			"WHERE S.Single=@single AND " + searchString + filterString +
			" (S.ParentQuestion=@emptyRef OR S.ParentQuestion IN (SELECT Question FROM USR_SKUQuestions SS " +
				"WHERE SS.SKU=S.SKU AND (SS.Answer='Yes' OR SS.Answer='Да')))" +
			"GROUP BY S.SKU, S.SKUDescription " +
			" ORDER BY BaseUnitQty DESC, S.SKUDescription ";
	q.AddParameter("emptyRef", DB.EmptyRef("Catalog_Question"));
	q.AddParameter("single", single);
	q.AddParameter("snapshot", DB.Current.Constant.DataType.Snapshot);
	q.AddParameter("attached", Translate["#snapshotAttached#"]);
	q.AddParameter("outlet", $.workflow.outlet);
	q.AddParameter("currentSKU", parentGUID);

	return q.Execute();
	//
}

function SetIndicators() {
	var q = new Query("SELECT " +
		"SUM(CASE WHEN Single = 0 THEN 1 ELSE 0 END) AS RegularTotal, " +
		"SUM(CASE WHEN Single = 1 THEN 1 ELSE 0 END) AS SingleTotal, " +
		"SUM(CASE WHEN Single = 0 AND TRIM(IFNULL(Answer, '')) != '' THEN 1 ELSE 0 END) AS RegularAnsw, " +
		"SUM(CASE WHEN Single = 1 AND TRIM(IFNULL(Answer, '')) != '' THEN 1 ELSE 0 END) AS SingleAnsw " +

		"FROM (SELECT DISTINCT Question, SKU, Single, Answer " +
			"FROM USR_SKUQuestions U1 " +
			"WHERE ParentQuestion=@emptyRef OR ParentQuestion IN " +
				"(SELECT Question FROM USR_SKUQuestions U2 WHERE (Answer='Yes' OR Answer='Да') AND U1.SKU=U2.SKU))");

	q.AddParameter("emptyRef", DB.EmptyRef("Catalog_Question"));
	var result = q.Execute();

	regular_total = result.RegularTotal;
	single_total = result.SingleTotal;
	regular_answ = result.RegularAnsw;
	single_answ = result.SingleAnsw;
}

function AddFilter(filterString, filterName, condition, connector) {

	var q = new Query("SELECT F.Id FROM USR_Filters F WHERE F.FilterType = @filterName");

	q.AddParameter("filterName", filterName);

	var res = q.ExecuteScalar();

	if (res!=null) {

		filterString += condition + " IN(SELECT F.Id FROM USR_Filters F WHERE F.FilterType = '" + filterName + "') " + connector;

	}

	return filterString;

}

function AddToParents(fieldName){
	parents.push(fieldName);
	return parents;
}

function ShowChilds(index) {
	var s = "p" + index;
	if (s == parentId)
		return true;
	else
		return false;
}

function GetChilds(sku) {

	var single = 1;
	if (regularAnswers)
		single = 0;

var q = new Query("SELECT DISTINCT S.Description, S.Obligatoriness, S.AnswerType, S.Question, S.Answer, S.IsInputField, S.KeyboardType,S.ParentQuestion, " +
			"CASE WHEN IsInputField='1' THEN Answer ELSE " +
				"CASE WHEN (RTRIM(Answer)!='' AND Answer IS NOT NULL) THEN CASE WHEN AnswerType=@snapshot THEN @attached ELSE Answer END ELSE '—' END END AS AnswerOutput, " +
				"CASE WHEN S.AnswerType=@snapshot THEN 1 END AS IsSnapshot, " +
			"CASE WHEN S.AnswerType=@snapshot THEN " +
				" CASE WHEN TRIM(IFNULL(VFILES.FullFileName, '')) != '' THEN LOWER(VFILES.FullFileName) ELSE " +
					" CASE WHEN TRIM(IFNULL(OFILES.FullFileName, '')) != '' THEN LOWER(OFILES.FullFileName) ELSE '/shared/result.jpg' END END ELSE NULL END AS FullFileName " +
			"FROM USR_SKUQuestions S " +
			"LEFT JOIN Document_Visit_Files VFILES ON VFILES.FileName = S.Answer AND VFILES.Ref = @visit " +
			"LEFT JOIN Catalog_Outlet_Files OFILES ON OFILES.FileName = S.Answer AND OFILES.Ref = @outlet " +
			"WHERE S.SKU=@sku AND S.Single=@single AND (S.ParentQuestion=@emptyRef OR S.ParentQuestion IN (SELECT Question FROM USR_SKUQuestions " +
			"WHERE SKU=S.SKU AND (Answer='Yes' OR Answer='Да'))) " +
			"ORDER BY S.DocDate, S.QuestionOrder ");
	q.AddParameter("sku", sku);
	q.AddParameter("emptyRef", DB.EmptyRef("Catalog_Question"));
	q.AddParameter("single", single);
	q.AddParameter("snapshot", DB.Current.Constant.DataType.Snapshot);
	q.AddParameter("attached", Translate["#snapshotAttached#"]);
	q.AddParameter("visit", $.workflow.visit);
	q.AddParameter("outlet", $.workflow.outlet);
	result = q.Execute();
	return result;
}

function GetImagePath(visitID, outletID, pictID, pictExt) {
	var pathFromVisit = Images.FindImage(visitID, pictID, pictExt, "Document_Visit_Files");
	var pathFromOutlet = Images.FindImage(outletID, pictID, pictExt, "Catalog_Outlet_Files");
	return (pathFromVisit == "/shared/result.jpg" ? pathFromOutlet : pathFromVisit);
}

function SnapshotExists(filename) {
	return FileSystem.Exists(filename);
}
// ------------------------SKU----------------------

function CreateItemAndShow(control, sku, index, showChild) {
//	if (parentId == ("p"+index)){
//		parentId = null;
//		scrollIndex = null;
//	}
//	else
//		parentId = "p" + index;

	if (showChild){
		parentGUID = null;
		scrollIndex = null;
	}
	else
		parentGUID = sku;

	scrollIndex = index;
	setScroll = true;

	Workflow.Refresh([$.search]);
}

function GoToQuestionAction(control, answerType, question, sku, editControl, currAnswer, title,indexparm,skurez) {
//	Dialog.Message("пар-"+editControl);
//	Dialog.Message("Чаил"+indexparm);

	idPar = editControl;
	idChail = indexparm;
	editControlName = "control"+editControl;
	editControl = Variables["control"+editControl];
	skuValueGl = sku;
	skuRezTemp = skurez;
	var SourceIdChailAndPar = GetAnswerdAndTotal();
	while (SourceIdChailAndPar.Next()) {
		answerinsku = SourceIdChailAndPar.Answered;
		totalanswerinsku = SourceIdChailAndPar.Total;
	}
	//Dialog.Message(totalanswerinsku);
	//Dialog.Message(answerinsku);
	editControl.Enabled = "True";
	var qForKol = new Query("Select Description From USR_SKUQuestions Where SKU=@sku And ParentQuestion==@quest");
	 qForKol.AddParameter("sku",sku);
	 qForKol.AddParameter("quest",question);
	 //qForKol.AddParameter("emptyPar",DB.EmptyRef("Catalog_Question"));
	 kolDoch = qForKol.ExecuteCount();

//	Dialog.Message(skuRezTemp);

	if (answerType == DB.Current.Constant.DataType.ValueList) {
		var q = new Query();
		q.Text = "SELECT Value, Value FROM Catalog_Question_ValueList WHERE Ref=@ref UNION SELECT '', '—' ORDER BY Value";
		q.AddParameter("ref", question);
		TempControl = editControl;
		if (String.IsNullOrEmpty(editControl.Text) || editControl.Text == "" || editControl.Text == "-" || editControl.Text == "—") {
					buferansw = true;
				 }
				 else {
					buferansw = false;
				 }

		Dialogs.DoChoose(q.Execute(), question, null, editControl, DialogCallBackBool, title);
	}

	if (answerType == DB.Current.Constant.DataType.Snapshot) {
		questionValueGl = question;
		var qForAns = new Query("Select Answer From USR_SKUQuestions Where SKU=@sku And Question=@quest");
		qForAns.AddParameter("sku",sku);
		qForAns.AddParameter("quest",question);
		currAnswer = qForAns.ExecuteScalar();
		if (String.IsNullOrEmpty(currAnswer)) {
					buferansw = true;
				 }
				 else {
					buferansw = false;
				 }

		var path = null;
		AddQuestionSnapshotSku("USR_SKUQuestions", question, sku, currAnswer, true, title, GalleryCallBack);
	}

	if (answerType == DB.Current.Constant.DataType.DateTime) {
		TempControl = editControl;
		if (String.IsNullOrEmpty(currAnswer)) {
					buferansw = true;
				 }
				 else {
					buferansw = false;
				 }

		Dialogs.ChooseDateTime(question, null, editControl, DialogCallBackBool, title);
	}

	if (answerType == DB.Current.Constant.DataType.Boolean) {
		TempControl = editControl;
		if (String.IsNullOrEmpty(editControl.Text) || editControl.Text == "" || editControl.Text == "-" || editControl.Text == "—" || editControl.Text == "Нет" || editControl.Text == "No") {
					buferansw = true;
				 }
				 else {
					buferansw = false;
				 }
		Dialogs.ChooseBool(question, null, editControl, DialogCallBackBool, title);
	}

	if ((answerType == DB.Current.Constant.DataType.String) ||
	   ((answerType).ToString() == (DB.Current.Constant.DataType.Integer).ToString()) ||
		 ((answerType).ToString() == (DB.Current.Constant.DataType.Decimal).ToString())) {
		FocusOnEditText(editControlName, '1');
	}

	setScroll = false;
}

function checkAndFormNextButton(obligateredLeft){
	if (obligateredLeft==0) {
			Variables["btn_forward"].CssClass = "btn_forward";
			Variables["btn_forward"].Refresh();
			for (control in $.btn_forward.Controls) {
				control.remove();
			}
			var toappend = "<c:TextView Id=\"btnForward\" Text=\"" + Translate["#forward#"]+"\" />";
			$.btn_forward.append(toappend);
			$.btn_forward.refresh();

		}else {
			Variables["btn_forward"].CssClass = "forward";
			Variables["btn_forward"].Refresh();

			for (control in $.btn_forward.Controls) {
				control.remove();
			}
		var toappend ="<c:VerticalLayout></c:VerticalLayout>" +
		"<c:TextView Id=\"obligateredButton\" Text=\""+obligateredLeft+")\" />" +
		"<c:Image Id=\"imagForw\"/>" +
		"<c:TextView Id=\"btnForward\" Text=\"" + Translate["#forward#"]+" (\" />" ;
		$.btn_forward.append(toappend);
		$.btn_forward.refresh();
	}
}

function RefreshScreen(control, search, sku, question, answerType, indexpar, answerednow,totalanswred,reqorno) {

	//var q2 = new Query("SELECT DISTINCT S.Description " +
	//"FROM USR_SKUQuestions S " +
	//"WHERE (RTRIM(Answer)='' OR S.Answer IS NULL) " +
	//"AND (S.ParentQuestion=@emptyRef OR S.ParentQuestion IN (SELECT SS.Question FROM USR_SKUQuestions SS " +
	//"WHERE SS.SKU=S.SKU AND (SS.Answer='Yes' OR SS.Answer='Да'))) AND S.SKU=@sku");
	//q2.AddParameter("emptyRef", DB.EmptyRef("Catalog_Question"));
	//q2.AddParameter("sku", sku);
	//var notanswer = q2.ExecuteCount();
	//Dialog.Message(notanswer);
	if (!relouded) {
		answerednow = answerinsku;
		totalanswred = totalanswerinsku;
		//Dialog.Message("WeNotReload");
	}
	//Dialog.Message(answerednow);
	//answerednow = parseInt(totalanswred) - parseInt(notanswer);
	var parentCount = Variables["CountOnPar"+indexpar];
	var answer = control.Text;
	if (TrimAll(answer)=="") {
		answer = "";
		control.Text = "";
	}

	//var SkuObj = sku.GetObject();

	if (!String.IsNullOrEmpty(answer) && answerType == DB.Current.Constant.DataType.Integer){

		control.Text = RoundToInt(answer);
		answer = control.Text;

		AssignAnswer(control, question, sku, answer, answerType);
	}
	//Dialog.Message(answerednow);
	if (answerType == DB.Current.Constant.DataType.Decimal) {
		var frstLetter = Left(answer,1);
		if (frstLetter == "," || frstLetter == ".") {
			answer = "0"+ answer;
			control.Text = answer;
		}
	}

	var havenewotv = String.IsNullOrEmpty(answer);
	if (!(havenewotv^buferansw)) {

	}
	if (buferansw && !havenewotv) {
		//Dialog.Message("add");
		if (regularAnswers) {
			regular_answ = parseInt(regular_answ) + 1;
		}else {
			single_answ = parseInt(single_answ) + 1;
		}
		answerednow = parseInt(answerednow) + 1;
	}
	if (!buferansw && havenewotv) {
		//Dialog.Message("minus");
		if (regularAnswers) {
			regular_answ = parseInt(regular_answ) - 1;
		}else {
			single_answ = parseInt(single_answ) - 1;
		}
		answerednow = parseInt(answerednow) - 1;
	}
	//Dialog.Message(answerednow);
//	var q1 = new Query()

	SetIndicators();
//		Dialog.Message(q2.ExecuteCount());

	parentCount.Text = answerednow + " " + Translate["#of#"] + " " + totalanswred;
//	if (regularAnswers) {
		$.CountRegAnswer.Text = Translate["#regular#"] + " (" +regular_answ + " " + Translate["#of#"] + " " + regular_total + ")";
//	}else {

		$.CountNoNRegAnswer.Text = Translate["#nonregular#"] + " (" +single_answ + " " + Translate["#of#"] + " " + single_total + ")";
//	}
	answerinsku = answerednow;
	//Dialog.Message(answerinsku);
	totalanswerinsku = totalanswred;
	relouded = false;
	if (reqorno == 1) {
		var obl =new Query("SELECT Question FROM USR_SKUQuestions WHERE Obligatoriness = @obl And SKU = @sku And Answer IS NULL");
		obl.AddParameter("obl",1);
		obl.AddParameter("sku",sku);
		var rez = obl.ExecuteCount();
		if (rez > 0) {
			//Dialog.Message("ParentReq"+idChail);
			//Variables["ParentReq"+idChail].Refresh();
			if (Variables.Exists("ParentReq"+idChail)) {
				Variables["ParentReq"+idChail].CssClass = "required_side_wh";
				Variables["ParentReq"+idChail].Refresh();
			}
		}
		if (rez == 0) {
			if (Variables.Exists("ParentReq"+idChail)) {
			Variables["ParentReq"+idChail].CssClass = "answered_side_wh";
			Variables["ParentReq"+idChail].Refresh();
		}
		}
	}
	//obligateredLeft = obligateredLeft - 1;
	if (reqorno==1 && (buferansw && !havenewotv)) {
		obligateredLeft = parseInt(obligateredLeft) - 1;
		checkAndFormNextButton(obligateredLeft);

		if (Variables.Exists("Req"+idPar)) {
			Variables["Req"+idPar].CssClass = "answered_side_gr";
			Variables["Req"+idPar].Refresh();
		}
		//Dialog.Message("ParentReq"+idChail);

		//setScroll = true;
		//scrollIndex = parseInt(idPar)+parseInt(idChail);
		//Workflow.Refresh([search]);
	}
	if (reqorno==1 && (!buferansw && havenewotv)) {
		obligateredLeft = parseInt(obligateredLeft) + 1;
		checkAndFormNextButton(obligateredLeft);
		//if (Variables.Exists("obligateredInfo")) {
		//	Variables["obligateredButton"].Text = obligateredLeft+")";
		//	Variables["obligateredInfo"].Text = obligateredLeft;
		//}
		if (Variables.Exists("Req"+idPar)) {
			Variables["Req"+idPar].CssClass = "required_side_gr";
			Variables["Req"+idPar].Refresh();
		}

	}
	//Workflow.Refresh([search]);
}

function BuferAns(control){
	if (String.IsNullOrEmpty(control.Text)) {
			 	buferansw = true;
			 }
			 else {
			 	buferansw = false;
			 }
}
function AssignAnswer(control, question, sku, answer, answerType) {

	if (control != null) {
		answer = control.Text;
	} else{
		if (answer!=null)
			answer = answer.ToString();
	}
	if (answer == "—" || answer == "" || answer=="-")
		answer = null;

	var answerString;
	if (String.IsNullOrEmpty(answer))
		answerString = "HistoryAnswer ";
	else
		answerString = "@answer ";

	var q =	new Query("UPDATE USR_SKUQuestions SET Answer=" + answerString + ", AnswerDate=DATETIME('now', 'localtime') WHERE Question=@question AND SKU=@sku");
	q.AddParameter("answer", (question.AnswerType == DB.Current.Constant.DataType.DateTime ? Format("{0:dd.MM.yyyy HH:mm}", Date(answer)) : answer));
	q.AddParameter("sku", sku);
	q.AddParameter("question", question);
	q.Execute();
}

function GetActionAndBack() {
	var q = new Query("SELECT NextStep " +
		" FROM USR_WorkflowSteps" +
		" WHERE Value=0 AND StepOrder<'3' ORDER BY StepOrder DESC");
	var step = q.ExecuteScalar();
	if (step==null)
		Workflow.BackTo("Outlet");
	else
		Workflow.BackTo(step);
}

function DoSearch(searcText) {
	ClearIndex();
	Workflow.Refresh([searcText]);
}

function ClearIndex() {
	parentId =null;
	scrollIndex = null;
	setScroll = null;
}

function AddToSubmitCollection(submitCollectionString, fieldName){
	submitCollectionString = String.IsNullOrEmpty(submitCollectionString) ? fieldName : (submitCollectionString + ";" + fieldName);

	return submitCollectionString;
}

function AssignSubmitScope(){
	$.btn_forward.SubmitScope = $.submitCollectionString; //all the magic is in this strings
	$.regular.SubmitScope = $.submitCollectionString;
	$.nonregular.SubmitScope = $.submitCollectionString;
	$.btnSearch.SubmitScope = $.submitCollectionString;
	$.btn_filters.SubmitScope = $.submitCollectionString;

	for (control in $.grScrollView.Controls){
		control.SubmitScope = $.submitCollectionString;
	}
}
//------------------------------internal-----------------------------------

function DialogCallBackBool(state, args){
	var entity = state[0];
	AssignAnswer(null, entity, skuValueGl, args.Result);
	//var controlField = idBool;
	TempControl.Text = args.Result;
	var ShowDoch = false;
	//Dialog.Message(kolDoch);
	//Dialog.Message(args.Result);
	if (kolDoch>0) {
		ShowDoch = true;
	}
if (ShowDoch) {
	setScroll = true;
	scrollIndex = parseInt(idPar)+parseInt(idChail)+1;
	scrollIndex1= parseInt(idPar);
	if (args.Result == "Нет" || args.Result == "No" || args.Result =="-" || args.Result =="—") {
		var qForChl = new Query("UPDATE USR_Questions SET Answer='' Where ParentQuestion=@Parent");
		qForChl.AddParameter("Parent",entity);
		qForChl.Execute();
	}
	//Dialog.Message(scrollIndex);
	inref = true;
	Workflow.Refresh([$.search]);

}else {
	var answerednow = answerinsku;
	var totalanswred = totalanswerinsku;
//	 answerednow = answerinsku;
//	 totalanswred = totalanswerinsku;
	var parentCount = Variables["CountOnPar"+idChail];
	var weHaveObl = false;
	for(control in Variables["DockLa"+idPar].Controls){
//		Dialog.Message(control.Id);
		if (control.Id == "Req"+idPar) {
				weHaveObl=true;
				break;
		}
	}
	if (ToString(args.Result)!="-" && ToString(args.Result)!="" && ToString(args.Result)!="—") {
		//Dialog.Message(args.Result);
		if (buferansw) {
			answerednow = answerednow + 1;
			if (regularAnswers) {
				regular_answ = regular_answ + 1;
			}else {
				single_answ = single_answ + 1;
			}
		}
		if (weHaveObl) {
			if (Variables.Exists("Req"+idPar)) {
				Variables["Req"+idPar].CssClass = "answered_side_gr";
				Variables["Req"+idPar].Refresh();
			}
		}

	}else {
		if (!buferansw) {
			answerednow = answerednow - 1;
			if (regularAnswers) {
				regular_answ = regular_answ - 1;
			}else {
				single_answ = single_answ - 1;
			}
		}
		TempControl.Text = "—";
		if (weHaveObl) {
			if (Variables.Exists("Req"+idPar)) {
				Variables["Req"+idPar].CssClass = "required_side_gr";
				Variables["Req"+idPar].Refresh();
			}
		}
	}
	SetIndicators();
	parentCount.Text = answerednow + " " + Translate["#of#"] + " " + totalanswred;

//	if (regularAnswers) {
		$.CountRegAnswer.Text = Translate["#regular#"] + " (" +regular_answ + " " + Translate["#of#"] + " " + regular_total + ")";
//	}else {
		$.CountNoNRegAnswer.Text = Translate["#nonregular#"] + " (" +single_answ + " " + Translate["#of#"] + " " + single_total + ")";
//	}
var q = new Query("SELECT DISTINCT S.Question, S.Description, S.SKU " +
    "FROM USR_SKUQuestions S " +
    "WHERE (RTRIM(Answer)='' OR S.Answer IS NULL) AND S.Obligatoriness=1 " +
    "AND (S.ParentQuestion=@emptyRef OR S.ParentQuestion IN (SELECT SS.Question FROM USR_SKUQuestions SS " +
      "WHERE SS.SKU=S.SKU AND (SS.Answer='Yes' OR SS.Answer='Да')))");
q.AddParameter("emptyRef", DB.EmptyRef("Catalog_Question"));
obligateredLeft = q.ExecuteCount().ToString();
checkAndFormNextButton(obligateredLeft);
var obl =new Query("SELECT S.Question FROM USR_SKUQuestions S WHERE S.Obligatoriness = @obl And S.SKU = @sku And S.Answer IS NULL AND" +
" (S.ParentQuestion=@emptyRef OR S.ParentQuestion IN (SELECT Question FROM USR_SKUQuestions SS " +
	"WHERE SS.SKU=S.SKU AND (SS.Answer='Yes' OR SS.Answer='Да')))" );
obl.AddParameter("emptyRef", DB.EmptyRef("Catalog_Question"));
obl.AddParameter("obl",1);
obl.AddParameter("sku",skuValueGl);
var rez = obl.ExecuteCount();
if (rez > 0) {
  //Dialog.Message("ParentReq"+idChail);
  //Variables["ParentReq"+idChail].Refresh();
if (Variables.Exists("ParentReq"+idChail)) {
  Variables["ParentReq"+idChail].CssClass = "required_side_wh";
  Variables["ParentReq"+idChail].Refresh();
}
}
if (rez == 0) {
if (Variables.Exists("ParentReq"+idChail)) {
  Variables["ParentReq"+idChail].CssClass = "answered_side_wh";
  Variables["ParentReq"+idChail].Refresh();
}
}



	answerinsku = answerednow;
	relouded = false;
	setScroll = true;
	scrollIndex = parseInt(idPar)+parseInt(idChail);
	scrollIndex1= parseInt(idChail);
	inref = true;
	totalanswerinsku = totalanswred;
	//Workflow.Refresh([$.search]);
	//idChail = idChail;

}
}

function GetCssClasForOblTop(){
	if (forwardAllowed) {
		return "margin_top";
	}else {
		return "required_grid";
	}
}

function DialogCallBack(state, args){
	var entity = state[0];
	AssignAnswer(null, entity, skuValueGl, args.Result);
	//var controlField = idBool;
	TempControl.Text = args.Result;

	if (!relouded) {
		var answerednow = answerinsku;
		var totalanswred = totalanswerinsku;
	}else {
		var answerednow = skuValueGl.Answered;
		var totalanswred = skuRezTemp;
	}

//	 answerednow = answerinsku;
//	 totalanswred = totalanswerinsku;
	var parentCount = Variables["CountOnPar"+idChail];
	var weHaveObl = false;
	for(control in Variables["DockLa"+idPar].Controls){
//		Dialog.Message(control.Id);
		if (control.Id == "Req"+idPar) {
				weHaveObl=true;
				break;
		}
	}
	if (ToString(args.Result)!="-" && ToString(args.Result)!="" && ToString(args.Result)!="—") {
		//Dialog.Message(args.Result);
		if (buferansw) {
			answerednow = answerednow + 1;
			if (regularAnswers) {
				regular_answ = regular_answ + 1;
			}else {
				single_answ = single_answ + 1;
			}
		}
		if (weHaveObl) {
			Variables["Req"+idPar].Refresh();
			Variables["Req"+idPar].CssClass = "answered_side_gr";
			Variables["Req"+idPar].Refresh();
		}

	}else {
		if (!buferansw) {
			answerednow = answerednow - 1;
			if (regularAnswers) {
				regular_answ = regular_answ - 1;
			}else {
				single_answ = single_answ - 1;
			}
		}
		TempControl.Text = "—";
		if (weHaveObl) {
			Variables["Req"+idPar].Refresh();
			Variables["Req"+idPar].CssClass = "required_side_gr";
			Variables["Req"+idPar].Refresh();
		}
	}
	SetIndicators();

	parentCount.Text = answerednow + " " + Translate["#of#"] + " " + totalanswred;

//	if (regularAnswers) {
		$.CountRegAnswer.Text = Translate["#regular#"] + " (" +regular_answ + " " + Translate["#of#"] + " " + regular_total + ")";
//	}else {
		$.CountNoNRegAnswer.Text = Translate["#nonregular#"] + " (" +single_answ + " " + Translate["#of#"] + " " + single_total + ")";
//	}
	answerinsku = answerednow;
	relouded = false;
	totalanswerinsku = totalanswred;
	//idChail = idChail;
}





function GalleryCallBack(state, args) {
	//Dialog.Message(args.Result);
	if (args.Result) {
		AssignAnswer(null, questionValueGl, skuValueGl, state[1]);

		newFile = DB.Create("Document.Visit_Files");
		newFile.Ref = state[0];
		newFile.FileName = state[1];
		newFile.FullFileName = state[2];
		newFile.Save();
//		Dialog.Message("control"+idPar)
//		Variables["controlVert"+idPar].CssClass = "answer_snapshotVl";
//		Variables["controlVert"+idPar].Refresh();
	var weHaveIt = Variables.Exists("controlVert"+idPar);
//	for(control in Variables["controlVert"+idPar].Controls){
//		Dialog.Message(control.Id);
//		if (control.Id == "controlVertIn"+idPar) {
//				weHaveIt=true;
//				break;
//		}
//	}
	if (weHaveIt) {
		if (Variables.Exists("controlVertIn"+idPar)) {
			if (Variables.Exists("control"+idPar)) {
				if (Variables["control"+idPar].CssClass == "answer_snapshot") {
				}else {
					for(control in Variables["controlVertIn"+idPar].Controls)
					control.remove();
					Variables["controlVertIn"+idPar].after("<c:Image Id='control"+idPar+"' CssClass='answer_snapshot'></c:Image>").refresh();
					Variables["controlVertIn"+idPar].remove();
				}
			}else {
				for(control in Variables["controlVertIn"+idPar].Controls)
				control.remove();
				Variables["controlVertIn"+idPar].after("<c:Image Id='control"+idPar+"' CssClass='answer_snapshot'></c:Image>").refresh();
				Variables["controlVertIn"+idPar].remove();
			}

		}
	}
if (Variables.Exists("control"+idPar)) {
	Variables["control"+idPar].CssClass = "answer_snapshot";
	Variables["control"+idPar].Refresh();
	Variables["control"+idPar].Source = newFile.FullFileName;
	Variables["control"+idPar].Refresh();
}
if (Variables.Exists("controlVert"+idPar)) {
	Variables["controlVert"+idPar].Refresh();
}

		var answerednow = answerinsku;
		var totalanswred = totalanswerinsku;

		var parentCount = Variables["CountOnPar"+idChail];
	if (buferansw) {
		answerednow = answerednow + 1;
		if (regularAnswers) {
			regular_answ = regular_answ + 1;
		}else {
			single_answ = single_answ + 1;
		}
	}
	if (Variables.Exists("Req"+idPar)) {
		Variables["Req"+idPar].CssClass = "answered_side_gr";
		Variables["Req"+idPar].Refresh();
	}
	SetIndicators();

	parentCount.Text = answerednow + " " + Translate["#of#"] + " " + totalanswred;

//	if (regularAnswers) {
		$.CountRegAnswer.Text = Translate["#regular#"] + " (" +regular_answ + " " + Translate["#of#"] + " " + regular_total + ")";
//	}else {
		$.CountNoNRegAnswer.Text = Translate["#nonregular#"] + " (" +single_answ + " " + Translate["#of#"] + " " + single_total + ")";
//	}
	answerinsku = answerednow;
	relouded = false;
 	var q = new Query("SELECT DISTINCT S.Question, S.Description, S.SKU " +
    "FROM USR_SKUQuestions S " +
    "WHERE (RTRIM(Answer)='' OR S.Answer IS NULL) AND S.Obligatoriness=1 " +
    "AND (S.ParentQuestion=@emptyRef OR S.ParentQuestion IN (SELECT SS.Question FROM USR_SKUQuestions SS " +
      "WHERE SS.SKU=S.SKU AND (SS.Answer='Yes' OR SS.Answer='Да')))");
q.AddParameter("emptyRef", DB.EmptyRef("Catalog_Question"));
obligateredLeft = q.ExecuteCount().ToString();
checkAndFormNextButton(obligateredLeft);
var obl =new Query("SELECT S.Question FROM USR_SKUQuestions S WHERE Obligatoriness = @obl And SKU = @sku And Answer IS NULL "+
"AND (S.ParentQuestion=@emptyRef OR S.ParentQuestion IN (SELECT SS.Question FROM USR_SKUQuestions SS " +
	"WHERE SS.SKU=S.SKU AND (SS.Answer='Yes' OR SS.Answer='Да')))");
obl.AddParameter("emptyRef", DB.EmptyRef("Catalog_Question"));
obl.AddParameter("obl",1);
obl.AddParameter("sku",skuValueGl);
var rez = obl.ExecuteCount();
if (rez > 0) {
  //Dialog.Message("ParentReq"+idChail);
  //Variables["ParentReq"+idChail].Refresh();
		if (Variables.Exists("ParentReq"+idChail)) {
	  Variables["ParentReq"+idChail].CssClass = "required_side_wh";
	  Variables["ParentReq"+idChail].Refresh();
		}
}
if (rez == 0) {
	if (Variables.Exists("ParentReq"+idChail)) {
	  Variables["ParentReq"+idChail].Refresh();
		Variables["ParentReq"+idChail].CssClass = "answered_side_wh";
	  Variables["ParentReq"+idChail].Refresh();
		}
}


		//Workflow.Refresh([]);
	}
}

function DeleteAnswers(recordset) {
	while (recordset.Next()){
		DB.Delete(recordset.Id);
	}
}

//------------------------CustomFoto
//---------------------------ForSkuQuest----------------------------
function AddQuestionSnapshotSku(tableName, question, sku, answer, previewAllowed, title, func) {
	title = String.IsNullOrEmpty(title) ? Translate["#snapshot#"] : title;
	if (String.IsNullOrEmpty(answer) && !$.sessionConst.galleryChoose)
		Images.MakeSnapshot($.workflow.visit, func);
	else{

		if (String.IsNullOrEmpty(answer)==false)
		path = Images.FindImage($.workflow.visit, answer, ".jpg", "Document_Visit_Files");

		var listChoice = new List;
		if ($.sessionConst.galleryChoose) //if Gallery is allowed
			listChoice.Add([0, Translate["#addFromGallery#"]]);
		listChoice.Add([1, Translate["#makeSnapshot#"]]);
		if (previewAllowed && String.IsNullOrEmpty(answer)==false && FileSystem.Exists(path)) //if not an Image.xml screen
			listChoice.Add([3, Translate["#show#"]]);
		if (String.IsNullOrEmpty(answer)==false && previewAllowed)
			listChoice.Add([2, Translate["#clearValue#"]]);

		Dialog.Choose(title, listChoice, AddSnapshotHandlerSku, [$.workflow.visit, func, tableName, path, question, sku]);
	}
}

function AddSnapshotHandlerSku(state, args) {
	var objRef = state[0];
	var func = state[1];
	var valueRef = state[2];

	if (parseInt(args.Result)==parseInt(0)){ 	//Gallery answer
		Images.ChooseFromGallery(objRef, func);
	}

	if (parseInt(args.Result)==parseInt(1)){ 	//SnapshotAnswer
		Images.MakeSnapshot(objRef, func);
	}

	if (parseInt(args.Result)==parseInt(2)){ 	//Delete answer
		if (getType(valueRef)=="System.String") 	//for Questions, SKUQuestions
			DeleteFromTableSku(state[4], state[5]);
		else
			DeleteImageSku(valueRef); 		//common delete handler
	}

	if (parseInt(args.Result)==parseInt(3)){ 	//Show answer
		var path = state[3];
		var attr;
		if (getType(valueRef)=="System.String"){ 	//for Questions/SKUQuestions, callback from AddQuestionSnapshot()
			valueRef = state[4];
			attr = state[5];
		}
		else{ 		//common handler
			if (valueRef!=null)
				attr = parameters[valueRef.Metadata().TableName];
		}

		var arr = [path, valueRef, attr];
		if (valueRef != null){
			if (valueRef.Metadata().TableName=="Catalog_SKU")
				arr = [path, valueRef, attr, false];
		}

		Workflow.Action("ShowImage", arr);
	}
}

function DeleteImageSku(valueRef) {
	if (valueRef.IsNew()){
		DB.Delete(valueRef);
		//Workflow.Refresh([]);
	}
	else{
		var index = parameters[valueRef.Metadata().TableName];
		var value = valueRef.GetObject();

		if (valueRef.Metadata().TableName == "Catalog_Outlet_Snapshots") {
			value.Deleted = true;
		} else {
			value[index] = "";
		}

		value.Save();
		//Workflow.Refresh([]);
	}
}

function DeleteFromTableSku(question, sku) {
	var answerString = "HistoryAnswer ";

	var tableName = sku==null ? "USR_Questions" : "USR_SKUQuestions";

	var q = new Query();

	var cond = "";
	if (tableName == "USR_SKUQuestions"){
		cond = " AND SKU=@sku";
		q.AddParameter("sku", sku);
	}

	q.Text = "UPDATE " + tableName + " SET Answer=" + answerString + ", AnswerDate=DATETIME('now', 'localtime') " +
		"WHERE Question=@question " + cond;
	q.AddParameter("answer", null);
	q.AddParameter("question", question);
	q.Execute();
	if (Variables.Exists("control"+idPar)) {
		Variables["control"+idPar].remove();
		var textToAppend = "<c:VerticalLayout Id='controlVertIn"+idPar+"' CssClass='no_child_answer'>"
		+"<c:Image Id='control"+idPar+"'/>"
		+"</c:VerticalLayout>";
		Variables["controlVert"+idPar].append(textToAppend).refresh();
	}
	var answerednow = answerinsku;
	var totalanswred = totalanswerinsku;


var parentCount = Variables["CountOnPar"+idChail];
	answerednow = answerednow - 1;
	if (regularAnswers) {
		regular_answ = regular_answ - 1;
	}else {
		single_answ = single_answ - 1;
	}
	if (Variables.Exists("Req"+idPar)) {
		Variables["Req"+idPar].CssClass = "required_side_gr";
		Variables["Req"+idPar].Refresh();
	}
	SetIndicators();

parentCount.Text = answerednow + " " + Translate["#of#"] + " " + totalanswred;

//if (regularAnswers) {
	$.CountRegAnswer.Text = Translate["#regular#"] + " (" +regular_answ + " " + Translate["#of#"] + " " + regular_total + ")";
//}else {

	$.CountNoNRegAnswer.Text = Translate["#nonregular#"] + " (" +single_answ + " " + Translate["#of#"] + " " + single_total + ")";
//}
answerinsku = answerednow;
relouded = false;
var q = new Query("SELECT DISTINCT S.Question, S.Description, S.SKU " +
    "FROM USR_SKUQuestions S " +
    "WHERE (RTRIM(Answer)='' OR S.Answer IS NULL) AND S.Obligatoriness=1 " +
    "AND (S.ParentQuestion=@emptyRef OR S.ParentQuestion IN (SELECT SS.Question FROM USR_SKUQuestions SS " +
      "WHERE SS.SKU=S.SKU AND (SS.Answer='Yes' OR SS.Answer='Да')))");
q.AddParameter("emptyRef", DB.EmptyRef("Catalog_Question"));
obligateredLeft = q.ExecuteCount().ToString();
checkAndFormNextButton(obligateredLeft);
var obl =new Query("SELECT Question FROM USR_SKUQuestions WHERE Obligatoriness = @obl And SKU = @sku And Answer IS NULL");
obl.AddParameter("obl",1);
obl.AddParameter("sku",skuValueGl);
var rez = obl.ExecuteCount();
if (rez > 0) {
  //Dialog.Message("ParentReq"+idChail);
  //Variables["ParentReq"+idChail].Refresh();
	if (Variables.Exists("ParentReq"+idChail)) {
	  Variables["ParentReq"+idChail].CssClass = "required_side_wh";
	  Variables["ParentReq"+idChail].Refresh();
	}
}
if (rez == 0) {
	if (Variables.Exists("ParentReq"+idChail)) {
	  Variables["ParentReq"+idChail].Refresh();
	  Variables["ParentReq"+idChail].CssClass = "answered_side_wh";
	  Variables["ParentReq"+idChail].Refresh();
	}
}




	//Workflow.Refresh([]);
}
