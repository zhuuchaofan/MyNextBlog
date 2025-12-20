using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyNextBlog.Models;

public class UserProfile
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [MaxLength(100)]
    public string? Location { get; set; }

    [MaxLength(100)]
    public string? Occupation { get; set; }

    public DateOnly? BirthDate { get; set; }
}
