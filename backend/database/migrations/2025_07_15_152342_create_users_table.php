<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('users', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary(); // no auto increment
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['student', 'supervisor', 'admin']);
            $table->string('photo')->nullable();
            $table->boolean('is_approved')->default(false);
            $table->unsignedBigInteger('department');
            $table->string('phone_number');

            $table->foreign('department')->references('id')->on('departments')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('users');
    }
};