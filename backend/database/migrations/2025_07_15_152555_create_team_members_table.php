<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('team_members', function (Blueprint $table) {
            $table->unsignedBigInteger('team_id');
            $table->unsignedBigInteger('student_id');
            $table->boolean('is_approved')->default(false);
            $table->boolean('is_admin')->default(false);

            // Composite Primary Key
            $table->primary(['team_id', 'student_id']);

            // Foreign Keys
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');
            $table->foreign('student_id')->references('student_id')->on('students')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('team_members');
    }
};

