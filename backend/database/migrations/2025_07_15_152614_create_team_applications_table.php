<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('team_applications', function (Blueprint $table) {
            $table->unsignedBigInteger('team_id');
            $table->unsignedBigInteger('project_id');
            $table->string('status');

            // Composite Primary Key
            $table->primary(['team_id', 'project_id']);

            // Foreign Keys
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');
            $table->foreign('project_id')->references('project_id')->on('projects')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('team_applications');
    }
};

