using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace RouteCast.Api.Helpers
{
    public static class EnumHelper
    {
        public static string GetDisplayName(this Enum enumValue)
        {
            var displayAttribute = enumValue.GetType()
                .GetMember(enumValue.ToString())
                .First()
                .GetCustomAttribute<DisplayAttribute>();

            return displayAttribute?.Name ?? enumValue.ToString();
        }
        
        public static T GetEnumFromChar<T>(char value) where T : Enum
        {
            foreach (T enumValue in Enum.GetValues(typeof(T)))
            {
                if (Convert.ToChar(enumValue) == value)
                    return enumValue;
            }
            
            throw new ArgumentException($"Valor '{value}' não encontrado no enum {typeof(T).Name}");
        }
    }
}