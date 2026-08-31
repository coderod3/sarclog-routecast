namespace RouteCast.Api.Models.External;

public class VisualCrossingResponse
{
    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string Timezone { get; set; } = string.Empty;

    public List<VisualCrossingDay> Days { get; set; } = new();
}

public class VisualCrossingDay
{
    public string Datetime { get; set; } = string.Empty;

    public List<VisualCrossingHour> Hours { get; set; } = new();
}

public class VisualCrossingHour
{
    public string Datetime { get; set; } = string.Empty;

    public long DatetimeEpoch { get; set; }

    public double? Temp { get; set; }

    public double? Humidity { get; set; }

    public double? Precip { get; set; }

    public double? Precipprob { get; set; }

    public double? Snow { get; set; }

    public double? Windspeed { get; set; }

    public double? Visibility { get; set; }

    public string Conditions { get; set; } = string.Empty;
}