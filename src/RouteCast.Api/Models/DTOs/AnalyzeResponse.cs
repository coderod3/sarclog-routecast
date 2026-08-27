namespace RouteCast.Api.Models.DTOs
{
    public class AnalyzeResponse
    {
        public List<Segment> Segments { get; set; } = new();
        public int FinalScore { get; set; }
        public string FinalSummary { get; set; } = string.Empty;
        public string? Coordinates { get; set; }
    }

    public class Segment
    {
        public int Index { get; set; }
        public int Score { get; set; }
        public string Summary { get; set; } = string.Empty;
        public Indicators Indicators { get; set; } = new();
    }

    public class Indicators
    {
        public string Temperature { get; set; } = string.Empty;
        public string Humidity { get; set; } = string.Empty;
        public string Precipitation { get; set; } = string.Empty;
        public bool Snow { get; set; }
    }
}