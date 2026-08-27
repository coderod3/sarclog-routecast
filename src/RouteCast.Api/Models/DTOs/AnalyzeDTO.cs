using RouteCast.Api.Models.Enums;

namespace RouteCast.Api.Models.DTOs
{
    public class AnalyzeDTO
    {
        public required double LatOrigin { get; set; }
        public required double LongOrigin { get; set; }
        public required double LatDestination { get; set; }
        public required double LongDestination { get; set; }
        public DateTime Date { get; set; }
        public required string Transport { get; set; }
        public required string Language { get; set; }
    }
}
