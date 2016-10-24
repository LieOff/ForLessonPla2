﻿var c_entity;
var c_attribute;
var c_questionnaire;
var c_tableName;
var c_editable;

function OnLoading() {
	c_editable = ($.param4==null || $.param4) ? false : true;
}

function OnLoad() {
	c_entity = $.entity;
	c_attribute = $.attribute;
	c_object = (getType(c_entity.Ref) == "System.String") ? c_entity : c_entity.Ref;
	c_questionnaire = (getType(c_entity.GetObject())=="DefaultScope.Catalog.Question") ? true : false;

	if (getType(c_entity.GetObject())=="DefaultScope.Catalog.Question")
		c_tableName = "USR_Questions";
	if (c_attribute!=null && getType(c_attribute)!="System.String"){
		if (getType(c_attribute.GetObject())=="DefaultScope.Catalog.SKU")
			c_tableName = "USR_SKUQuestions";
	}

	if ($.sessionConst.galleryChoose)
		$.reshoot.Text = Translate["#editChange#"];
}

function Reshoot(control) {
	var callback = c_questionnaire ? QuestionCallBack : SaveSnapshot;
	if ($.sessionConst.galleryChoose) {
		if (c_questionnaire)
			Images.AddQuestionSnapshot(c_tableName, c_entity, c_attribute, $.path, false, null, QuestionCallBack);
		else
			Images.AddSnapshot(c_object, c_entity, SaveSnapshot, null, null, true);
	}
	else{
		var obj = c_questionnaire ? $.workflow.visit : $.workflow.outlet;
		Images.MakeSnapshot(obj, callback);
	}
}

function SaveSnapshot(state, args) {
	if (args.Result) {
		var objRef = state[0];
		var pictId = state[1];
		var source = state[2];

		var entityObj = c_entity.GetObject();
		entityObj[c_attribute] = pictId;
		entityObj.Save();
		SaveSnapshotFile(objRef,pictId,source);
	//	Dialog.Message(entityObj.Id);
		Workflow.Refresh([source, c_entity, c_attribute]);
	}
}

function Delete() {
	if (c_questionnaire){
		AssignQuestionAnswer(null, null);
	}
	else{
		var object = c_entity.GetObject();
		object[c_attribute] = null;

		if (getType(object)=="DefaultScope.Catalog.Outlet_Snapshots")
			object.Deleted = true;

		object.Save();
		Workflow.Back();
	}
}


//---------------------------------Special handlers-------------------------------


function QuestionCallBack(state, args) {
	if (args.Result){
		SaveSnapshotFile(state[0], state[1], state[2]);
		AssignQuestionAnswer(state[1], state[2]);
	}
}

function SaveSnapshotFile(objRef,pictId,source){

//var callback = c_questionnaire ? QuestionCallBack : SaveSnapshot;
if (c_questionnaire) {
	var cond ="";
	if (c_tableName == "USR_SKUQuestions"){
		cond = " AND SKU=@sku";
	}
	var getprevFileName = new Query("Select Answer From "+c_tableName+" Where Question=@question"+cond);
	getprevFileName.AddParameter("question",c_entity);
	if (c_tableName == "USR_SKUQuestions"){
		getprevFileName.AddParameter("sku", c_attribute);
	}
	var PrevFileName = getprevFileName.ExecuteScalar();
	var q = new Query("Select Id From Document_Visit_Files Where Ref=@vis And FileName=@PrevFileName");
	q.AddParameter("vis", objRef);
	q.AddParameter("PrevFileName", PrevFileName);
}else {
	//Dialog.Message(objRef);
	//Dialog.Message(c_tableName);
	var q = new Query("Select Id From Catalog_Outlet_Files Where Ref=@ref");
	q.AddParameter("ref", objRef);
}
var NodeFile = q.ExecuteScalar();
var objNodeFile = NodeFile.GetObject();
objNodeFile.FileName = pictId;
objNodeFile.FullFileName = source;
objNodeFile.Save();
//Dialog.Message(PrevFileName);
//Dialog.Message(objRef);
//	var q = new Query();
//	q.AddParameter("pictId", pictId);
//	q.AddParameter("FullFileName", source);
//	Dialog.Message(a);

}

function AssignQuestionAnswer(answer, source) {
	var answerString;
	if (String.IsNullOrEmpty(answer))
		answerString = "HistoryAnswer ";
	else
		answerString = "@answer ";

	var q = new Query();

	var cond = "";
	if (c_tableName == "USR_SKUQuestions"){
		cond = " AND SKU=@sku";
		q.AddParameter("sku", c_attribute);
	}
 //Dialog.Message(c_tableName);
	q.Text = "UPDATE " + c_tableName + " SET Answer=" + answerString + ", AnswerDate=DATETIME('now', 'localtime') " +
		"WHERE Question=@question " + cond;
	q.AddParameter("answer", answer);
	q.AddParameter("question", c_entity);
	q.Execute();

	if (source == null)
		Workflow.Back();
	else
		Workflow.Refresh([source, c_entity, c_attribute]);
}
