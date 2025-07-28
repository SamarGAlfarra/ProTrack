<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('projects', function (Blueprint $table) {
            $table->unsignedBigInteger('project_id')->primary();
            $table->unsignedBigInteger('supervisor_id');
            $table->string('title');
            $table->datetime('meeting_time')->nullable();
            $table->string('meeting_link')->nullable();
            $table->text('summary')->nullable();
            $table->string('file_path')->nullable();
            $table->unsignedBigInteger('semester_id');
            $table->tinyInteger('number');

            $table->foreign('supervisor_id')->references('supervisor_id')->on('supervisors')->onDelete('cascade');
            $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('projects');
    }
};

