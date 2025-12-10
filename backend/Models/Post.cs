// `using` 语句用于导入必要的命名空间。
using System.ComponentModel.DataAnnotations; // 引入数据注解命名空间，用于在模型属性上添加验证规则，例如 `[Required]`。

// `namespace` 声明了当前文件中的代码所属的命名空间。
namespace MyNextBlog.Models;

/// <summary>
/// `Post` 类代表了博客系统中的一篇文章实体。
/// 这是一个“领域模型 (Domain Model)”或“实体类 (Entity Class)”，它直接映射到数据库中的一张表。
/// EF Core (Entity Framework Core) 会负责将这个 C# 类的数据存储到数据库中，并从数据库中读取数据来填充这个类的实例。
/// </summary>
public class Post
{
    /// <summary>
    /// `Id` 属性是文章的唯一标识符（主键）。
    /// 当数据被添加到数据库时，EF Core 通常会默认将其配置为自增主键。
    /// `get; set;` 是 C# 中属性的简写，表示该属性有公共的读取器和写入器。
    /// </summary>
    public int Id { get; set; }
    
    /// <summary>
    /// `Title` 属性是文章的标题。
    /// `[Required]` 数据注解：表示这个字段在数据库中是不可为空的（`NOT NULL`）。
    /// 如果尝试保存一个 `Title` 为空的文章，模型验证会失败。
    /// `string.Empty`：C# 8.0 引入的 Non-nullable reference types (NRTs) 特性。
    /// `.NET 6+` 中，`string` 默认是不可空的，`= string.Empty` 确保 `Title` 始终有一个空字符串的初始值，
    /// 避免 `null` 引用警告。
    /// </summary>
    [Required] 
    public string Title { get; set; } = string.Empty;    
    
    /// <summary>
    /// `Content` 属性存储文章的正文内容，通常是 Markdown 格式。
    /// `string.Empty`：确保 `Content` 初始值为非 `null`。
    /// </summary>
    public string Content { get; set; } = string.Empty; 

    /// <summary>
    /// `CreateTime` 属性记录文章的创建时间。
    /// `= DateTime.Now`: 在创建 `Post` 实例时，自动将其初始化为当前系统时间。
    /// </summary>
    public DateTime CreateTime { get; set; } = DateTime.Now;
    
    // public DateTime？ FinalEditTime { get; set; } = DateTime.Now;    // 这是被注释掉的代码，用于表示最后一次修改时间，目前未使用。
    
    // --- 导航属性 (Navigation Properties) ---
    // 导航属性是 EF Core 中用来表示实体之间关系（如一对多、多对多）的属性。
    // 它们允许我们通过一个实体直接访问其关联的实体。

    /// <summary>
    /// `Comments` 属性是一个导航属性，表示**一篇文章可以有多个评论**（一对多关系）。
    /// `List<Comment>`：这是一个集合类型，EF Core 会自动识别这种关系。
    /// `= new List<Comment>()`: 确保 `Comments` 列表在 `Post` 实例创建时就被初始化，避免 `null` 引用。
    /// </summary>
    public List<Comment> Comments { get; set; } = new List<Comment>();

    /// <summary>
    /// `Tags` 属性是一个导航属性，表示**一篇文章可以有多个标签**（多对多关系）。
    /// `List<Tag>`：这是一个集合类型，EF Core 会通过一个中间表（通常称为 `PostTag`）来管理这种多对多关系。
    /// `= new()`: C# 9 引入的 `new()` 语法，等同于 `new List<Tag>()`，更简洁。
    /// </summary>
    public List<Tag> Tags { get; set; } = new();

    /// <summary>
    /// `CategoryId` 属性是外键（Foreign Key），指向 `Category` 表的主键。
    /// `int?`: 这是一个可空值类型 (`Nullable<int>`)，表示 `CategoryId` 可以为 `null`。
    /// 这样做的好处是：即使文章没有分配分类，也不会导致数据错误，兼容旧数据或“未分类”的情况。
    /// </summary>
    public int? CategoryId { get; set; }
    /// <summary>
    /// `Category` 属性是一个导航属性，表示**一篇文章属于一个分类**（多对一关系）。
    /// `Category?`: 同样是可空类型，因为它对应的 `CategoryId` 可能是 `null`。
    /// 通过这个属性，可以直接从 `Post` 实例访问其关联的 `Category` 实体。
    /// </summary>
    public Category? Category { get; set; }

    /// <summary>
    /// `IsHidden` 属性表示文章是否处于隐藏状态（例如草稿）。
    /// `false`: 默认值为 `false`，表示文章默认是公开的。
    /// </summary>
    public bool IsHidden { get; set; } = false;

    /// <summary>
    /// `UserId` 属性是外键，指向 `User` 表的主键。
    /// `int?`: 可空类型，表示文章可以没有关联作者（例如系统自动发布、旧数据）。
    /// </summary>
    public int? UserId { get; set; }
    /// <summary>
    /// `User` 属性是一个导航属性，表示**一篇文章由一个用户撰写**（多对一关系）。
    /// `User?`: 可空类型，因为它对应的 `UserId` 可能是 `null`。
    /// 通过这个属性，可以直接从 `Post` 实例访问其关联的 `User` 实体（即作者信息）。
    /// </summary>
    public User? User { get; set; }
}