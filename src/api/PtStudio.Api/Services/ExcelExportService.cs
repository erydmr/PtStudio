using ClosedXML.Excel;
using PtStudio.Api.DTOs;

namespace PtStudio.Api.Services;

public class ExcelExportService
{
    public byte[] ExportTrainerReport(List<TrainerReportDto> data, DateTime from, DateTime to)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Antrenor Raporu");

        ws.Cell(1, 1).Value = $"Antrenor Raporu ({from:dd.MM.yyyy} - {to:dd.MM.yyyy})";
        ws.Range(1, 1, 1, 7).Merge().Style.Font.SetBold(true).Font.SetFontSize(14);

        var headers = new[] { "Antrenor", "Toplam Ders", "Tamamlanan", "Iptal", "Yanan", "Musteri Sayisi", "Tamamlanma %" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(3, i + 1).Value = headers[i];
            ws.Cell(3, i + 1).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.LightGray);
        }

        for (int i = 0; i < data.Count; i++)
        {
            var r = data[i];
            ws.Cell(4 + i, 1).Value = r.TrainerFullName;
            ws.Cell(4 + i, 2).Value = r.TotalLessons;
            ws.Cell(4 + i, 3).Value = r.CompletedLessons;
            ws.Cell(4 + i, 4).Value = r.CancelledLessons;
            ws.Cell(4 + i, 5).Value = r.BurnedLessons;
            ws.Cell(4 + i, 6).Value = r.UniqueClientCount;
            ws.Cell(4 + i, 7).Value = r.CompletionRate;
        }

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    public byte[] ExportClientReport(List<ClientReportDto> data, DateTime from, DateTime to)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Musteri Raporu");

        ws.Cell(1, 1).Value = $"Musteri Raporu ({from:dd.MM.yyyy} - {to:dd.MM.yyyy})";
        ws.Range(1, 1, 1, 7).Merge().Style.Font.SetBold(true).Font.SetFontSize(14);

        var headers = new[] { "Musteri", "Toplam Ders", "Tamamlanan", "Iptal", "Yanan", "Kalan Hak", "Aktif Paket" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(3, i + 1).Value = headers[i];
            ws.Cell(3, i + 1).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.LightGray);
        }

        for (int i = 0; i < data.Count; i++)
        {
            var r = data[i];
            ws.Cell(4 + i, 1).Value = r.ClientFullName;
            ws.Cell(4 + i, 2).Value = r.TotalLessons;
            ws.Cell(4 + i, 3).Value = r.CompletedLessons;
            ws.Cell(4 + i, 4).Value = r.CancelledLessons;
            ws.Cell(4 + i, 5).Value = r.BurnedLessons;
            ws.Cell(4 + i, 6).Value = r.TotalRemainingSessions;
            ws.Cell(4 + i, 7).Value = r.ActivePackageCount;
        }

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    public byte[] ExportRevenueReport(List<RevenueReportDto> data, DateTime from, DateTime to)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Gelir Raporu");

        ws.Cell(1, 1).Value = $"Gelir Raporu ({from:dd.MM.yyyy} - {to:dd.MM.yyyy})";
        ws.Range(1, 1, 1, 3).Merge().Style.Font.SetBold(true).Font.SetFontSize(14);

        var headers = new[] { "Ay", "Gelir (TL)", "Satilan Paket" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(3, i + 1).Value = headers[i];
            ws.Cell(3, i + 1).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.LightGray);
        }

        for (int i = 0; i < data.Count; i++)
        {
            var r = data[i];
            ws.Cell(4 + i, 1).Value = r.MonthName;
            ws.Cell(4 + i, 2).Value = r.Revenue;
            ws.Cell(4 + i, 2).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(4 + i, 3).Value = r.PackagesSold;
        }

        var totalRow = 4 + data.Count + 1;
        ws.Cell(totalRow, 1).Value = "TOPLAM";
        ws.Cell(totalRow, 1).Style.Font.SetBold(true);
        ws.Cell(totalRow, 2).Value = data.Sum(d => d.Revenue);
        ws.Cell(totalRow, 2).Style.Font.SetBold(true).NumberFormat.Format = "#,##0.00";
        ws.Cell(totalRow, 3).Value = data.Sum(d => d.PackagesSold);
        ws.Cell(totalRow, 3).Style.Font.SetBold(true);

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    public byte[] ExportCancellationReport(List<CancellationReportDto> data, DateTime from, DateTime to)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Iptal Yanma Raporu");

        ws.Cell(1, 1).Value = $"Iptal/Yanma Raporu ({from:dd.MM.yyyy} - {to:dd.MM.yyyy})";
        ws.Range(1, 1, 1, 7).Merge().Style.Font.SetBold(true).Font.SetFontSize(14);

        var headers = new[] { "Ay", "Toplam", "Tamamlanan", "Iptal", "Yanan", "Iptal Orani %", "Yanma Orani %" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(3, i + 1).Value = headers[i];
            ws.Cell(3, i + 1).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.LightGray);
        }

        for (int i = 0; i < data.Count; i++)
        {
            var r = data[i];
            ws.Cell(4 + i, 1).Value = r.MonthName;
            ws.Cell(4 + i, 2).Value = r.TotalLessons;
            ws.Cell(4 + i, 3).Value = r.CompletedLessons;
            ws.Cell(4 + i, 4).Value = r.CancelledLessons;
            ws.Cell(4 + i, 5).Value = r.BurnedLessons;
            ws.Cell(4 + i, 6).Value = r.CancellationRate;
            ws.Cell(4 + i, 7).Value = r.BurnRate;
        }

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    private static byte[] WorkbookToBytes(XLWorkbook workbook)
    {
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
