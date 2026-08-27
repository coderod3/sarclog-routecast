using RouteCast.Api.Models.Commons;
using RouteCast.Api.Models.Enums;

namespace RouteCast.Api.Models
{
    public class User: BasicInfo
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.User;
    }
}
