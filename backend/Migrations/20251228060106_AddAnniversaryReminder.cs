using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MyNextBlog.Migrations
{
    /// <inheritdoc />
    public partial class AddAnniversaryReminder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EnableReminder",
                table: "Anniversaries",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReminderDays",
                table: "Anniversaries",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReminderEmail",
                table: "Anniversaries",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AnniversaryNotifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AnniversaryId = table.Column<int>(type: "integer", nullable: false),
                    TargetDate = table.Column<DateOnly>(type: "date", nullable: false),
                    DaysBefore = table.Column<int>(type: "integer", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IsSuccess = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnniversaryNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnniversaryNotifications_Anniversaries_AnniversaryId",
                        column: x => x.AnniversaryId,
                        principalTable: "Anniversaries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnniversaryNotifications_AnniversaryId",
                table: "AnniversaryNotifications",
                column: "AnniversaryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnniversaryNotifications");

            migrationBuilder.DropColumn(
                name: "EnableReminder",
                table: "Anniversaries");

            migrationBuilder.DropColumn(
                name: "ReminderDays",
                table: "Anniversaries");

            migrationBuilder.DropColumn(
                name: "ReminderEmail",
                table: "Anniversaries");
        }
    }
}
