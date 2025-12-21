using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyNextBlog.Migrations
{
    /// <inheritdoc />
    public partial class AddSeriesFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SeriesId",
                table: "Posts",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SeriesOrder",
                table: "Posts",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Series",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Series", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Posts_SeriesId",
                table: "Posts",
                column: "SeriesId");

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_Series_SeriesId",
                table: "Posts",
                column: "SeriesId",
                principalTable: "Series",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Posts_Series_SeriesId",
                table: "Posts");

            migrationBuilder.DropTable(
                name: "Series");

            migrationBuilder.DropIndex(
                name: "IX_Posts_SeriesId",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "SeriesId",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "SeriesOrder",
                table: "Posts");
        }
    }
}
