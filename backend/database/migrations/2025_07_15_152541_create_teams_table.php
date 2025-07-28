<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('teams', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('name');
            $table->unsignedBigInteger('team_admin');
            $table->unsignedBigInteger('semester_id');
            $table->integer('members_limit');

            $table->foreign('team_admin')->references('student_id')->on('students')->onDelete('cascade');
            $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('teams');
    }
};