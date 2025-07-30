<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('supervisors', function (Blueprint $table) {
            $table->unsignedBigInteger('supervisor_id')->primary();
            $table->foreign('supervisor_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('educational_degree');
            $table->integer('projects_no_limit');
        });
    }

    public function down(): void {
        Schema::dropIfExists('supervisors');
    }
};
