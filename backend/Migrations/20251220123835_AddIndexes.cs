using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyNextBlog.Migrations
{
    /// <inheritdoc />
    public partial class AddIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Posts_CreateTime",
                table: "Posts",
                column: "CreateTime");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_IsHidden",
                table: "Posts",
                column: "IsHidden");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Posts_CreateTime",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Posts_IsHidden",
                table: "Posts");
        }
    }
}
