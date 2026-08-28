using RouteCast.Api.Models.DTOs;

namespace RouteCast.Api.Helpers;

public static class FlexiblePolylineDecoder
{
    private const string EncodingTable =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

    public static List<Coordinate> Decode(string encodedPolyline)
    {
        if (string.IsNullOrWhiteSpace(encodedPolyline))
        {
            throw new ArgumentException(
                "A polyline não pode estar vazia.",
                nameof(encodedPolyline));
        }

        var index = 0;

        var version = DecodeUnsignedValue(
            encodedPolyline,
            ref index);

        if (version != 1)
        {
            throw new InvalidOperationException(
                $"Versão de Flexible Polyline não suportada: {version}.");
        }

        var header = DecodeUnsignedValue(
            encodedPolyline,
            ref index);

        var precision = (int)(header & 15);
        var thirdDimension = (int)((header >> 4) & 7);
        var thirdDimensionPrecision = (int)((header >> 7) & 15);

        var coordinateFactor = Math.Pow(10, precision);
        var thirdDimensionFactor =
            Math.Pow(10, thirdDimensionPrecision);

        long lastLatitude = 0;
        long lastLongitude = 0;
        long lastThirdDimension = 0;

        var coordinates = new List<Coordinate>();

        while (index < encodedPolyline.Length)
        {
            lastLatitude += DecodeSignedValue(
                encodedPolyline,
                ref index);

            lastLongitude += DecodeSignedValue(
                encodedPolyline,
                ref index);

            if (thirdDimension != 0)
            {
                lastThirdDimension += DecodeSignedValue(
                    encodedPolyline,
                    ref index);

                _ = lastThirdDimension / thirdDimensionFactor;
            }

            coordinates.Add(new Coordinate(
                lastLatitude / coordinateFactor,
                lastLongitude / coordinateFactor));
        }

        return coordinates;
    }

    private static long DecodeUnsignedValue(
        string encodedPolyline,
        ref int index)
    {
        long result = 0;
        var shift = 0;

        while (index < encodedPolyline.Length)
        {
            var character = encodedPolyline[index++];
            var value = EncodingTable.IndexOf(character);

            if (value < 0)
            {
                throw new FormatException(
                    $"Caractere inválido na Flexible Polyline: {character}");
            }

            result |= (long)(value & 31) << shift;

            if ((value & 32) == 0)
                return result;

            shift += 5;

            if (shift > 60)
            {
                throw new FormatException(
                    "Flexible Polyline inválida.");
            }
        }

        throw new FormatException(
            "Flexible Polyline terminou inesperadamente.");
    }

    private static long DecodeSignedValue(
        string encodedPolyline,
        ref int index)
    {
        var value = DecodeUnsignedValue(
            encodedPolyline,
            ref index);

        return (value & 1) != 0
            ? -((value + 1) >> 1)
            : value >> 1;
    }
}