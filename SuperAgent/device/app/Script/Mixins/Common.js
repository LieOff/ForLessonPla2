
//---------------Common functions-----------

function ToFloat(text) {
    if (String.IsNullOrEmpty(text))
        return parseFloat(0, 10);
    return parseFloat(text, 10);
}

function ToInteger(text) {
    return parseInt(text);
}

function ToString(val) {
	return val.ToString();
}

function ToDecimal(val) {
    val = TrimAll(val);
	if (String.IsNullOrEmpty(val))
		return Converter.ToDecimal(0);
	else
		return Converter.ToDecimal(val);
}

function GetSum(val1, val2) {

	if (val1 == null)
		val1 = parseFloat(0);
	if (val2 == null)
		val2 = parseFloat(0);

    return parseFloat(val1) + parseFloat(val2);
}

function GetDifference(val1, val2) {
    return val1 - val2;
}

function GetGreater(val1, val2) {
    var r = val1 - val2;
    if (r > 0) {
        return false;
    }
    else
        return true;
}

function CountCollection(collection) {
    return parseInt(collection.Count());
}

function AreEqual(val1, val2) {
    if (val1.ToString() == val2.ToString())
        return true;
    else
        return false;
}

function NotEqualInt(val1, val2) {
    if (parseInt(val1) == parseInt(val2))
        return false;
    else
        return true;
}

function GetMultiple(val1, val2) {
    return (val1 * val2)
}

function FormatValue(value) {
    return String.Format("{0:F2}", value || 0);
}

function ConvertToBoolean(val) {
    if (val == "true" || val == true)
        return true;
    else
        return false;
}

function ConvertToBoolean1(val1) {
    if (val1 > 0)
        return true;
    else
        return false;
}

function IsNullOrEmpty(val1) {
    return String.IsNullOrEmpty(val1);
}

function GetControlId(count) {
    return ("control" + count);
}

function IsInCollection(item, collection) {
    var res = false;
    for (var i in collection) {
        if (item.ToString() == i.ToString())
            res = true;
    }
    return res;
}


function DeleteFromCollection(item, collection) {
    var arr = [];
    for (var i in collection) {
        if (item.ToString() != collection[i].ToString())
            arr.push(collection[i]);
    }
    return arr;
}

function EmptyRef(ref) {
    return ref.EmptyRef();
}

function IsEmptyValue(value) {

	if (String.IsNullOrEmpty(value))
		return true;
	else{
		if (getType(value)=="System.String" || getType(value)=="System.DateTime" || getType(value)=="System.Boolean")
			return false;
		else{
			if (value.EmptyRef())
	            return true;
	        else
	            return false;
		}
	}
}

function NotEmptyRef(ref) {
    if (ref.EmptyRef())
        return false;
    else
        return true;
}

function GenerateGuid() {

    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

function IsNew(val1) {
	return val1.IsNew();
}

function GetObject(val){
	return val.GetObject();
}

function GetSharedImagePath(objectType, objectID, pictID, pictExt) {
	var r = "/shared/" + objectType + "/" + objectID.Id.ToString() + "/"
    + pictID + pictExt;
	return r;
}

function GetPrivateImagePath(objectType, objectID, pictID, pictExt) {
	var r = "/private/" + objectType + "/" + objectID.Id.ToString() + "/"
    + pictID + pictExt;
	return r;
}

function FocusOnEditText(editFieldName, isInputField) {
  if (isInputField != null) {
    if (isInputField == '1') {
      Variables[editFieldName].SetFocus();
    }
  }
}

function FormatOutput(value) {
	if (String.IsNullOrEmpty(value) || IsEmptyValue(value))
		return "-";
	else
		return value;
}

function RoundToIntFloor(val){
  var roundInt = Round(val,0);
  if (val > 0) {
      if (roundInt>val) {
        return roundInt - 1;
      }else {
        return roundInt;
      }
  }else {
    if (roundInt>=val) {
      return roundInt;
    }else {
      return roundInt + 1;
    }

  }
}

function RoundToInt(val){

    var string = val;
    var resultString = "";

    if (typeof string != "string")
        string = string.ToString();

    for (var i = 1; i <= StrLen(string); i++){  // it's all about ot clear source from incorrect chars
        var ch = Mid(string, i, 1);

        if (validate(ch, "([0-9.,-])*") && validate((resultString + ch), "(-)?([0-9])*[.,]?[0-9]?")){
            resultString += ch;
        }
        else
            break;
    }

    if (resultString == "")
        return null;
    else
        return Round(resultString, 0);
}

function CheckUserInput(sender){
    if (TrimAll(sender.Text) == '.' || TrimAll(sender.Text) == ',')
    {
        sender.Text = '0,';
    }
}

function TranslateString(val){
    return Translate["#" + val + "#"];
}

//--------------------Clear Button part----------------------

function ShowClearButton(source, button) {
	button.Visible = true;
}

function HideClearButton(source, button) {
	button.Visible = false;
}

function ClearField(source, field, objectRef, attribute) {
    field.Text = "";
	var object = objectRef.GetObject();
	object[attribute] = "";
	object.Save();
	source.Visible = false;
}

//-------------------------Dialogs----------------------------

function AssignDialogValue(state, args) {
	var entity = state[0];
	var attribute = state[1];
	entity[attribute] = args.Result;
	entity.GetObject().Save();
	return entity;
}

//--------------------------WorkWithGPS-----------------------

function ActualLocation(location){

    var actualTime;
    if (parseInt($.sessionConst.UserCoordinatesActualityTime)==parseInt(0)){
        actualTime = true;
    }
    else{
        var locTime = location.Time.ToLocalTime();
        var maxTime = DateTime.Now.AddMinutes(-parseInt($.sessionConst.UserCoordinatesActualityTime));
        actualTime = locTime > maxTime;
    }

    return (location.NotEmpty && actualTime);
}
