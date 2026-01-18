using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyNextBlog.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTodoTaskForHierarchyAndReminderDays : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReminderSent",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "ReminderTime",
                table: "TodoTasks");

            migrationBuilder.AddColumn<int>(
                name: "ParentId",
                table: "TodoTasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReminderDays",
                table: "TodoTasks",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SentReminderDays",
                table: "TodoTasks",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaskType",
                table: "TodoTasks",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_TodoTasks_ParentId",
                table: "TodoTasks",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_TodoTasks_TodoTasks_ParentId",
                table: "TodoTasks",
                column: "ParentId",
                principalTable: "TodoTasks",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TodoTasks_TodoTasks_ParentId",
                table: "TodoTasks");

            migrationBuilder.DropIndex(
                name: "IX_TodoTasks_ParentId",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "ReminderDays",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "SentReminderDays",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "TaskType",
                table: "TodoTasks");

            migrationBuilder.AddColumn<bool>(
                name: "ReminderSent",
                table: "TodoTasks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReminderTime",
                table: "TodoTasks",
                type: "timestamp without time zone",
                nullable: true);
        }
    }
}
