namespace RouteCast.Api.Models.DTOs
{
    public class MapsData
    {
        public string? json { get; set; }
        public List<Coordinate> Coordinates { get; set; } = new();
    }
}