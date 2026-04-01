Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\")) & "cydens-print-server.exe" & Chr(34), 0, False
Set WshShell = Nothing
