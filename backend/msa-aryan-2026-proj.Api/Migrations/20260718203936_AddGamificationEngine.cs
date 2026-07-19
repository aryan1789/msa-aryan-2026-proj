using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace msa_aryan_2026_proj.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGamificationEngine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Xp",
                table: "CrewMemberships",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateOnly>(
                name: "DayKey",
                table: "CheckIns",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.CreateTable(
                name: "WeeklyResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MembershipId = table.Column<int>(type: "integer", nullable: false),
                    WeekKey = table.Column<DateOnly>(type: "date", nullable: false),
                    CheckInCount = table.Column<int>(type: "integer", nullable: false),
                    TargetMet = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklyResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WeeklyResults_CrewMemberships_MembershipId",
                        column: x => x.MembershipId,
                        principalTable: "CrewMemberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CheckIns_MembershipId_DayKey",
                table: "CheckIns",
                columns: new[] { "MembershipId", "DayKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyResults_MembershipId_WeekKey",
                table: "WeeklyResults",
                columns: new[] { "MembershipId", "WeekKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeeklyResults");

            migrationBuilder.DropIndex(
                name: "IX_CheckIns_MembershipId_DayKey",
                table: "CheckIns");

            migrationBuilder.DropColumn(
                name: "Xp",
                table: "CrewMemberships");

            migrationBuilder.DropColumn(
                name: "DayKey",
                table: "CheckIns");
        }
    }
}
