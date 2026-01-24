using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyNextBlog.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenamePasswordResetTokenToHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PasswordResetToken",
                table: "Users",
                newName: "PasswordResetTokenHash");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PasswordResetTokenHash",
                table: "Users",
                newName: "PasswordResetToken");
        }
    }
}
