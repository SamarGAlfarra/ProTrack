<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('task_submissions', function (Blueprint $table) {
            $table->unsignedBigInteger('task_id');
            $table->unsignedBigInteger('student_id');
            $table->string('file_path');
            $table->decimal('grade', 5, 2)->nullable();
            $table->timestamp('timestamp')->useCurrent();

            $table->primary(['task_id', 'student_id']);

            $table->foreign('task_id')->references('id')->on('project_tasks')->onDelete('cascade');
            $table->foreign('student_id')->references('student_id')->on('students')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('task_submissions');
    }
};

