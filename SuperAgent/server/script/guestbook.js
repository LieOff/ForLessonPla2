function entries()
{
    $.Push("title", GetTitle());
    $.Push("entries", GetGuestBookEntries());
    return View.TemplateView("guestbook.xml");
}

function submitEntry()
{
    AddEntry($.message);
    return entries();
}

function GetGuestBookEntries()
{
    var qry = DB.CreateCommand();
    qry.Text = "SELECT TOP 10 [Date], [UserName], [Description] FROM [Document].[Guestbook] ORDER BY [Date] DESC";
    return qry.Select();
}

function AddEntry(Message)
{
    var qry = DB.CreateCommand();
    qry.Text = "INSERT INTO [Document].[Guestbook]([Id],[Date],[UserName],[Description]) VALUES(@Id,@Date,@UserName,@Description)";
    qry.AddParameter("Id", Guid.NewGuid());
    qry.AddParameter("Date", DateTime.Now);
    qry.AddParameter("UserName", "guest");
    qry.AddParameter("Description", Message);
    qry.Execute();
}

function GetTitle()
{
    return "BIT:Mobile server pages demo !";
}
