<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('comments', function (Blueprint $table) {
            $table->unsignedBigInteger('task_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('author_id');
            $table->timestamp('timestamp')->useCurrent();
            $table->text('comment');
            
            //PK
            $table->primary(['task_id', 'student_id', 'author_id', 'timestamp']);
            //FK
            $table->foreign(['task_id', 'student_id'])
                  ->references(['task_id', 'student_id'])
                  ->on('task_submissions')
                  ->onDelete('cascade');
            
            $table->foreign('author_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('comments');
    }
};

