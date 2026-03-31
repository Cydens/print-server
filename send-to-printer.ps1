param([string]$PrinterName, [string]$FilePath)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
public struct DOCINFOW {
    public string pDocName;
    public string pOutputFile;
    public string pDataType;
}

public class RawPrint {
    [DllImport("winspool.drv", CharSet=CharSet.Unicode)]
    public static extern bool OpenPrinter(string n, out IntPtr h, IntPtr d);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode)]
    public static extern bool ClosePrinter(IntPtr h);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode)]
    public static extern int StartDocPrinter(IntPtr h, int l, ref DOCINFOW d);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode)]
    public static extern bool EndDocPrinter(IntPtr h);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode)]
    public static extern bool StartPagePrinter(IntPtr h);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode)]
    public static extern bool EndPagePrinter(IntPtr h);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode)]
    public static extern bool WritePrinter(IntPtr h, IntPtr p, int n, out int w);
}
"@

$bytes    = [System.IO.File]::ReadAllBytes($FilePath)
$hPrinter = [IntPtr]::Zero

[RawPrint]::OpenPrinter($PrinterName, [ref]$hPrinter, [IntPtr]::Zero) | Out-Null

$docInfo           = New-Object DOCINFOW
$docInfo.pDocName  = "Ticket"
$docInfo.pDataType = "RAW"

[RawPrint]::StartDocPrinter($hPrinter, 1, [ref]$docInfo) | Out-Null
[RawPrint]::StartPagePrinter($hPrinter) | Out-Null

$ptr = [System.Runtime.InteropServices.Marshal]::AllocCoTaskMem($bytes.Length)
[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
$written = 0
[RawPrint]::WritePrinter($hPrinter, $ptr, $bytes.Length, [ref]$written) | Out-Null
[System.Runtime.InteropServices.Marshal]::FreeCoTaskMem($ptr)

[RawPrint]::EndPagePrinter($hPrinter)  | Out-Null
[RawPrint]::EndDocPrinter($hPrinter)   | Out-Null
[RawPrint]::ClosePrinter($hPrinter)    | Out-Null

Write-Host "OK: $written bytes enviados"
