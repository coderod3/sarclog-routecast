namespace RouteCast.Api.Models.DTOs
{
    public class AnalyzeResponse
    {
        public List<RouteRiskSegment> Segments { get; set; } = new();

        public int FinalScore { get; set; }

        public string FinalRiskLevel { get; set; } = string.Empty;

        public string FinalSummary { get; set; } = string.Empty;

        public string Coordinates { get; set; } = string.Empty;

        public int DistanceMeters { get; set; }

        public int DurationSeconds { get; set; }

        public int CoordinateCount { get; set; }

        public int SampleCount { get; set; }
    }
}