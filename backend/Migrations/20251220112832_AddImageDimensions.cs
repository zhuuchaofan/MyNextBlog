using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyNextBlog.Migrations
{
    /// <inheritdoc />
    public partial class AddImageDimensions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Height",
                table: "ImageAssets",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Width",
                table: "ImageAssets",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Height",
                table: "ImageAssets");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "ImageAssets");
        }
    }
}
