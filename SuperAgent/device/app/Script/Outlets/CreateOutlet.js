﻿
var requiredLeft;

function CreateOutlet(outlet) {



	if (String.IsNullOrEmpty(outlet))
	{
		outlet = DB.Create("Catalog.Outlet");
		outlet.OutletStatus = DB.Current.Constant.OutletStatus.Potential;
		outlet.Save();
		return outlet.Id;
	}
	else
	{
		outlet = outlet.GetObject();
		return outlet.Id;
	}
}

function hasDistr(){
	var qur = new Query("Select Id From Catalog_Distributor");
	var distr = qur.ExecuteScalar();
	if (distr == null) {
		return false;
	}else {
		return true;
	}
}

function GetTerritory() {
	var q = new Query("SELECT Id From Catalog_Territory LIMIT 1");
	var territory = q.ExecuteScalar();
	if (territory == null) {
		return  territoryEmptyRef;
	}
	else {
		return territory;
	}
	return territory || territoryEmptyRef;
}

function SetSideStyles(outlet){
	var sideStyle = new Dictionary();

	outlet = outlet.GetObject();

	requiredLeft = parseInt(0);
	sideStyle.Add("outletName", ClassValue(outlet.Description));
	sideStyle.Add("outletAddress", ClassValue(outlet.Address));
	sideStyle.Add("outletClass", ClassValue(outlet.Class));
	sideStyle.Add("outletType", ClassValue(outlet.Type));
	return sideStyle;
}

function ClassValue(value)
{
	requiredLeft = typeof requiredLeft == "undefined" ? parseInt(0) : requiredLeft;

	if (value == "" || value=="—" || value == DB.EmptyRef("Catalog.OutletType") || value == DB.EmptyRef("Catalog.OutletClass"))
	{
		requiredLeft = requiredLeft + 1;
		return "required_side_wh";
	}
	else
		return "answered_side_wh";
}

function NoRequired()
{
	return parseInt(requiredLeft) == parseInt(0);
}

function DeleteAndBack(entity) {
	Workflow.Rollback();
}

function SaveNewOutlet(outlet) {

	outlet = outlet.GetObject();

	if (outlet.Description != null && outlet.Address != null){
		if (TrimAll(outlet.Description) != "" && TrimAll(outlet.Address) != "" && outlet.Class!=DB.EmptyRef("Catalog_OutletClass")
				&& outlet.Type!=DB.EmptyRef("Catalog_OutletType") && $.territory!=null) {

			var to = DB.Create("Catalog.Territory_Outlets");
			to.Ref = $.territory;
			to.Outlet = outlet.Id;
			to.Save();

			outlet.Lattitude = parseInt(0);
			outlet.Longitude = parseInt(0);
			outlet.Save();

			GlobalWorkflow.SetOutletIsCreated(true);
			GlobalWorkflow.SetOutlet(outlet.Id);

			$.workflow.Add("outlet", GlobalWorkflow.GetOutlet());

			Workflow.Action('OpenOutlet', []);

			return null;
		}
	}
	Dialog.Message("#messageNulls#");
}

function DoSelect(source, outlet, attribute, control, title) {
	if (control.Id != "outletTerritory") {
		Dialogs.DoChoose(null, outlet, attribute, control, CallBack, title);
	}
	else
	{
		if ($.territory != DB.EmptyRef("Catalog_Territory")) {
			Dialogs.DoChoose(null, outlet, attribute, control, TerritoryCallBack, title);
		}
	}
}

function CallBack(state, args) {
	AssignDialogValue(state, args);
	var outlet = state[0];
	DoRefresh(null, outlet);
}

function TerritoryCallBack(state, args) {
	var control = state[2];
	var attribute = state[1];
	if (getType(args.Result)=="BitMobile.DbEngine.DbRef") {
		$.territory = args.Result;
		control.Text = args.Result.Description;
	}
	else {
		$.territory = DB.EmptyRef("Catalog_Territory");
		control.Text = String.IsNullOrEmpty(args.Result) ? "—" : args.Result;
	}
}
