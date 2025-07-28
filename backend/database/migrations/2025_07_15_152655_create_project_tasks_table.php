<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('project_tasks', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->unsignedBigInteger('project_id');
            $table->string('title');
            $table->datetime('deadline');
            $table->text('description')->nullable();
            $table->timestamp('timestamp')->useCurrent();

            $table->foreign('project_id')->references('project_id')->on('projects')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('project_tasks');
    }
};
